# RhodoniteTS Project Overview

## Purpose
RhodoniteTS is a comprehensive Web3D graphics library written in TypeScript that provides:
- Dual rendering API support (WebGL2 and WebGPU)
- Advanced 3D graphics capabilities including PBR, IBL, WebXR
- Efficient GPU data transfer through "Blittable Memory Architecture"
- Support for various 3D model formats (glTF, VRM, DRC, KTX2, etc.)
- Entity-Component-System (ECS) architecture for scene graph management

## Tech Stack
- **Primary Language**: TypeScript (ES2019 target)
- **Runtime Support**: Node.js 22+ required
- **Package Manager**: Yarn 4.9.2
- **Module System**: ESM (ES Modules)
- **Build Tool**: tsup with esbuild for fast compilation
- **Test Framework**: Vitest for unit tests, Puppeteer for E2E visual regression
- **Code Quality**: Biome for linting and formatting
- **Documentation**: TypeDoc for API documentation

## Core Dependencies
### Runtime
- ktx-parse: KTX2 texture format parsing
- shaderity: Shader compilation and cross-platform support
- zstddec: ZSTD decompression for compressed assets

### Development
- @biomejs/biome: Code quality tooling
- vitest: Fast unit testing framework
- puppeteer: Browser automation for E2E tests
- typedoc: API documentation generation
- tsup: Build tool using esbuild

## Architecture Highlights
- **Entity-Component-System (ECS)**: Modular scene graph management
- **Blittable Memory Architecture**: Pre-allocated ArrayBuffers for efficient GPU transfer
- **Strategy Pattern**: Abstract rendering interfaces for WebGL2/WebGPU
- **Node-Based Material System**: Flexible shader composition
- **Memory Pools**: Typed array views into shared memory pools