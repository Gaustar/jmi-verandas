#!/usr/bin/env python3
"""Génère les icônes (favicon, Apple touch, PWA) à partir du logo : on découpe le carré bleu « JMi »."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
logo = Image.open(ROOT / "src" / "static" / "assets" / "img" / "logo.png").convert("RGB")
# Le logo est un bandeau bleu (148×50) avec le glyphe blanc « JMi » entre x=47 et x=101.
# On découpe un carré centré sur le glyphe, sans le texte « PIERROT Jean-Michel » en dessous.
box = (37, 0, 111, 50)
mark = logo.crop(box)
print("carré bleu :", box, mark.size)

side = max(mark.size)
brand = (0, 139, 204)
square = Image.new("RGB", (side, side), brand)
square.paste(mark, ((side - mark.width) // 2, (side - mark.height) // 2))

out = ROOT / "src" / "static"
for name, size in (("favicon-32.png", 32), ("apple-touch-icon.png", 180), ("icon-192.png", 192), ("icon-512.png", 512)):
    pad = int(size * 0.14)                       # marge intérieure pour respirer
    canvas = Image.new("RGB", (size, size), brand)
    inner = square.resize((size - 2 * pad, size - 2 * pad), Image.LANCZOS)
    canvas.paste(inner, (pad, pad))
    canvas.save(out / name)
canvas = Image.open(out / "favicon-32.png")
canvas.save(out / "favicon.ico", sizes=[(16, 16), (32, 32)])
print("icônes écrites dans", out)
