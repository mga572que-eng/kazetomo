# AI 引き継ぎ

## 基準
- ゲーム：ともしびアイランド（ブラウザー3D冒険RPG / PWA）
- GitHub：https://github.com/mga572que-eng/kazetomo
- 公開URL：https://mga572que-eng.github.io/kazetomo/
- 最新main：f70088b（PR #11 統合、2026-10-01 20:54 JST）
- ゲーム版：20261001184146（公開済み）
- 記録日：2026-10-01 JST
- 担当：固定しない（Claude / Codex / Gemini）。今回の記録：Claude

## 構成と壊しやすい箇所
ビルド不要のHTMLと通常スクリプト。index.htmlの順序：pwa → music → art → data → art_mon → art_face → world → game → settings → life → shrines → base → ch4 → jobs → quests → deco → ux → onboard → unstuck → names → balance → battle3d → talk → town → mobs → monplus → gemini-talk。
world.jsが描画・地形、game.jsが進行・戦闘・セーブとwindow.KZ/HOOK。後続モジュールはKZ/HOOKへ追加する。data.jsが共通データ、ch4.jsが第4章、jobs/quests/base/life/shrinesが拡張、ux/onboard/unstuck/settingsが操作・救出・設定。
追加モジュール：names（技の表示名）、balance（そうび袋・防具の種類・店・売却、K.bal）、battle3d（立体バトル、設定で平面に戻せる）、talk / gemini-talk（仲間会話）、town（酒場・訳あり家・探索）、mobs（町の住人）、monplus（モンスター装備・覚醒・連携）。
セーブ：kazetomo-rpg-3、追加スロットkazetomo-rpg-3-sN、旧kazetomo-rpg-1。設定：kazetomo-opt。IDと進行フラグを勝手に変更しない。
追加のセーブ値：bag、armTier、talkSeen、talkIdx、town、flags.tw_*、monEq、monAwake。旧セーブでは無くても動く（HOOK.loadで補う）。
PWA版番号はindex/pwa/sw/versionで同期する。

## 状況（保存済み／公開済み／未確認）
| 区分 | 内容 |
|---|---|
| 公開済み（main・Pages） | PR #3〜#11 と、直接アップロード 301ca07〜7c699d9（Gemini成果の適用・小修正）。自動検査（Game checks・build・deploy）は、すべて success |
| 保存済み・未統合 | なし（2026-10-01 20:55 時点） |
| ローカルの実ゲーム検査 | Codex：装備・覚醒・在庫・セーブ／ロードなど14項目。Claude：メニュー7項目、仲間会話25回（重複なし）、戦闘、新しいセーブ値の保存。どちらもエラー0 |
| 844×390 画面 | ブラウザの模擬画面で確認済み（そうび・モンスター・戦闘） |
| **未確認** | **iPhone 実機**（立体バトルの重さ・操作・PWA）、**全章の通しプレイ**、旧セーブでの長時間の継続 |

## 未確認と次の一手
- 計画と優先順位：docs/plan/NEXT.md。他のAIへの依頼文：docs/plan/PROMPTS.md。
- 優先順位（開発者決定）：
  1. 作業記録の更新・改行のLF統一（専用PR）・PR運用
  2. 新しいモジュールの監査と、既存設定との食い違いの修正
  3. iPhoneでの10分テストと、その結果にもとづく改善
  4. 追加要素（落下ダメージは仕様を先に決める・職業支援・物語改稿）
- 運用：mainへ直接アップロードしない。作業ブランチ → PR → 統合。Geminiへの依頼は1件ずつ、対象コミットと必要なソースだけを渡す。成果物はClaudeかCodexが確認・適用・検査してからPRにする。
- 物語の新しい過去・年齢・家族関係（docs/design/story.md・docs/lore/foreshadow.md）は未承認の提案。本編に入れない。
- 文の方針：「難しい漢字はひらがな」を維持。意味が取りにくい文を個別に直す。固有名詞は本編の表記に合わせる。
- Claude環境の旧 `deploy.sh`（リポジトリ外）は使用禁止（リポジトリを丸ごと上書きする方式のため）。

## 次回終了時に更新
担当 / 開始コミット / 終了コミット / 変更ファイル / 実施した検証と結果（保存済み／公開済み／未確認を分ける） / 未解決 / 次の一手。

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
