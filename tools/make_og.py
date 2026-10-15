#!/usr/bin/env python3
"""Fabrique l'image de partage (1200×630) avec Chrome headless, polices du site comprises.

    python3 tools/make_og.py   ->   src/static/assets/img/og.jpg
"""
import subprocess
import tempfile
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
photo = ROOT / "src" / "img-src" / "pergola-bio-hero.jpg"
logo = ROOT / "src" / "static" / "assets" / "img" / "logo.png"
fonts = ROOT / "src" / "fonts"
out = ROOT / "src" / "static" / "assets" / "img" / "og.jpg"

page = f"""<!doctype html><meta charset="utf-8"><style>
@font-face{{font-family:F;src:url(file://{fonts}/archivo.woff2);font-weight:100 900;font-stretch:62% 125%}}
@font-face{{font-family:M;src:url(file://{fonts}/archivo.woff2);font-weight:100 900;font-stretch:62% 125%}}
*{{margin:0;box-sizing:border-box}}
body{{width:1200px;height:630px;position:relative;overflow:hidden;background:#0d1a24;font-family:M}}
.photo{{position:absolute;right:0;top:0;width:700px;height:630px;background:url(file://{photo}) 40% 50%/cover}}
.shade{{position:absolute;inset:0;background:linear-gradient(90deg,#0d1a24 0 48%,rgba(13,26,36,.85) 58%,rgba(13,26,36,0) 82%)}}
.copy{{position:absolute;left:64px;top:64px;bottom:64px;width:620px;display:flex;flex-direction:column;justify-content:space-between;color:#f6f2eb}}
.eyebrow{{font-weight:700;font-size:20px;letter-spacing:.16em;text-transform:uppercase;color:#7fd0f5}}
h1{{font-family:F;font-weight:800;font-stretch:78%;font-size:76px;line-height:1;letter-spacing:-.01em}}
h1 i{{font-style:normal;display:block;margin-top:14px;font-size:36px;font-weight:500;font-stretch:100%;line-height:1.2;color:#cfe9f6}}
.foot{{display:flex;align-items:center;gap:22px;font-size:22px;color:#cfd8de}}
.foot img{{height:70px;border-radius:8px}}
</style><div class="photo"></div><div class="shade"></div>
<div class="copy"><div class="eyebrow">Corbion-sur-Semois · Bouillon</div>
<h1>Votre spécialiste en vérandas et pergolas <i>dans les provinces de Luxembourg et de Namur</i></h1>
<div class="foot"><img src="file://{logo}"><span>Devis gratuit et sans engagement<br>0471 55 39 94</span></div></div>"""

with tempfile.TemporaryDirectory() as d:
    html = Path(d) / "og.html"
    png = Path(d) / "og.png"
    html.write_text(page, encoding="utf-8")
    subprocess.run(["google-chrome", "--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars",
                    "--allow-file-access-from-files", "--force-device-scale-factor=1",
                    "--window-size=1200,630", "--virtual-time-budget=3000",
                    f"--screenshot={png}", f"file://{html}"], check=True, capture_output=True, timeout=90)
    Image.open(png).convert("RGB").save(out, "JPEG", quality=88, optimize=True)
print("écrit :", out, out.stat().st_size // 1024, "Ko")
