#!/usr/bin/env bash
set -euo pipefail

root="$(dirname "$(dirname "$(realpath "$0")")")"
checkout="$(realpath "${1:?Usage: bash scripts/fetch-qni-webgpu.sh /path/to/pinned/qni-webgpu}")"
ref="$(tr -d '\r\n' < "$root/qni-webgpu.ref")"
if [[ "$(git -C "$checkout" rev-parse HEAD)" != "$ref" ]]; then
  printf 'Checkout must be at the commit in qni-webgpu.ref (%s).\n' "$ref" >&2
  exit 1
fi
if [[ -n "$(git -C "$checkout" status --porcelain --untracked-files=no)" ]]; then
  printf 'The qni-webgpu checkout has tracked changes; use a clean pinned checkout.\n' >&2
  exit 1
fi

# rustup reads the upstream rust-toolchain.toml from this working directory.
env -C "$checkout" rustup show active-toolchain
env -C "$checkout" rustup target add wasm32-unknown-unknown
pnpm -C "$checkout/apps/web" install --frozen-lockfile
bash "$checkout/apps/web/scripts/build-embed.sh" "$root/public/qni-webgpu"

# The link destination is also the standalone asset base path's single source.
public_url="$(node --experimental-strip-types --input-type=module -e "import { APP_URL } from '$root/src/components/qni-webgpu-app-url.ts'; console.log(new URL(APP_URL, 'https://build.invalid').pathname)")"
env -u NO_COLOR -C "$checkout/apps/web" trunk build --verbose --release --public-url "$public_url" --dist "$root/public/app"
