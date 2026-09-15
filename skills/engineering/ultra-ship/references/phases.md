# PR を仕上げる工程と再開

`S` は `scripts/checkpoint.py`、`V` は `scripts/verify.py` の絶対パス。各コマンドは対象 repo で実行する。

## チェックポイント

`python3 "$S" status` がなければ `init --base <base>` で作る。`z/` をローカルの git exclude に追加し、既存記録があれば保持する。

```bash
python3 "$S" phase <id> in_progress
python3 "$S" phase <id> done --note "結果"
python3 "$S" phase <id> skipped --note "今回不要な理由"
python3 "$S" phase <id> blocked --note "障害と残作業"
python3 "$S" set pr_url <url>
python3 "$S" log "再開時に見つけた記録との差"
```

| phase id | 到達点 |
| --- | --- |
| `commit` | 対象差分を論理単位で commit |
| `merge` | 最新の `origin/<base>` を取り込み、衝突と影響を確認 |
| `review:code-review` | 要求・規約・不具合のレビューと指摘の処理が済む |
| `review:thermo` / `review:simplify` / `review:deslop` | 必要な観点だけ追加。不要なら理由付きで skipped |
| `pr` | push 済みの差分と一致する説明の PR がある |
| `canvas` | 大きな差分の説明に有用、または依頼された場合に HTML。不要なら理由付きで skipped |
| `ci` | 最新の PR checks を確認。設定がなければ理由付きで skipped |

再開時は `git status`、進行中の merge / rebase、`git merge-base --is-ancestor origin/<base> HEAD`、PR の head / base、現在の checks を必要に応じて照合する。`git merge HEAD` では base の取り込みを検証できない。base や diff が進んでいれば影響する工程の記録を更新する。

## commit と base の取り込み

対象差分だけを stage し、repo の慣習に従って commit する。`z/`、秘密情報、無関係な変更を混ぜない。

```bash
git fetch origin <base>
git merge origin/<base>
```

衝突は両方の要求を確認して解消する。`resolving-merge-conflicts` が利用可能なら必要な場合に参照する。修正・取り込みによる影響を確認し、関連する検査を実行する。衝突がないことだけを理由に全検査を重複実行しない。

## PR と説明

既存 PR があれば更新し、なければ push して draft PR を作る。タイトルと本文には解決する問題、変更後の挙動、レビューに必要な検証・制限を書く。`make-pr-easy-to-review` は履歴整理や詳細な案内が必要で、利用可能な場合に使う。

HTML が有用なら `pr-review-canvas` を利用するか、変更の説明を自分で作る。`z/<sanitized-branch>/pr-review.html` に保存し、`canvas_path` を設定する。HTML を作らない場合は `canvas` を理由付きで skipped にする。

## CI

`gh pr checks --json name,bucket,state,workflow,link` などで PR に付いた checks を見る。未終了なら待ち、失敗はログから原因を特定する。今回の修正に起因する失敗を直し、影響する検査を通して commit・push する。

- flaky と判断できる証拠がある場合の単純再実行は 1 回まで。
- 同じ問題への修正試行は 3 回まで。権限不足、外部障害、無関係な失敗が残る場合は `blocked` にして内容を報告する。
- 全 checks が成功または正当な skip なら `ci` を done、`ci_status` を `green` にする。
- checks がない場合は workflow のトリガーと PR の状態も確認する。CI を設定していないなら `ci` を理由付きで skipped、`ci_status` を `none` にする。認証エラー、取得失敗、必要な check の未起動を「CI なし」に置き換えない。

利用可能なら `loop-on-ci` を診断に使えるが、このスキルの試行上限・対象範囲を保つ。

## 最後の照合

```bash
python3 "$V"
python3 "$V" --no-ci  # CI 待ち中の途中確認専用
```

`--no-ci` の結果を最終的な CI 成功として報告しない。不要な再レビューを増やさず、照合で残った問題だけを直す。実行環境に `gh` がなければ接続済みツールで同じ項目を確認し、検証器を実行できなかった理由と確認結果を区別して報告する。
