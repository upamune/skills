このリポジトリは upamune の agent skills 集。自作スキルと、外部リポジトリから vendor した外部スキルを一緒に管理し、`npx skills add upamune/skills` 一発でインストールできるようにしている。

## ディレクトリ

`skills/` 配下はバケット単位:

- `engineering/`: 日常のコード作業向け（自作）
- `productivity/`: コード以外のワークフロー向け（自作）
- `in-progress/`: 作りかけ・試用中（自作、plugin には含めない）
- `deprecated/`: 使わなくなったもの（自作）
- `external/`: 外部リポジトリから vendor したもの（**直接編集禁止**）

`engineering/` と `productivity/` が **promoted** バケット。ここにあるスキルは必ず `README.md`（トップ）と `.claude-plugin/plugin.json` の `skills` 配列に載せる。`in-progress/`、`deprecated/`、`external/` はどちらにも載せない。

各バケットの `README.md` にはそのバケットの全スキルを一行説明付きで列挙し、スキル名は `SKILL.md` にリンクする。promoted バケットとトップ `README.md` は **User-invoked** / **Model-invoked** に分けて書く。

`deprecated/` に移したスキルは frontmatter に `metadata: { internal: true }` を付け、`npx skills add` から見えないようにする。

## この repo を触るときのスキル

`.agents/skills/manage-skills/`（`.claude/skills/manage-skills` は symlink）に、この repo 自身のスキル管理手順（外部 vendor / 自作追加 / 昇格・廃止 / リリース）がある。`metadata.internal: true` なので `npx skills add upamune/skills` の配布対象には入らない。スキルの追加・更新を頼まれたらまずこれを使う。

## SKILLS.md

`SKILLS.md` は `scripts/gen-skills-md.ts` が生成する全スキル一覧。手で編集しない。自作スキルを追加・改名・削除・説明変更したら再実行する（`scripts/external.ts` の add / sync / remove は自動で再生成する）。共通ヘルパーは `scripts/lib.ts`。

## 外部スキル

出所と pin（commit）は `external-skills.json` が正。`skills/external/` の中身はそこから生成されたコピーなので手で触らない。操作はすべて `scripts/external.ts` で行う:

- 追加: `scripts/external.ts add <owner/repo|URL> [<skill>...] [--ref <ref>] [--path <repo内パス>]`（スキル名を省略すると対話的に選択、`--list` で一覧のみ）
- 更新: `scripts/external.ts sync [<skill>...]`（`--frozen` で pin した commit のまま取り直し）
- 削除: `scripts/external.ts remove <skill>...`
- 一覧: `scripts/external.ts list`

`add` / `sync` / `remove` は `skills/external/README.md` を再生成する。外部スキルに手を入れたくなったら、fork して出所を変えるか、自作バケットにコピーして別名にする。

## ローカル反映

`scripts/link-skills.sh` で `~/.claude/skills` と `~/.agents/skills` に symlink する（`git pull` だけで追従）。既存の実体ディレクトリは上書きしないので、置き換えるときは `--force`。スキルの追加・削除・改名後は再実行する。

## Plugin manifest

`.claude-plugin/plugin.json` は promoted スキルだけを列挙する。`.claude-plugin/marketplace.json` はこの repo 自身を単一 plugin の marketplace にするためのもの。どちらかを触ったら `claude plugin validate . --strict` を通す。

## 文章

散文に em-dash（—）を使わない。カンマ、読点、括弧、接続詞で書き直す。
