# Skills

<!-- このファイルは scripts/gen-skills-md.ts が自動生成する。手で編集しない。 -->

このリポジトリに入っている全スキルの一覧。`npx skills add upamune/skills` でインストールできる。
再生成: `scripts/gen-skills-md.ts`（`scripts/external.ts` の add / sync / remove 後は自動で更新される）。

合計 17 スキル

| bucket | count | 用途 |
| --- | --- | --- |
| [engineering/](#engineering) | 1 | 日常のコード作業向け（自作） |
| [productivity/](#productivity) | 0 | コード以外のワークフロー向け（自作） |
| [in-progress/](#in-progress) | 0 | 作りかけ・試用中（自作） |
| [deprecated/](#deprecated) | 0 | 使わなくなったもの（自作） |
| [external/](#external) | 16 | 外部リポジトリから vendor したもの |

## engineering

日常のコード作業向け（自作）

**User-invoked**

- [init-project](./skills/engineering/init-project/SKILL.md): Go または TypeScript (Bun) の新規プロジェクトを、mise / format・lint・test の CI / backlog / upamune の skills 込みで立ち上げる。新しいリポジトリで最初に一度だけ実行する。

## productivity

コード以外のワークフロー向け（自作）

（なし）

## in-progress

作りかけ・試用中（自作）

（なし）

## deprecated

使わなくなったもの（自作）

（なし）

## external

外部リポジトリから vendor したもの

| skill | description | source | commit |
| --- | --- | --- | --- |
| [claude-handoff](./skills/external/claude-handoff/SKILL.md) | Hand the current conversation off to a fresh background agent that picks up the work immediately. | [mattpocock/skills/skills/in-progress/claude-handoff](https://github.com/mattpocock/skills/tree/5b15a47f2d7150f545fbcacbfe381787fc0230dc/skills/in-progress/claude-handoff) | `5b15a47` |
| [code-review](./skills/external/code-review/SKILL.md) | Review the changes since a fixed point (commit, branch, tag, or merge-base) along two axes: Standards (does the code follow this repo's documented coding standards?) and Spec (does the code match what the originating issue/spec asked for?). Runs both reviews in parallel sub-agents and reports them side by side. Use when the user wants to review a branch, a PR, work-in-progress changes, or asks to "review since X". | [mattpocock/skills/skills/engineering/code-review](https://github.com/mattpocock/skills/tree/5b15a47f2d7150f545fbcacbfe381787fc0230dc/skills/engineering/code-review) | `5b15a47` |
| [codebase-design](./skills/external/codebase-design/SKILL.md) | Shared vocabulary for designing deep modules. Use when the user wants to design or improve a module's interface, find deepening opportunities, decide where a seam goes, make code more testable or AI-navigable, or when another skill needs the deep-module vocabulary. | [mattpocock/skills/skills/engineering/codebase-design](https://github.com/mattpocock/skills/tree/5b15a47f2d7150f545fbcacbfe381787fc0230dc/skills/engineering/codebase-design) | `5b15a47` |
| [diagnosing-bugs](./skills/external/diagnosing-bugs/SKILL.md) | Diagnosis loop for hard bugs and performance regressions. Use when the user says "diagnose"/"debug this", or reports something broken/throwing/failing/slow. | [mattpocock/skills/skills/engineering/diagnosing-bugs](https://github.com/mattpocock/skills/tree/5b15a47f2d7150f545fbcacbfe381787fc0230dc/skills/engineering/diagnosing-bugs) | `5b15a47` |
| [domain-modeling](./skills/external/domain-modeling/SKILL.md) | Build and sharpen a project's domain model. Use when discussing codebase terminology, writing or editing a CONTEXT.md, or recording or editing an ADR. | [mattpocock/skills/skills/engineering/domain-modeling](https://github.com/mattpocock/skills/tree/5b15a47f2d7150f545fbcacbfe381787fc0230dc/skills/engineering/domain-modeling) | `5b15a47` |
| [grill-me](./skills/external/grill-me/SKILL.md) | A relentless interview to sharpen a plan or design. | [mattpocock/skills/skills/productivity/grill-me](https://github.com/mattpocock/skills/tree/5b15a47f2d7150f545fbcacbfe381787fc0230dc/skills/productivity/grill-me) | `5b15a47` |
| [grill-with-docs](./skills/external/grill-with-docs/SKILL.md) | A relentless interview to sharpen a plan or design, which also creates docs (ADR's and glossary) as we go. | [mattpocock/skills/skills/engineering/grill-with-docs](https://github.com/mattpocock/skills/tree/5b15a47f2d7150f545fbcacbfe381787fc0230dc/skills/engineering/grill-with-docs) | `5b15a47` |
| [handoff](./skills/external/handoff/SKILL.md) | Compact the current conversation into a handoff document for another agent to pick up. | [mattpocock/skills/skills/productivity/handoff](https://github.com/mattpocock/skills/tree/5b15a47f2d7150f545fbcacbfe381787fc0230dc/skills/productivity/handoff) | `5b15a47` |
| [implement](./skills/external/implement/SKILL.md) | Implement a piece of work based on a spec or set of tickets. | [mattpocock/skills/skills/engineering/implement](https://github.com/mattpocock/skills/tree/5b15a47f2d7150f545fbcacbfe381787fc0230dc/skills/engineering/implement) | `5b15a47` |
| [improve-codebase-architecture](./skills/external/improve-codebase-architecture/SKILL.md) | Scan a codebase for deepening opportunities, present them as a visual HTML report, then grill through whichever one you pick. | [mattpocock/skills/skills/engineering/improve-codebase-architecture](https://github.com/mattpocock/skills/tree/5b15a47f2d7150f545fbcacbfe381787fc0230dc/skills/engineering/improve-codebase-architecture) | `5b15a47` |
| [loop-me](./skills/external/loop-me/SKILL.md) | Grill me about specs for the workflows I want to build, within this workspace. | [mattpocock/skills/skills/in-progress/loop-me](https://github.com/mattpocock/skills/tree/5b15a47f2d7150f545fbcacbfe381787fc0230dc/skills/in-progress/loop-me) | `5b15a47` |
| [prototype](./skills/external/prototype/SKILL.md) | Build a throwaway prototype to answer a design question. Use when the user wants to sanity-check whether a state model or logic feels right, or explore what a UI should look like. | [mattpocock/skills/skills/engineering/prototype](https://github.com/mattpocock/skills/tree/5b15a47f2d7150f545fbcacbfe381787fc0230dc/skills/engineering/prototype) | `5b15a47` |
| [research](./skills/external/research/SKILL.md) | Investigate a question against high-trust primary sources and capture the findings as a Markdown file in the repo. Use when the user wants a topic researched, docs or API facts gathered, or reading legwork delegated to a background agent. | [mattpocock/skills/skills/engineering/research](https://github.com/mattpocock/skills/tree/5b15a47f2d7150f545fbcacbfe381787fc0230dc/skills/engineering/research) | `5b15a47` |
| [resolving-merge-conflicts](./skills/external/resolving-merge-conflicts/SKILL.md) | Use when you need to resolve an in-progress git merge/rebase conflict. | [mattpocock/skills/skills/engineering/resolving-merge-conflicts](https://github.com/mattpocock/skills/tree/5b15a47f2d7150f545fbcacbfe381787fc0230dc/skills/engineering/resolving-merge-conflicts) | `5b15a47` |
| [teach](./skills/external/teach/SKILL.md) | Teach the user a new skill or concept, within this workspace. | [mattpocock/skills/skills/productivity/teach](https://github.com/mattpocock/skills/tree/5b15a47f2d7150f545fbcacbfe381787fc0230dc/skills/productivity/teach) | `5b15a47` |
| [writing-for-agents](./skills/external/writing-for-agents/SKILL.md) | Writing documents for agents. Use when creating or editing skills, or modifying AGENTS.md or CLAUDE.md. | [mattpocock/skills/skills/productivity/writing-for-agents](https://github.com/mattpocock/skills/tree/5b15a47f2d7150f545fbcacbfe381787fc0230dc/skills/productivity/writing-for-agents) | `5b15a47` |
