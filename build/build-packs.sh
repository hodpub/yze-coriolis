#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

# Work on this system, then pack each packs/source/<name> folder into packs/<name>.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

FVTT="${ROOT}/node_modules/.bin/fvtt"
if [[ ! -x "$FVTT" ]]; then
  echo "Missing ${FVTT}. Run yarn install first." >&2
  exit 1
fi

"$FVTT" package workon "yzecoriolis" --type "System"

shopt -s nullglob
for folder in packs/source/*; do
  [[ -d "$folder" ]] || continue
  name=$(basename "$folder")
  out="packs/${name}"
  echo "Packing ${name} from ${folder}"
  # Wipe prior LevelDB so tombstones / Foundry lock leftovers cannot leave an empty pack.
  rm -rf "${out}"
  "$FVTT" package pack "$name" --in "$folder" --out "packs" --log
done
