#!/usr/bin/env bash
set -euo pipefail

# この repo のスキル（自作 + external、deprecated 除く）をローカルの各ハーネスの
# スキルディレクトリに symlink する。git pull するだけで最新が反映される。
#   ~/.claude/skills : Claude Code
#   ~/.agents/skills : Codex ほか Agent Skills 互換ハーネス
#
# 既存の「実体ディレクトリ」（npx skills add で入れたものなど）は上書きしない。
# 置き換えたい場合は --force を付ける。

REPO="$(cd "$(dirname "$0")/.." && pwd)"
DESTS=("$HOME/.claude/skills" "$HOME/.agents/skills")
FORCE=0
[ "${1:-}" = "--force" ] && FORCE=1

names=()
srcs=()
while IFS= read -r -d '' skill_md; do
  src="$(dirname "$skill_md")"
  names+=("$(basename "$src")")
  srcs+=("$src")
done < <(find "$REPO/skills" -name SKILL.md -not -path '*/node_modules/*' -not -path '*/deprecated/*' -print0)

if [ "${#names[@]}" -eq 0 ]; then
  echo "skills/ に SKILL.md がありません" >&2
  exit 0
fi

for DEST in "${DESTS[@]}"; do
  if [ -L "$DEST" ]; then
    resolved="$(readlink -f "$DEST")"
    case "$resolved" in
      "$REPO"|"$REPO"/*)
        echo "error: $DEST はこの repo への symlink です ($resolved)。rm してから再実行してください。" >&2
        exit 1
        ;;
    esac
  fi
  mkdir -p "$DEST"

  for i in "${!names[@]}"; do
    name="${names[$i]}"
    src="${srcs[$i]}"
    target="$DEST/$name"

    if [ -e "$target" ] && [ ! -L "$target" ]; then
      if [ "$FORCE" -eq 1 ]; then
        rm -rf "$target"
      else
        echo "skip    $name ($DEST に実体あり。--force で置き換え)"
        continue
      fi
    fi
    ln -sfn "$src" "$target"
    echo "linked  $name -> $src ($DEST)"
  done
done
