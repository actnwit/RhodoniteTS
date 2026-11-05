#!/usr/bin/env bash
# Runs inside the E2E container. The repository is mounted at /work, while
# node_modules, the pnpm store and the Puppeteer browser cache live in named
# volumes so the host's macOS install is never touched.
set -euo pipefail

MODE="${1:-test}"

cd /work

case "${MODE}" in
  shell)
    exec bash
    ;;
esac

echo "==> Installing dependencies"
pnpm install --frozen-lockfile

# pnpm does not run Puppeteer's postinstall script, so fetch the pinned Chrome
# for Testing explicitly (cached in the Puppeteer volume after the first run).
# An interrupted download leaves a partial folder behind, so retry from a clean
# cache once.
echo "==> Installing Chrome for Testing"
if ! pnpm exec puppeteer browsers install chrome; then
  echo "Clearing the Puppeteer cache and retrying"
  rm -rf "${PUPPETEER_CACHE_DIR}/chrome"
  pnpm exec puppeteer browsers install chrome
fi

echo "==> Building the library (esm-dev) and the samples"
pnpm run build-esm-dev
pnpm run build-samples

case "${MODE}" in
  test)
    echo "==> Running the E2E suite"
    pnpm run test-e2e
    ;;
  update)
    echo "==> Updating all E2E reference images in this environment"
    E2E_UPDATE_ALL_SNAPSHOTS=1 pnpm run test-e2e-update
    ;;
  *)
    echo "Unknown mode: ${MODE}" >&2
    exit 1
    ;;
esac
