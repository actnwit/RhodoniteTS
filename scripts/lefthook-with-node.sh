#!/usr/bin/env bash
# Git hooks often run with a minimal PATH (e.g. GUI git clients), so Node may be
# missing even when it works in an interactive terminal (nvm/fnm/Homebrew).
set -euo pipefail

PATH="/opt/homebrew/bin:/usr/local/bin:${HOME}/.volta/bin:${PATH}"
export PATH

if [[ -s "${HOME}/.nvm/nvm.sh" ]]; then
  # shellcheck disable=SC1090
  . "${HOME}/.nvm/nvm.sh"
fi

if [[ -f "${HOME}/.asdf/asdf.sh" ]]; then
  # shellcheck disable=SC1090
  . "${HOME}/.asdf/asdf.sh"
fi

if command -v fnm >/dev/null 2>&1; then
  eval "$(fnm env)"
fi

if command -v mise >/dev/null 2>&1; then
  eval "$(mise env -s bash 2>/dev/null)" || true
fi

exec "$@"
