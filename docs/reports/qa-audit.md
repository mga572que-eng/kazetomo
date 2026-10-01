# 全コード監査（Gemini 06）と検証結果

監査：Gemini（AI Studio）、基準 main f889309 ／ 検証・修正：Claude、ブランチ work/qa-audit-fixes

| # | 指摘 | 判定 | 対応 |
|---|---|---|---|
| 1 | 蘇生技（カエリビ・大カエリビ）で復活しない（HOOK.revive が未登録） | 正しい（高） | game.js に既定の復活処理 reviveDown を追加。HOOK.revive があれば優先する。実際の戦闘で「立ちあがった」まで確認 |
| 2 | 空振りの「こわす」で「この建物はこわせない」と出る | 誤検出 | ループは Blocks.has で空きを飛ばすので、null は保護ブロックの時だけ。変更なし |
| 3 | 草の判定で毎フレーム文字列を作る | 正しい（低〜中） | world.js：前回の値を数値で比べる方式に変更 |
| 4 | 旧セーブで G.sp / G.board に仲間のキーがない | 正しい（中） | 実際に旧セーブは sora,mio,riku,sana だけだった。カイト加入時（ch4.js:148, game.js:2485）に落ちうる。load で既定値とキーごとに合成するよう変更 |
| 5 | 比率を「じどう」に戻しても html の height / background が残る | 正しい（低） | settings.js：じどうの時にリセット |
| 6 | ch4.js だけ ?v= がない | 正しい（低） | 原因は旧 build.sh の正規表現（数字を含む名前に非対応）。index.html に追加し、版番号を同期 |
| 要確認 | ch4.js がバンドルにない | Claude側の不備 | バンドル作成時に同じ正規表現で漏れていた。ch4.js は存在する |
| 要確認 | HOOK.gearFlat が未登録 | 仕様どおり | 未登録の時は基本計算を使う設計。変更なし |

---
## 原文（Gemini の出力）
# 全コード監査報告書 (QA・物理・UI・性能)

基準コミット: `f889309` (main)  
重大度「高」の件数: **2件** (中: 2件 / 低: 2件)

---

## 1. 検出事項一覧

### 【高】蘇生技（カエリビ・大カエリビ）を使用しても仲間が蘇生しない
- **重大度**: 高
- **ファイル:行**: `game.js`: 1722, `data.js`: 599-600
- **再現手順**:
  1. 戦闘中にパーティメンバーが戦闘不能（HP 0）になる。
  2. ソラやミオ等で「カエリビ」または「大カエリビ」を使用する。
- **原因**:
  `game.js` 1722行にて `if (s.revive && !isFoe && HOOK.revive)` と定義されているが、リポジトリ内の全スクリプトのどこにも `HOOK.revive` が登録されていない。そのため蘇生判定ブロックが丸ごとスキップされ、MPだけを消費して誰も復活しない。
