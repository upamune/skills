---
name: manage-skills
description: このリポジトリ（upamune/skills）のスキル管理。外部スキルの追加・更新・削除、自作スキルの追加・昇格・廃止、SKILLS.md / README / plugin.json の更新、ローカル反映、リリース。このリポジトリ内で「スキルを追加して」「外部スキルを更新して」「vendor して」「SKILLS.md を直して」と言われたら使う。
metadata:
  internal: true
---

# Manage Skills

このリポジトリ自身のメンテナンス手順。規約の原文は `CLAUDE.md`、生成物の一覧は `SKILLS.md`。ここでは「何をどの順で叩くか」だけを書く。

## 外部スキル（vendor）

出所と commit pin は `external-skills.json` が正。`skills/external/` は生成物なので直接編集しない。

| やること | コマンド |
| --- | --- |
| 候補を見る | `scripts/external.ts add <owner/repo> --list` |
| 追加（対話選択） | `scripts/external.ts add <owner/repo>`（TTY が無い環境では名前指定にする） |
| 追加（名前指定） | `scripts/external.ts add <owner/repo> <skill>...`（`--ref <branch>`、tree URL も可） |
| 追加（gist） | `scripts/external.ts add https://gist.github.com/<user>/<id>`（SKILL.md がルート直下にある gist。スキルが 1 つなら自動選択） |
| 更新 | `scripts/external.ts sync [<skill>...]`（pin を動かさず取り直すだけなら `--frozen`） |
| 削除 | `scripts/external.ts remove <skill>...` |
| 一覧 | `scripts/external.ts list` |

`add` / `sync` / `remove` は `skills/external/README.md` と `SKILLS.md` を自動で再生成する。完了条件: `external-skills.json`・`skills/external/`・`SKILLS.md` の件数が一致している（`scripts/external.ts list | wc -l` と `ls skills/external | grep -vc README`）。

`sync` で差分が出たら、変更内容をざっと読んで（SKILL.md の description が変わっていないか等）からコミットする。

## 自作スキルを追加する

1. バケットを決める: `engineering/`（コード作業）/ `productivity/`（それ以外）/ `in-progress/`（試用中）。まず `in-progress/` に置き、使い込んでから昇格でもよい
2. `skills/<bucket>/<name>/SKILL.md` を書く。frontmatter は `name` と `description`。人が `/name` で叩くだけのものは `disable-model-invocation: true` にして description は一行の人向け要約、モデルに自動起動させたいものは description にトリガーを列挙する。書き方に迷ったら Skill ツールで `writing-great-skills` を呼ぶ
3. `skills/<bucket>/<name>/agents/openai.yaml` を置く（`interface.display_name` / `short_description`。user-invoked なら `policy.allow_implicit_invocation: false` も）
4. promoted バケット（`engineering/` / `productivity/`）なら、`.claude-plugin/plugin.json` の `skills` に `./skills/<bucket>/<name>` を追加し、`claude plugin validate . --strict` を通す。`in-progress/` は追加しない
5. `skills/<bucket>/README.md` と トップ `README.md` の該当セクションに一行追加（User-invoked / Model-invoked の区分に合わせる）
6. `scripts/gen-skills-md.ts` で `SKILLS.md` を再生成
7. `scripts/link-skills.sh` でローカルに symlink（既存の実体を置き換えるときだけ `--force`）

完了条件: `scripts/list-skills.sh` に新しい `SKILL.md` が出て、`SKILLS.md` のバケット件数が増えており、promoted なら `plugin.json` にも載っている。

## 昇格・廃止

- 昇格（`in-progress/` → `engineering/` など）: `git mv` してから上の 4〜7 をやり直す
- 廃止: `git mv` で `skills/deprecated/` へ移し、frontmatter に `metadata: { internal: true }` を付ける（`npx skills add` から見えなくなる）。`plugin.json` と README から外し、`SKILLS.md` を再生成

## 外部スキルに手を入れたくなったら

`skills/external/` は `sync` で上書きされる。fork して `external-skills.json` の出所を fork に向けるか、自作バケットにコピーして別名で持つ。

## リリース

1. `scripts/gen-skills-md.ts` を一度流して差分が無いことを確認（あれば生成漏れ）
2. 日本語でコミット（本文末尾に `prompt:` 行）して `git push`
3. 各マシンでは `npx skills update -g`（初回は `npx skills add upamune/skills -g --all`）

## このスキル自身

`.agents/skills/manage-skills/` にあり、`.claude/skills/manage-skills` から symlink。`metadata.internal: true` なので `npx skills add upamune/skills` の配布対象には入らない（repo 内だけで効く）。
