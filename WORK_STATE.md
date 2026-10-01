# 作業の再開

更新: 2026-10-01T05:54:25.284Z
ブランチ: work/balance-v1
直前コミット: e6a4dff1d27fcb3113bc719fa25912f2843f8353

## 目的
バランスv10：技名の法則・武器の相性・第4章ボス是正

## 完了・途中の内容
names.js（全技の表示名、IDは不変）、jobs.js（職業×専用武器の相性）、game.js（MP吸収の1人化、ボスの全体攻撃連続を禁止）、data.js（深海の圧・深み喰らいの弱体）、版番号同期。ヘッドレスで技名・相性・裏ボス戦を確認。設計書は docs/design/balance.md

## 次の一手
ユーザー確認後にPR統合。次は v11：防具の種類（cloth/light/heavy/robe/shield）と地域ごとの店の品ぞろえ・売却。iPhone実機確認

## 検証
構文・参照・PWA検査: PASS
実プレイ: 未確認（担当AIが結果を別途記録）

## 保存対象
- names.js
- jobs.js
- game.js
- data.js
- index.html
- sw.js
- pwa.js
- version.json
- docs/design/balance.md

このコミットは作業の保管用。mainへの統合・公開承認ではない。GitHubへpushされたことを別途確認する。未選択ファイルはこの保存に含まれない。
