# GitHub Actions の規約

CI は **format / lint / test** の 3 ジョブを最低限とする。TypeScript は **typecheck** と **build** も独立ジョブにする。`uses:` は完全なタグで書き、`.github/workflows/actions.lock` に commit を固定する。

## actions.lock

lockfile は `.github/workflows/actions.lock`。`gh actions-lock` が生成し、手では編集しない。ワークフローの `uses:` は完全なタグ（`actions/checkout@v7.0.1`）で書く。

拡張は pre-1.0 なので `--pin` を省かない。導入時に release を確認する。ここでの pin は v0.4.0。

```bash
gh extension install github/gh-actions-lock --pin v0.4.0
gh actions-lock
```

- `gh actions-lock`: onboard と更新。未固定の部分バージョン（`v4` や `v7`）だけ、その範囲で最も新しい完全なタグへ narrow し、lockfile を書く。すでに完全なタグの `uses:` は変えない。narrow の結果は表の full semver とは限らない
- `gh actions-lock --relock`: 動いた ref（`main` や `v4` など）を現在の commit へ進める
- `gh actions-lock --verify`: CI 用。ファイルは書き換えず、lockfile と workflow の一致と pin の upstream を検証する
- `gh actions-lock --verify-local`: オフライン。各 `uses:` に lockfile エントリがあることだけを見る
- `--accept-moved` は上流の履歴を確認したあとの手動例外。自動化では使わない

lockfile の対象外:

- 他リポジトリの reusable workflow（`jobs.<id>.uses`）
- ローカルの `./` action
- container image

Dependabot の `github-actions` 更新は、onboard 済み workflow の lockfile も同じ PR で直す。未 onboard の workflow には lockfile を足さない。`.github/dependabot.yml` を置く。

```yaml
version: 2
updates:
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
```

`.github/CODEOWNERS` に lockfile を入れる。`@<owner>` はレビュー担当のユーザーかチームに置き換える。

```
.github/workflows/actions.lock @<owner>
```

