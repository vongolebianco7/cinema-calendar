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
git diff --quiet "$baseline" HEAD -- ':(top,glob)*.html' ':(top,glob)*.png' ':(top,glob)*.svg' ':(top,glob)*.webmanifest' ':(top,glob)*.css' ':(top,glob)*.js' ':(top)assets/' ':(top)js/' ':(top)data/' ':(top)preview/' ':(top)my-cinelva/' ':(top)scripts/build-static.cjs' ':(top)scripts/source-status.cjs' ':(top)quality/external-data-registry.json' ':(top)vercel.json' ':(top)scripts/ignore-frontend-build.sh' ':(top)scripts/production-checks.cjs' ':(top)scripts/source-configuration.cjs' ':(top)scripts/verify-production-release.cjs' ':(top)quality/production-proof.json' ':(top)scripts/quality_gate.py'
status=$?
[[ "$status" == "0" ]] && exit 0
exit 1
