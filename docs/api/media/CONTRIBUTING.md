# Contributing to Rhodonite

Thank you for considering contributing to Rhodonite! This document describes how to set up your environment, run the tests and send pull requests.

## Project setup

1. Install **Node.js 22** or later and **pnpm**.
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

Before opening a pull request please make sure that the build and all tests succeed.

```bash
pnpm build
pnpm build-samples
pnpm test
```

You can also run only unit tests or a subset of the E2E tests using the commands described in the [README](README.md).
The E2E test will only pass if the test is run in the library author's environment, so you can submit a PR in a failed state.

## Submitting pull requests

1. Fork the repository and create a new branch for your work.
2. Ensure `pnpm build` and `pnpm test` run without errors.
3. Push your branch and open a pull request against the **main** branch of this repository.
4. Provide a clear description of your changes.

We appreciate your contributions!

