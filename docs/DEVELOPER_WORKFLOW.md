# RhodoniteTS Developer Workflow

**Complete Development Process Guide**

> 🎯 **Quick Access**: [Setup](#environment-setup) | [Development](#development-cycle) | [Testing](#testing-strategy) | [Quality](#quality-assurance) | [Deployment](#build-deployment)

---

## 🚀 Environment Setup

### Prerequisites

```bash
# Required versions
Node.js >= 22.0.0
Yarn >= 4.9.2 (packageManager: yarn@4.9.2)

# Verify installation
node --version    # Should be 22+
yarn --version    # Should be 4.9.2+
```

### Initial Setup

```bash
# Clone repository
git clone https://github.com/actnwit/RhodoniteTS.git
cd RhodoniteTS

# Install dependencies
yarn install

# Verify setup
yarn build        # Should complete without errors
yarn test-unit    # Should pass unit tests
```

### Development Environment

```bash
# Start development mode
yarn watch-esm-dev    # Library development with auto-rebuild
yarn watch-samples    # Sample development with dev server

# Development server (port 8082)
yarn start            # Serves samples at http://localhost:8082
```

---

## 🔄 Development Cycle

### 1. Branch Strategy

```bash
# Main branches
develop    # Primary development branch
main       # Stable release branch

# Feature development
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name

# Work on feature
# ... make changes ...

# Prepare for PR
git add .
git commit -m \"feat: implement your feature\"
git push origin feature/your-feature-name
```

### 2. Code Development

#### Component Development Pattern

```typescript
// 1. Create component class
// src/foundation/components/YourComponent/YourComponent.ts
export class YourComponent extends Component {
  constructor(entityUid: number, componentSid: number, entityRepository: EntityRepository) {
    super(entityUid, componentSid, entityRepository);
    // Initialize component
  }

  $load(): void {
    // Component loading logic
  }

  $logic(): void {
    // Component update logic
  }
}

// 2. Register component
// src/foundation/components/YourComponent/YourComponentType.ts
export const YourComponentTID = ComponentTIDClass._from({
  type: ComponentType.YourComponent,
  index: nextIndex++,
});

// 3. Add to index
// src/foundation/components/YourComponent/index.ts
export * from './YourComponent';
export * from './YourComponentType';

// 4. Register in component types
// src/foundation/components/ComponentTypes.ts
YourComponent: YourComponentTID,
```

#### Memory Management Pattern

```typescript
// Use MemoryManager for efficient allocation
export class YourComponent extends Component {
  private _data: Float32Array;

  constructor(...) {
    super(...);
    // Allocate from memory pool
    const byteSize = 16 * 4; // 16 floats
    this._data = MemoryManager.allocateMemory(byteSize);
  }

  // Use typed array views for GPU-friendly data
  get position(): Vector3 {
    return new Vector3(this._data, 0);
  }

  set position(value: Vector3) {
    this._data.set(value._v, 0);
  }
}
```

### 3. Testing During Development

```bash
# Run tests frequently during development
yarn test-unit                    # Quick unit test feedback
yarn test-unit-part -- ./src/foundation/components/YourComponent

# Test specific functionality
yarn test-unit-part -- ./src/foundation/math    # Math module tests
yarn test-unit-part -- ./src/foundation/core    # Core system tests
```

### 4. Code Quality Checks

```bash
# Auto-fix common issues
yarn check:fix              # Fix linting and formatting
yarn format:fix             # Format code only
yarn lint:fix               # Fix linting only

# Verify quality
yarn check                  # Check without fixing
yarn lint                   # Lint without fixing
yarn format                 # Format check without fixing
```

---

## 🧪 Testing Strategy

### Unit Testing

```typescript
// Create test file: YourComponent.test.ts
import { YourComponent } from './YourComponent';
import { EntityRepository } from '../core/EntityRepository';

test('YourComponent should initialize correctly', () => {
  const entityRepository = new EntityRepository();
  const entity = entityRepository.createEntity();
  const component = entity.addComponent(YourComponent);
  
  expect(component).toBeDefined();
  expect(component.componentType).toBe(ComponentType.YourComponent);
});

test('YourComponent should handle data correctly', () => {
  // Test component logic
  const component = createTestComponent();
  component.setData(testData);
  
  expect(component.getData()).toEqual(expectedData);
});
```

### E2E Testing

```bash
# Visual regression tests
yarn test-e2e                     # Full E2E suite (environment-sensitive)
yarn test-e2e-part -- ./samples/test_e2e/YourSample

# Update snapshots when intentional changes made
yarn test-e2e-update             # Update all snapshots
yarn test-e2e-part -- --update ./samples/test_e2e/YourSample
```

### Sample Development

```typescript
// Create sample: samples/simple/YourSample/main.ts
import Rn from '../../../dist/esmdev/index.js';

export default async function() {
  // Initialize Rhodonite
  await Rn.System.init({
    approach: Rn.ProcessApproach.DataTexture,
    canvas: document.getElementById('world') as HTMLCanvasElement,
  });

  // Create your scene
  const entity = Rn.EntityRepository.createEntity();
  const yourComponent = entity.addComponent(YourComponent);
  
  // Setup rendering
  Rn.System.startRenderLoop(() => {
    Rn.System.processAuto();
  });
}
```

---

## ✅ Quality Assurance

### Pre-Commit Checklist

```bash
# 1. Code quality
yarn check:fix              # Auto-fix issues
yarn check                  # Verify no remaining issues

# 2. Build verification
yarn build                  # Ensure all builds work
yarn build-samples          # Ensure samples compile

# 3. Test validation
yarn test-unit              # Unit tests must pass
yarn test-unit-part -- ./src/path/to/changed/code

# 4. Documentation
yarn doc                    # Generate updated API docs (if needed)
```

### Code Review Guidelines

#### Architecture Compliance
- Follow ECS patterns for components
- Use memory pools for data allocation
- Support both WebGL2 and WebGPU where applicable
- Maintain immutable/mutable class pairs for math types

#### Performance Considerations
- Minimize garbage collection pressure
- Use typed arrays for GPU data
- Consider memory layout for efficiency
- Profile performance-critical paths

#### Code Style
- TypeScript strict mode compliance
- Biome configuration adherence
- Descriptive naming conventions
- Proper error handling with Result types

### Continuous Integration

```yaml
# .github/workflows/test.yml (reference)
- name: Install dependencies
  run: yarn install

- name: Check code quality  
  run: yarn check

- name: Build library
  run: yarn build

- name: Build samples
  run: yarn build-samples

- name: Run unit tests
  run: yarn test-unit

# E2E tests are environment-sensitive
- name: Run E2E tests (allowed to fail)
  run: yarn test-e2e
  continue-on-error: true
```

---

## 📦 Build & Deployment

### Build Targets

```bash
# Development builds (with source maps)
yarn build-esm-dev          # ESM development build
yarn build-iife-dev         # IIFE development bundle

# Production builds (optimized)
yarn build-esm-prod         # ESM production build  
yarn build-iife-prod        # IIFE production bundle (minified)

# Complete build
yarn build                  # All targets
```

### Build Output Structure

```
dist/
├── esm/                    # Production ES modules
│   ├── index.js           # Main entry point
│   ├── index.d.ts         # TypeScript definitions
│   └── ...                # Module structure
├── esmdev/                 # Development ES modules
│   ├── index.js           # With source maps
│   ├── index.js.map       # Source maps
│   └── ...
├── iife/                   # Production browser bundle
│   ├── rhodonite.min.js   # Minified bundle
│   └── rhodonite.min.d.ts # Type definitions
└── iifedev/               # Development browser bundle
    ├── rhodonite.js       # Unminified with source maps
    └── rhodonite.d.ts     # Type definitions
```

### Release Process

```bash
# 1. Prepare release
git checkout develop
git pull origin develop

# 2. Version update (package.json)
# Update version number manually

# 3. Pre-release validation
yarn preoutput             # Runs build + build-samples + test

# 4. Create release branch
git checkout -b release/v0.x.x
git add package.json
git commit -m \"chore: bump version to v0.x.x\"

# 5. Merge to main
git checkout main
git merge release/v0.x.x
git tag v0.x.x
git push origin main --tags

# 6. Publish to npm
yarn yarn-pack            # Create package
npm publish rhodonite-*.tgz
```

---

## 🛠️ Advanced Development

### Custom Material Development

```typescript
// 1. Create material content class
export class CustomMaterialContent extends AbstractMaterialContent {
  constructor() {
    super(null, 'CustomMaterial', {}, '');
  }

  // 2. Define shader methods
  _getVertexShaderMethodDefinitions() {
    return `
      vec4 getWorldPosition(vec3 position_inLocal) {
        return u_worldMatrix * vec4(position_inLocal, 1.0);
      }
    `;
  }

  _getPixelShaderMethodDefinitions() {
    return `
      vec4 getBaseColor() {
        return u_baseColorFactor;
      }
    `;
  }

  // 3. Define uniforms and attributes
  _getShaderSemantics() {
    return [
      { semantic: ShaderSemantics.WorldMatrix, componentType: ComponentType.Mat4 },
      { semantic: ShaderSemantics.BaseColorFactor, componentType: ComponentType.Vec4 },
    ];
  }
}

// 4. Register material
MaterialRepository.registerMaterial('CustomMaterial', CustomMaterialContent);
```

### Importer Development

```typescript
// 1. Create importer class
export class CustomImporter {
  async import(uri: string, options: CustomImportOptions): Promise<RnPromise<Group>> {
    // 2. Load and parse asset
    const arrayBuffer = await fetch(uri).then(res => res.arrayBuffer());
    const parsedData = this._parseAsset(arrayBuffer);

    // 3. Create Rhodonite entities
    const rootGroup = this._createEntities(parsedData);

    // 4. Return wrapped result
    return new RnPromise(rootGroup);
  }

  private _parseAsset(arrayBuffer: ArrayBuffer) {
    // Custom parsing logic
  }

  private _createEntities(data: any): Group {
    // Convert to Rhodonite ECS entities
  }
}

// 5. Register with asset loader
AssetLoader.getInstance().registerLoader('custom', new CustomImporter());
```

### Performance Optimization

```typescript
// Memory pool optimization
export class OptimizedComponent extends Component {
  private static _memoryPool: Float32Array;
  private _offset: number;

  static initializePool(maxInstances: number) {
    const bytesPerInstance = 64; // Component data size
    this._memoryPool = new Float32Array(maxInstances * bytesPerInstance / 4);
  }

  constructor(entityUid: number, componentSid: number, entityRepository: EntityRepository) {
    super(entityUid, componentSid, entityRepository);
    this._offset = this._allocateFromPool();
  }

  private _allocateFromPool(): number {
    // Pool allocation logic
    return MemoryManager.allocateMemoryFromPool(OptimizedComponent._memoryPool);
  }
}
```

---

## 🔍 Debugging Guide

### Development Tools

```typescript
// Enable debug mode
Rn.Config.isDebugMode = true;
Rn.Config.cgApiDebugMode = 'webgl2'; // or 'webgpu'

// Memory debugging
const memoryInfo = Rn.MemoryManager.getMemoryInfo();
console.log('Memory usage:', memoryInfo);

// Performance monitoring
const stats = Rn.System.getPerformanceStats();
console.log('Frame time:', stats.frameTime);
console.log('Draw calls:', stats.drawCalls);
```

### Common Issues

| Issue | Symptoms | Solution |
|-------|----------|----------|
| **Memory leaks** | Increasing memory usage | Use `MemoryManager.freeMemoryIfNoEntity()` |
| **Shader compilation** | Rendering errors | Check `Config.cgApiDebugMode` and console |
| **Component registration** | Components not found | Verify `ComponentRepository.registerComponentClass()` |
| **Asset loading** | Files not loading | Check file paths and CORS settings |

### VSCode Debugging

```json
// .vscode/launch.json
{
  \"version\": \"0.2.0\",
  \"configurations\": [
    {
      \"type\": \"chrome\",
      \"request\": \"launch\",
      \"name\": \"Debug Rhodonite\",
      \"url\": \"http://localhost:8082\",
      \"webRoot\": \"${workspaceFolder}\",
      \"sourceMaps\": true
    }
  ]
}
```

---

## 📚 Documentation Maintenance

### API Documentation

```bash
# Generate TypeDoc documentation
yarn doc                   # Creates docs/api/ directory

# Documentation files
docs/
├── api/                   # Generated TypeDoc API documentation
├── PROJECT_INDEX.md       # Project navigation and architecture
├── API_OVERVIEW.md        # Comprehensive API examples
└── DEVELOPER_WORKFLOW.md  # This workflow guide
```

### Memory Files (Serena)

```bash
# Project memories for Claude Code
.serena/memories/
├── project_overview.md           # Project purpose and tech stack
├── code_style_conventions.md     # TypeScript and Biome configuration
├── suggested_commands.md         # Essential development commands
├── task_completion_checklist.md  # Quality checklist
├── codebase_structure.md         # Directory organization
└── architecture_patterns.md      # Design patterns and guidelines
```

---

## 🎯 Best Practices Summary

### Development
- ✅ Use ECS patterns for all game objects
- ✅ Allocate memory through MemoryManager
- ✅ Support both WebGL2 and WebGPU
- ✅ Follow immutable/mutable math class patterns
- ✅ Use Result types for error handling

### Testing
- ✅ Write unit tests for all components
- ✅ Create samples for new features
- ✅ Run tests before committing
- ✅ Update E2E snapshots when needed

### Quality
- ✅ Auto-fix with `yarn check:fix`
- ✅ Build before pushing: `yarn build && yarn build-samples && yarn test-unit`
- ✅ Follow TypeScript strict mode
- ✅ Document public APIs

### Performance
- ✅ Minimize garbage collection
- ✅ Use typed arrays for GPU data
- ✅ Profile performance-critical code
- ✅ Consider memory layout optimization

---

**Happy Coding!** 🚀 | **Version**: 0.17.4 | **Node.js**: 22+ | **Package Manager**: Yarn 4.9.2