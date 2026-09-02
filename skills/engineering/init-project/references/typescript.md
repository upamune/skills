# TypeScript (Bun) の雛形

ランタイム・パッケージマネージャ・テストランナーは Bun。アプリケーション基盤は **Effect**。品質ツールは **Ultracite + Oxfmt（format）/ Ultracite + Oxlint（lint）/ knip（未使用検出）/ TypeScript + Effect TSGO（型・Effect 診断）**。Node / npm / ESLint / Prettier は入れない。

## mise.toml

バージョンは書く前に `mise ls-remote bun` 等で確認し、マイナーまで固定する（`latest` 禁止）。

```toml
[tools]
bun = "1.4"
pinact = "4"
"npm:backlog" = "1.4"

[tasks.format]
description = "Format"
run = "bun run format"

[tasks."format:check"]
description = "Format check"
run = "bun run format:check"

[tasks.lint]
description = "Lint + unused check"
run = ["bun run lint", "bun run knip"]

[tasks.typecheck]
description = "TypeScript + Effect diagnostics"
run = "bun run typecheck"

[tasks.test]
description = "Test"
run = "bun test"

[tasks.ci]
depends = ["format:check", "lint", "typecheck", "test"]
```

## package.json

```json
{
  "name": "<project>",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "format": "oxfmt",
    "format:check": "oxfmt --check",
    "lint": "oxlint --type-aware",
    "lint:fix": "ultracite fix --type-aware",
    "check": "ultracite check --type-aware",
    "fix": "ultracite fix --type-aware",
    "knip": "knip",
    "typecheck": "tsc --noEmit && effect-tsgo diagnostics --project tsconfig.json",
    "test": "bun test"
  }
}
```

依存は次のように入れる。`effect` は production dependency、`@effect/tsgo` は TypeScript 7 と組み合わせ、Effect 固有の誤りをエディタと CI の両方で検出する。

```bash
bun add effect
bun add -D knip typescript @types/bun @effect/tsgo
```

Ultracite の安定版を確認してから、確認した版を明示して初期化する。`latest` のまま実行しない。

```bash
bun pm view ultracite version
bunx ultracite@<確認した版> init \
  --quiet \
  --linter oxlint \
  --pm bun \
  --type-aware \
  --js-plugins anti-slop
```

`--quiet` は agent files、editor settings、hooks、git integrations を作らず、lint / format の core config だけを非対話で生成する。これにより、このスキルが管理する `CLAUDE.md` / `AGENTS.md` と競合しない。生成後、`package.json` の scripts を上の形に揃え、`bun run fix` を一度実行する。生成直後の config や `package.json` 自体が Ultracite の形式とずれている場合があるので、`bun run check` が通るまでを初期化に含める。

Ultracite が `ultracite`、`oxlint`、`oxfmt`、`oxlint-tsgolint` と `oxlint.config.ts` / `oxfmt.config.ts` を追加する。`oxlint.config.ts` が `ultracite/oxlint/core` と `ultracite/oxlint/anti-slop` を extends していることを確認する。knip は `typescript` を peer に要求する。`@types/node` ではなく `@types/bun` を使う。`bun.lock` をコミットする。

## 設定ファイル

- `oxfmt.config.ts`: `ultracite/oxfmt` を展開する。手書きの `.oxfmtrc.json` は作らない
- `oxlint.config.ts`: `ultracite/oxlint/core` と `ultracite/oxlint/anti-slop` を extends する。手書きの `.oxlintrc.json` は作らない
- `knip.json`:

```json
{
  "$schema": "https://unpkg.com/knip@6/schema.json",
  "entry": ["src/index.ts"],
  "project": ["src/**/*.ts"],
  "ignoreDependencies": ["@effect/language-service"]
}
```

`@effect/tsgo` の plugin 名は `@effect/language-service` なので、knip には仮想的な依存として無視させる。テストを `entry` に含める必要がある構成では `src/**/*.test.ts` も追加する。

Ultracite の anti-slop preset は型アサーション、`unknown` の漏出、module mocking などを厳しく検査する。Effect の Schema / Layer / typed error と組み合わせ、ルールを一括で無効化しない。プロジェクト固有の正当な理由があるルールだけ、`oxlint.config.ts` で個別に上書きする。

- `tsconfig.json`（`bun init` が生成するものをベースに、`"strict": true` と `"noEmit": true` を確認）。Effect Language Service を有効にする:

```json
{
  "$schema": "./node_modules/@effect/tsgo/schema.json",
  "compilerOptions": {
    "strict": true,
    "noEmit": true,
    "types": ["bun"],
    "plugins": [{ "name": "@effect/language-service" }]
  }
}
```

既存の `compilerOptions` は保持してマージする。CLI では `effect-tsgo diagnostics --project tsconfig.json` を明示的に実行し、エディタ専用 plugin にしない。`@effect/language-service` は TypeScript 6 以前向けなので、新規プロジェクトには使わない。
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

`src/index.ts` は通常の Promise や例外だけで済ませず、最小の業務処理を Effect として公開する:

```ts
import { Effect } from "effect";

export const greet = (name: string) => Effect.succeed(`Hello, ${name}!`);
```

`src/index.test.ts` は Effect を実行して 1 ケース書く:

```ts
import { expect, test } from "bun:test";
import { Effect } from "effect";
import { greet } from "./index";

test("greets by name", () => {
  expect(Effect.runSync(greet("Effect"))).toBe("Hello, Effect!");
});
```

`bun run typecheck` と `bun test` が通ることが完成条件。

## Effect の規約

- 業務処理と副作用は Effect を返す。`Effect.runSync` / `Effect.runPromise` は CLI、HTTP handler、テストなどの境界に置く
- 想定内の失敗は `Schema.TaggedError` などで型に載せる。`throw` や広い `catch (error: unknown)` を通常の制御フローにしない
- 外部入力は Effect Schema で検証する。サービスは Layer で差し替え可能にする
- 純粋な同期変換まで無理に Effect で包まない
- Effect API が不確かなときは型定義、公式ドキュメント、公式リポジトリの実例を確認し、存在しそうな API 名を推測しない

## CI

`references/github-actions.md` の雛形をそのまま使う。`jdx/mise-action` が `bun` を入れるので `oven-sh/setup-bun` は不要。依存解決は各ジョブの `mise run ...` の前に `bun install --frozen-lockfile` を挟む。

## 確認

`mise install && bun install && bun run check && mise run ci` が通り、Ultracite、TypeScript、Effect の診断がすべて 0 件であること。`bun run fix --codex` はコードを変更するため、通常の初期化や CI では実行しない。
