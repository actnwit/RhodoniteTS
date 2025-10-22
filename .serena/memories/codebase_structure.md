# RhodoniteTS Codebase Structure

## Directory Organization

### Source Code (/src)
```
src/
├── foundation/           # Core library functionality
│   ├── components/       # ECS components (Transform, Mesh, Camera, Light, etc.)
│   ├── core/            # Core systems (Entity, Component, Repository, Memory)
│   ├── system/          # System-level management (System, ModuleManager, Time)
│   ├── renderer/        # Rendering pipeline (RenderPass, RenderPipeline, FrameBuffer)
│   ├── materials/       # Material system (Material, MaterialContent, shader nodes)
│   ├── math/           # Mathematical primitives (Vector, Matrix, Quaternion, Color)
│   ├── geometry/       # Mesh and primitive geometry (Primitive, Buffer, Accessor)
│   ├── physics/        # Physics integration (PhysicsComponent, collision detection)
│   ├── helpers/        # Utility helpers (data conversion, validation, etc.)
│   ├── importer/       # Asset importers (glTF, VRM, DRC, KTX2, etc.)
│   ├── exporter/       # Asset exporters
│   ├── textures/       # Texture management and utilities
│   ├── cameras/        # Camera implementations
│   ├── constraints/    # Animation and physics constraints
│   ├── gizmos/         # Editor gizmos and handles
│   ├── memory/         # Memory management utilities
│   └── misc/           # Miscellaneous utilities
├── webgl/              # WebGL-specific implementation
├── webgpu/             # WebGPU-specific implementation
├── types/              # TypeScript type definitions
├── effekseer/          # Effekseer particle system integration
├── xr/                 # WebXR support
└── pbr/                # PBR (Physically Based Rendering) utilities
```

### Build Outputs (/dist)
- **ESM Dev** (`dist/esmdev/`): Development build with source maps
- **ESM Prod** (`dist/esm/`): Production build with optimization
- **IIFE Dev** (`dist/iifedev/rhodonite.js`): Browser bundle (dev)
- **IIFE Prod** (`dist/iife/rhodonite.min.js`): Minified browser bundle

### Samples (/samples)
- 78 TypeScript example files demonstrating library usage
- Visual regression tests in `samples/test_e2e/`

### Configuration (/config)
- Build configurations for tsup
- Test configurations for Vitest

## Key Files
- `package.json`: Project dependencies and scripts
- `tsconfig.json`: TypeScript compilation settings
- `biome.json`: Code quality and formatting rules
- `CLAUDE.md`: Development guidance and architecture overview

## Statistics
- **Total Source Files**: ~488 TypeScript files
- **Test Files**: Co-located with source (*.test.ts pattern)
- **Sample Files**: 78 example implementations
- **Dependencies**: Minimal runtime deps (3), comprehensive dev tooling