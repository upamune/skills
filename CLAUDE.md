このリポジトリは upamune の agent skills 集。自作スキルと外部から vendor したスキルを `npx skills add upamune/skills` で配布する。`AGENTS.md` はこのファイルへの symlink。

## 作業に応じて読む

- スキルの追加・更新・移動や vendor 管理には [.agents/skills/manage-skills/SKILL.md](.agents/skills/manage-skills/SKILL.md) を使う。個々の修正では対象スキルと関連 reference から読む。
- 配布・インストール方法は [README.md](README.md)、スキルを探すときは [SKILLS.md](SKILLS.md)。一覧全体や無関係な reference を毎回読む必要はない。

## 保つ制約

- `skills/engineering/` と `skills/productivity/` は promoted。トップ README と `.claude-plugin/plugin.json` に載せる。`in-progress/`・`deprecated/`・`external/` は載せない。
- 各バケットの README は全スキルを `SKILL.md` へのリンクと一行説明で列挙する。promoted とトップ README は User-invoked / Model-invoked に分ける。廃止スキルは `metadata.internal: true` にする。
- `skills/external/` は `external-skills.json` の出所・commit pin から生成する。直接編集せず、`scripts/external.ts` を使う。改変が必要なら fork への出所変更か、自作バケットへの別名コピーを検討する。
- `SKILLS.md` は生成物。スキルの追加・改名・削除・description 変更後は `bun scripts/gen-skills-md.ts` で再生成する。
- `.agents/skills/manage-skills/` は内部用。`metadata.internal: true` と `.claude/skills/manage-skills` の symlink を保つ。
- 散文に em-dash（—）を使わない。

## 作業の完了

依頼された修正、関連する生成物の更新、影響に見合った検証まで進める。説明文だけなら frontmatter・参照・一覧の整合を確認し、スクリプト変更なら変更した振る舞いを実行して確かめる。`.claude-plugin/*.json` を変更した場合は `claude plugin validate . --strict` を使う。

ローカル編集・生成・一時データでの検証は都度確認せず進め、修正に起因する失敗を直す。スキルを保守する依頼は、そのスキルが説明している公開・インストール・アカウント操作を実行する依頼ではない。
