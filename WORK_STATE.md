# 作業の再開

更新: 2026-10-01T13:10:12.367Z
ブランチ: work/job-steal
直前コミット: a5cc972a2131333f091f82edd21d2f8fbc8d844f

## 目的
職業の支援能力を全職業に＋新職業（商人・狩人）

## 完了・途中の内容
jobs.js：商人（お金を使う技3つ）・狩人を追加（ツリー・武器の相性）。balance.js：防具の種類、商人の売値5割。game.js：お金を使う技の処理（足りないと失敗、おまかせでは使わない）、戦士の岩・魔法使いの灯り・吟遊詩人の追跡距離。jobfield.js：見習いの宝箱地図・僧侶/勇灯の歩いて回復・武闘家のがんばり・商人/勇灯の稼ぎ上乗せ・狩人の採取+1、職業説明に【仲間にいると】を追記。docs/design/jobs-support.md。ヘッドレスで10職業・各能力・戦闘を確認

## 次の一手
PR統合。次はS5 メニュー整理と一人称

## 検証
構文・参照・PWA検査: PASS
実プレイ: 未確認（担当AIが結果を別途記録）

## 保存対象
- jobs.js
- jobfield.js
- balance.js
- game.js
- index.html
- sw.js
- pwa.js
- version.json
- docs/design/jobs-support.md

このコミットは作業の保管用。mainへの統合・公開承認ではない。GitHubへpushされたことを別途確認する。未選択ファイルはこの保存に含まれない。
