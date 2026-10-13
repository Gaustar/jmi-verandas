#!/usr/bin/env python3
"""Génère le site statique dans public/ à partir de src/.

    python3 tools/build.py

- gabarits : src/partials/layout.html + src/pages/*.html (variables, inclusions, images)
- images   : src/img-src/*  ->  WebP en plusieurs tailles (srcset)
- SEO      : balises Open Graph, JSON-LD, sitemap.xml, robots.txt, manifest
- contrôle : liens, ancres et images internes vérifiés à chaque génération
"""
import datetime
import hashlib
import html
import json
import os
import re
import shutil
import sys
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
OUT = ROOT / "public"
TMP = ROOT / f".build-{os.getpid()}"   # unique : le serveur de dev et un build manuel ne se marchent plus dessus
CACHE = ROOT / ".cache" / "img"
SITE = json.loads((ROOT / "site.json").read_text(encoding="utf-8"))

# Surcharges d'environnement (utilisées par le déploiement de test sur GitHub Pages) :
#   SITE_URL, BASE_PATH, TEST_BUILD=1  -> noindex, robots.txt fermé, bandeau « version de test »
if os.environ.get("SITE_URL"):
    SITE["siteUrl"] = os.environ["SITE_URL"].rstrip("/")
if os.environ.get("BASE_PATH"):
    SITE["basePath"] = os.environ["BASE_PATH"]
TEST_BUILD = os.environ.get("TEST_BUILD") == "1"

WIDTHS = (480, 800, 1200, 1600)
WEBP_QUALITY = 74
DAYS = [("mon", "Lundi"), ("tue", "Mardi"), ("wed", "Mercredi"), ("thu", "Jeudi"),
        ("fri", "Vendredi"), ("sat", "Samedi"), ("sun", "Dimanche")]
SCHEMA_DAYS = {"mon": "Monday", "tue": "Tuesday", "wed": "Wednesday", "thu": "Thursday",
               "fri": "Friday", "sat": "Saturday", "sun": "Sunday"}

errors = []
warnings = []


# --------------------------------------------------------------------------- css
def minify_css(css):
    """Retire commentaires et espaces superflus. Chaînes et url() sont mises de côté."""
    keep = []

    def stash(m):
        keep.append(m.group(0))
        return f"\u0001{len(keep) - 1}\u0002"
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    css = re.sub(r"url\([^)]*\)|\"(?:[^\"\\]|\\.)*\"|'(?:[^'\\]|\\.)*'", stash, css)
    css = re.sub(r"\s+", " ", css)
    css = re.sub(r" ?([{};,]) ?", r"\1", css)
    css = re.sub(r":\s+", ":", css)
    css = css.replace(";}", "}")
    return re.sub("\u0001(\\d+)\u0002", lambda m: keep[int(m.group(1))], css).strip()


# --------------------------------------------------------------------------- images
def process_images():
    """Retourne {nom: {w, h, widths}} et remplit le cache WebP."""
    CACHE.mkdir(parents=True, exist_ok=True)
    index_file = CACHE / "index.json"
    index = json.loads(index_file.read_text()) if index_file.exists() else {}
    result = {}
    for src in sorted((SRC / "img-src").iterdir()):
        if src.suffix.lower() not in (".jpg", ".jpeg", ".png"):
            continue
        name = src.stem
        key = f"q{WEBP_QUALITY}:{src.stat().st_mtime_ns}:{src.stat().st_size}"
        entry = index.get(name)
        if not entry or entry.get("key") != key or not all(
                (CACHE / f"{name}-{w}.webp").exists() for w in entry["widths"]):
            im = ImageOps.exif_transpose(Image.open(src))
            if im.mode in ("RGBA", "LA", "P"):
                im = im.convert("RGBA")
                bg = Image.new("RGB", im.size, (255, 255, 255))
                bg.paste(im, mask=im.split()[-1])
                im = bg
            else:
                im = im.convert("RGB")
            ow, oh = im.size
            widths = sorted({w for w in WIDTHS if w < ow} | {min(ow, WIDTHS[-1])})
            for w in widths:
                h = round(oh * w / ow)
                im.resize((w, h), Image.LANCZOS).save(
                    CACHE / f"{name}-{w}.webp", "WEBP", quality=WEBP_QUALITY, method=6)
            fw = widths[-1]
            entry = {"key": key, "w": fw, "h": round(oh * fw / ow), "widths": widths}
            index[name] = entry
        result[name] = entry
    index_file.write_text(json.dumps(index, indent=1))
    return result


