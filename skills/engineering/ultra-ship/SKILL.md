---
name: ultra-ship
description: 実装済みブランチをレビューし、必要な修正・PR 作成・CI 確認まで仕上げる。中断した作業の再開にも使う。
disable-model-invocation: true
---

# ultra-ship

実装済みの変更を、レビュー可能で検証済みの PR にする。依頼範囲の修正、commit、base の取り込み、push、PR 作成・更新、CI の確認まで続ける。PR は指定がなければ draft。マージや本番公開はこのスキルの完了条件に含めない。

## 進め方と判断境界

- チェックポイントがあれば git / PR / CI の実状態と照合して再開する。記録だけを根拠に完了扱いしない。
- 差分を要求・規約・不具合の観点でレビューする。構造の監査、simplify、deslop は具体的な必要がある場合に追加する。毎回すべてのスキルを読む必要はない。
- 既定は現在のエージェントがレビューと修正を行う。独立した確認が有用で、委譲が利用可能・許可済みなら読み取り専用のレビュアーを使う。モデルやプロバイダーのローテーションは必須ではない。
- 依頼された挙動を実現する修正は進める。挙動を変えるバグ修正を一律に見送らない。要求外の設計変更や不明な仕様は、実施できる作業を終えてから判断点を示す。
- 修正後は影響する検査と指摘箇所を確かめる。指摘ゼロを得るためだけに別の総点検を繰り返さない。収束しない場合は同じ問題への試行を 3 回までとし、理由と残作業を記録する。
- 作業ツリーに書き込む担当は同時に一つ。`push --force`、`reset --hard`、`--no-verify` は使わず、push 済み履歴を保つ。
- `z/` のチェックポイント・レビュー記録・HTML はコミットに入れない。既存のユーザー変更を、作業ツリーを clean にするためだけに取り込んだり消したりしない。

## 記録と資料

`S` はこのスキルの `scripts/checkpoint.py` の絶対パス。base は既存 PR、なければ remote の既定ブランチから決める。

```bash
python3 "$S" status
python3 "$S" init --base <base>
```

進捗は `z/<sanitized-branch>/ultra-ship.html` に保存する。工程を終えた時点と中断時に記録を更新する。

- commit / merge / PR / CI と再開時の照合: [references/phases.md](references/phases.md)
- 指摘の記録、独立レビュー、追加監査: [references/review.md](references/review.md)
- 外部 CLI を明示的に選んで使う場合のみ: [references/reviewers.md](references/reviewers.md)

## 完了条件

対象の変更が commit・push され、最新の差分のレビューと必要な修正が済み、PR の説明が現在の内容に合い、CI の状態が確認できていること。CI が設定されていない場合は「CI なし」と記録し、成功したと表現しない。

`python3 <skill-dir>/scripts/verify.py` で記録と実状態を照合する。任意工程の省略は理由を残す。未解決の指摘、取得できない CI、認証・外部サービスの障害は `blocked` とし、完了と取り違えない。最終報告は PR URL、主な変更、検証結果、残る判断点に絞る。
