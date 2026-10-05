# テスト（Playwright）

- `npm run test` … 回帰テスト（起動・戦闘・セーブ・町のくらし・家の中・カジノ・宝箱・ボス・祠・雨）。1件ずつ 新しい ブラウザで 動かす。
- `npm run test -- カジノ` … 名前に「カジノ」を ふくむ ものだけ。
- `node tests/economy.mjs` … お金の 流れの 試算を docs/reports/economy.md に 書く。
- `node tests/ui-p1.mjs` … PCの横画面844×390・667×375、4人MP3桁、敵3体の札・味方札・技説明を確認。画像はリポジトリ内の `tests/out/` に保存（Git対象外）。iPhone実機の検査ではない。
- `node tests/field-recovery.mjs` … 回復の無駄消費・保存と、ともしびの値・目盛りを確認。
- `node tests/navigation.mjs` … 第1章の灯台案内、クエスト切替、現在地・方角・距離、地図内外の目的地表示を確認。PC横画面2サイズの画像は `tests/out/`。
- `npm run chapters` … 第1章〜第4章の開始状態、仲間・地域・重要フラグ・目的と、最終章の記録の保存復元を短時間で確認。実際の全章通しプレイではない。
- `node tests/save-isolation.mjs` … 古いセーブに直前の持ち物・報酬・SPが混ざらないことと、現在のセーブの職業・隊列・HP/MP 0の復元を確認。独立したブラウザを使い、実セーブは操作しない。
- `node tests/architecture-houses.mjs` … 家の閉天井、壁、家具キー、3方向のカメラと入退室を確認。
- `node tests/architecture-dungeons.mjs` … 灯台8区間の屋根、階段、仕掛けの条件、報酬の一度だけの付与。`--render` を付けるとPCの描画・歩行も確認。
- `node tests/architecture-budget.mjs` … 全地域の描画ブロック上限と、プレイヤー配置ブロックの保持を確認。描画検査と同時に起動せず順番に実行する。

準備：`npm i -D playwright` と `npx playwright install chromium`（Codespaces など）。全体に 入れた playwright も 使える（NODE_PATH）。Chromium の 場所を 指定する ときは `PW_CHROMIUM=/path/to/chrome`。
描画は 切って 速く 動かす（`window.__norender`）。画面写真が 必要な ときは `boot({ render: true })`。

本編屋根の専用確認: `node tests/main-dungeon-roofs.mjs`（入口/章の対象位置/宝箱/7祠の高さ/PCカメラ3位置。画像はtests/out）。カメラは安全距離へ戻って5回続けて安定してから撮影する。実機・全章通しの代替ではない。
