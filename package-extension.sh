#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

VERSION="$(node -e "console.log(require('./manifest.json').version)")"
DIST_DIR="$ROOT_DIR/dist"
PACKAGE_NAME="page-scroll-master-v${VERSION}.zip"

rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

zip -r "$DIST_DIR/$PACKAGE_NAME" \
  manifest.json \
  background.js \
  content.js \
  popup.html \
  popup.js \
  options.html \
  options.js \
  icons/icon16.png \
  icons/icon32.png \
  icons/icon48.png \
  icons/icon128.png \
  _locales/en/messages.json \
  _locales/zh_CN/messages.json

echo "$DIST_DIR/$PACKAGE_NAME"
