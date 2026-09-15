# 自作スキルの追加・移動と配布

## 追加

`skills/<bucket>/<name>/SKILL.md` に作る。`engineering/` はコード作業、`productivity/` はそれ以外、`in-progress/` は試用中。

- frontmatter に `name` と短い `description` を置く。既存の対応形式に合わせ、`agents/openai.yaml` に `interface.display_name` と `short_description` を置く。
- 明示呼び出し専用と指定された場合は、frontmatter の `disable-model-invocation: true` と YAML の `policy.allow_implicit_invocation: false` を揃える。
- バケット README に `SKILL.md` へのリンクと一行説明を追加する。
- promoted（`engineering/` / `productivity/`）だけはトップ README と `.claude-plugin/plugin.json` の `skills` 配列にも追加する。README の User-invoked / Model-invoked を policy に合わせる。

`bun scripts/gen-skills-md.ts` で一覧を再生成する。manifest を変更したら `claude plugin validate . --strict`。一覧・README・manifest の対象が一致すれば配布準備は完了。

## 昇格・廃止

- 昇格は `git mv` 後、追加と同じ配布設定を更新する。
- 廃止は `skills/deprecated/` へ移し、frontmatter に `metadata.internal: true` を付ける。plugin とトップ README から外し、移動元・移動先の README と生成一覧を更新する。

## ローカル反映・リリース

ローカル導入が依頼範囲に含まれるときは `scripts/link-skills.sh` で `~/.claude/skills` と `~/.agents/skills` に symlink する。追加・削除・改名には再実行が必要。`--force` は同名の実体ディレクトリも置き換えるため、その置換が許可された場合に使う。

`install.sh` は新しいマシン向けに clone と `link-skills.sh --force` をまとめて実行する。repo 保守の検証目的では実行しない。

リリースが依頼されたら生成漏れを確認し、日本語コミット（本文末尾に `prompt:`）で push する。各マシンでの初回導入は `npx skills add upamune/skills -g --all`、更新は `npx skills update -g`。特定スキルだけの導入には `--skill <name>` を使う。
