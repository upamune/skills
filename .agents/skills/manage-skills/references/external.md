# 外部スキルの vendor 管理

出所と commit pin は `external-skills.json` が正。操作は repo ルートで行う。

| 作業 | コマンド |
| --- | --- |
| 候補を見る | `bun scripts/external.ts add <owner/repo> --list` |
| 追加 | `bun scripts/external.ts add <owner/repo> <skill>...` |
| ref / パスを指定 | `bun scripts/external.ts add <owner/repo> <skill> --ref <ref> --path <path>` |
| gist を追加 | `bun scripts/external.ts add https://gist.github.com/<user>/<id>` |
| 更新 | `bun scripts/external.ts sync [<skill>...]` |
| pin のまま再取得 | `bun scripts/external.ts sync [<skill>...] --frozen` |
| 削除 | `bun scripts/external.ts remove <skill>...` |
| 一覧 | `bun scripts/external.ts list` |

skill 名省略時は対話選択。TTY がない場合は名前を指定する。GitHub の tree URL も使える。gist はルートに `SKILL.md` が必要で、1 スキルなら自動選択される。

`add` / `sync` / `remove` は `skills/external/README.md` と `SKILLS.md` も再生成する。manifest の名前・pin、実ディレクトリ、生成一覧が一致し、取得差分が意図した内容なら完了。特に description と invocation policy の変化を見る。

外部スキルを独自に修正する場合は fork への出所変更か、自作バケットへの別名コピーを選ぶ。同期時に消える手修正や、依頼されていない一括更新・削除を行わない。
