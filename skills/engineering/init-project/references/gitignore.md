# .gitignore の雛形

gitignore.io の `go` + `node`（<https://www.toptal.com/developers/gitignore/api/go,node>）を元に、この雛形のスタック（Go / Bun / mise / backlog / ultra-ship）に不要な行を削った all-in-one。言語どちらを作る場合でも全文をそのまま書いてよい。関係ない行は単に発火しないだけ。

## .gitignore

```gitignore
# 元ネタ: https://www.toptal.com/developers/gitignore/api/go,node（要抜粋）

# OS
.DS_Store

# 環境変数（.env.example だけコミットする）
.env
.env.*
!.env.example

# ログ
*.log

### Go ###
# ビルド成果物
*.exe
*.exe~
*.dll
*.so
*.dylib

# go test -c のバイナリ
*.test

# coverage（go test -coverprofile など）
*.out

# Go workspace を使うときだけ各行を外す
go.work
go.work.sum
# vendor/

### Node (Bun) ###
# 依存
node_modules/

# ビルド出力。`out/` や `build/` に吐くプロジェクトは都度足す
dist/

# TypeScript の incremental ビルドキャッシュ
*.tsbuildinfo

# coverage
coverage/
.nyc_output/

# デバッグログ
npm-debug.log*
yarn-debug.log*
yarn-error.log*

### ローカル設定 ###
# mise の個人設定。リポジトリでは共有しない
.mise.local.toml

# ultra-ship のチェックポイント置き場（z/<branch>/ 配下）。コミット禁止
/z/
```

## 決めごと

- **`.backlog/` はここで無視しない。** `backlog init` が `.backlog/.gitignore` を置き、コミット対象（`config.toml`, `tasks.yaml`）と無視対象（`claims/`, `runs/`, `worktrees/`）を自分で決める。丸ごと無視するとタスクが共有できなくなる
- **`.claude` は無視しない。** 手順 6 で入れる skills の `.claude/skills/`（symlink）をコミットする。既存プロジェクトの `.gitignore` に `.claude` の行があれば削除をユーザーに提案する
- **`/z/` は repo root 固定**（先頭の `/` を外さない）。ultra-ship の `checkpoint.py init` が `.git/info/exclude` にも入れるが、`.gitignore` 側にも入れて clone 先や `git add -f` からの混入を二重に防ぐ
- `!.env.example` は `.env.*` より後ろに置く（否定は後勝ち）
- プロジェクト固有の例外（`bin/`、IDE のキャッシュ等）はこの雛形を膨らませず、そのプロジェクトの `.gitignore` に足す

既存 repo に `.gitignore` があるときは上書きしない。足りない行だけ移植する。