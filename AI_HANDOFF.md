# AI 引き継ぎ

## 基準
- ゲーム：ともしびアイランド（ブラウザー3D冒険RPG / PWA）
- GitHub：https://github.com/mga572que-eng/kazetomo
- 公開URL：https://mga572que-eng.github.io/kazetomo/
- 以下の冒頭記録の基準main：f70088b（PR #11 統合、2026-10-01 20:54 JST）。現在の基準は末尾の更新とWORK_STATE.mdを確認。
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
- 2026-10-02 21時の開発者決定：iPhone確認を予定・依頼・公開条件に入れない。PCでの全章通しプレイによる代替も予定にしない。過去の未確認記録のみ残す。
- 計画と優先順位：docs/plan/NEXT.md。他のAIへの依頼文：docs/plan/PROMPTS.md。
- 以下は以前の優先順位。現在の作業順はROADMAP.mdとdocs/plan/NEXT.mdを優先する：
  1. 作業記録の更新・改行のLF統一（専用PR）・PR運用
  2. 新しいモジュールの監査と、既存設定との食い違いの修正
  3. 追加要素（落下ダメージは仕様を先に決める・職業支援・物語改稿）
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

## 2026-10-02 品質方針の更新
main f36a44b/ゲーム版20261002164000の公開を確認。今後は機能量より完成度を優先し、最初の町→道→灯台を基準にP0〜P7で磨く。正本ROADMAP.md、依頼文docs/plan/PROMPTS.md、次の1件docs/plan/NEXT.md。旧quality-plan.mdは過去の記録。ユーザーが取り消したiPhone確認・PC代替の全章通しテストを再開・予定化しない。横画面専用。これは計画の保存で、基準区間の改善を実装した記録ではない。

## 2026-10-02 C0の基準区間
公開ソースf36a44bを調査。風見の村(kazami/region0)→依頼k0/欠片3→beacons[0]野原の灯台→点火/初回手紙が基準。lighthouses.jsの内部は点火後の任意寄り道。北の案内と生成座標/ミニマップの方角の不一致を確認。詳細と優先5件、画面基準、最初のPRはdocs/design/quality-baseline.md。ゲームの変更・実機画面確認はまだ。次はP1共通UIの整理。

## 2026-10-02 UI作業の引き継ぎ

PR38復旧内容を作業ブランチへ取り込み。P1の実ゲーム画面確認は完了。13件回帰検査は起動待ちで未完了。詳細はdocs/reports/ui-p1.md。公開・push未実施。iPhone実機確認とPC代替全章通しプレイはユーザーが取り消したため予定化しない。

## 2026-10-02 回復・操作の改善

野原の灯台の案内、料理の無駄消費防止と即時保存、回復技の有効対象、作戦の短い説明、文字の下限、がんばり目盛りを改善。詳細はdocs/reports/comfort-polish.md。ゲーム版20261002215000はローカルのみ。回帰13件は未完了。Claudeの同種変更とは差分を照合し、全文置換しない。


## 2026-10-02 Claudeレビューへの対応完了

敵3体の札の重なり、味方札、技説明、毎フレームの計測順、コマンドの折返し、検査画像の保存先を修正。対象選択中の敵だけ弱点表示。844×390・667×375の描画検査、回帰13件、構文・参照・PWA検査がCodex側でも成功。過去の未完了記録は当時の結果。詳細はdocs/reports/ui-review-followup.md。版20261002221500はローカル保存のみ、GitHub未送信・未公開。共通字体の変更はカジノ・宝箱などにも及ぶ。実機と全章通しを予定に戻さない。


## 2026-10-02 ミニマップの案内改善

現在地を輪で強調。目的地名・8方角・距離と地図外の矢印を追加。最初の灯台は点火まで固定。第1章の分離した新規データによる案内・追跡検査と横画面844×390/667×375の画像確認が成功。詳細docs/reports/navigation-polish.md。地形・セーブ・クエストフラグは変更していない。Claudeの道/町の作業と差分を照合する。版20261002231000はローカルのみ。


## 2026-10-02 C1/C2/C3 建築改善

家の閉天井・壁・梁・壁灯と屋内カメラ、53棟の軒/棟をC1で保存。任意灯台内部8区間の屋根・高窓・太柱・仕切りと4階をC2で保存。C3で共通版20261002234000へ結合。家/灯台専用描画・移動検査、全4地域の建築予算/プレイヤー配置保持、3件の関連回帰が成功。最大可視ブロック18020<24000。詳細docs/reports/architecture-integration.md。全13件再実行・実機・全章通し済みとは扱わない。Claudeの入口札/町/道は差分で保持して統合。GitHub未送信・未公開。本編遺跡・祠・宮の全面改修はまだ。


## 2026-10-03 Claude/Codex統合
Claude work/tonight-all f699762の道・見晴らし・港・入口の目じるしと家の名前札を、CodexのUI・案内・家/灯台改修と差分で結合。名前札と屋内API shellHeightを両方保持。ゲーム版20261003090000。
本編の星の遺跡・深淵の宮・7祠に高天井/外壁を追加。迷路・ボス・祭壇・宝箱ID・試練の位置/報酬/進行は変更なし。今回本編の新階層/新謎解きは未追加。任意灯台8区間の4階は前回分。
本編屋根・入口・既存6宝箱・7祠の高さ・PCカメラ3位置と結合前の建築予算検査成功。結合後の検査はWORK_STATE.md/統合報告を確認。保存・GitHub送信・公開は別に記録する。

最終統合: Claude 4f2a1de（シオミの宿/道具屋）まで保持。統合版で回帰19件成功、その後店舗追加の5入口検査成功。案内2サイズと全20屋内/8灯台の建築量・配置保持も成功。詳細docs/reports/combined-integration.md。PR #59でGitHubへ保存・main統合済み（a8d1146）。Game checksとPages公開run 37110383803成功。共通版20261003090000。GitHubのツリーと検査済みローカル版の完全一致を確認。現在の再開状態はWORK_STATE.mdを正とする。
