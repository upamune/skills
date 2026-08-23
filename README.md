# upamune/skills

upamune の agent skills 集。自作スキルと、外部リポジトリから vendor した外部スキルを一つの repo で管理し、どのマシンでも一発でインストールできるようにしている。

## インストール

private repo なので、`gh auth login` 済みか SSH 鍵の設定があれば `skills` CLI がそのまま認証を使う。

```bash
# 自作 + 外部を全部、グローバルに、検出された全エージェントへ
npx skills@latest add upamune/skills -g --all

# 対象エージェントを絞る / スキルを選ぶ
npx skills@latest add upamune/skills -g -a claude-code -a codex -y --skill '*'
npx skills@latest add upamune/skills -g -a claude-code --skill grilling --skill tdd

# 中身を見るだけ
npx skills@latest add upamune/skills --list
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

- [init-project](./skills/engineering/init-project/SKILL.md): Go / TypeScript (Bun) の新規プロジェクトを mise・CI（format/lint/test, pinact）・backlog・upamune/skills 込みで立ち上げる。新しいリポジトリで最初に一度だけ実行する。

**Model-invoked**

（なし）

### Productivity

**User-invoked**

（なし）

**Model-invoked**

（なし）

## 運用メモ

- 自作スキルを追加・改名・削除したら `scripts/gen-skills-md.ts` と `scripts/link-skills.sh` を再実行する
- `.claude-plugin/*.json` を触ったら `claude plugin validate . --strict`
- `scripts/list-skills.sh` で repo 内の全 `SKILL.md` を一覧できる