検証ジョブは公式の [verify-lockfile.yml](https://github.com/github/gh-actions-lock/blob/v0.4.0/.github/workflows/verify-lockfile.yml) に合わせる。ランナーは `ubuntu-24.04`、拡張の pin は v0.4.0、ジョブ名は `actions-lock`。

```yaml
  actions-lock:
    runs-on: ubuntu-24.04
    permissions:
      contents: read
    env:
      GH_TOKEN: ${{ github.token }}
    steps:
      - uses: actions/checkout@v7.0.1
        with:
          persist-credentials: false
      - run: gh extension install github/gh-actions-lock --pin v0.4.0
      - run: gh actions-lock --verify
```

## pinact（reusable workflow と composite action だけ）

既定の `[tools]` には入れない。lockfile の対象外を SHA に固定するときだけ `pinact = "5.0"` を足す（`mise ls-remote pinact` で v5 系を確認する。2026-10-30 時点は v5.0.2）。フラグは `--check` と `--update`。固定は `pinact run`、検証は `pinact run --check`、更新は `pinact run --update`。

[pinact](https://github.com/suzuki-shunsuke/pinact) v5.0.2 は `actions.lock` を読まない。引数なしの `pinact run --check` は、lockfile 済みの step action も SHA への変更として報告し exit 1 になる。`--check` はファイルを書き換えない。

reusable workflow（`jobs.<id>.uses`）があるときだけ `.pinact.yaml` を置き、`pinact run --check` を CI に足す。step の action は無視し、reusable workflow だけを対象にする。

```yaml
version: 3
rules:
  - ignore: true
    conditions:
      - expr: '!(ActionName contains ".github/workflows/")'
```

composite action（`action.yml`）は、上の ignore があると対象外になる。ignore の無い設定を `--config` で渡し、ファイルを明示する。

```bash
pinact --config .pinact-action.yaml run --check .github/actions/<name>/action.yml
```

`.pinact-action.yaml` は次だけにする。

```yaml
version: 3
```

CI には実際に使う方だけ載せる。両方使うなら両方のコマンドを走らせる。引数なしの `pinact run --check` は置かない。

```yaml
  pinact:
    runs-on: ubuntu-24.04
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v7.0.1
        with:
          persist-credentials: false
      - uses: jdx/mise-action@v4.2.5
      - run: pinact run --check
        env:
          GITHUB_TOKEN: ${{ github.token }}
```

composite action だけのときは `run` を `pinact --config .pinact-action.yaml run --check .github/actions/<name>/action.yml` にする。

## Action の選び方

**必ず各リポジトリの Releases を見て最新メジャーを確認してから書く**（下表は 2026-08-23 時点の確認結果。古くなっていたら表ではなく Releases を信じる）。`uses:` には full semver 列を書く。

| Action | 最新メジャー | full semver | 用途 |
| --- | --- | --- | --- |
| actions/checkout | v7 | v7.0.1 | `persist-credentials: false` を付ける |
| jdx/mise-action | v4 | v4.2.5 | `mise.toml` を読んでツール一式を入れる。**これを使えば setup-go / setup-bun は不要** |
| actions/setup-go | v7 | v7.0.0 | `go-version-file: go.mod` |
| oven-sh/setup-bun | v2 | v2.2.0 | `bun-version-file: .bun-version` |
| actions/setup-node | v7 | v7.0.0 | Node が直接要るときだけ |
| golangci/golangci-lint-action | v9 | v9.3.0 | golangci-lint を使う場合。setup-go が前提 |
| actions/cache | v6 | v6.1.0 | 追加キャッシュが要るときだけ |

- ランナーは `ubuntu-24.04`（`ubuntu-latest` と同じだが明示する）
- `permissions: contents: read` をワークフロー直下に置く
- `concurrency` で同一 ref の古い実行をキャンセルする

## ツールの入れ方は mise 経由に統一する

`jdx/mise-action` が `mise.toml` をそのまま読むので、ローカルと CI で同じバージョンが動く。言語ランタイムも `mise.toml` で pin しているなら setup-go / setup-bun は使わない。

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
permissions:
  contents: read
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
jobs:
  format:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v7.0.1
        with:
          persist-credentials: false
      - uses: jdx/mise-action@v4.2.5
      - run: mise run format:check
  lint:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v7.0.1
        with:
          persist-credentials: false
      - uses: jdx/mise-action@v4.2.5
      - run: mise run lint
  # TypeScript の場合だけ typecheck と build を追加する。Go では省略する。
  # TypeScript は各ジョブで mise-action の直後に `bun install --frozen-lockfile` を挟む
  # （lint の knip / fallow も node_modules のバイナリを使う）。
  # TypeScript の lint ジョブだけ checkout に fetch-depth: 0 を付ける（fallow audit 用）。Go では付けない。
  typecheck:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v7.0.1
        with:
          persist-credentials: false
      - uses: jdx/mise-action@v4.2.5
      - run: bun install --frozen-lockfile
      - run: mise run typecheck
  build:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v7.0.1
        with:
          persist-credentials: false
      - uses: jdx/mise-action@v4.2.5
      - run: bun install --frozen-lockfile
      - run: mise run build
  test:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v7.0.1
        with:
          persist-credentials: false
      - uses: jdx/mise-action@v4.2.5
      - run: mise run test
```

`mise run format:check` 等は `mise.toml` の `[tasks]` に定義する（言語別 reference を参照）。ジョブ名は `format` / `lint` / `test`、TypeScript では `typecheck` / `build` に揃える（ブランチ保護の required checks で使う）。

TypeScript の lint ジョブは次の形にする。`mise run lint` が oxlint、knip、`fallow audit`、`cccc .` を回す。`fallow audit` は PR の base との差分を見るので `fetch-depth: 0` が要る。公式 Action `fallow-rs/fallow` は使わず、`package.json` の pin と `bun run fallow` に揃える。

```yaml
  lint:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v7.0.1
        with:
          persist-credentials: false
          fetch-depth: 0  # TypeScript: fallow audit の PR 差分ゲート用
      - uses: jdx/mise-action@v4.2.5
      - run: bun install --frozen-lockfile
      - run: mise run lint
```

Go の lint には fallow も `fetch-depth: 0` も不要。main への push でも TypeScript は同じ `mise run lint` を回す（`fallow audit` の base 自動検出は TypeScript reference を参照）。

## 書いたあとの確認

1. `gh actions-lock` → `.github/workflows/actions.lock` ができる。部分バージョン（`v4` や `v7`）だけ、その範囲で最も新しい完全なタグへ narrow される（表の full semver とは限らない。2026-10-30 に `jdx/mise-action@v4` は `v4.3.0` になった）。もともと完全なタグの `uses:` は変わらない
2. `actionlint` があれば `actionlint`（mise に `actionlint` あり）
3. `gh actions-lock --verify` と `gh actions-lock --verify-local`。reusable workflow があるときは ignore 付きの `pinact run --check`、composite action があるときは `--config` でファイルを明示した `pinact run --check` も通す
4. `gh workflow list` でワークフローが認識されている（push 後）
