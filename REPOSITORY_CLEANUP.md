# リポジトリ整理記録

基準: 4463d23。元ファイルはGit履歴とREPO_CLEANUP_ORIGINALS_4463d23.zipで復元できます。
実行ファイルは削除せず、検査済み20261002132328へ更新します。

## 未参照の配布物・画面写真・レビュー用コード束を削除

- CLAUDE_HANDOFF_AFTER.txt
- CLAUDE_HANDOFF_BEFORE.txt
- CLAUDE_HANDOFF_PROOF.png
- CLAUDE_HANDOFF_TEST.txt
- FULL_DEBUG_BASELINE.txt
- FULL_DEBUG_EDGE_AFTER.txt
- FULL_DEBUG_EDGE_BEFORE.txt
- FULL_DEBUG_FINAL.txt
- FULL_DEBUG_FIX.patch
- FULL_DEBUG_MOVEMENT.txt
- FULL_DEBUG_PROOF.png
- G1_AUDIT_f70088b.txt
- GEMINI_CH4_SOURCE.txt
- GEMINI_FOUR_PUBLISH.txt
- GEMINI_FOUR_TEST.txt
- GEMINI_GITHUB_AUDIT_PROMPT.txt
- GEMINI_GITHUB_AUDIT_d47f2db.txt
- GEMINI_POLISH_REPORT.txt
- GEMINI_POLISH_TEST.txt
- GEMINI_REVIEW_MAIN_d47f2db.txt
- GEMINI_REVIEW_MANIFEST.json
- GEMINI_REVIEW_PROMPT.txt
- GEMINI_START.txt
- GEMINI_TALK_MOBS_FILES.zip
- GEMINI_TALK_MOBS_SOURCE.txt
- GITHUB_AUDIT_SNAPSHOT.json
- IMPROVE_BATTLE.png
- IMPROVE_FPV_844.png
- IMPROVE_JOB_STATUE.png
- IMPROVE_ROOM.png
- IMPROVE_TEST.txt
- IMPROVE_TOWNS_TEST.txt
- LIGHTHOUSE_SEA.png
- MAP_HORSE_STOP.png
- MAP_RIVER_BRIDGE.png
- MAP_ROWBOAT.png
- MAP_TRAVEL_DOCS.zip
- MAP_TRAVEL_MOTION_TEST.txt
- MAP_TRAVEL_SHA256.txt
- MAP_TRAVEL_TEST.txt
- PLAYABILITY_DOCS_20261002132328.zip
- PUBLISH_CLAUDE_DOCS_20261002104321.zip
- PUBLISH_CLAUDE_GAME_20261002104321.zip
- PUBLISH_CLAUDE_GAME_20261002104321/base.js
- PUBLISH_CLAUDE_GAME_20261002104321/battle3d.js
- PUBLISH_CLAUDE_GAME_20261002104321/game.js
- PUBLISH_CLAUDE_GAME_20261002104321/index.html
- PUBLISH_CLAUDE_GAME_20261002104321/interiors.js
- PUBLISH_CLAUDE_GAME_20261002104321/newtowns.js
- PUBLISH_CLAUDE_GAME_20261002104321/payoff.js
- PUBLISH_CLAUDE_GAME_20261002104321/pwa.js
- PUBLISH_CLAUDE_GAME_20261002104321/recipes.js
- PUBLISH_CLAUDE_GAME_20261002104321/sw.js
- PUBLISH_CLAUDE_GAME_20261002104321/titles2.js
- PUBLISH_CLAUDE_GAME_20261002104321/townlife.js
- PUBLISH_CLAUDE_GAME_20261002104321/version.json
- PUBLISH_CLAUDE_GAME_20261002104321/weather.js
- PUBLISH_FULL_DEBUG.zip
- PUBLISH_MAP_TRAVEL_20261002122747.zip
- PUBLISH_NEXT.txt
- PUBLISH_PLAYABILITY_20261002132328.zip
- PUBLISH_TOWNS_LIGHTHOUSES_20261002112035.zip
- TALK_MOBS_BROWSER_TEST.txt
- TOWNS_KAZAMI.png
- TOWNS_LIGHTHOUSES_DOCS.zip
- TOWNS_LIGHTHOUSES_SHA256.json
- TOWNS_LIGHTHOUSES_TEST.txt
- TOWNS_OASIS.png
- ai-handoff-saved.png
- claude-saved.png
- cloud-backup-success.png
- correct-upload-branch.png
- devcontainer-saved.png
- development-saved.png
- gemini-four-mobile.png
- gemini-four-monster.png
- gemini-polish-test.png
- gemini-saved.png
- gemini-stage1-correction-sent.png
- gemini-stage1-second-correction.png
- gemini-upload-waiting.png
- github-branch.png
- kazetomo-portable.zip
- pr11-merged.png
- talk-mobs-checks.png
- talk-mobs-mobile.png
- tools-saved.png
- upgrade-merged.png
- upgrade-upload-blocked.png
- upgrade-upload.png
- upload-reset.png

## 独立した文書は移動して保全

- CLAUDE_DEPARTMENT_OPINIONS.md → docs/archive/CLAUDE_DEPARTMENT_OPINIONS.md
- CLAUDE_HANDOFF.md → docs/archive/CLAUDE_HANDOFF.md
- FULL_DEBUG_REPORT.md → docs/archive/FULL_DEBUG_REPORT.md
- GEMINI_TALK_MOBS_INSTRUCTIONS.md → docs/archive/GEMINI_TALK_MOBS_INSTRUCTIONS.md
- GITHUB_STATUS.md → docs/archive/GITHUB_STATUS.md
- MAP_TRAVEL_README.md → docs/archive/MAP_TRAVEL_README.md
- PLAYABILITY_README.md → docs/archive/PLAYABILITY_README.md
- SETUP_REPORT.md → docs/archive/SETUP_REPORT.md
- TOWNS_LIGHTHOUSES_README.md → docs/archive/TOWNS_LIGHTHOUSES_README.md

## 状態
ローカル変更はコミットと履歴bundleに保存済み。GitHubには未反映・未公開。最新mainのZIPアップロードだけではゲーム更新になっていない（版20261002104321）。整理後は20261002132328。

適用用差分: PUBLISH_AND_CLEANUP.patch。最新mainから専用ブランチへgit apply --indexで適用し、npm run checkとgit diff --check、コミット、push、PR、統合の順に進める。単なるファイルアップロードでは削除を適用できない。
