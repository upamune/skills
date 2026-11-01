# external

外部リポジトリから vendor したスキル。**このディレクトリを直接編集しない**（`scripts/external.ts sync` で上書きされる）。
出所と pin は [`external-skills.json`](../../external-skills.json) が正。追加・更新・削除は `scripts/external.ts` で行う。

次のスキルはコピー直後にローカル override を再適用する。`skills/external/` 側を手で戻しても、次の add / sync で同じ差分が入る。アンカーが上流とずれたらコマンドは失敗し、直前のツリーは残る。

- archify: 更新確認は既定でオフ。`ARCHIFY_UPDATE_CHECK=1` のときだけ https://tt-a1i.github.io/archify/skill-updates/archify/stable.json へ GET する。`ARCHIFY_UPDATE_CHECK_DISABLED=1` はオプトインより優先して止める。オプトイン時も、新しい版があること以外はリモート manifest の文面を出さず、自己更新は案内しない。グローバルな agent ルールファイルは書き換えない。再適用は `scripts/external-overrides.ts`。

| skill | source | ref | commit |
| --- | --- | --- | --- |
| [animate](./animate/SKILL.md) | [emilkowalski/skills](https://github.com/emilkowalski/skills/tree/a81dbca07f2217b7103e510c0f13f8d5b017afc9/skills/animate) | `default` | `a81dbca` |
| [animation-vocabulary](./animation-vocabulary/SKILL.md) | [emilkowalski/skills](https://github.com/emilkowalski/skills/tree/a81dbca07f2217b7103e510c0f13f8d5b017afc9/skills/animation-vocabulary) | `default` | `a81dbca` |
| [apple-design](./apple-design/SKILL.md) | [emilkowalski/skills](https://github.com/emilkowalski/skills/tree/a81dbca07f2217b7103e510c0f13f8d5b017afc9/skills/apple-design) | `default` | `a81dbca` |
| [archify](./archify/SKILL.md) | [tt-a1i/archify](https://github.com/tt-a1i/archify/tree/a4065941f12be7967436261d9934784e381d423c/archify) | `default` | `a406594` |
| [claude-handoff](./claude-handoff/SKILL.md) | [mattpocock/skills](https://github.com/mattpocock/skills/tree/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/in-progress/claude-handoff) | `default` | `4ae2317` |
| [code-review](./code-review/SKILL.md) | [mattpocock/skills](https://github.com/mattpocock/skills/tree/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/code-review) | `default` | `4ae2317` |
| [codebase-design](./codebase-design/SKILL.md) | [mattpocock/skills](https://github.com/mattpocock/skills/tree/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/codebase-design) | `default` | `4ae2317` |
| [cognitive-rhythm-writing](./cognitive-rhythm-writing/SKILL.md) | [gist:k16shikano/eb2929f13ed19c97188393d297be8432](https://gist.github.com/k16shikano/eb2929f13ed19c97188393d297be8432/a3b1e26beced71d582e13314fb6f5b179b023c76) | `default` | `a3b1e26` |
| [create-formal-verification-skill](./create-formal-verification-skill/SKILL.md) | [cursor/plugins](https://github.com/cursor/plugins/tree/ae5650febf4320793844c12c4adaa937f417f8da/pstack/skills/create-formal-verification-skill) | `default` | `ae5650f` |
| [deslop](./deslop/SKILL.md) | [cursor/plugins](https://github.com/cursor/plugins/tree/ae5650febf4320793844c12c4adaa937f417f8da/cursor-team-kit/skills/deslop) | `default` | `ae5650f` |
| [diagnosing-bugs](./diagnosing-bugs/SKILL.md) | [mattpocock/skills](https://github.com/mattpocock/skills/tree/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/diagnosing-bugs) | `default` | `4ae2317` |
| [domain-modeling](./domain-modeling/SKILL.md) | [mattpocock/skills](https://github.com/mattpocock/skills/tree/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/domain-modeling) | `default` | `4ae2317` |
| [eli5](./eli5/SKILL.md) | [anthropics/claude-plugins-community](https://github.com/anthropics/claude-plugins-community/tree/06ec7b6a0a82bdc4bec44bd82d4368c42f20d7c1/eli5/skills/eli5) | `main` | `06ec7b6` |
| [emil-design-eng](./emil-design-eng/SKILL.md) | [emilkowalski/skills](https://github.com/emilkowalski/skills/tree/a81dbca07f2217b7103e510c0f13f8d5b017afc9/skills/emil-design-eng) | `default` | `a81dbca` |
| [find-animation-opportunities](./find-animation-opportunities/SKILL.md) | [emilkowalski/skills](https://github.com/emilkowalski/skills/tree/a81dbca07f2217b7103e510c0f13f8d5b017afc9/skills/find-animation-opportunities) | `default` | `a81dbca` |
| [first-reader](./first-reader/SKILL.md) | [Shubhamsaboo/awesome-llm-apps](https://github.com/Shubhamsaboo/awesome-llm-apps/tree/6c16b23f1bacd0fdf240bb5141ef45e59e82c306/agent_skills/first-reader) | `default` | `6c16b23` |
| [get-pr-comments](./get-pr-comments/SKILL.md) | [cursor/plugins](https://github.com/cursor/plugins/tree/ae5650febf4320793844c12c4adaa937f417f8da/cursor-team-kit/skills/get-pr-comments) | `default` | `ae5650f` |
| [grill-me](./grill-me/SKILL.md) | [mattpocock/skills](https://github.com/mattpocock/skills/tree/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/productivity/grill-me) | `default` | `4ae2317` |
| [grill-with-docs](./grill-with-docs/SKILL.md) | [mattpocock/skills](https://github.com/mattpocock/skills/tree/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/grill-with-docs) | `default` | `4ae2317` |
| [handoff](./handoff/SKILL.md) | [mattpocock/skills](https://github.com/mattpocock/skills/tree/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/productivity/handoff) | `default` | `4ae2317` |
| [i-have-adhd](./i-have-adhd/SKILL.md) | [ayghri/i-have-adhd](https://github.com/ayghri/i-have-adhd/tree/1ecea1993b7fce257ffbd686c070948b5e07eda6/skills/i-have-adhd) | `default` | `1ecea19` |
| [implement](./implement/SKILL.md) | [mattpocock/skills](https://github.com/mattpocock/skills/tree/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/implement) | `default` | `4ae2317` |
| [improve-animations](./improve-animations/SKILL.md) | [emilkowalski/skills](https://github.com/emilkowalski/skills/tree/a81dbca07f2217b7103e510c0f13f8d5b017afc9/skills/improve-animations) | `default` | `a81dbca` |
| [improve-codebase-architecture](./improve-codebase-architecture/SKILL.md) | [mattpocock/skills](https://github.com/mattpocock/skills/tree/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/improve-codebase-architecture) | `default` | `4ae2317` |
| [japanese-tech-writing](./japanese-tech-writing/SKILL.md) | [gist:k16shikano/fd287c3133457c4fd8f5601d34aa817d](https://gist.github.com/k16shikano/fd287c3133457c4fd8f5601d34aa817d/8f2d57610a73efc97d743c9b0b0ecb1002e09fa4) | `default` | `8f2d576` |
| [loop-me](./loop-me/SKILL.md) | [mattpocock/skills](https://github.com/mattpocock/skills/tree/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/in-progress/loop-me) | `default` | `4ae2317` |
| [loop-on-ci](./loop-on-ci/SKILL.md) | [cursor/plugins](https://github.com/cursor/plugins/tree/ae5650febf4320793844c12c4adaa937f417f8da/cursor-team-kit/skills/loop-on-ci) | `default` | `ae5650f` |
| [make-pr-easy-to-review](./make-pr-easy-to-review/SKILL.md) | [cursor/plugins](https://github.com/cursor/plugins/tree/ae5650febf4320793844c12c4adaa937f417f8da/cursor-team-kit/skills/make-pr-easy-to-review) | `default` | `ae5650f` |
| [new-branch-and-pr](./new-branch-and-pr/SKILL.md) | [cursor/plugins](https://github.com/cursor/plugins/tree/ae5650febf4320793844c12c4adaa937f417f8da/cursor-team-kit/skills/new-branch-and-pr) | `default` | `ae5650f` |
| [pick-ui-library](./pick-ui-library/SKILL.md) | [emilkowalski/skills](https://github.com/emilkowalski/skills/tree/a81dbca07f2217b7103e510c0f13f8d5b017afc9/skills/pick-ui-library) | `default` | `a81dbca` |
| [pr-review-canvas](./pr-review-canvas/SKILL.md) | [cursor/plugins](https://github.com/cursor/plugins/tree/ae5650febf4320793844c12c4adaa937f417f8da/cursor-team-kit/skills/pr-review-canvas) | `default` | `ae5650f` |
| [prototype](./prototype/SKILL.md) | [mattpocock/skills](https://github.com/mattpocock/skills/tree/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/prototype) | `default` | `4ae2317` |
| [research](./research/SKILL.md) | [mattpocock/skills](https://github.com/mattpocock/skills/tree/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/research) | `default` | `4ae2317` |
| [review-and-ship](./review-and-ship/SKILL.md) | [cursor/plugins](https://github.com/cursor/plugins/tree/ae5650febf4320793844c12c4adaa937f417f8da/cursor-team-kit/skills/review-and-ship) | `default` | `ae5650f` |
| [review-animations](./review-animations/SKILL.md) | [emilkowalski/skills](https://github.com/emilkowalski/skills/tree/a81dbca07f2217b7103e510c0f13f8d5b017afc9/skills/review-animations) | `default` | `a81dbca` |
| [show-me](./show-me/SKILL.md) | [humanlayer/skills](https://github.com/humanlayer/skills/tree/69d5fc61d6ca6f7056d283a2ee2a045be741a1d6/plugins/show-me/skills/show-me) | `main` | `69d5fc6` |
| [simplify](./simplify/SKILL.md) | [brianlovin/agent-config](https://github.com/brianlovin/agent-config/tree/1a9819ebf3fee811150fc76cbe177ea4e5f747ff/skills/simplify) | `default` | `1a9819e` |
| [statechart](./statechart/SKILL.md) | [cursor/plugins](https://github.com/cursor/plugins/tree/ae5650febf4320793844c12c4adaa937f417f8da/pstack/skills/statechart) | `default` | `ae5650f` |
| [teach](./teach/SKILL.md) | [mattpocock/skills](https://github.com/mattpocock/skills/tree/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/productivity/teach) | `default` | `4ae2317` |
| [thermo-nuclear-code-quality-review](./thermo-nuclear-code-quality-review/SKILL.md) | [cursor/plugins](https://github.com/cursor/plugins/tree/ae5650febf4320793844c12c4adaa937f417f8da/cursor-team-kit/skills/thermo-nuclear-code-quality-review) | `default` | `ae5650f` |
| [weekly-review](./weekly-review/SKILL.md) | [cursor/plugins](https://github.com/cursor/plugins/tree/ae5650febf4320793844c12c4adaa937f417f8da/cursor-team-kit/skills/weekly-review) | `default` | `ae5650f` |
| [what-did-i-get-done](./what-did-i-get-done/SKILL.md) | [cursor/plugins](https://github.com/cursor/plugins/tree/ae5650febf4320793844c12c4adaa937f417f8da/cursor-team-kit/skills/what-did-i-get-done) | `default` | `ae5650f` |
| [workflow-from-chats](./workflow-from-chats/SKILL.md) | [cursor/plugins](https://github.com/cursor/plugins/tree/ae5650febf4320793844c12c4adaa937f417f8da/cursor-team-kit/skills/workflow-from-chats) | `default` | `ae5650f` |
| [writing-for-agents](./writing-for-agents/SKILL.md) | [mattpocock/skills](https://github.com/mattpocock/skills/tree/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/productivity/writing-for-agents) | `default` | `4ae2317` |
| [yomiyasu](./yomiyasu/SKILL.md) | [nanaism/yomiyasu](https://github.com/nanaism/yomiyasu/tree/29d67ccb05e370b5958d72920a9cd1aa829dee80/skills/yomiyasu) | `default` | `29d67cc` |
