#!/usr/bin/env bash
# Runs the E2E suite in a Linux container that mirrors the GitHub Actions job,
# so that local runs and CI compare against the same rendering.
#
# Usage:
#   config/e2e/run-in-docker.sh [test|update|shell]
#
#   test    run the E2E suite (default)
#   update  regenerate every reference image (snapshot) in this environment
#   shell   open a shell inside the container
#
# Environment variables:
#   E2E_DOCKER_FRESH=1  drop the dependency/build caches first
set -euo pipefail

MODE="${1:-test}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
IMAGE="rhodonite-e2e:local"
NODE_MODULES_VOLUME="rhodonite-e2e-node-modules"
DIST_VOLUME="rhodonite-e2e-dist"
PNPM_STORE_VOLUME="rhodonite-e2e-pnpm-store"
PUPPETEER_VOLUME="rhodonite-e2e-puppeteer"

if [[ "${E2E_DOCKER_FRESH:-0}" == "1" ]]; then
  docker volume rm -f \
    "${NODE_MODULES_VOLUME}" \
    "${DIST_VOLUME}" \
    "${PNPM_STORE_VOLUME}" \
    "${PUPPETEER_VOLUME}" >/dev/null 2>&1 || true
fi

echo "==> Building the E2E image (${IMAGE})"
docker build -f "${ROOT}/config/e2e/Dockerfile" -t "${IMAGE}" "${ROOT}/config/e2e"

TTY_FLAGS=("-i")
if [[ -t 0 && -t 1 ]]; then
  TTY_FLAGS+=("-t")
fi

echo "==> Running mode: ${MODE}"
docker run --rm "${TTY_FLAGS[@]}" \
  --shm-size=2g \
  -v "${ROOT}:/work" \
  -v "${NODE_MODULES_VOLUME}:/work/node_modules" \
  -v "${DIST_VOLUME}:/work/dist" \
  -v "${PNPM_STORE_VOLUME}:/root/.local/share/pnpm/store" \
  -v "${PUPPETEER_VOLUME}:/root/.cache/puppeteer" \
  -w /work \
  "${IMAGE}" \
  bash /work/config/e2e/entrypoint.sh "${MODE}"
