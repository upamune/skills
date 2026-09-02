# engineering

日常のコード作業で使う自作スキル。README 上では **User-invoked** と **Model-invoked** に分けて列挙する。

**User-invoked**

- [init-project](./init-project/SKILL.md): Go / TypeScript (Bun + Effect + Ultracite) の新規プロジェクトを mise・CI（format/lint/typecheck/test, pinact）・backlog・upamune/skills 込みで立ち上げる。新しいリポジトリで最初に一度だけ実行する。
- [ultra-ship](./ultra-ship/SKILL.md): 実装済みのブランチを、コミット → base merge と衝突解消 → thermo-nuclear / simplify / deslop / code-review を Cursor / OpenCode / Codex / Claude / ホストのサブエージェントをローテーションして指摘ゼロまで反復（安いモデルへオフロード） → PR 作成・整備 → pr-review-canvas で説明 → CI green まで一気に仕上げる。進捗は `z/<branch>/ultra-ship.html` に残し途中から再開できる。

**Model-invoked**

- [tagpr](./tagpr/SKILL.md): Songmu/tagpr でリリース PR の自動生成・タグ付け・GitHub Release 作成を GitHub Actions に組み込む。GitHub App（actions/create-github-app-token）のトークンで動かし、タグ push で別の公開ワークフローを起動できる形にする。
- [uv-script](./uv-script/SKILL.md): uv の PEP 723 インラインメタデータで単一ファイルの Python スクリプトを書く・直す・実行する。依存を入れるときは `[tool.uv] exclude-newer` を必ず付けて再現性を保つ。