# --------------------------------------------------------------------------- facebook
FR_MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août",
             "septembre", "octobre", "novembre", "décembre"]


def dms(v, pos, neg):
    hemi = pos if v >= 0 else neg
    v = abs(v)
    d = int(v)
    m = int((v - d) * 60)
    sec = round(((v - d) * 60 - m) * 60)
    return f"{d}°{m:02d}′{sec:02d}″{hemi}"


def facebook_data():
    f = SRC / "data" / "facebook.json"
    return json.loads(f.read_text(encoding="utf-8")) if f.exists() else {"page": {}, "posts": []}


def facebook_posts_html(fb, images, base):
    """Au plus deux publications marquées show=true, les plus récentes d'abord."""
    posts = [p for p in fb.get("posts", []) if p.get("show")]
    posts.sort(key=lambda p: p.get("date", ""), reverse=True)
    out = []
    for p in posts[:2]:
        y, m, d = p["date"].split("-")
        label = f"{int(d)} {FR_MONTHS[int(m) - 1]} {y}"
        info = images.get(p.get("image", ""))
        img = img_tag(p["image"], info, base, "", "(min-width: 960px) 220px, 90vw") if info else ""
        text = html.escape(p.get("text", ""))
        out.append(
            f'<a class="fb-post reveal" href="{html.escape(p["url"], quote=True)}" target="_blank" rel="noopener">'
            f'{img}<div><time class="mono" datetime="{p["date"]}">{label}</time><p>{text}</p>'
            f'<span class="link-arrow">Voir sur Facebook <span aria-hidden="true">↗</span></span></div></a>')
    return "\n".join(out)


# --------------------------------------------------------------------------- hours
def fmt_time(t):
    h, m = t.split(":")
    return f"{int(h)}h" + (m if m != "00" else "")


def hours_table():
    rows = []
    for key, label in DAYS:
        ranges = SITE["hours"].get(key, [])
        if ranges:
            val = " · ".join(f"{fmt_time(a)} – {fmt_time(b)}" for a, b in ranges)
        else:
            val = "Fermé"
        cls = ' class="is-closed"' if not ranges else ""
        rows.append(f'<tr data-day="{key}"{cls}><th scope="row">{label}</th><td>{val}</td></tr>')
    return "\n".join(rows)


# --------------------------------------------------------------------------- json-ld
def json_ld(base):
    s = SITE
    a = s["address"]
    url = s["siteUrl"].rstrip("/")
    spec = []
    for key, _ in DAYS:
        for start, end in s["hours"].get(key, []):
            spec.append({"@type": "OpeningHoursSpecification", "dayOfWeek": SCHEMA_DAYS[key],
                         "opens": start, "closes": end})
    data = {
        "@context": "https://schema.org",
        "@type": ["HomeAndConstructionBusiness", "LocalBusiness"],
        "@id": f"{url}/#entreprise",
        "name": s["name"],
        "description": ("Vérandas, pergolas bioclimatiques, stores, volets, portes, fenêtres et "
                        "châssis dans les provinces de Luxembourg et de Namur."),
        "url": url + "/",
        "image": f"{url}{base}assets/img/og.jpg",
        "logo": f"{url}{base}assets/img/logo.png",
        "telephone": s["phoneIntl"],
        "email": s["email"],
        "vatID": s["vat"],
        "address": {"@type": "PostalAddress", "streetAddress": a["street"], "postalCode": a["zip"],
                    "addressLocality": a["city"], "addressRegion": "Luxembourg",
                    "addressCountry": a["country"]},
        "geo": {"@type": "GeoCoordinates", "latitude": s["geo"]["lat"], "longitude": s["geo"]["lon"]},
        "areaServed": [{"@type": "AdministrativeArea", "name": n} for n in s["areaServed"]],
        "openingHoursSpecification": spec,
        "sameAs": [s["facebook"]],
        "knowsAbout": ["Vérandas", "Pergolas bioclimatiques", "Pergolas", "Carports", "Stores",
                       "Protections solaires", "Volets roulants", "Fenêtres", "Portes", "Châssis",
                       "Moustiquaires"],
    }
    return json.dumps(data, ensure_ascii=False, indent=1)


