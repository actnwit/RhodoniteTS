# Architecture Patterns and Design Guidelines

## Core Architectural Patterns

### Entity-Component-System (ECS)
- **Entities**: Scene graph nodes managed by centralized system
- **Components**: Data containers (Transform, Mesh, Camera, Light, Animation, etc.)
- **Systems**: Logic processors that operate on component data
- **Repository Pattern**: Centralized component management and lifecycle

### Memory Management
- **Blittable Memory Architecture**: Pre-allocated ArrayBuffers for GPU efficiency
- **Memory Pools**: Components use typed array views into shared pools
- **GPU Optimization**: Data layout designed for floating-point texture transfer
- **Zero-Copy Transfers**: Direct memory mapping between CPU and GPU

### Multi-API Rendering Strategy
- **Strategy Pattern**: Abstract rendering interfaces
- **WebGL2 Implementation**: Full-featured WebGL2 renderer
- **WebGPU Implementation**: Modern WebGPU renderer for future compatibility
- **Resource Repositories**: Separate management for each API
- **Unified Shader System**: Cross-platform compilation and management

### Material System Architecture
- **Node-Based Composition**: Shader nodes for flexible material creation
- **Material Contents**: Abstraction layer for different material types
- **Shader Graph Resolver**: Automatic dependency resolution
- **Supported Materials**: PBR, MToon, MatCap, and custom materials

## Design Patterns in Use

### Repository Pattern
- Component management through centralized repositories
- Lifecycle management and dependency tracking
- Type-safe component registration and retrieval

### Strategy Pattern
- Rendering API abstraction (WebGL2/WebGPU)
- Material content implementations
- Asset loader extensibility

### Observer Pattern
- Component change notifications
- Scene graph update propagation
- Event-driven rendering updates

### Factory Pattern
- Component creation and initialization
- Material instantiation
- Asset loader selection

## Development Guidelines

### Component Development
1. Extend base `Component` class
2. Implement required interfaces for ECS integration
3. Use `ComponentRepository` for registration
4. Follow established memory allocation patterns

### Memory Allocation Best Practices
1. Use `MemoryManager` for efficient pool allocation
2. Prefer typed array views over new array creation
3. Consider GPU data layout in structure design
4. Minimize garbage collection pressure

### Material Creation Process
1. Extend `AbstractMaterialContent` for new types
2. Use shader nodes for composable features
3. Register with `MaterialRepository`
4. Implement both WebGL2 and WebGPU paths

### Asset Loading Integration
1. Use `AssetLoader` with appropriate extension loaders
2. Support format detection via extension and magic numbers
3. Handle async loading patterns consistently
4. Implement proper error handling and validation

### Rendering Integration
1. Use `RenderPass` system for operation organization
2. Support both rendering APIs consistently
3. Follow established resource management patterns
4. Implement proper cleanup and disposal