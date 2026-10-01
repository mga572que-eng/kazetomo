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
- Claude側のソースはGitHub版と比較済み（2026-10-01、Claude）。版番号以外の差分は、game.jsのデバッグ用の1行（`window.__B`）だけだったため、採用していない。未保存の機能はない。
- Claude環境の旧 `deploy.sh`（リポジトリ外）は、リポジトリを公開用ファイルで丸ごと上書きする方式。今の運用では使用禁止。
- 部署・方針・優先順位は ROADMAP.md、AIへの作業指示は docs/briefs/ に置く。
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

## Gemini 4件の適用（2026-10-01）
- 基準main: 301ca07。work/gemini-fourで実装。main 0d8f77fでゲーム12ファイルの一致と公開を確認、b0fd71dで設計・物語文書3ファイルも保存確認。
- gemini-talk.js: AI Studioの追加会話65件と口調45種を登録。コオリドリ1種は既存の会話を補完。talk.jsの選択機構にregister APIを足し、既読キーと隊列・個体の条件を維持する。
- mobs.js: 今回のGemini全文の住人86人を採用。既存の生成町の座標に合わせ、障害物や建物を避けて7町に配置。以前の48人版を更新した。
- town.js: 酒場4店、訳あり家6軒、探索29か所。G.townとG.flags.tw_*で独立して保存。既存本編フラグは変更しない。
- monplus.js: 装備9種、覚醒、連携6種。本体にモンスターのcalcフックを接続し、パネルへの入口と連携UID、MP二重消費を修正。対応済み/設計のみの効果はdocs/design/monsters.md冒頭に明記。
- docs/lore/foreshadow.md、docs/design/monsters.md、docs/design/story.mdはGemini成果物の全文。物語の新しい過去・年齢は提案扱いで、本編には実装していない。
- 追加の画面文言は難しい漢字をひらがなにした。表示名以外のID・既存セーブキー・キャラの種族IDは維持。
- 検証: 構文/参照/PWA、実ゲームで4モジュール、候補会話・同席除外、86人の安全配置、4店、探索の一度だけ取得、装備/覚醒のステータス、連携UID、実save/load保持。844x390でモンスター画面も確認。実端末と全シナリオ通しプレイは未検証。

## Gemini共同レビューによる小修正（2026-10-01）
- 基準main b0fd71d、作業ブランチwork/gemini-polish。装備/バトル・UI/セーブ・QAの観点をGoogle AI Studioへ依頼し、Codexがソースと照合して修正。
- monplus.js: 装備変更時のHP0を維持、HP/MP比率と上限を維持、未知装備IDの参照と在庫返却をガード。未知IDをロード時に削除しない。覚醒の実行側にもなつき100/覚醒済みガード、ソラ同席時のみ発言、能力説明を実効果へ合わせ、保存失敗を通知。
- 設計の変更は行わず、牧場からの覚醒を維持。Geminiの未知ID一括削除案と隊列必須案は採用していない。
- ゲーム版番号20261001184146。ローカル保存とGitHub保存/公開は分けて確認する。
