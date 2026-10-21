#!/usr/bin/env bash
# Exit 0 skips the build; changed publication inputs return 1.
# Compare with the last successful deployment, including changes missed by quota/errors.
baseline="${VERCEL_GIT_PREVIOUS_SHA:-}"
if [[ -z "$baseline" ]]; then
  [[ "${VERCEL:-}" == "1" ]] && exit 1
  baseline="HEAD^"
elif [[ ! "$baseline" =~ ^[0-9a-fA-F]{40}$ ]]; then
  exit 1
fi
git cat-file -e "${baseline}^{commit}" 2>/dev/null || exit 1
git diff --quiet "$baseline" HEAD -- ':(top)backend/' ':(top)scripts/ignore-backend-build.sh'
status=$?
[[ "$status" == "0" ]] && exit 0
exit 1
