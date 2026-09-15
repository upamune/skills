# 任意の外部レビュアー

通常は現在のエージェントで進める。外部 CLI への委譲が選択・許可されている場合だけ `scripts/reviewers.py` を使う。`host` は現在のエージェントで、サブエージェントの可用性を保証する値ではない。

`ULTRA_SHIP_REVIEWERS` で選んだものだけを候補にする。未指定なら `host` のみ。スクリプト内の CLI / モデル ID は既存環境向けのプリセットであり、モデル品質・価格・速度の推奨順位ではない。外部 CLI の実際の設定・ログイン・モデル可用性は利用時に確認する。

```bash
R=<skill-dir>/scripts/reviewers.py
python3 "$R" list
ULTRA_SHIP_REVIEWERS=codex:gpt-5.6-sol,host python3 "$R" pick --role review --n 1
python3 "$R" run <id> --role review --prompt-file <prompt.md> --skill <SKILL.md> --out <review.md> --timeout <seconds>
```

既存プリセット: `opencode:glm-5.3-flash`、`opencode:deepseek-v4-flash`、`cursor:grok-4.6`、`codex:gpt-5.6-sol`、`claude:opus-5`、`host`。新しいモデルへの切替が依頼されていなければ、モデル比較や追加インストールをこの工程に持ち込まない。

- OpenCode の個人機制約（`USER=upamune` または `ULTRA_SHIP_PERSONAL=1`）を保つ。
- Cursor の出力は JSON 形式を使用し、最終テキストを抽出する。
- `--skill` は本文をプロンプトに埋め込む。追加 reference が必要なら関連部分だけ prompt に含める。
- `host` は `run` できない。現在のエージェントが作業するか、利用可能・許可済みの委譲機構を使う。
- タイムアウトは差分と環境に合わせる。上限まで無条件に待ったり、タイムアウトするたびに全プロバイダーへ転送したりしない。
- `--role apply` は外部 CLI が作業ツリーを書き換える。明示的にその担当を選んだ場合に限り、実行中は他の担当が編集しない。
