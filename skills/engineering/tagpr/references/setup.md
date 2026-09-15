# tagpr の初回導入・移行

## 既存運用に合わせる

remote、リリースブランチ、最新リリースタグ、バージョンファイル、CHANGELOG、既存のタグ・Release・公開ワークフローを見る。tagpr に移す役割と、既存のまま残す公開処理を決める。

tagpr は merge commit または squash merge を前提とする。rebase のみ許可された repo では必要な変更を示し、設定変更の権限がある場合に対応する。

## 設定を作る

`.tagpr` を先に書き、初回実行時の自動検出に任せきりにしない。

```ini
[tagpr]
    releaseBranch = main
    versionFile = version.go
    vPrefix = true
```

`versionFile` は既存の対象すべてをカンマ区切りで指定し、無ければ `-`。`vPrefix`、monorepo の `tagPrefix` は既存タグに合わせる。パスは repo ルート基準。独自の CHANGELOG 管理があれば `changelog = false` を検討する。詳細は [config.md](config.md)。

`.github/release.yml` がなければ、必要に応じて次を初期値にする。ラベルは `.tagpr` の major / minor 判定と合わせる。

```yaml
changelog:
  exclude:
    labels: [tagpr, dependencies]
  categories:
    - title: Breaking Changes
      labels: [major, breaking]
    - title: Features
      labels: [minor, enhancement, feature]
    - title: Bug Fixes
      labels: [bug]
    - title: Other Changes
      labels: ["*"]
```

[workflows.md](workflows.md) から必要な構成だけ使う。既存のタグ起動の公開処理は再利用する。GoReleaser などが Release を作るなら `tagpr.release = false` とし、所有者を一つにする。App が未準備なら [github-app.md](github-app.md) で不足を特定する。

## 導入の検証

`on.push.branches` と `releaseBranch`、公開側のタグ条件と prefix、App の vars / secrets 名を突き合わせる。`pinact run -check` と利用可能な workflow 検査を行い、タグ生成と Release 作成が重複していないことを確認する。

リリースブランチへの反映が許可されている場合は、tagpr の実行と最初のリリース PR を確認する。前回タグからの CHANGELOG 範囲、提案バージョン、変更ファイル、release notes を見る。範囲がおかしければ公開前に `.tagpr` を修正する。ベースライン合わせのためのタグ追加も公開への影響を確認して扱う。

マージ・公開まで許可されている場合だけ、そのリリースを実行する。タグの指す commit、Release の内容、公開ワークフローが一度だけ成功したことを確認する。失敗時は原因と既存の公開状態を調べ、同じ操作を盲目的に再実行しない。
