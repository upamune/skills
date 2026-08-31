#!/bin/sh
# upamune/skills を何もないマシンに一発で展開する。確認は一切しない。
#
#   curl -fsSL https://raw.githubusercontent.com/upamune/skills/main/install.sh | sh
#
# やること:
#   1. この repo を $UPAMUNE_SKILLS_DIR (既定 ~/ghq/github.com/upamune/skills) に clone する。
#      既に clone 済みなら git pull --ff-only。git が無ければ tarball を展開する
#   2. scripts/link-skills.sh --force で ~/.claude/skills と ~/.agents/skills に symlink する。
#      同名の既存スキルは symlink でも実体でも問答無用で置き換える
#
# 環境変数:
#   UPAMUNE_SKILLS_DIR   clone 先
#   UPAMUNE_SKILLS_REF   ブランチ (既定 main)
#   UPAMUNE_SKILLS_REPO  取得元 (既定 https://github.com/upamune/skills。fork や file:// に差し替え可)
set -eu

REPO="${UPAMUNE_SKILLS_REPO:-https://github.com/upamune/skills}"
DIR="${UPAMUNE_SKILLS_DIR:-$HOME/ghq/github.com/upamune/skills}"
REF="${UPAMUNE_SKILLS_REF:-main}"

log() { printf '==> %s\n' "$*"; }
warn() { printf 'warn: %s\n' "$*" >&2; }
die() { printf 'error: %s\n' "$*" >&2; exit 1; }

# macOS は Command Line Tools 未導入でも /usr/bin/git が存在し、実行すると GUI ダイアログで止まるので、
# xcode-select で実体があるかを見る
have_git() {
  command -v git >/dev/null 2>&1 || return 1
  [ "$(uname -s)" != "Darwin" ] || xcode-select -p >/dev/null 2>&1
}

fetch_with_git() {
  export GIT_TERMINAL_PROMPT=0
  if [ -d "$DIR/.git" ]; then
    log "更新: $DIR"
    if ! git -C "$DIR" pull --ff-only --quiet; then
      warn "git pull --ff-only に失敗 (手元の変更かブランチが原因)。今の checkout のまま link する"
    fi
  else
    log "clone: $REPO -> $DIR"
    rm -rf "$DIR"
    mkdir -p "$(dirname "$DIR")"
    git clone --quiet --branch "$REF" "$REPO" "$DIR"
  fi
}

fetch_with_tarball() {
  url="$REPO/archive/refs/heads/$REF.tar.gz"
  log "git が無いので tarball を展開: $url -> $DIR"
  rm -rf "$DIR"
  mkdir -p "$DIR"
  curl -fsSL "$url" | tar -xz -C "$DIR" --strip-components=1
}

main() {
  command -v curl >/dev/null 2>&1 || die "curl が必要です"
  command -v bash >/dev/null 2>&1 || die "bash が必要です (scripts/link-skills.sh が bash)"

  if have_git; then fetch_with_git; else fetch_with_tarball; fi
  [ -f "$DIR/scripts/link-skills.sh" ] || die "$DIR に scripts/link-skills.sh が無い"

  log "link: ~/.claude/skills, ~/.agents/skills (--force)"
  bash "$DIR/scripts/link-skills.sh" --force
  log "done: $DIR"
}

main "$@"
