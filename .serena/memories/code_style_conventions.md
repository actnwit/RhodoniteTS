# Code Style and Conventions

## TypeScript Configuration
- **Target**: ES2019 with ESNext modules
- **Strict Mode**: All strict type-checking options enabled
- **Declaration**: Generate .d.ts files for type definitions
- **Source Maps**: Enabled for debugging support
- **Decorators**: Experimental decorators enabled for metadata

## Biome Configuration (Linting & Formatting)
### Formatting
- **Indentation**: 2 spaces
- **Line Width**: 120 characters
- **Line Ending**: LF (Unix style)
- **Quotes**: Single quotes for JavaScript/TypeScript
- **Semicolons**: Always required
- **Trailing Commas**: ES5 style
- **Arrow Parentheses**: As needed

### Linting Rules
- **Import/Export Types**: Enforce explicit type imports/exports
- **Unused Variables**: Error level enforcement
- **Cognitive Complexity**: Max 80 (higher than default for graphics library)
- **No Explicit Any**: Allowed (graphics programming needs flexibility)
- **No Non-Null Assertion**: Disabled (performance-critical code)

## Naming Conventions
- **Classes**: PascalCase (Component, Material, Vector3)
- **Methods/Variables**: camelCase (transformVector3, isEqual)
- **Files**: PascalCase for classes, camelCase for utilities
- **Directories**: lowercase with underscores if needed

## Project Structure Patterns
- **Components**: Extend base Component class
- **Memory Management**: Use MemoryManager for allocation
- **Materials**: Extend AbstractMaterialContent
- **Assets**: Use AssetLoader with extension loaders
- **Repositories**: Centralized management pattern

## File Organization
- **Tests**: Co-located with source files (*.test.ts)
- **Types**: Separate /types directory for shared interfaces
- **API-Specific**: Separate /webgl and /webgpu directories
- **Foundation**: Core library functionality in /foundation