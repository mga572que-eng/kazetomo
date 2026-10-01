# AI 引き継ぎ

## 基準
- ゲーム：ともしびアイランド（ブラウザー3D冒険RPG / PWA）
- GitHub：https://github.com/mga572que-eng/kazetomo
- 公開URL：https://mga572que-eng.github.io/kazetomo/
- 初回基準：6c656eb8573c7d12912db00d896e6c7f7515d406（main、10コミット）
- ゲーム版：20260930230833
- 記録日：2026-10-01 JST
- 現担当：Codex / 開発環境・保全の初期設定

## 今回の変更
共通ルール、Claude/Gemini入口、運用手順、Node起動・構文/参照検査・Gitバックアップを追加。既存ゲームファイルは変更しない。
開発環境はPR #1でmainへ統合済み。作業開始は最新mainから担当別ブランチを作る。

## 構成と壊しやすい箇所
ビルド不要のHTMLと通常スクリプト。index.htmlの順序：pwa → music → art → data → art_mon → art_face → world → game → settings → life → shrines → base → ch4 → jobs → quests → deco → ux → onboard → unstuck。
world.jsが描画・地形、game.jsが進行・戦闘・セーブとwindow.KZ/HOOK。後続モジュールはKZ/HOOKへ追加する。data.jsが共通データ、ch4.jsが第4章、jobs/quests/base/life/shrinesが拡張、ux/onboard/unstuck/settingsが操作・救出・設定。
セーブ：kazetomo-rpg-3、追加スロットkazetomo-rpg-3-sN、旧kazetomo-rpg-1。設定：kazetomo-opt。IDと進行フラグを勝手に変更しない。
PWA版番号はindex/pwa/sw/versionで同期（ch4.jsの?v欠落はwork/qa-audit-fixesで修正）。

## 未確認と次の一手
- Claude「JRPG 作成」の本文・未保存変更はアクセス拒否のため未確認。GitHub版と同一と断定しない。未公開ファイルがあれば別フォルダーへ保存し、基準と比較する。
- 各AIアカウントへのログイン・権限付与・AI Studioへのインポートは未実施。接続時は必要な範囲だけ許可する。
- ブラウザーでゲーム全章の動作と既存セーブの継続確認は未実施。
- この作業の最終検証は SETUP_REPORT.md を参照。
- 次担当：このファイルを読んで git status と HEAD を確認。変更したい機能を1つに絞り、作業ブランチから開始。

## 次回終了時に更新
担当 / 開始コミット / 終了コミット（文書更新時点の直前コミット可） / 変更ファイル / 実施した検証と結果 / 未解決 / 次の一手。

## PCに依存しない設定の追加
.devcontainer（Node 22）、.nvmrc、GitHub検査と手動バックアップワークフロー、CLOUD_DEVELOPMENT.mdを追加。リモート反映・main統合とGame checks成功を確認済み。Codespacesの初回起動は未実施。保存はGitHubへのcommit/pushを完了条件とする。セーブはブラウザー単位で自動同期されない。

## リモート最終確認（2026-10-01）
- PR #1統合後、設定ファイルを所定の場所へ配置。ゲーム実行ファイルは初回基準から差分なし。
- 確認コミット：7ddca17bbfe2d9bcdae2f4fedb18cb65b928767f（この文書更新直前）。
- GitHub Game checksと取得したmainの構文・参照・PWA検査は成功。mainバックアップのbundle復元も確認。
- クラウドバックアップ初回はupload-artifact v7の相対パス制限で失敗。runner.tempへコピーする修正を反映し、再実行：https://github.com/mga572que-eng/kazetomo/actions/runs/36805603525
- SETUP_REPORT.mdの初期リモート未反映記録は過去の状態。この節を最新の進捗として扱う。
