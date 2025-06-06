# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RhodoniteTS is a comprehensive Web3D graphics library written in TypeScript that supports both WebGL2 and WebGPU rendering APIs. It features a "Blittable Memory Architecture" for efficient GPU data transfer and supports advanced rendering techniques including PBR, IBL, WebXR, and various 3D model formats.

## Essential Commands

### Building
```bash
yarn build                 # Build all targets (ESM + IIFE, dev + prod)
yarn build-esm-dev         # Development ESM build with source maps
yarn build-esm-prod        # Production ESM build (optimized)
yarn build-samples         # Compile TypeScript samples
```

### Development Workflow
```bash
yarn watch-esm-dev         # Watch mode for library development
yarn watch-samples         # Watch samples with auto-reload and dev server
yarn start                 # Start development server on port 8082
```

### Testing
```bash
yarn test                  # Run all tests (unit + E2E visual regression)
yarn test-unit             # Unit tests only (Vitest)
yarn test-e2e              # E2E visual tests only (Puppeteer)
yarn test-coverage         # Test with coverage report
yarn test-e2e-update       # Update E2E test snapshots
```

### Code Quality
```bash
yarn gts-lint              # Lint using Google TypeScript Style
yarn gts-fix               # Auto-fix linting issues
yarn doc                   # Generate TypeDoc API documentation
```

### Important Notes
- **Node.js 22+** is strictly required
- E2E tests are environment-sensitive and may fail in different environments
- Always run `yarn build && yarn build-samples && yarn test` before submitting PRs
- Main development branch is `develop`, not `main`

## Core Architecture

### Component-Oriented Design
- **Entity-Component-System (ECS)**: Scene graph management through entities with attachable components
- **Component Types**: Transform, Mesh, Camera, Light, Animation, Physics, Skeletal, BlendShape, VRM, Effekseer
- **Component Repository**: Centralized component management and lifecycle

### Memory Management Strategy
- **Blittable Memory Architecture**: Data stored in pre-allocated ArrayBuffers for efficient GPU transfer
- **Memory Pools**: Components use typed array views into shared memory pools
- **GPU Optimization**: Data layout optimized for transfer as floating-point textures

### Multi-API Rendering
- **Strategy Pattern**: Abstract rendering interfaces supporting both WebGL2 and WebGPU
- **Resource Repositories**: Separate management for WebGL and WebGPU resources
- **Unified Shader System**: Cross-platform shader compilation and management

### Material System
- **Node-Based Composition**: Shader nodes for flexible material creation
- **Material Contents**: Abstraction layer for different material types (PBR, MToon, MatCap, etc.)
- **Shader Graph Resolver**: Automatic dependency resolution for shader node graphs

## Key Source Directories

```
src/foundation/
├── components/           # ECS components (Transform, Mesh, Camera, Light, etc.)
├── core/                # Core systems (Entity, Component, Repository, Memory)
├── system/              # System-level management (System, ModuleManager, Time)
├── renderer/            # Rendering pipeline (RenderPass, RenderPipeline, FrameBuffer)
├── materials/           # Material system (Material, MaterialContent, shader nodes)
├── math/               # Mathematical primitives (Vector, Matrix, Quaternion, Color)
├── geometry/           # Mesh and primitive geometry (Primitive, Buffer, Accessor)
├── physics/            # Physics integration (PhysicsComponent, collision detection)
├── helpers/            # Utility helpers (data conversion, validation, etc.)
└── importer/           # Asset importers (glTF, VRM, DRC, KTX2, etc.)

src/webgl/              # WebGL-specific implementation
src/webgpu/             # WebGPU-specific implementation  
src/types/              # TypeScript type definitions
src/effekseer/          # Effekseer particle system integration
src/xr/                 # WebXR support
```

## Build System

### Build Targets
- **ESM Dev** (`dist/esmdev/`): Development build with source maps and debugging
- **ESM Prod** (`dist/esm/`): Production build with tree-shaking and optimization
- **IIFE Dev** (`dist/iifedev/rhodonite.js`): Browser-ready development bundle
- **IIFE Prod** (`dist/iife/rhodonite.min.js`): Minified production bundle

### Build Tools
- **tsup**: Primary build tool using esbuild for fast compilation
- **esbuild-plugin-shaderity**: Processes shader files during build
- **esbuild-plugin-version**: Handles version file generation
- **TypeScript**: Type checking and .d.ts generation

## Testing Infrastructure

### Unit Tests (Vitest)
- **Environment**: Happy DOM for lightweight browser simulation
- **Coverage**: Available via V8 coverage provider
- **Location**: Test files alongside source code (`*.test.ts`)

### E2E Tests (Puppeteer)
- **Purpose**: Visual regression testing for rendering accuracy
- **Location**: `samples/test_e2e/`
- **Environment Sensitive**: Tests are calibrated for specific development environment
- **Snapshots**: Image comparison with automatic snapshot updating

## Development Patterns

### Component Development
- Components extend base `Component` class and implement required interfaces
- Use `ComponentRepository` for registration and lifecycle management
- Follow established patterns in existing components for consistency

### Memory Allocation
- Use `MemoryManager` for efficient memory pool allocation
- Components should use typed array views rather than creating new arrays
- Consider GPU data layout when designing data structures

### Material Creation
- Extend `AbstractMaterialContent` for new material types
- Use shader nodes for composable material features
- Register materials with `MaterialRepository`

### Asset Loading
- Use `AssetLoader` with appropriate extension loaders
- Support format detection via file extension and magic numbers
- Handle async loading patterns consistently

### Rendering Integration
- Use `RenderPass` system for organizing rendering operations
- Support both WebGL and WebGPU rendering strategies
- Follow established patterns for resource management

## Dependencies

### Runtime Dependencies
- **ktx-parse**: KTX2 texture format parsing
- **shaderity**: Shader compilation and cross-platform support
- **zstddec**: ZSTD decompression for compressed assets

### Key Dev Dependencies
- **gts**: Google TypeScript Style for consistent code formatting
- **typedoc**: API documentation generation
- **vitest**: Fast unit testing framework
- **puppeteer**: Automated browser testing for E2E