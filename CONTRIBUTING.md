# Contributing to Rhodonite

Thank you for considering contributing to Rhodonite! This document describes how to set up your environment, run the tests and send pull requests.

## Project setup

1. Install **Node.js 22** or later and **pnpm** (the version is pinned by the `packageManager` field of `package.json`).
2. Clone the repository and fetch submodules:

```bash
git clone https://github.com/actnwit/RhodoniteTS.git
cd RhodoniteTS
git submodule update --init
```

3. Install the dependencies:

```bash
pnpm install
```

## Running tests

Before opening a pull request please make sure that the build, the lint and all tests succeed.

```bash
pnpm build
pnpm build-samples
pnpm check
pnpm test
```

You can also run only unit tests or a subset of the E2E tests using the commands described in the [README](README.md).

The E2E reference images are generated in a Linux container with a software GPU (Mesa llvmpipe/lavapipe). Runs on
other machines (for example macOS with a real GPU) render slightly differently and apply a 2% tolerance, so a
native run may still report differences. To check exactly what CI checks, run the suite in the same container:

```bash
pnpm test-e2e:docker
```

If your change intentionally changes the rendering, regenerate the affected reference images in that container
(see "For E2E (visual) test" in the [README](README.md)) and mention it in the pull request.

## Submitting pull requests

1. Fork the repository and create a new branch for your work.
2. Ensure `pnpm build`, `pnpm check` and `pnpm test` run without errors.
3. Push your branch and open a pull request against the **main** branch of this repository.
4. Give the pull request a [Conventional Commits](https://www.conventionalcommits.org/) title, for example
   `feat: add X` or `fix(scope): correct Y`. Allowed types: `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`,
   `refactor`, `revert`, `style`, `test`. The `Lint PR` workflow checks this.
5. Provide a clear description of your changes.

If you change the rendering or performance features, read the related note in
[docs/design-notes/](docs/design-notes/README.md) first. It records the measurements and the alternatives that were
already rejected.

We appreciate your contributions!
