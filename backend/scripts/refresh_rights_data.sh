#!/usr/bin/env bash
# Refresh the rights knowledge base:
#   1. Scrape latest data from btl.gov.il + kolzchut.org.il
#   2. Re-index into ChromaDB

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
URLS_DIR="$SCRIPT_DIR/../../../urls"  # path to the urls sibling project
BACKEND_DIR="$SCRIPT_DIR/.."

echo "=== Step 1: Scraping latest rights data ==="
cd "$URLS_DIR"
python smart_ingest.py

echo "=== Step 2: Copying updated smart_data to NovaHub ==="
cp -r "$URLS_DIR/smart_data/." "$BACKEND_DIR/data/smart_data/"

echo "=== Step 3: Rebuilding ChromaDB ==="
cd "$BACKEND_DIR"
python scripts/ingest_rights_to_chroma.py

echo "=== Done! Rights database is up to date ==="
