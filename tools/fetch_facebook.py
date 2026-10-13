#!/usr/bin/env python3
"""Met à jour src/data/facebook.json avec ses deux dernières publications sur son métier.

Source : API Graph de Facebook (méthode officielle). Il faut un jeton de PAGE :

    FB_PAGE_ID=…  FB_PAGE_TOKEN=…  python3 tools/fetch_facebook.py

Sans jeton, le script ne fait rien (le site garde les données déjà dans facebook.json).
Voir docs/FACEBOOK.md pour obtenir le jeton. NON TESTÉ contre l'API réelle : aucun jeton n'était disponible.

Règles :
- on ne retient que les publications dont le texte contient un mot de `filter_keywords` ;
- et qui ont une photo (téléchargée dans src/img-src, car les adresses d'images Facebook expirent) ;
- les entrées saisies à la main (id commençant par « manual- ») ne sont jamais modifiées ni supprimées.
"""
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "src" / "data" / "facebook.json"
IMG = ROOT / "src" / "img-src"
API = "https://graph.facebook.com/v21.0"
KEEP = 2


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "jmi-site/1.0"}), timeout=30) as r:
        return r.read()


def main():
    page_id, token = os.environ.get("FB_PAGE_ID", ""), os.environ.get("FB_PAGE_TOKEN", "")
    if not page_id or not token:
        print("fetch_facebook : pas de FB_PAGE_ID / FB_PAGE_TOKEN, rien à faire.")
        return
    data = json.loads(DATA.read_text(encoding="utf-8"))
    keywords = [k.lower() for k in data.get("filter_keywords", [])]

    q = urllib.parse.urlencode({"fields": "message,created_time,permalink_url,full_picture", "limit": 25, "access_token": token})
    try:
        feed = json.loads(get(f"{API}/{page_id}/published_posts?{q}"))["data"]
        q2 = urllib.parse.urlencode({"fields": "followers_count", "access_token": token})
        followers = json.loads(get(f"{API}/{page_id}?{q2}")).get("followers_count")
    except Exception as e:                       # réseau, jeton expiré… : ne casse jamais le déploiement
        print(f"fetch_facebook : échec de l'appel API ({e}). Données inchangées.")
        return

    manual = [p for p in data["posts"] if str(p.get("id", "")).startswith("manual-")]
    for old in IMG.glob("fb-*.jpg"):             # anciennes images automatiques
        old.unlink()

    auto = []
    for post in feed:
        text = (post.get("message") or "").strip()
        if not text or not post.get("full_picture"):
            continue
        if keywords and not any(k in text.lower() for k in keywords):
            continue
        stem = "fb-" + post["created_time"][:10] + "-" + re.sub(r"\D", "", post["id"])[-6:]
        try:
            tmp = IMG / (stem + ".tmp")
            tmp.write_bytes(get(post["full_picture"]))
            im = ImageOps.exif_transpose(Image.open(tmp)).convert("RGB")
            im.thumbnail((1600, 1600))
            im.save(IMG / (stem + ".jpg"), "JPEG", quality=85)
            tmp.unlink()
        except Exception as e:
            print(f"  image ignorée ({e})")
            continue
        auto.append({"id": post["id"], "date": post["created_time"][:10], "text": text[:220], "image": stem,
                     "url": post["permalink_url"], "show": True})
        if len(auto) == KEEP:
            break

    data["posts"] = manual + auto
    if followers:
        data["page"]["followers"] = followers
    DATA.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"fetch_facebook : {len(auto)} publication(s) retenue(s) sur {len(feed)} lues.")


if __name__ == "__main__":
    main()
