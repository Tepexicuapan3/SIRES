#!/usr/bin/env bash
set -euo pipefail

# Optional, exact path allowlist for intentional exceptions.
# Keep this empty unless there is a strong reason to version one of these files.
ALLOWLIST=()

matches_allowlist() {
  local path="$1"
  local allowed
  if (( ${#ALLOWLIST[@]} == 0 )); then
    return 1
  fi
  for allowed in "${ALLOWLIST[@]}"; do
    if [[ "$path" == "$allowed" ]]; then
      return 0
    fi
  done
  return 1
}

declare -a violations=()

while IFS= read -r path; do
  [[ -z "$path" ]] && continue

  if matches_allowlist "$path"; then
    continue
  fi

  case "$path" in
    .cache/*)
      violations+=("$path|.cache/**")
      ;;
    artifacts/*)
      violations+=("$path|artifacts/**")
      ;;
    *.log)
      violations+=("$path|*.log")
      ;;
    .play*)
      violations+=("$path|.play*")
      ;;
  esac
done < <(git ls-files)

if (( ${#violations[@]} == 0 )); then
  echo "No prohibited tracked files detected."
  exit 0
fi

echo "[FAIL] Prohibited files/paths are tracked in git index:"
for entry in "${violations[@]}"; do
  printf '  - %s\n' "${entry%%|*}"
done

echo
echo "How to fix:"
echo "1) Remove generated files from git index (keeps local files):"
echo "   git rm -r --cached .cache artifacts"
echo "   git ls-files '*.log' -z | xargs -0 -I{} git rm --cached -- '{}'"
echo "   git rm -r --cached .playwgrigthmcp .playwright-mcp"
echo "2) Add ignore rules in .gitignore (if missing):"
echo "   .cache/"
echo "   artifacts/"
echo "   *.log"
echo "   .play*/"
echo "3) Re-add only source files that must be versioned and commit the cleanup."

exit 1
