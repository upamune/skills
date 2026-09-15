---
name: tagpr
description: Songmu/tagpr の導入、設定・ワークフロー変更、リリース PR やタグ生成の不具合調査に使う。
---

# tagpr

tagpr によるリリース PR とタグ生成を、既存のリリース方式に合わせて導入・修正する。既存設定の不具合なら、その設定と失敗ログから調べる。初回導入の手順をやり直さない。

## 保つ制約

- タグ push で後続の公開ワークフローを動かす構成は GitHub App のインストールトークンを使う。`GITHUB_TOKEN` へ暗黙にフォールバックしない。
- App トークン構成のために `can_approve_pull_request_reviews` やリポジトリ全体の既定権限を変更しない。
- 既存の公開済みタグを動かさない。バージョン・タグ接頭辞・リリースブランチを既存運用に合わせ、タグや Release を二重に作らせない。
- Actions の `uses:` は pinact で SHA に固定し、checkout は `persist-credentials: false`。公開はタグ起動と明示タグによる再実行を扱える形にする。

## 必要な資料

- 初回導入・移行: [references/setup.md](references/setup.md)
- App の用意、権限・インストール・secret の問題: [references/github-app.md](references/github-app.md)
- ワークフローの作成・変更: [references/workflows.md](references/workflows.md) の該当構成
- `.tagpr` の設定、monorepo、バージョン・CHANGELOG の問題: [references/config.md](references/config.md)

## 完了と実行範囲

依頼が設定の導入・修正なら、設定とワークフローをレビュー可能にし、差分に関係する検証まで終える。App 登録や secret の準備が必要でも、作成できるローカルの差分を先に完成させる。

既に許可された操作は再確認せず続ける。ただし App の権限変更、リポジトリ設定変更、リリースブランチへの反映、リリース PR のマージ・公開を、設定ファイルの修正依頼だけで実行しない。公開まで依頼された場合は、対象バージョンのタグ・Release・公開ワークフローを確認して完了する。確認用のダミーリリースや次バージョンを作らない。
