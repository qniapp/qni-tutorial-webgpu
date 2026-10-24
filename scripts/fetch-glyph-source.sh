#!/usr/bin/env bash
# Optional source acquisition for glyph regeneration only; never compiles Rust.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
source="${QNI_WEBGPU_SOURCE:-$root/.qni-webgpu-source}"
ref="$(tr -d '\r\n' < "$root/qni-webgpu.ref")"
[[ "$ref" =~ ^[a-f0-9]{40}$ ]] || { echo 'Invalid qni-webgpu.ref' >&2; exit 1; }
if [[ ! -e "$source" ]]; then
  git init --quiet "$source"
fi
# Retry interrupted downloads and support a new pin without switching HEAD or
# modifying working-tree files. Recipes read immutable git objects directly.
if ! git -C "$source" cat-file -e "$ref^{commit}" 2>/dev/null; then
  git -C "$source" fetch --depth=1 https://github.com/qniapp/qni-webgpu.git "$ref"
fi
git -C "$source" cat-file -e "$ref:scripts/extract-gate-svg.py"
git -C "$source" cat-file -e "$ref:apps/web/assets/Geist-Bold.ttf"
git -C "$source" cat-file -e "$ref:apps/web/assets/GeistMono-Regular.ttf"
printf 'Pinned glyph source objects are available.\n'
