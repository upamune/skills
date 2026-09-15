---
name: uv-script
description: uv で動かす単独 Python スクリプトの作成・編集、PEP 723 メタデータと依存管理に使う。Python パッケージ開発は対象外。
---

# uv-script

単独で配布・実行する Python スクリプトの依存を PEP 723 のインラインメタデータにまとめる。既存パッケージの依存管理をこの形式へ勝手に移行しない。

## このスキルの既定

- メタデータを使う場合、`dependencies` は空でも必須。`requires-python` は対象環境と必要な構文に合わせて明示する。
- 依存付きスクリプトを新規作成・uv 形式へ移行するときは、`[tool.uv] exclude-newer` に作成時の UTC 時刻を RFC 3339 で書く。この repo の再現性を高めるための規約で、PEP 723 の必須項目ではない。
- `exclude-newer` は新しい配布物を候補から外す制約。解決結果そのものを固定したい場合は `uv lock --script <file>` を使い、`<file>.lock` も保存する。
- 既存スクリプトの小さな修正では Python 制約・依存・cutoff・lock を保つ。依存追加時に cutoff が無ければ設定し、更新が必要な場合だけ日付や lock を変える。

```python
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
```

新規ファイルは `uv init --script <file> --python <version>`、依存追加は `uv add --script <file> <package>`。依存を初めて追加する場合は、その前に cutoff をメタデータへ書く。`--exclude-newer` オプションだけで保存できたと思わず、ファイルに残った設定を確認する。

## 実行と完了

実装とメタデータを揃え、代表入力で `uv run <file> [args]` の結果を確かめる。外部更新や破壊的処理は許可済みの対象で検証するか、fixture / dry-run で該当動作を確認する。検証のためだけに本番操作を実行しない。

作成・変更したスクリプト、実行方法、確認結果を渡す。実行できなければ未確認の点と理由を明示する。

lock、shebang、別 index、プロジェクト内の実行やトラブル時のコマンドは [references/cheatsheet.md](references/cheatsheet.md) の該当箇所を読む。
