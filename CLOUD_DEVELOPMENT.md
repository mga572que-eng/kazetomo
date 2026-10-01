# どのPCからでも編集・保存する

## 本体と保存場所
本体は https://github.com/mga572que-eng/kazetomo のGit履歴。PCやAIのチャットを本体にしない。編集した後はcommitとpushまで行う。エディターのSaveやCodespacesの自動保存だけではGitHubへ保存されない。
この設定はWindows・Mac・Linux、GitHubのブラウザー環境で共用。ゲーム用npm依存なし。開発にはGitとNode 22が必要で、Codespacesならコンテナー側にある。ゲームは既存のHTML/JSのまま。

## インストールなしで軽い編集
GitHubで対象ブランチを開き、キーボードの . を押すとgithub.devエディターで編集できる。Source Controlで差分確認、Commit & Pushを行う。このエディターには実行用ターミナルがないため、起動確認にはCodespacesまたはローカル環境を使う。
mainを直接編集せず、ai/担当/内容ブランチを使う。

## ブラウザーで開発・動作確認
1. GitHubのCode > Codespaces > Create codespaceを対象ブランチで選択。この設定がmainへ未統合ならai/codex/handoff-setupを選ぶ。
2. .devcontainer/devcontainer.jsonがNode 22とポート4173、作成後の検査を設定する。
3. Terminalで npm run dev 。Portsで4173のOpen in Browserを開く。ポートのVisibilityはPrivateを維持する。
4. AI_HANDOFF.mdとAGENTS.mdを読み、作業ブランチを切って編集する。
5. npm run check、実プレイ確認、引き継ぎ更新。git add <確認済みファイル>、git commit、git push。
6. 別PCではGitHubのCodespaces一覧から同じ環境を再開できる。新環境ならGitHubから保存済みコミットを取得する。
7. 終了時はCodespacesをStopする。長期保存はcommit/pushを正とする。未pushのままCodespaceを削除しない。
Codespacesには使用枠と料金がある。支払い設定・上限を確認して利用する。本設定は有料枠や支払いを有効化しない。

## 任意のPCでローカル開発
公式GitとNode 22を用意し、ターミナルで以下を実行する。

```sh
git clone https://github.com/mga572que-eng/kazetomo.git
cd kazetomo
git switch ai/codex/handoff-setup
npm run check
npm run dev
```

mainへ設定統合後はgit switch行を省略できる。npm install不要。localhost:4173はそのPCだけのプレビュー。別PCへ移る前にcommit/pushし、移転先ではgit pull --ff-only。同じブランチを2台で同時編集せず担当別ブランチを使う。
.cmdはWindows用の便宜機能であり、必須ではない。特定PCのCodexランタイムは環境本体に含めない。

## AIを変更する
どのAIも同じGitHubリポジトリと指定ブランチから開始し、AGENTS.md・AI_HANDOFF.mdを読む。Claude CodeはCLAUDE.md、GeminiはGEMINI.mdを入口にする。AI Studioでファイルを渡す際は対象コミットを明記し、返却を差分に限定する。
各サービスのログインやリポジトリへのアクセス権はそのアカウントで設定する。これらの文書は自動でアカウントを連携するものではない。ブラウザーのClaudeチャットにしかない未保存ソースは別保存して比較する。

## 別PCからバックアップを取得
GitHubのActions > Downloadable Git backup > Run workflowで対象ブランチを選ぶ。実行終了後のArtifactsからkazetomo-git-backupをダウンロードする。Git履歴bundle・ソースZIP・SHA256のmanifestが入る。手動起動のため勝手に定期実行しない。保存期間30日なので長期保管用には別媒体へコピーする。
ローカルやCodespacesでは npm run backup でも作成できる。復元手順はDEVELOPMENT.mdを参照。ワークフローはmainへ統合後に通常のRun workflow入口へ表示される。

## コードとセーブの違い
Gitで共有するのはコード。現在のゲームのセーブは各ブラウザーのlocalStorageで、別PCに自動同期されない。GitやCodespacesに移してもセーブは移動しない。PWAキャッシュを掃除する操作とセーブ削除を混同しない。
セーブの自動クラウド同期はゲーム本体・認証・保存先を追加する別機能なので今回実装していない。必要なら既存セーブの保全と移行設計から始める。

## 設定と稼働の区別
.devcontainerとActionsは設定ファイル。GitHubにpushして初めて別PCで利用できる。Codespaces初回ビルドとGitHub Actionsの実行が成功するまでクラウド動作検証済みとは扱わない。

## 公式資料
- https://docs.github.com/en/codespaces/setting-up-your-project-for-codespaces/adding-a-dev-container-configuration/setting-up-your-nodejs-project-for-codespaces
- https://docs.github.com/en/billing/concepts/product-billing/github-codespaces
- https://docs.github.com/en/codespaces/the-githubdev-web-based-editor
