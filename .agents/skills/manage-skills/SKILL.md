---
name: manage-skills
description: upamune/skills 内のスキル、配布一覧、外部 vendor の追加・更新・移動を行うときに使う。
metadata:
  internal: true
---

# Manage Skills

この repo 自身の保守に使う。対象のスキルを編集し、配布設定と生成一覧を整合させる。ルートの制約は [CLAUDE.md](../../../CLAUDE.md)。

## 対象に応じて読む

- 自作スキルの本文・description の修正は、下の編集基準で進める。
- 追加・昇格・廃止、配布設定、ローカル反映、リリースには [references/lifecycle.md](references/lifecycle.md)。
- 外部スキルの追加・同期・削除には [references/external.md](references/external.md)。`skills/external/` を手で編集しない。

## 編集基準

- description は能力と適用条件を短く書く。「関連する作業すべて」のような条件や、ツール・手順の列挙は避ける。
- `SKILL.md` には目的、判断に必要な固有の制約、条件付き reference の入口を置く。短いスキルは単一ファイルのままでよい。
- モデルが既にできる一般論、工程ごとの確認、同じ検査の反復を増やさない。決まった手順は依存関係や壊れやすい操作に絞る。
- 完了条件を成果物と検証結果で示す。許可済みの範囲で修正・検証まで続け、公開や権限変更の許可を本文から推定させない。
- ユーザーの技術選定と非自明な運用制約を残す。モデル名や過去一例の所要時間を一般的な選定基準にしない。
- 既存の invocation policy と metadata を保つ。新規は自動選択を既定にし、明示呼び出し専用の要望がある場合だけ `disable-model-invocation: true` と `policy.allow_implicit_invocation: false` を揃える。

## 更新を仕上げる

1. 本文を変更したら、参照先と `agents/openai.yaml` の説明に矛盾がないか確認する。description を変えたらバケット README と、promoted ならトップ README の一行説明も揃える。
2. 一覧に影響した場合は `bun scripts/gen-skills-md.ts` を実行する。自作本文だけの変更で vendor の `sync` や全スキルの再インストールを行わない。
3. frontmatter、相対リンク、既存 policy を確認する。スクリプトを変えた場合はその振る舞いを検証する。複雑な判断境界は、実際の依頼例でも対象範囲と停止条件を確かめる。
4. 差分をレビュー可能な形で保存し、変更点と検証結果を報告する。コミットは日本語、本文末尾に `prompt:` 行を付ける。
