# E2E runner image that mirrors the GitHub Actions job (.github/workflows/test.yml).
#
# Ubuntu 24.04 + Node 24 + Chrome for Testing (downloaded by Puppeteer) and
# Mesa's software stack: llvmpipe for GL/WebGL2 and lavapipe for Vulkan. Chromium
# then composites WebGPU canvases through its WebGPU-on-Vulkan-via-GL-interop
# path, which is what makes WebGPU screenshots possible without a GPU.
FROM ubuntu:24.04

ARG NODE_VERSION=24.22.1
ARG TARGETARCH

ENV DEBIAN_FRONTEND=noninteractive \
    PUPPETEER_CACHE_DIR=/root/.cache/puppeteer

RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates curl xz-utils unzip git \
      libnss3 libgbm1 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 \
      libxrandr2 libxss1 libdrm2 libpango-1.0-0 libcairo2 \
      libatk1.0-0t64 libatk-bridge2.0-0t64 libcups2t64 libasound2t64 \
      libegl1 libgl1-mesa-dri mesa-vulkan-drivers fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

RUN set -eux; \
    case "${TARGETARCH:-$(dpkg --print-architecture)}" in \
      amd64) NODE_ARCH=x64 ;; \
      arm64) NODE_ARCH=arm64 ;; \
      *) echo "unsupported architecture" >&2; exit 1 ;; \
    esac; \
    curl -fsSL "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-${NODE_ARCH}.tar.xz" -o /tmp/node.tar.xz; \
    tar -xJf /tmp/node.tar.xz -C /usr/local --strip-components=1; \
    rm /tmp/node.tar.xz; \
    npm install -g pnpm@12; \
    node --version; \
    pnpm --version

WORKDIR /work