# --------------------------------------------------------------------------- templating
INC = re.compile(r"\{\{>\s*([\w-]+)\s*\}\}")
IMG = re.compile(r"\{\{\s*(img|imgurl)\s+((?:[\w:-]+=\"[^\"]*\"\s*)+)\}\}")
VAR = re.compile(r"\{\{\s*([A-Za-z_][\w.]*)\s*\}\}")
ATTR = re.compile(r'([\w:-]+)="([^"]*)"')


def lookup(ctx, dotted, where):
    cur = ctx
    for part in dotted.split("."):
        if isinstance(cur, dict) and part in cur:
            cur = cur[part]
        else:
            errors.append(f"{where}: variable inconnue {{{{{dotted}}}}}")
            return ""
    return cur if isinstance(cur, str) else str(cur)


def img_tag(name, info, base, alt, sizes, loading="lazy", cls="", fetchpriority="", extra=None):
    widths = info["widths"]
    mid = min(widths, key=lambda w: abs(w - 800))
    srcset = ", ".join(f"{base}assets/img/{name}-{w}.webp {w}w" for w in widths)
    parts = [f'src="{base}assets/img/{name}-{mid}.webp"', f'srcset="{srcset}"', f'sizes="{sizes}"',
             f'width="{info["w"]}"', f'height="{info["h"]}"', f'alt="{alt}"',
             f'loading="{loading}"', 'decoding="async"']
    if cls:
        parts.append(f'class="{cls}"')
    if fetchpriority:
        parts.append(f'fetchpriority="{fetchpriority}"')
    for k, v in (extra or {}).items():
        parts.append(f'{k}="{v}"')
    return "<img " + " ".join(parts) + ">"


def gallery_html(images, base):
    """Grille de la page Réalisations, générée depuis src/data/gallery.json."""
    items = json.loads((SRC / "data" / "gallery.json").read_text(encoding="utf-8"))
    out = []
    for it in items:
        info = images.get(it["name"])
        if not info:
            errors.append(f"gallery.json : image inconnue « {it['name']} »")
            continue
        big = f"{base}assets/img/{it['name']}-{info['widths'][-1]}.webp"
        cap = html.escape(it["caption"], quote=True)
        tag = img_tag(it["name"], info, base, html.escape(it["alt"], quote=True),
                      "(min-width: 1100px) 390px, (min-width: 700px) 46vw, 92vw")
        low = ' data-lowres="1"' if info["w"] < 900 else ""
        out.append(
            f'<figure class="tile reveal" data-cats="{" ".join(it["cats"])}"{low}>'
            f'<a href="{big}" data-lightbox="galerie" data-caption="{cap}">{tag}</a>'
            f'<figcaption>{html.escape(it["caption"])}</figcaption></figure>')
    return "\n".join(out)


def render(text, ctx, images, where):
    # 1. inclusions (récursives)
    for _ in range(6):
        def inc(m):
            f = SRC / "partials" / f"{m.group(1)}.html"
            if not f.exists():
                errors.append(f"{where}: partiel introuvable {m.group(1)}")
                return ""
            return f.read_text(encoding="utf-8")
        new = INC.sub(inc, text)
        if new == text:
            break
        text = new

    # 2. images
    def img(m):
        kind, raw = m.group(1), m.group(2)
        a = dict(ATTR.findall(raw))
        name = a.pop("name", "")
        info = images.get(name)
        if not info:
            errors.append(f"{where}: image inconnue « {name} »")
            return ""
        base = ctx["base"]
        if kind == "imgurl":
            w = a.get("w", "max")
            w = info["widths"][-1] if w == "max" else int(w)
            return f"{base}assets/img/{name}-{w}.webp"
        alt = a.pop("alt", None)
        if alt is None:
            errors.append(f"{where}: image « {name} » sans attribut alt")
            alt = ""
        return img_tag(name, info, base, alt, a.pop("sizes", "100vw"), a.pop("loading", "lazy"),
                       a.pop("class", ""), a.pop("fetchpriority", ""), a)
    text = IMG.sub(img, text)

    # 3. variables
    return VAR.sub(lambda m: lookup(ctx, m.group(1), where), text)


