# RhodoniteTS Project Index

**Comprehensive Developer Navigation and Architecture Reference**

> 🎯 **Quick Links**: [Architecture](#architecture) | [API Reference](#api-reference) | [Development](#development) | [Components](#components) | [Materials](#materials) | [Rendering](#rendering)

---

## 🏗️ Architecture

### Core Design Patterns

| Pattern | Implementation | Key Files |
|---------|----------------|-----------|
| **Entity-Component-System** | Scene graph management | [`src/foundation/core/`](../src/foundation/core/) |
| **Blittable Memory** | GPU-optimized data layout | [`src/foundation/memory/`](../src/foundation/memory/) |
| **Strategy Pattern** | WebGL2/WebGPU abstraction | [`src/webgl/`](../src/webgl/), [`src/webgpu/`](../src/webgpu/) |
| **Repository Pattern** | Resource management | [`src/foundation/core/ComponentRepository.ts`](../src/foundation/core/ComponentRepository.ts) |

### System Architecture

```
┌─ Foundation Layer ─────────────────────────────┐
│  Core ECS │ Math │ Memory │ Components │ Utils  │
├─ API Abstraction Layer ───────────────────────┤
│          WebGL2 │ WebGPU │ Strategy            │
├─ Rendering Pipeline ──────────────────────────┤
│    Materials │ Shaders │ Passes │ Pipelines   │
├─ Asset Pipeline ──────────────────────────────┤
│   Importers │ Exporters │ Formats │ Loaders   │
└─ Application Layer ───────────────────────────┘
```

---

## 📚 API Reference

### Core Systems

#### Entity-Component-System (ECS)
- **Entity**: [`src/foundation/core/Entity.ts`](../src/foundation/core/Entity.ts)
- **Component**: [`src/foundation/core/Component.ts`](../src/foundation/core/Component.ts)
- **Repository**: [`src/foundation/core/ComponentRepository.ts`](../src/foundation/core/ComponentRepository.ts)

#### Memory Management
- **MemoryManager**: [`src/foundation/core/MemoryManager.ts`](../src/foundation/core/MemoryManager.ts)
- **Memory Pool**: [`src/foundation/memory/`](../src/foundation/memory/)

#### Mathematical Foundation
| Class | Purpose | File |
|-------|---------|------|
| `Vector3` | 3D vectors | [`src/foundation/math/Vector3.ts`](../src/foundation/math/Vector3.ts) |
| `Matrix44` | 4x4 matrices | [`src/foundation/math/Matrix44.ts`](../src/foundation/math/Matrix44.ts) |
| `Quaternion` | Rotations | [`src/foundation/math/Quaternion.ts`](../src/foundation/math/Quaternion.ts) |
| `ColorRgba` | Colors | [`src/foundation/math/ColorRgba.ts`](../src/foundation/math/ColorRgba.ts) |

---

## 🧩 Components

### Built-in Components

| Component | Purpose | Implementation |
|-----------|---------|----------------|
| **Transform** | Position, rotation, scale | [`src/foundation/components/Transform/`](../src/foundation/components/Transform/) |
| **Mesh** | Geometry data | [`src/foundation/components/Mesh/`](../src/foundation/components/Mesh/) |
| **Camera** | Viewing frustum | [`src/foundation/components/Camera/`](../src/foundation/components/Camera/) |
| **Light** | Illumination | [`src/foundation/components/Light/`](../src/foundation/components/Light/) |
| **Animation** | Keyframe animation | [`src/foundation/components/Animation/`](../src/foundation/components/Animation/) |
| **Skeletal** | Bone animation | [`src/foundation/components/Skeletal/`](../src/foundation/components/Skeletal/) |
| **BlendShape** | Morph targets | [`src/foundation/components/BlendShape/`](../src/foundation/components/BlendShape/) |
| **Physics** | Physics simulation | [`src/foundation/components/Physics/`](../src/foundation/components/Physics/) |

### Component Development

1. **Base Class**: Extend [`Component`](../src/foundation/core/Component.ts)
2. **Registration**: Use [`ComponentRepository`](../src/foundation/core/ComponentRepository.ts)
3. **Memory**: Allocate through [`MemoryManager`](../src/foundation/core/MemoryManager.ts)
4. **Pattern**: Follow existing component patterns

---

## 🎨 Materials

### Material System Architecture

```
AbstractMaterialContent ──┐
                         ├── PBRMaterialContent
                         ├── MToonMaterialContent
                         ├── MatCapMaterialContent
                         └── CustomMaterialContent
```

### Material Types

| Material | Use Case | Implementation |
|----------|----------|----------------|
| **PBR** | Physically-based rendering | [`src/foundation/materials/contents/`](../src/foundation/materials/contents/) |
| **MToon** | Toon/anime-style rendering | [`src/foundation/materials/contents/`](../src/foundation/materials/contents/) |
| **MatCap** | Matcap-based materials | [`src/foundation/materials/contents/`](../src/foundation/materials/contents/) |
| **Custom** | User-defined shaders | [`src/foundation/materials/contents/`](../src/foundation/materials/contents/) |

### Shader System

- **Node-Based**: [`src/foundation/materials/nodes/`](../src/foundation/materials/nodes/)
- **Graph Resolver**: [`src/foundation/materials/core/ShaderGraphResolver.ts`](../src/foundation/materials/core/ShaderGraphResolver.ts)
- **Cross-Platform**: Automatic WebGL2/WebGPU compilation

---

## 🎮 Rendering

### Rendering Pipeline

```
Scene Graph → Culling → Material Sorting → Render Passes → GPU Commands
```

### Render System

| Component | Purpose | Location |
|-----------|---------|----------|
| **RenderPass** | Rendering operations | [`src/foundation/renderer/RenderPass.ts`](../src/foundation/renderer/RenderPass.ts) |
| **Pipeline** | Rendering strategies | [`src/foundation/renderer/pipelines/`](../src/foundation/renderer/pipelines/) |
| **FrameBuffer** | Render targets | [`src/foundation/renderer/FrameBuffer.ts`](../src/foundation/renderer/FrameBuffer.ts) |

### Multi-API Support

| API | Implementation | Strategy |
|-----|----------------|----------|
| **WebGL2** | [`src/webgl/`](../src/webgl/) | [`WebGLStrategy`](../src/webgl/WebGLStrategy.ts) |
| **WebGPU** | [`src/webgpu/`](../src/webgpu/) | [`WebGpuStrategyBasic`](../src/webgpu/WebGpuStrategyBasic.ts) |

---

## 📁 Directory Structure

### Source Organization

```
src/
├── foundation/           # Core library functionality
│   ├── core/            # ECS system and memory management
│   ├── components/      # Built-in ECS components
│   ├── math/           # Mathematical primitives
│   ├── materials/      # Material and shader system
│   ├── renderer/       # Rendering pipeline
│   ├── geometry/       # Mesh and primitive geometry
│   ├── importer/       # Asset importers (glTF, VRM, etc.)
│   ├── exporter/       # Asset exporters
│   ├── physics/        # Physics integration
│   ├── textures/       # Texture management
│   ├── cameras/        # Camera implementations
│   ├── helpers/        # Utility functions
│   └── misc/           # Miscellaneous utilities
├── webgl/              # WebGL2-specific implementation
├── webgpu/             # WebGPU-specific implementation
├── types/              # TypeScript type definitions
├── effekseer/          # Effekseer particle system
└── xr/                 # WebXR support
```

### Build Outputs

```
dist/
├── esm/                # Production ES modules
├── esmdev/             # Development ES modules (source maps)
├── iife/               # Production browser bundle
└── iifedev/            # Development browser bundle
```

---

## 🔧 Development

### Essential Commands

```bash
# Development
pnpm watch-esm-dev         # Watch mode for library development
pnpm start                 # Development server (port 8082)

# Building
pnpm build                 # Build all targets
pnpm build-samples         # Compile samples

# Testing
pnpm test                  # Full test suite
pnpm test-unit             # Unit tests only
pnpm test-e2e              # E2E visual tests

# Quality
pnpm check:fix             # Auto-fix linting and formatting
pnpm doc                   # Generate API documentation
```

### Development Workflow

1. **Setup**: `pnpm install` (Node.js 22+ required)
2. **Watch**: `pnpm watch-esm-dev` for live development
3. **Test**: `pnpm test-unit` for validation
4. **Quality**: `pnpm check:fix` before commits
5. **Build**: `pnpm build && pnpm test` before PRs

### Code Standards

- **TypeScript**: Strict mode, ES2019 target
- **Linting**: Biome configuration in [`biome.json`](../biome.json)
- **Testing**: Vitest for units, Puppeteer for E2E
- **Architecture**: Follow ECS patterns and memory management guidelines

---

## 🚀 Getting Started

### For Users

1. **Install**: `npm install rhodonite`
2. **Import**: `import Rn from 'rhodonite'`
3. **Initialize**: `await Rn.Engine.init({...})`
4. **Create**: Use helper functions or ECS directly
5. **Render**: `Rn.Engine.startRenderLoop()`

### For Contributors

1. **Clone & Setup**: Repository setup and dependency installation
2. **Read Documentation**: [`CLAUDE.md`](../CLAUDE.md) for comprehensive development guide
3. **Explore Samples**: [`samples/`](../samples/) for usage examples
4. **Follow Patterns**: Study existing components and implementations
5. **Test Thoroughly**: Both unit and E2E testing required

---

## 📖 Additional Resources

### Documentation

- **Development Guide**: [`CLAUDE.md`](../CLAUDE.md) - Comprehensive development documentation
- **User Guide**: [`README.md`](../README.md) - Installation and basic usage
- **API Docs**: [`docs/api/`](../docs/api/) - Generated TypeDoc documentation
- **Contributing**: [`CONTRIBUTING.md`](../CONTRIBUTING.md) - Contribution guidelines

### External Links

- **Official Website**: https://librn.com/
- **Online Editor**: https://editor.librn.com/
- **GitHub Repository**: https://github.com/actnwit/RhodoniteTS
- **NPM Package**: https://www.npmjs.com/package/rhodonite

### Key Concepts

- **Blittable Memory Architecture**: Data pre-allocation for GPU efficiency
- **Component-Oriented Design**: ECS pattern for modularity
- **Multi-API Support**: WebGL2 and WebGPU compatibility
- **Node-Based Materials**: Flexible shader composition
- **Asset Pipeline**: Comprehensive format support (glTF, VRM, etc.)

---

**Last Updated**: Generated by /sc:index | **Version**: 0.17.4 | **License**: MIT
