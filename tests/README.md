# テスト（Playwright）

- `npm run test` … 回帰テスト（起動・戦闘・セーブ・町のくらし・家の中・カジノ・宝箱・ボス・祠・雨）。1件ずつ 新しい ブラウザで 動かす。
- `npm run test -- カジノ` … 名前に「カジノ」を ふくむ ものだけ。
- `node tests/economy.mjs` … お金の 流れの 試算を docs/reports/economy.md に 書く。

準備：`npm i -D playwright` と `npx playwright install chromium`（Codespaces など）。全体に 入れた playwright も 使える（NODE_PATH）。Chromium の 場所を 指定する ときは `PW_CHROMIUM=/path/to/chrome`。
描画は 切って 速く 動かす（`window.__norender`）。画面写真が 必要な ときは `boot({ render: true })`。
