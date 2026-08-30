---
name: init-project
description: Go または TypeScript (Bun) の新規プロジェクトを、mise / format・lint・test の CI / backlog / upamune の skills 込みで立ち上げる。新しいリポジトリで最初に一度だけ実行する。
disable-model-invocation: true
---

# Init Project

新規プロジェクトの骨組みを、毎回同じ形で作る。言語は **Go** か **TypeScript (Bun)** のどちらか。ツールはすべて mise で管理し、バージョンは pin する（`latest` を書かない）。

原則:

- **ツールは mise 経由**。グローバルインストールや `go install` / `npm i -g` を直接やらない。`mise.toml` の `[tools]` に書き、`mise install` で入れる
- **バージョンは pin**。`mise ls-remote <tool>` で最新を確認してから、マイナーまで固定して書く（`bun = "1.4"`、`go = "1.27"`）。`latest` は使わない
- **GitHub Actions の `uses:` は pinact で SHA に pin**し、各 action は Releases を見て最新メジャーを使う
- **CI は format / lint / test の 3 ジョブ**を最低限とする

言語別の雛形は [references/typescript.md](references/typescript.md) と [references/go.md](references/go.md)、CI の規約と action の最新版は [references/github-actions.md](references/github-actions.md)。選んだ言語の reference だけ読む。

## 手順

### 1. 現状を見る

カレントディレクトリを調べる: 空か、`git init` 済みか、`go.mod` / `package.json` / `mise.toml` / `.github/workflows` がすでにあるか、`git remote -v` は何か、`gh auth status` は通っているか。

既存ファイルがあれば上書きしない前提で進め、衝突するものは都度ユーザーに聞く。

完了条件: 空プロジェクトか既存プロジェクトかを判定し、既存なら何があるかを列挙した。

### 2. 決めることを聞く

一度にまとめて聞く（AskUserQuestion が使えるならそれで）:

- 言語: **Go** / **TypeScript (Bun)**
- プロジェクト名（ディレクトリ名を既定値に）
- Go なら module path（`github.com/<owner>/<repo>` を既定値に。owner は `gh api user -q .login` で取る）
- 一行説明（README と CLAUDE.md の冒頭に使う）

完了条件: 4 項目すべて確定した。

### 3. ツールのバージョンを確認する

選んだ言語の reference にある `[tools]` の各ツールについて `mise ls-remote <tool> | tail -3` を実行し、最新の安定版を確認する。reference の数字は書いた時点のものなので、確認結果の方を `mise.toml` に書く。

完了条件: `mise.toml` に書く全ツールについて、確認した版数がメモできている。

### 4. 骨組みを書く

選んだ言語の reference に従って作る:

1. `git init`（未初期化の場合）と `.gitignore`（[references/gitignore.txt](references/gitignore.txt) をそのままコピー。`.backlog/` は backlog 自身の `.gitignore` に任せる）
2. `mise.toml`（`[tools]` と `[tasks]` の `format` / `format:check` / `lint` / `test` / `ci`）→ `mise trust` → `mise install`
3. 言語の初期化（`go mod init` / `bun init -y` 相当）、設定ファイル、最小ソースとテスト 1 本
4. `.editorconfig`
5. `.github/workflows/ci.yml`（`references/github-actions.md` の雛形。`format` / `lint` / `test` + `pinact` ジョブ）→ `pinact run`

完了条件: `mise run ci` がローカルで通り、`pinact run -check` が 0 で終わる。

### 5. backlog を初期化する

[osmove/backlog](https://github.com/osmove/backlog) は npm パッケージ（`mise.toml` に `"npm:backlog" = "<確認した版>"`）。

```bash
backlog init --name <project>
```

対話はない。`.backlog/` ができ、コミット対象（`config.toml`, `tasks.yaml` など）と無視対象（`claims/`, `runs/`, `worktrees/` など）は `.backlog/.gitignore` が自動で決める。最初のタスクを 1 つ入れておく:

```bash
backlog task add --title "初期セットアップの確認" --priority P2
```

完了条件: `backlog task list` にタスクが 1 件出る。

### 6. upamune/skills を入れる

```bash
bunx skills@latest add upamune/skills --list
```

で一覧を出し、どれを入れるかユーザーに聞く（既定は全部）。決まったら project スコープで入れる:

```bash
bunx skills@latest add upamune/skills -a claude-code -a codex -y --skill '*'   # または --skill <name> ...
```

`.agents/skills/`（実体）、`.claude/skills/`（symlink）、`skills-lock.json` ができるので、すべてコミット対象にする（`.gitignore` で `.claude` を消していないか確認）。

完了条件: `bunx skills ls` に選んだスキルが出る。

### 7. CLAUDE.md / AGENTS.md / README.md を書く

- `CLAUDE.md`: 一行説明、よく使うコマンド（`mise run format|lint|test|ci`）、規約（ツールは mise、Actions は pinact、タスクは backlog で管理: `backlog task add|list|show|move <id> done`）、ディレクトリ構成。長くしない
- `AGENTS.md` は `ln -s CLAUDE.md AGENTS.md` で symlink
- `README.md`: プロジェクト名と一行説明、**インストール方法**（前提: mise → `mise install` → 言語固有の依存取得 → 動かし方）、**使い方**（CLI なら主要コマンド例、ライブラリなら import 例、サーバーなら起動と疎通）、開発（`mise run ci`、CI の構成、backlog）。初見の人が README だけで動かせることを基準にする

完了条件: 3 ファイルが存在し、`AGENTS.md` が symlink で、README の手順を上から実行すれば動く。

### 8. 仕上げ

1. `mise run ci` をもう一度通す
2. `git status` で生成物を確認し、初回コミットを作るかユーザーに確認する（作るなら日本語メッセージ）
3. リモートが無ければ `gh repo create` を提案する（実行はユーザー確認後）

完了条件: 未追跡ファイルが意図したものだけで、ユーザーに次の一手（push / 最初のタスク着手）を伝えた。
