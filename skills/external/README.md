# external

外部リポジトリから vendor したスキル。**このディレクトリを直接編集しない**（`scripts/external.ts sync` で上書きされる）。
出所と pin は [`external-skills.json`](../../external-skills.json) が正。追加・更新・削除は `scripts/external.ts` で行う。

次のスキルはコピー直後にローカル override を再適用する。`skills/external/` 側を手で戻しても、次の add / sync で同じ差分が入る。アンカーが上流とずれたらコマンドは失敗し、直前のツリーは残る。

- archify: 更新確認は既定でオフ。`ARCHIFY_UPDATE_CHECK=1` のときだけ https://tt-a1i.github.io/archify/skill-updates/archify/stable.json へ GET する。`ARCHIFY_UPDATE_CHECK_DISABLED=1` はオプトインより優先して止める。オプトイン時も、新しい版があること以外はリモート manifest の文面を出さず、自己更新は案内しない。グローバルな agent ルールファイルは書き換えない。再適用は `scripts/external-overrides.ts`。

| skill | source | ref | commit |
| --- | --- | --- | --- |
| [animate](./animate/SKILL.md) | [emilkowalski/skills](https://github.com/emilkowalski/skills/tree/2d228630ba1446365f614a108cb8252f1feda202/skills/animate) | `default` | `2d22863` |
| [animation-vocabulary](./animation-vocabulary/SKILL.md) | [emilkowalski/skills](https://github.com/emilkowalski/skills/tree/2d228630ba1446365f614a108cb8252f1feda202/skills/animation-vocabulary) | `default` | `2d22863` |
| [apple-design](./apple-design/SKILL.md) | [emilkowalski/skills](https://github.com/emilkowalski/skills/tree/2d228630ba1446365f614a108cb8252f1feda202/skills/apple-design) | `default` | `2d22863` |
| [archify](./archify/SKILL.md) | [tt-a1i/archify](https://github.com/tt-a1i/archify/tree/d6059331abbddb49bca380ff46dca8ce33158b04/archify) | `default` | `d605933` |
| [claude-handoff](./claude-handoff/SKILL.md) | [mattpocock/skills](https://github.com/mattpocock/skills/tree/59db609eb1e18aaf59b63284d0e52255aff0c63c/skills/in-progress/claude-handoff) | `default` | `59db609` |
| [code-review](./code-review/SKILL.md) | [mattpocock/skills](https://github.com/mattpocock/skills/tree/59db609eb1e18aaf59b63284d0e52255aff0c63c/skills/engineering/code-review) | `default` | `59db609` |
| [codebase-design](./codebase-design/SKILL.md) | [mattpocock/skills](https://github.com/mattpocock/skills/tree/59db609eb1e18aaf59b63284d0e52255aff0c63c/skills/engineering/codebase-design) | `default` | `59db609` |
| [cognitive-rhythm-writing](./cognitive-rhythm-writing/SKILL.md) | [gist:k16shikano/eb2929f13ed19c97188393d297be8432](https://gist.github.com/k16shikano/eb2929f13ed19c97188393d297be8432/a3b1e26beced71d582e13314fb6f5b179b023c76) | `default` | `a3b1e26` |
| [deslop](./deslop/SKILL.md) | [cursor/plugins](https://github.com/cursor/plugins/tree/23ab063af02bb9b9c97936b0563879dd6bf21a05/cursor-team-kit/skills/deslop) | `default` | `23ab063` |
| [diagnosing-bugs](./diagnosing-bugs/SKILL.md) | [mattpocock/skills](https://github.com/mattpocock/skills/tree/59db609eb1e18aaf59b63284d0e52255aff0c63c/skills/engineering/diagnosing-bugs) | `default` | `59db609` |
| [domain-modeling](./domain-modeling/SKILL.md) | [mattpocock/skills](https://github.com/mattpocock/skills/tree/59db609eb1e18aaf59b63284d0e52255aff0c63c/skills/engineering/domain-modeling) | `default` | `59db609` |
| [eli5](./eli5/SKILL.md) | [anthropics/claude-plugins-community](https://github.com/anthropics/claude-plugins-community/tree/06ec7b6a0a82bdc4bec44bd82d4368c42f20d7c1/eli5/skills/eli5) | `main` | `06ec7b6` |
| [emil-design-eng](./emil-design-eng/SKILL.md) | [emilkowalski/skills](https://github.com/emilkowalski/skills/tree/2d228630ba1446365f614a108cb8252f1feda202/skills/emil-design-eng) | `default` | `2d22863` |
| [find-animation-opportunities](./find-animation-opportunities/SKILL.md) | [emilkowalski/skills](https://github.com/emilkowalski/skills/tree/2d228630ba1446365f614a108cb8252f1feda202/skills/find-animation-opportunities) | `default` | `2d22863` |
| [first-reader](./first-reader/SKILL.md) | [Shubhamsaboo/awesome-llm-apps](https://github.com/Shubhamsaboo/awesome-llm-apps/tree/6c16b23f1bacd0fdf240bb5141ef45e59e82c306/agent_skills/first-reader) | `default` | `6c16b23` |
| [get-pr-comments](./get-pr-comments/SKILL.md) | [cursor/plugins](https://github.com/cursor/plugins/tree/23ab063af02bb9b9c97936b0563879dd6bf21a05/cursor-team-kit/skills/get-pr-comments) | `default` | `23ab063` |
| [grill-me](./grill-me/SKILL.md) | [mattpocock/skills](https://github.com/mattpocock/skills/tree/59db609eb1e18aaf59b63284d0e52255aff0c63c/skills/productivity/grill-me) | `default` | `59db609` |
| [grill-with-docs](./grill-with-docs/SKILL.md) | [mattpocock/skills](https://github.com/mattpocock/skills/tree/59db609eb1e18aaf59b63284d0e52255aff0c63c/skills/engineering/grill-with-docs) | `default` | `59db609` |
| [handoff](./handoff/SKILL.md) | [mattpocock/skills](https://github.com/mattpocock/skills/tree/59db609eb1e18aaf59b63284d0e52255aff0c63c/skills/productivity/handoff) | `default` | `59db609` |
| [i-have-adhd](./i-have-adhd/SKILL.md) | [ayghri/i-have-adhd](https://github.com/ayghri/i-have-adhd/tree/1ecea1993b7fce257ffbd686c070948b5e07eda6/skills/i-have-adhd) | `default` | `1ecea19` |
| [implement](./implement/SKILL.md) | [mattpocock/skills](https://github.com/mattpocock/skills/tree/59db609eb1e18aaf59b63284d0e52255aff0c63c/skills/engineering/implement) | `default` | `59db609` |
| [improve-animations](./improve-animations/SKILL.md) | [emilkowalski/skills](https://github.com/emilkowalski/skills/tree/2d228630ba1446365f614a108cb8252f1feda202/skills/improve-animations) | `default` | `2d22863` |
| [improve-codebase-architecture](./improve-codebase-architecture/SKILL.md) | [mattpocock/skills](https://github.com/mattpocock/skills/tree/59db609eb1e18aaf59b63284d0e52255aff0c63c/skills/engineering/improve-codebase-architecture) | `default` | `59db609` |
| [japanese-tech-writing](./japanese-tech-writing/SKILL.md) | [gist:k16shikano/fd287c3133457c4fd8f5601d34aa817d](https://gist.github.com/k16shikano/fd287c3133457c4fd8f5601d34aa817d/8f2d57610a73efc97d743c9b0b0ecb1002e09fa4) | `default` | `8f2d576` |
| [loop-me](./loop-me/SKILL.md) | [mattpocock/skills](https://github.com/mattpocock/skills/tree/59db609eb1e18aaf59b63284d0e52255aff0c63c/skills/in-progress/loop-me) | `default` | `59db609` |
| [loop-on-ci](./loop-on-ci/SKILL.md) | [cursor/plugins](https://github.com/cursor/plugins/tree/23ab063af02bb9b9c97936b0563879dd6bf21a05/cursor-team-kit/skills/loop-on-ci) | `default` | `23ab063` |
| [make-pr-easy-to-review](./make-pr-easy-to-review/SKILL.md) | [cursor/plugins](https://github.com/cursor/plugins/tree/23ab063af02bb9b9c97936b0563879dd6bf21a05/cursor-team-kit/skills/make-pr-easy-to-review) | `default` | `23ab063` |
| [new-branch-and-pr](./new-branch-and-pr/SKILL.md) | [cursor/plugins](https://github.com/cursor/plugins/tree/23ab063af02bb9b9c97936b0563879dd6bf21a05/cursor-team-kit/skills/new-branch-and-pr) | `default` | `23ab063` |
| [pick-ui-library](./pick-ui-library/SKILL.md) | [emilkowalski/skills](https://github.com/emilkowalski/skills/tree/2d228630ba1446365f614a108cb8252f1feda202/skills/pick-ui-library) | `default` | `2d22863` |
| [pr-review-canvas](./pr-review-canvas/SKILL.md) | [cursor/plugins](https://github.com/cursor/plugins/tree/23ab063af02bb9b9c97936b0563879dd6bf21a05/cursor-team-kit/skills/pr-review-canvas) | `default` | `23ab063` |
| [prototype](./prototype/SKILL.md) | [mattpocock/skills](https://github.com/mattpocock/skills/tree/59db609eb1e18aaf59b63284d0e52255aff0c63c/skills/engineering/prototype) | `default` | `59db609` |
| [research](./research/SKILL.md) | [mattpocock/skills](https://github.com/mattpocock/skills/tree/59db609eb1e18aaf59b63284d0e52255aff0c63c/skills/engineering/research) | `default` | `59db609` |
| [review-and-ship](./review-and-ship/SKILL.md) | [cursor/plugins](https://github.com/cursor/plugins/tree/23ab063af02bb9b9c97936b0563879dd6bf21a05/cursor-team-kit/skills/review-and-ship) | `default` | `23ab063` |
| [review-animations](./review-animations/SKILL.md) | [emilkowalski/skills](https://github.com/emilkowalski/skills/tree/2d228630ba1446365f614a108cb8252f1feda202/skills/review-animations) | `default` | `2d22863` |
| [show-me](./show-me/SKILL.md) | [humanlayer/skills](https://github.com/humanlayer/skills/tree/653b6411c1f70c275a18e37673b042ff99f67ceb/plugins/show-me/skills/show-me) | `main` | `653b641` |
| [simplify](./simplify/SKILL.md) | [brianlovin/agent-config](https://github.com/brianlovin/agent-config/tree/1a9819ebf3fee811150fc76cbe177ea4e5f747ff/skills/simplify) | `default` | `1a9819e` |
| [teach](./teach/SKILL.md) | [mattpocock/skills](https://github.com/mattpocock/skills/tree/59db609eb1e18aaf59b63284d0e52255aff0c63c/skills/productivity/teach) | `default` | `59db609` |
| [thermo-nuclear-code-quality-review](./thermo-nuclear-code-quality-review/SKILL.md) | [cursor/plugins](https://github.com/cursor/plugins/tree/23ab063af02bb9b9c97936b0563879dd6bf21a05/cursor-team-kit/skills/thermo-nuclear-code-quality-review) | `default` | `23ab063` |
| [weekly-review](./weekly-review/SKILL.md) | [cursor/plugins](https://github.com/cursor/plugins/tree/23ab063af02bb9b9c97936b0563879dd6bf21a05/cursor-team-kit/skills/weekly-review) | `default` | `23ab063` |
| [what-did-i-get-done](./what-did-i-get-done/SKILL.md) | [cursor/plugins](https://github.com/cursor/plugins/tree/23ab063af02bb9b9c97936b0563879dd6bf21a05/cursor-team-kit/skills/what-did-i-get-done) | `default` | `23ab063` |
| [workflow-from-chats](./workflow-from-chats/SKILL.md) | [cursor/plugins](https://github.com/cursor/plugins/tree/23ab063af02bb9b9c97936b0563879dd6bf21a05/cursor-team-kit/skills/workflow-from-chats) | `default` | `23ab063` |
| [writing-for-agents](./writing-for-agents/SKILL.md) | [mattpocock/skills](https://github.com/mattpocock/skills/tree/59db609eb1e18aaf59b63284d0e52255aff0c63c/skills/productivity/writing-for-agents) | `default` | `59db609` |
| [yomiyasu](./yomiyasu/SKILL.md) | [nanaism/yomiyasu](https://github.com/nanaism/yomiyasu/tree/41e5aec228f080fe24e5f795efee2ac3fda61839/skills/yomiyasu) | `default` | `41e5aec` |