def parse_page(path):
    raw = path.read_text(encoding="utf-8")
    m = re.match(r"\s*<!--meta\s*(.*?)-->\s*", raw, flags=re.S)
    meta = {}
    if m:
        for line in m.group(1).splitlines():
            if ":" in line:
                k, v = line.split(":", 1)
                meta[k.strip()] = v.strip()
        raw = raw[m.end():]
    return meta, raw


# --------------------------------------------------------------------------- build
def main():
    if TMP.exists():
        shutil.rmtree(TMP)
    TMP.mkdir(parents=True)

    images = process_images()
    fb = facebook_data()
    base = SITE["basePath"]
    url = SITE["siteUrl"].rstrip("/")

    # fichiers statiques
    for sub in ("static",):
        d = SRC / sub
        if d.exists():
            shutil.copytree(d, TMP, dirs_exist_ok=True)
    (TMP / "assets" / "img").mkdir(parents=True, exist_ok=True)
    for f in CACHE.glob("*.webp"):
        shutil.copy(f, TMP / "assets" / "img" / f.name)
    shutil.copytree(SRC / "fonts", TMP / "assets" / "fonts")
    shutil.copytree(SRC / "js", TMP / "assets" / "js")
    (TMP / "assets" / "css").mkdir(parents=True, exist_ok=True)
    css_src = (SRC / "css" / "styles.css").read_text(encoding="utf-8")
    (TMP / "assets" / "css" / "styles.css").write_text(minify_css(css_src), encoding="utf-8")

    # empreinte pour casser le cache navigateur
    h = hashlib.md5()
    for f in sorted((TMP / "assets").rglob("*")):
        if f.is_file() and f.suffix in (".css", ".js"):
            h.update(f.read_bytes())
    version = h.hexdigest()[:8]

    layout = (SRC / "partials" / "layout.html").read_text(encoding="utf-8")
    pages = []
    for path in sorted((SRC / "pages").glob("*.html")):
        meta, body = parse_page(path)
        slug = path.stem
        out_rel = "index.html" if slug == "index" else ("404.html" if slug == "404" else f"{slug}/index.html")
        page_path = "" if slug == "index" else ("404.html" if slug == "404" else f"{slug}/")
        for k in ("title", "description"):
            if k in meta:
                meta[k] = html.escape(meta[k], quote=True)
        meta.setdefault("title", SITE["name"])
        meta.setdefault("description", "")
        meta.setdefault("nav", "")
        meta.setdefault("body", "")
        meta["robots"] = "noindex,nofollow" if TEST_BUILD else meta.get("robots", "index,follow")
        ctx = {
            "site": {**SITE, "address": SITE["address"]},
            "page": meta,
            "base": base,
            "v": version,
            "year": str(SITE["year"]),
            "hours_table": hours_table(),
            "hours_json": html.escape(json.dumps(SITE["hours"]), quote=True),
            "jsonld": json_ld(base),
            "canonical": f"{url}{base}{page_path}",
            "og_image": f"{url}{base}assets/img/og.jpg",
            "test_banner": ('  <p class="test-banner" role="note">Version de test · site officiel : '
                            'jmiverandas.be</p>\n') if TEST_BUILD else "",
            "gallery_items": gallery_html(images, base),
            "fb": fb["page"],
            "fb_quote": fb.get("quote", {}),
            "fb_posts": facebook_posts_html(fb, images, base),
            "tape_ticks": "".join(f"<span>{i}</span>" for i in range(30)) + "<span>30+</span>",
            "coords": f'{dms(SITE["geo"]["lat"], "N", "S")} {dms(SITE["geo"]["lon"], "E", "W")}',
            "head_extra": "".join(
                f'  <link rel="preload" href="{base}assets/fonts/{f.strip()}.woff2" as="font" type="font/woff2" crossorigin>\n'
                for f in meta.get("preload", "").split(",") if f.strip()),
            "content": "@@CONTENT@@",
            "scripts": "".join(
                f'<script src="{base}assets/js/{s.strip()}.js?v={version}" defer></script>\n'
                for s in meta.get("scripts", "").split(",") if s.strip()),
        }
        where = f"pages/{path.name}"
        content = render(body, ctx, images, where)
        out_html = render(layout, ctx, images, "layout").replace("@@CONTENT@@", content)

        nav = meta["nav"]
        out_html = re.sub(r'\s*data-nav="(\w+)"',
                          lambda m: ' aria-current="page"' if m.group(1) == nav else "", out_html)
        dest = TMP / out_rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(out_html, encoding="utf-8")
        pages.append({"rel": out_rel, "url": ctx["canonical"], "sitemap": meta.get("sitemap", "yes") != "no"})

    # sitemap, robots, manifest
    today = datetime.date.today().isoformat()
    smap = ['<?xml version="1.0" encoding="UTF-8"?>',
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for p in pages:
        if p["sitemap"]:
            smap.append(f"  <url><loc>{p['url']}</loc><lastmod>{today}</lastmod></url>")
    smap.append("</urlset>")
    (TMP / "sitemap.xml").write_text("\n".join(smap) + "\n", encoding="utf-8")
    if TEST_BUILD:
        (TMP / "robots.txt").write_text("User-agent: *\nDisallow: /\n")
    else:
        (TMP / "robots.txt").write_text(f"User-agent: *\nAllow: /\n\nSitemap: {url}{base}sitemap.xml\n")
    manifest = {
        "name": SITE["name"], "short_name": "JMI Vérandas", "lang": "fr",
        "start_url": base, "display": "browser", "theme_color": "#008bcc", "background_color": "#f6f2eb",
        "icons": [{"src": f"{base}icon-192.png", "sizes": "192x192", "type": "image/png"},
                  {"src": f"{base}icon-512.png", "sizes": "512x512", "type": "image/png"}],
    }
    (TMP / "site.webmanifest").write_text(json.dumps(manifest, ensure_ascii=False, indent=1))

    check_links(TMP, base)

    if errors:
        print("\n".join("ERREUR  " + e for e in errors), file=sys.stderr)
        shutil.rmtree(TMP)
        sys.exit(1)

    if OUT.exists():
        shutil.rmtree(OUT)
    TMP.rename(OUT)
    n_img = len(list((OUT / "assets" / "img").glob("*.webp")))
    print(f"OK  {len(pages)} pages, {n_img} images WebP, version {version}")
    for w in warnings:
        print("avert.  " + w)


# --------------------------------------------------------------------------- contrôle des liens
REF = re.compile(r'(?:href|src|poster)="([^"]+)"')
SRCSET = re.compile(r'srcset="([^"]+)"')
ID = re.compile(r'\sid="([^"]+)"')


def check_links(root, base):
    files = list(root.rglob("*.html"))
    ids = {}
    for f in files:
        ids[f] = set(ID.findall(f.read_text(encoding="utf-8")))

    def target_file(path):
        p = path[len(base):] if path.startswith(base) else path.lstrip("/")
        cand = root / p
        if p == "" or p.endswith("/"):
            cand = root / p / "index.html"
        elif cand.is_dir():
            cand = cand / "index.html"
        return cand

    for f in files:
        text = f.read_text(encoding="utf-8")
        rel = f.relative_to(root)
        refs = REF.findall(text)
        for ss in SRCSET.findall(text):
            refs += [part.strip().split(" ")[0] for part in ss.split(",")]
        for ref in refs:
            if re.match(r"^(https?:|mailto:|tel:|data:|javascript:|//)", ref):
                continue
            path, _, frag = ref.partition("#")
            path = path.split("?")[0]
            if path == "":
                tgt = f
            else:
                if not path.startswith("/"):
                    errors.append(f"{rel}: lien relatif {ref} (utiliser {{{{base}}}})")
                    continue
                tgt = target_file(path)
                if not tgt.exists():
                    errors.append(f"{rel}: lien cassé {ref}")
                    continue
            if frag and tgt.suffix == ".html" and frag not in ids.get(tgt, set()):
                errors.append(f"{rel}: ancre introuvable {ref}")


if __name__ == "__main__":
    main()