- **修正案 (unified diff)**:
```diff
--- a/game.js
+++ b/game.js
@@ -1721,3 +1721,11 @@
-    if (s.revive && !isFoe && HOOK.revive) { const up = HOOK.revive(P, s); if (up.length) { redraw(); up.forEach(t => fxAt(bArtOf(t), 'heal')); Music.sfx('heal'); await bmsg(`${up.map(nameOf).join('と ')}が 灯に みちびかれて 立ちあがった！`, 400); } } // v9：復活（balance.js）
+    if (s.revive && !isFoe) {
+      const fn = HOOK.revive || ((party, sk) => {
+        const down = party.filter(m => m.hp <= 0);
+        const rev = [];
+        for (const t of down) {
+          t.hp = Math.max(1, Math.round(t.st.hp * (sk.revive || .3)));
+          rev.push(t);
+        }
+        return rev;
+      });
+      const up = fn(P, s); if (up.length) { redraw(); up.forEach(t => fxAt(bArtOf(t), 'heal')); Music.sfx('heal'); await bmsg(`${up.map(nameOf).join('と ')}が 灯に みちびかれて 立ちあがった！`, 400); }
+    }

【高】何もない空間で「こわす」操作をすると「この建物はこわせない」と誤表示される

  - 重大度: 高
  - ファイル:行: game.js: 665-668
  - 再現手順:
    1.  つくるモード（Bキーまたは画面下のボタン）をONにする。
    2.  前方にブロックが存在しない空間（空気中）を向いて Rキーまたは「こわす」ボタンを押す。
  - 原因: Blocks.del() は「保護ブロック」または「ブロックが存在しない」場合に null を返す仕様になっている。breakBlock()
    内でブロックが存在するかどうかの判定（Blocks.has）を事前に行わずに Blocks.del()
    の戻り値だけで判定しているため、単なる空振りでも保護ブロック扱いになり「この 建物は こわせない」という誤ったトーストが表示される。
  - 修正案 (unified diff):

--- a/game.js
+++ b/game.js
@@ -666,3 +666,7 @@
     for (let iy = Math.floor(player.y + 2.2); iy >= Math.floor(player.y - 1.2); iy--) { if (!Blocks.has(ix, iy, iz)) continue;
-    const t = Blocks.del(ix, iy, iz); if (t == null) { toast('この 建物は こわせない', 1200); return; } G.blk[t] = (G.blk[t] || 0) + 1; Music.sfx('mine'); hud(); return; } }
+    if (Blocks.isProt(ix, iy, iz)) { toast('この 建物は こわせない', 1200); return; }
+    const t = Blocks.del(ix, iy, iz); if (t != null) { G.blk[t] = (G.blk[t] || 0) + 1; Music.sfx('mine'); hud(); return; }
+  }
+}

【中】毎フレームの文字列アロケーションによるGCプレッシャー（草カリング処理）

  - 重大度: 中
  - ファイル:行: world.js: 873-874
  - 再現手順: フィールドを歩行またはカメラ回転させる。
  - 原因: grassCells() の先頭でキャッシュキー判定を行う際、毎フレーム 24要素の Float32Array（視錐台平面）を
    Array.from(Pl, v => Math.round(v * 60)).join(',')
    で配列化および文字列結合している。60fpsで毎秒大量の短命文字列・配列がヒープに確保され、低スペック端末やモバイルブラウザで定期的なガベージコレクション（微小なカクつき）を誘発する。
  - 修正案 (unified diff):

--- a/world.js
+++ b/world.js
@@ -872,3 +872,11 @@
-  function grassCells(Pl, player) { const G = GRID, bx = Math.floor(player.x / GSP) * GSP, bz = Math.floor(player.z / GSP) * GSP;
-    const key = G + ',' + bx + ',' + bz + ',' + REGION + ',' + Array.from(Pl, v => Math.round(v * 60)).join(','); if (key === grsKey) return; grsKey = key;
+  let lastGrsBx = 1e9, lastGrsBz = 1e9, lastGrsG = 0, lastGrsR = -1;
+  const lastPlR = new Int16Array(24);
+  function grassCells(Pl, player) { const G = GRID, bx = Math.floor(player.x / GSP) * GSP, bz = Math.floor(player.z / GSP) * GSP;
+    let changed = (G !== lastGrsG || bx !== lastGrsBx || bz !== lastGrsBz || REGION !== lastGrsR);
+    for (let i = 0; i < 24; i++) { const v = Math.round(Pl[i] * 60); if (v !== lastPlR[i]) { lastPlR[i] = v; changed = true; } }
+    if (!changed) return;
+    lastGrsG = G; lastGrsBx = bx; lastGrsBz = bz; lastGrsR = REGION;

【中】旧セーブデータまたは新仲間追加時の G.board / G.sp 未初期化によるクラッシュリスク

  - 重大度: 中
  - ファイル:行: game.js: 356-368, 1949, jobs.js: 307
  - 再現手順: 過去バージョンまたは特定章（ハルやカイト加入直後など）のセーブデータを読み込み、スキルメニューを開く。
  - 原因: load() 時に G.eq[k] は全仲間分ループで初期化補正されているが、G.board や G.sp
    はオブジェクト全体の上書きマージのみで、追加された仲間のキー（haru や kaito）が存在しない場合がある。一部の参照箇所で
    (G.board[m.id] || []) と保護されているものの、直接アクセスする箇所で undefined 参照から .includes が呼ばれて
    TypeError を起こすリスクがある。
  - 修正案 (unified diff):

--- a/game.js
+++ b/game.js
@@ -367,2 +367,6 @@
   for (const k of HUMAN_IDS) if (!G.eq[k]) G.eq[k] = { w: 0, a: 0 }; if (!G.wind) G.wind = [0, 0, 0]; if (G.wind.every(Boolean)) G.flags.c3bridge = true; if (G.flags.c3bridge) buildBridge(); G.build = false; if (G.flags.c3done && G.flags.c3reunion === undefined && G.region === 0) G.flags.c3reunion = true;
+  G.board = G.board || {}; G.sp = G.sp || {};
+  for (const k of HUMAN_IDS) {
+    if (!G.board[k]) G.board[k] = [];
+    if (G.sp[k] == null) G.sp[k] = 0;
+  }

【低】画面比率変更から「じどう」に戻した際のインラインスタイル残留

  - 重大度: 低
  - ファイル:行: settings.js: 18-24
  - 再現手順: 「せってい」で画面比率を「16:9」等の固定比率に変更した後、再び「じどう」に戻す。
  - 原因: 固定比率時に document.body に付与された position: fixed や left, top, width, height
    等は空文字代入でクリアされるが、iOS standalone 用の分岐で document.documentElement.style.height
    に設定された値がリセットされずに残る場合がある（推測: 通常ブラウザとPWAの挙動差による）。
  - 修正案 (unified diff):

--- a/settings.js
+++ b/settings.js
@@ -18,2 +18,3 @@
     if (!r) { window.__vw = 0; window.__vh = 0; ['position', 'left', 'top', 'width', 'height', 'transform'].forEach(k => b.style[k] = '');
+      document.documentElement.style.height = ''; document.documentElement.style.background = '';

【低】ch4.js だけ PWA バージョンキャッシュクエリ (?v=) が欠落

  - 重大度: 低
  - ファイル:行: index.html: 1011
  - 再現手順: ブラウザのキャッシュが存在する状態でバージョンを更新する。
  - 原因: AI_HANDOFF.md に「既知の構造」として記録されている通り、ch4.js だけ ?v=20260930230833
    が付いておらず、Service Worker更新時にブラウザ側で古いキャッシュを掴み続ける可能性がある（※既存規約上、今回変更は保留対象）。
  - 修正案: 本コミットではルールに従い変更を行わず、「要確認」として記録。

2. 要確認事項

1.  ch4.js の扱い:
    index.html 1011行で読み込まれているが、バンドルおよび現行作業ブランチには含まれていない。将来の実装タスクでの追加を前提としているか確認が必要。
2.  HOOK.gearFlat の実装状況: game.js 323行で if (HOOK.gearFlat) HOOK.gearFlat(...)
    が呼ばれているが、現在このフックを提供するモジュールは存在せず、すべて else 側の基本計算が通る。仕様通りか確認が必要。


未保存
