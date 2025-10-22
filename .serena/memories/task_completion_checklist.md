# Task Completion Checklist

## After Completing Any Development Task

### 1. Code Quality Checks (Required)
```bash
yarn check:fix             # Auto-fix linting and formatting issues
yarn check                 # Verify all issues are resolved
```

### 2. Build Verification (Required)
```bash
yarn build                 # Ensure all build targets compile successfully
yarn build-samples         # Verify samples compile without errors
```

### 3. Testing (Required)
```bash
yarn test-unit             # Run unit tests (must pass)
yarn test                  # Run full test suite if possible
```

### 4. Documentation (If applicable)
```bash
yarn doc                   # Regenerate API documentation if public APIs changed
```

### 5. Pre-PR Workflow (For submissions)
```bash
yarn build && yarn build-samples && yarn test
```

## Quality Standards
- All Biome linting rules must pass (no warnings/errors)
- Code must follow established TypeScript strict mode patterns
- Unit tests must maintain or improve coverage
- No console.log statements in production code
- Follow ECS patterns for component development
- Use MemoryManager for efficient memory allocation

## Git Workflow
- Work on feature branches, not `develop` directly
- `develop` is the main development branch (not `main`)
- Commit messages should be clear and descriptive
- Always test before pushing changes

## Special Considerations
- E2E tests are environment-sensitive - focus on unit test coverage
- Memory management is critical - use typed array views
- Support both WebGL2 and WebGPU rendering paths
- Follow established component patterns for consistency