# upamune/skills

upamune の agent skills 集。自作スキルと、外部リポジトリから vendor した外部スキルを一つの repo で管理し、どのマシンでも一発でインストールできるようにしている。

## インストール

必要なスキルだけを `--skill <name>` で選ぶと、用途の重複と自動選択時の説明文を減らせる。全件導入が必要な場合は一括インストールを使う。

### 何もないマシンに一発で

```bash
curl -fsSL https://raw.githubusercontent.com/upamune/skills/main/install.sh | sh
```

`~/ghq/github.com/upamune/skills` に clone（git が無ければ tarball を展開）し、`scripts/link-skills.sh --force` で `~/.claude/skills` と `~/.agents/skills` に全スキルを symlink する。確認は出さず、同名の既存スキルは symlink でも実体でも置き換える。clone 先は `UPAMUNE_SKILLS_DIR`、ブランチは `UPAMUNE_SKILLS_REF` で変えられる。更新は同じコマンドをもう一度打つか、clone 先で `git pull`。

### skills CLI で

用途に合わせてスキルと対象エージェントを選ぶ。

```bash
# 必要なスキルを選ぶ（例）
npx skills@latest add upamune/skills -g -a claude-code -a codex --skill uv-script --skill tagpr

# 中身を見るだけ
npx skills@latest add upamune/skills --list

# 全件が必要な場合: 自作 + 外部をグローバルに、検出された全エージェントへ
npx skills@latest add upamune/skills -g --all
```

更新は `npx skills update -g`。この repo 側で外部スキルを `sync` して push すれば、同じコマンドで追従する。

### この repo を clone して使う（メンテ用）

```bash
scripts/link-skills.sh          # ~/.claude/skills, ~/.agents/skills に symlink
scripts/link-skills.sh --force  # npx skills add で入れた実体を置き換える
```

### Claude Code plugin として

```bash
claude plugin marketplace add upamune/skills
claude plugin install upamune-skills@upamune
```

plugin に入るのは promoted バケット（`engineering/`, `productivity/`）の自作スキルだけ。外部スキルは `npx skills add` 経由で入れる。

## スキル一覧

[`SKILLS.md`](./SKILLS.md) に自作・外部すべてのスキルが載っている（自動生成）。

```bash
scripts/gen-skills-md.ts   # SKILLS.md を再生成（external.ts の add / sync / remove 後は自動で実行される）
```

## 外部スキルの管理

`external-skills.json` に出所と commit を記録し、`skills/external/<name>/` にコピーを持つ。

```bash
scripts/external.ts add mattpocock/skills              # 対話的に選ぶ（dir ごとにグループ表示。↑↓ / j k / C-n C-p 移動、Space 選択、見出しで Space ならグループ一括、a 全選択、Enter 確定）
scripts/external.ts add mattpocock/skills --list       # 一覧だけ見る（✓ = vendor 済み）
scripts/external.ts add mattpocock/skills grilling tdd # 名前指定
scripts/external.ts add vercel-labs/agent-browser agent-browser --ref main
scripts/external.ts add https://github.com/openai/plugins/tree/main/plugins/build-ios-apps/skills/ios-debugger-agent
scripts/external.ts sync              # 全部を最新に
scripts/external.ts sync grilling     # 1つだけ
scripts/external.ts sync --frozen     # pin した commit のまま取り直す
scripts/external.ts remove grilling
scripts/external.ts list
```

一覧は [`skills/external/README.md`](./skills/external/README.md)。外部スキルは上書きされるので直接編集しない。

他の repo を探すときは `npx skills find <keyword>` が使える。

## 自作スキル

| バケット | 用途 |
| --- | --- |
| [`skills/engineering/`](./skills/engineering/README.md) | 日常のコード作業 |
| [`skills/productivity/`](./skills/productivity/README.md) | コード以外のワークフロー |
| [`skills/in-progress/`](./skills/in-progress/README.md) | 作りかけ・試用中 |
| [`skills/deprecated/`](./skills/deprecated/README.md) | 使わなくなったもの |

### Engineering

**User-invoked**

- [init-project](./skills/engineering/init-project/SKILL.md): 新しい Go / TypeScript Web プロジェクトを、mise・CI・開発文書を含む標準構成で初期化する。
- [ultra-ship](./skills/engineering/ultra-ship/SKILL.md): 実装済みブランチを、差分に応じたレビュー・必要な修正・PR 作成・CI 確認まで仕上げる。チェックポイントから再開できる。

**Model-invoked**

- [tagpr](./skills/engineering/tagpr/SKILL.md): Songmu/tagpr の導入・設定変更・不具合調査を行う。既存のタグと公開経路を保ち、必要な設定を修正する。
- [uv-script](./skills/engineering/uv-script/SKILL.md): uv で動く単独 Python スクリプトを作成・編集する。PEP 723 と cutoff / lock で依存を管理する。

### Productivity

**User-invoked**

（なし）

**Model-invoked**

（なし）

## 運用メモ

- 自作スキルを追加・改名・削除したら `scripts/gen-skills-md.ts` と `scripts/link-skills.sh` を再実行する
- `.claude-plugin/*.json` を触ったら `claude plugin validate . --strict`
- `scripts/list-skills.sh` で repo 内の全 `SKILL.md` を一覧できる
