# 作業の再開

更新: 2026-10-03 公開後
正本: GitHub main
公開コミット: a8d1146cbbfe48086e2c7507c3b87816f10ea041（PR #59）
共通版: 20261003090000

## 完了
Claude work/tonight-all 4f2a1deまでとCodexの戦闘UI・案内・回復・家/灯台/本編屋根を統合。PR #59のpush/pull_request検査成功。mainへ統合後のGame checksも成功。Pages公開 run 37110383803 成功。
GitHubの統合ツリーがローカル検査済みebd4fc1と完全一致し、改行LFも一致することを確認。

## 検査の範囲
統合069f74bで回帰19件成功、続くシオミ店舗追加は影響する5入口の検査成功。案内844×390/667×375、全20屋内/8灯台の建築量と配置保持成功。屋根・入口・宝箱・灯台構造/扉/報酬も検査。最大22233/24000。短いPC自動検査と描画確認であり、iPhone実測や全章通しではない。

## 次の一手と未実装
新しい作業は最新mainから専用ブランチとPRで開始。mainへ直接アップロードしない。本編の新階層/新謎解きは未追加で、任意灯台の4階と区別する。新しい灯の樹など別PRの作業はPR #59に含めていない。必要な差分を個別に確認して統合する。
iPhone実機・PC全章通しを予定や公開条件に戻さない。既存ID・HOOK・進行フラグ・セーブキーとプレイヤー配置を維持する。

公開先: https://mga572que-eng.github.io/kazetomo/
PR: https://github.com/mga572que-eng/kazetomo/pull/59

## 2026-10-03 18:00 Claude：統合PR（work/release-1003）
- 基準：main 401f4ec（Codex の #59・#61 で 戦闘UI・案内・家とダンジョンの屋根・work/tonight-all までの Claude 分が 公開ずみ）
- この PR で 追加：#48〜#60 の Claude 分（戦闘の 下段を 小さく・2Dの絵＋3Dのけしき・敵を 本来の 色＋輪郭線・まもの・家の中で 登らない・町のくらしの 夜の 不具合・灯の樹 P1〜P5）
- 重なりの 解決：battle3d.js の 名札の 位置・tests/lib.mjs・tests/ui-p1.mjs・戦闘の さくせんボタンは Codex の 新しい 版を 採用。index.html の 横の短い画面の 戦闘は Claude の 小さい 下段を 採用（3体の 名札の ずらしは Codex の 間隔の 計算と 重なるので 外した）
- tests/navigation.mjs の 期待値を「野原の灯の樹」に（開発者の 決定による 名前の 変更）
- 版番号 20261003175157。npm run test 24件・navigation・architecture-budget/houses/dungeons・main-dungeon-roofs・field-recovery すべて成功（PCのChromium。実機未確認）
- のこり：Codex に「樹のなか（幹の中）」への 作りかえ と lighthouses.js 16か所・interiors.js 1か所の 言葉の 置きかえを 依頼。地図の ワープを 根の道の 演出に そろえる
