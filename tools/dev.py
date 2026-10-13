#!/usr/bin/env python3
"""Serveur local : construit le site, le sert sur http://127.0.0.1:8765 et le reconstruit à chaque changement.

    ./dev.sh            (ou : python3 tools/dev.py [port])
"""
import functools
import gzip
import http.server
import subprocess
import sys
import threading
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
WATCH = [ROOT / "src", ROOT / "site.json"]


def snapshot():
    files = []
    for w in WATCH:
        files += [w] if w.is_file() else [f for f in w.rglob("*") if f.is_file()]
    return {str(f): f.stat().st_mtime_ns for f in files}


def build():
    r = subprocess.run([sys.executable, "-I", str(ROOT / "tools" / "build.py")], capture_output=True, text=True)
    stamp = time.strftime("%H:%M:%S")
    print(f"[{stamp}] " + (r.stdout.strip() or r.stderr.strip()), flush=True)


TEXT = {".html", ".css", ".js", ".json", ".svg", ".xml", ".txt", ".webmanifest"}


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        """Compression gzip des textes, comme le ferait un hébergeur."""
        path = Path(self.translate_path(self.path.split("?")[0]))
        if path.is_dir():
            path = path / "index.html"
        if path.suffix in TEXT and path.is_file() and "gzip" in self.headers.get("Accept-Encoding", ""):
            body = gzip.compress(path.read_bytes(), 6)
            self.send_response(200)
            self.send_header("Content-Type", self.guess_type(str(path)) + "; charset=utf-8")
            self.send_header("Content-Encoding", "gzip")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        else:
            super().do_GET()

    def log_message(self, *args):
        pass

    def send_error(self, code, message=None, explain=None):
        if code == 404 and (ROOT / "public" / "404.html").exists():
            body = (ROOT / "public" / "404.html").read_bytes()
            self.send_response(404)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        else:
            super().send_error(code, message, explain)


def watch():
    seen = snapshot()
    while True:
        time.sleep(0.8)
        now = snapshot()
        if now != seen:
            seen = now
            build()


if __name__ == "__main__":
    build()
    threading.Thread(target=watch, daemon=True).start()
    handler = functools.partial(Handler, directory=str(ROOT / "public"))
    # le dossier public/ est remplacé à chaque build : on résout le chemin à chaque requête
    with http.server.ThreadingHTTPServer(("127.0.0.1", PORT), handler) as srv:
        print(f"Site local : http://127.0.0.1:{PORT}   (Ctrl+C pour arrêter)", flush=True)
        try:
            srv.serve_forever()
        except KeyboardInterrupt:
            pass
