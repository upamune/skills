# engineering

日常のコード作業で使う自作スキル。README 上では **User-invoked** と **Model-invoked** に分けて列挙する。

**User-invoked**

- [init-project](./init-project/SKILL.md): Go / TypeScript (Bun) の新規プロジェクトを mise・CI（format/lint/test, pinact）・backlog・upamune/skills 込みで立ち上げる。新しいリポジトリで最初に一度だけ実行する。

**Model-invoked**

- [tagpr](./tagpr/SKILL.md): Songmu/tagpr でリリース PR の自動生成・タグ付け・GitHub Release 作成を GitHub Actions に組み込む。GitHub App（actions/create-github-app-token）のトークンで動かし、タグ push で別の公開ワークフローを起動できる形にする。
- [uv-script](./uv-script/SKILL.md): uv の PEP 723 インラインメタデータで単一ファイルの Python スクリプトを書く・直す・実行する。依存を入れるときは `[tool.uv] exclude-newer` を必ず付けて再現性を保つ。
