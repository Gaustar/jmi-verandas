#!/usr/bin/env bash
# Serveur local avec reconstruction automatique : http://127.0.0.1:8765
cd "$(dirname "$0")" && exec python3 tools/dev.py "$@"
