# 作業の再開

更新: 2026-10-01T06:04:23.631Z
ブランチ: work/gear-bag
直前コミット: fb592f57b5f4cb77908d5d4e73b54ae5d493465e

## 目的
v11：そうび袋・防具の種類・店の品ぞろえ・売却

## 完了・途中の内容
balance.js を新設（K.bal・HOOK.shopUI・HOOK.gearFlat）。防具4種類と職業ごとの制限、地域ごとの防具12種を追加、袋・売却（4割）・メニュー「そうび」・転職時の自動着替え。ux.js 鍛冶の防具段は armTier で管理。game.js は shopUI0/ICON を公開。ヘッドレスで購入・売却・転職・装備画面・道具屋を確認

## 次の一手
ユーザー確認後にPR統合。iPhone実機で店・そうび画面の操作確認。次は戦闘演出（ROADMAP優先1）または 02 酒場

## 検証
構文・参照・PWA検査: PASS
実プレイ: 未確認（担当AIが結果を別途記録）

## 保存対象
- balance.js
- game.js
- jobs.js
- ux.js
- index.html
- sw.js
- pwa.js
- version.json
- docs/design/balance.md

このコミットは作業の保管用。mainへの統合・公開承認ではない。GitHubへpushされたことを別途確認する。未選択ファイルはこの保存に含まれない。
