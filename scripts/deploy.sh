#!/usr/bin/env bash
set -e

echo "=== [1/4] Membersihkan folder dist ==="
rm -rf dist
mkdir -p dist/db

echo "=== [2/4] Menjalankan Python Prompt Builder ==="
python3 scripts/build_prompts.py

echo "=== [3/4] Kompilasi TypeScript ke JavaScript ==="
tsc src/app.ts --target ES2020 --module ES2020 --outDir dist --lib ES2020,DOM

echo "=== [4/4] Menyalin Aset HTML, CSS & Skema SQL ==="
cp index.html dist/
cp style.css dist/
cp database/schema.sql dist/db/

echo "=== BUILD SELESAI! Siap deploy ke GitHub Pages ==="
