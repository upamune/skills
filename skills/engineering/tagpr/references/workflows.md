# ワークフロー雛形

Action のバージョンは 2026-08-23 時点の最新メジャー。書く前に Releases で確認し、`uses:` は表の full semver で書く。書いたあと `gh actions-lock` で `.github/workflows/actions.lock` を生成してコミットする（手で編集しない）。他リポジトリの reusable workflow と composite action（`action.yml`）だけ pinact v5 の `pinact run` で SHA に固定する（検証は `pinact run --check`）。

| Action | 最新メジャー | full semver |
| --- | --- | --- |
| actions/checkout | v7 | v7.0.1 |
| actions/create-github-app-token | v3 | v3.2.0 |
| Songmu/tagpr | v1 | v1.20.1 |
| jdx/mise-action | v4 | v4.2.5 |
| goreleaser/goreleaser-action | v7 | v7.2.3 |

拡張は pre-1.0 なので `--pin` を省かない。導入時に release を確認する。ここでの pin は v0.4.0。Dependabot の `github-actions` 更新は、onboard 済み workflow の lockfile も同じ PR で直す。`actions.lock` は CODEOWNERS に入れる（オーナーは `@<owner>` のようなプレースホルダを実在の担当に置き換える）。検証ジョブが無ければ次を足す。`--accept-moved` は自動化で使わない。

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

## `.github/workflows/tagpr.yml`（GitHub App トークン）

```yaml
name: tagpr
on:
  push:
    branches: [main]

permissions:
  contents: read

concurrency:
  group: tagpr-${{ github.ref }}
  cancel-in-progress: false

jobs:
  tagpr:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/create-github-app-token@v3.2.0
        id: app-token
        with:
          client-id: ${{ vars.TAGPR_APP_CLIENT_ID }}
          private-key: ${{ secrets.TAGPR_APP_PRIVATE_KEY }}
          permission-contents: write
          permission-pull-requests: write
          permission-issues: read
      - uses: actions/checkout@v7.0.1
        with:
          token: ${{ steps.app-token.outputs.token }}
          persist-credentials: false
      - id: tagpr
        uses: Songmu/tagpr@v1.20.1
        env:
          GITHUB_TOKEN: ${{ steps.app-token.outputs.token }}
```

- `on.push.branches` は `.tagpr` の `releaseBranch` と一致させる
- `concurrency` は同じブランチの tagpr を直列にする（キャンセルはしない。マージ直後のタグ付け実行を落とさないため）
- ワークフロー直下の `permissions` は最小の `contents: read`。書き込みはすべて App トークンで行う
- monorepo で `.tagpr` をサブディレクトリに置くなら `with: config: tools/.tagpr` を `Songmu/tagpr` に足す。複数プロジェクトなら job を分ける

## `.github/workflows/release.yml`（タグ起動の公開）

タグ push で起動し、`workflow_dispatch` から明示タグで再実行できるようにしておく。失敗したときにタグを打ち直さずに済む。

```yaml
name: release
on:
  push:
    tags: ["v*"]
  workflow_dispatch:
    inputs:
      tag:
        description: "Tag to publish (e.g. v1.2.3)"
        required: true

permissions:
  contents: read

concurrency:
  group: release-${{ inputs.tag || github.ref_name }}
  cancel-in-progress: false

jobs:
  release:
    runs-on: ubuntu-24.04
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v7.0.1
        with:
          ref: ${{ inputs.tag || github.ref }}
          fetch-depth: 0
          persist-credentials: false
      - uses: jdx/mise-action@v4.2.5
      - run: mise run publish -- "${TAG}"
        env:
          TAG: ${{ inputs.tag || github.ref_name }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

- `tags: ["v*"]` は `.tagpr` の `vPrefix` / `tagPrefix` に合わせる（`tools/v*` など）
- 公開コマンドは `mise.toml` の `[tasks]` に `publish` として定義し、引数でタグを受け取る形にする（ローカルからも同じコマンドで復旧できる）
- GitHub Release は tagpr が作る（`tagpr.release = true` が既定）。ここでアセットを付けるなら `gh release upload "${TAG}" dist/*` のように既存 Release に追加する。goreleaser を使うなら `tagpr.release = false` にして goreleaser 側に Release 作成を任せる方が衝突しない

### Go + goreleaser の場合

```yaml
      - uses: actions/checkout@v7.0.1
        with:
          ref: ${{ inputs.tag || github.ref }}
          fetch-depth: 0
          persist-credentials: false
      - uses: jdx/mise-action@v4.2.5
      - uses: goreleaser/goreleaser-action@v7.2.3
        with:
          version: "~> v2"
          args: release --clean
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

`workflow_dispatch` から再実行するときは checkout の `ref` がタグを指していれば goreleaser はそのタグでビルドする。`.tagpr` には `release = false` を書く。

### npm の場合

```yaml
      - uses: actions/checkout@v7.0.1
        with:
          ref: ${{ inputs.tag || github.ref }}
          persist-credentials: false
      - uses: jdx/mise-action@v4.2.5
      - run: bun install --frozen-lockfile
      - run: bun publish --access public
        env:
          NPM_CONFIG_TOKEN: ${{ secrets.NPM_TOKEN }}
```

`package.json` を `.tagpr` の `versionFile` に入れておけば、タグと同じ版で publish される。Trusted Publishing（OIDC）を使うなら `permissions: id-token: write` を job に足し、`NPM_TOKEN` は不要。

## 同一ワークフロー内で公開する変種

別ワークフローに分けたくない場合は、`tagpr.yml` に続けて書く。`tag` 出力はタグを作ったときだけ非空。

```yaml
      - id: tagpr
        uses: Songmu/tagpr@v1.20.1
        env:
          GITHUB_TOKEN: ${{ steps.app-token.outputs.token }}
      - if: steps.tagpr.outputs.tag != ''
        uses: jdx/mise-action@v4.2.5
      - if: steps.tagpr.outputs.tag != ''
        run: mise run publish -- "${TAG}"
        env:
          TAG: ${{ steps.tagpr.outputs.tag }}
          GITHUB_TOKEN: ${{ steps.app-token.outputs.token }}
```

再実行は tagpr を通さずに済むよう、公開コマンド自体は明示タグを受け取れる形にしておく（`workflow_dispatch` 付きの `release.yml` を復旧用に持っておくのが楽）。

## outputs

| output | 内容 |
| --- | --- |
| `tag` | 作ったタグ。タグを作らなかった実行では空 |
| `pull_request` | 作成・更新したリリース PR の JSON |
| `base_tag` | 比較元のタグ。初回リリースでは空 |

## 書いた後の確認

1. `gh actions-lock` → `uses:` が完全なタグになり、`.github/workflows/actions.lock` ができている。reusable workflow か composite action があるときだけ、続けて `pinact run`
2. `actionlint`（mise に `actionlint` あり）
3. `gh actions-lock --verify`。pinact を使ったときだけ `pinact run --check` も通す
4. リリースブランチへの反映まで許可された場合は、`gh run list --workflow tagpr.yml` と `gh pr list --label tagpr` で実行結果を確認する
