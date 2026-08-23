# TypeScript (Bun) の雛形

ランタイム・パッケージマネージャ・テストランナーは Bun。品質ツールは **oxfmt（format）/ oxlint（lint）/ knip（未使用検出）**。Node / npm / ESLint / Prettier は入れない。

## mise.toml

バージョンは書く前に `mise ls-remote bun` 等で確認し、マイナーまで固定する（`latest` 禁止）。

```toml
[tools]
bun = "1.4"
pinact = "4"
"npm:backlog" = "1.4"

[tasks.format]
description = "Format"
run = "bun run fmt"

[tasks."format:check"]
description = "Format check"
run = "bun run fmt:check"

[tasks.lint]
description = "Lint + unused check"
run = ["bun run lint", "bun run knip"]

[tasks.test]
description = "Test"
run = "bun test"

[tasks.ci]
depends = ["format:check", "lint", "test"]
```

## package.json

```json
{
  "name": "<project>",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "fmt": "oxfmt",
    "fmt:check": "oxfmt --check",
    "lint": "oxlint",
    "lint:fix": "oxlint --fix",
    "knip": "knip",
    "test": "bun test"
  }
}
```

依存は `bun add -D oxfmt oxlint knip typescript @types/bun` で入れる（knip は `typescript` を peer に要求する。`@types/node` ではなく `@types/bun`）。`bun.lock` をコミットする。

## 設定ファイル

- `bunx oxfmt --init` → `.oxfmtrc.json`。生成されたら `$schema` が入っていることを確認。`.editorconfig` を読むので、`indent_style` / `insert_final_newline` は `.editorconfig` に書く
- `bunx oxlint --init` → `.oxlintrc.json`。最低限 `"categories": {"correctness": "error"}` にする。型情報ルールが欲しければ `bun add -D oxlint-tsgolint` して `"options": {"typeAware": true}`
- `knip.json`:

```json
{
  "$schema": "https://unpkg.com/knip@6/schema.json",
  "entry": ["src/index.ts"],
  "project": ["src/**/*.ts"]
}
```

- `tsconfig.json`（`bun init` が生成するものをベースに、`"strict": true` と `"noEmit": true` を確認）
- `.editorconfig`:

```ini
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
```

## 最小ソース

```
src/index.ts
src/index.test.ts
```

`src/index.test.ts` は `import { expect, test } from "bun:test"` で 1 ケース書く。`bun test` が 1 pass することが完成条件。

## CI

`references/github-actions.md` の雛形をそのまま使う。`jdx/mise-action` が `bun` を入れるので `oven-sh/setup-bun` は不要。依存解決は各ジョブの `mise run ...` の前に `bun install --frozen-lockfile` を挟む。

## 確認

`mise install && bun install && mise run ci` が通ること。
