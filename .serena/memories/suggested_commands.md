# Essential Commands for RhodoniteTS Development

## Building
```bash
yarn build                 # Build all targets (ESM + IIFE, dev + prod)
yarn build-esm-dev         # Development ESM build with source maps
yarn build-esm-prod        # Production ESM build (optimized)
yarn build-samples         # Compile TypeScript samples
```

## Development Workflow
```bash
yarn watch-esm-dev         # Watch mode for library development
yarn watch-samples         # Watch samples with auto-reload and dev server
yarn start                 # Start development server on port 8082
```

## Testing
```bash
yarn test                  # Run all tests (unit + E2E visual regression)
yarn test-unit             # Unit tests only (Vitest)
yarn test-e2e              # E2E visual tests only (Puppeteer)
yarn test-coverage         # Test with coverage report
yarn test-e2e-update       # Update E2E test snapshots
```

## Code Quality
```bash
yarn check                 # Run both linting and formatting checks
yarn check:fix             # Auto-fix both linting and formatting issues
yarn lint                  # Lint code using Biome
yarn lint:fix              # Auto-fix linting issues
yarn format                # Format code using Biome
yarn format:fix            # Auto-format code
```

## Documentation
```bash
yarn doc                   # Generate TypeDoc API documentation
```

## Pre-submission Workflow
```bash
yarn build && yarn build-samples && yarn test
```
This is the recommended command sequence before submitting PRs.

## System Commands (Darwin/macOS)
```bash
ls                         # List directory contents
find . -name "*.ts"        # Find TypeScript files
grep -r "pattern" src/     # Search for patterns in source
git status                 # Check git status
git branch                 # Show current branch (develop is main branch)
```

## Important Notes
- Node.js 22+ is strictly required
- Main development branch is `develop`, not `main`
- E2E tests are environment-sensitive and may fail in different environments
- Always run the full build and test suite before submitting PRs