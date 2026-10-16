#!/bin/sh
# upamune/skills を何もないマシンに一発で展開する。確認は一切しない。
#
#   curl --proto '=https' --tlsv1.2 -fsSL https://raw.githubusercontent.com/upamune/skills/main/install.sh | sh
#
# やること:
#   1. この repo を $UPAMUNE_SKILLS_DIR (既定 ~/ghq/github.com/upamune/skills) に clone する。
#      既に clone 済みなら git pull --ff-only。git が無ければ tarball を一時ディレクトリへ
#      取得して展開し、成功したときだけ配置先を置き換える
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

# mktemp した tarball 作業ディレクトリ。EXIT / INT / TERM で消す。
tmp=

log() { printf '==> %s\n' "$*"; }
warn() { printf 'warn: %s\n' "$*" >&2; }
die() { printf 'error: %s\n' "$*" >&2; exit 1; }

# 末尾の / を除く。ルート "/" だけはそのまま残す。
strip_trailing_slashes() {
  _p=$1
  while :; do
    case "$_p" in
      /) break ;;
      */) _p=${_p%/} ;;
      *) break ;;
    esac
  done
  printf '%s\n' "$_p"
}

# rm -rf してよいパスか。空、/、ホームは拒否して終了する。
refuse_unsafe_rm() {
  _target=$(strip_trailing_slashes "$1")
  _home=$(strip_trailing_slashes "${HOME:-}")
  if [ -z "$_target" ]; then
    die "削除を拒否しました: パスが空です"
  fi
  if [ "$_target" = "/" ]; then
    die "削除を拒否しました: パスが / です"
  fi
  if [ -n "$_home" ] && [ "$_target" = "$_home" ]; then
    die "削除を拒否しました: パスがホームディレクトリです (${_target})"
  fi
}

rm_rf() {
  refuse_unsafe_rm "$1"
  rm -rf "$(strip_trailing_slashes "$1")"
}

cleanup_tmp() {
  trap - EXIT INT TERM
  if [ -z "${tmp:-}" ]; then
    return 0
  fi
  _t=$(strip_trailing_slashes "$tmp")
  _h=$(strip_trailing_slashes "${HOME:-}")
  if [ -z "$_t" ] || [ "$_t" = "/" ] || { [ -n "$_h" ] && [ "$_t" = "$_h" ]; }; then
    printf 'error: %s\n' "削除を拒否しました: 一時ディレクトリが空、/、またはホームディレクトリです (${tmp})" >&2
    tmp=
    return 0
  fi
  rm -rf "$_t"
  tmp=
}

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
    rm_rf "$DIR"
    mkdir -p "$(dirname "$DIR")"
    git clone --quiet --branch "$REF" "$REPO" "$DIR"
  fi
}

# ダウンロードと展開が両方成功するまで $DIR は触らない。curl の出力を tar に直結しない。
fetch_with_tarball() {
  url="$REPO/archive/refs/heads/$REF.tar.gz"
  log "git が無いので tarball を展開: $url -> $DIR"

  _tmp_root=$(strip_trailing_slashes "${TMPDIR:-/tmp}")
  [ -n "$_tmp_root" ] || _tmp_root=/tmp
  tmp=$(mktemp -d "$_tmp_root/upamune-skills.XXXXXX") || die "一時ディレクトリを作れません"
  trap 'cleanup_tmp' EXIT
  trap 'cleanup_tmp; exit 130' INT
  trap 'cleanup_tmp; exit 143' TERM

  curl --proto '=https' --tlsv1.2 -fsSL "$url" -o "$tmp/repo.tar.gz"
  mkdir -p "$tmp/extract"
  tar -xz -f "$tmp/repo.tar.gz" -C "$tmp/extract" --strip-components=1
  [ -f "$tmp/extract/scripts/link-skills.sh" ] || die "tarball に scripts/link-skills.sh がありません"

  replace_extracted "$tmp/extract"
}

# 既存の $DIR は退避してから新しいツリーを置く。配置に失敗したら退避を戻す。
replace_extracted() {
  _src=$1
  refuse_unsafe_rm "$DIR"
  _parent=$(dirname "$DIR")
  mkdir -p "$_parent"

  if [ -e "$DIR" ] || [ -L "$DIR" ]; then
    _backup=$(mktemp -d "$_parent/upamune-skills.bak.XXXXXX") || die "退避先を作れません"
    mv "$DIR" "$_backup/prev" || die "既存の $DIR を退避できません"
    if ! mv "$_src" "$DIR"; then
      mv "$_backup/prev" "$DIR" || warn "退避した $DIR を戻せません: $_backup/prev"
      die "$DIR への配置に失敗しました"
    fi
    rm_rf "$_backup"
  else
    mv "$_src" "$DIR" || die "$DIR への配置に失敗しました"
  fi
}

main() {
  command -v curl >/dev/null 2>&1 || die "curl が必要です"
  command -v bash >/dev/null 2>&1 || die "bash が必要です (scripts/link-skills.sh が bash)"

  DIR=$(strip_trailing_slashes "$DIR")
  refuse_unsafe_rm "$DIR"

  if have_git; then fetch_with_git; else fetch_with_tarball; fi
  [ -f "$DIR/scripts/link-skills.sh" ] || die "$DIR に scripts/link-skills.sh が無い"

  log "link: ~/.claude/skills, ~/.agents/skills (--force)"
  bash "$DIR/scripts/link-skills.sh" --force
  log "done: $DIR"
}

main "$@"
