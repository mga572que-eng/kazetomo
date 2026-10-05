// カジノ（黄金の都ラッキーナ）の 作りなおし — 面白さ部署 ①（docs/design/fun-audit.md）
// ・コイン制：支配人から 1枚20Gで 買う。コインは お金に もどせない（景品と こうかんだけ）→ お金の 釣り合いを くずさない
// ・スロット：3つの リールが 回り、ボタンで 1つずつ 止める。2つ そろうと リーチ（音と 光）。7が 3つで ジャックポット（積み立て）
// ・ハイ＆ロー：当てたら「つづける（倍がけ）」か「うけとる」。倍率は 当たる 確率に あわせる（期待値 0.95）
// ・丁半（ちょうはん）：2つの サイコロの 合計が 偶数か 奇数か。1.9倍
// ・景品交換所：カジノでしか 手に入らない 防具・称号・虹ブロックなど
// セーブ：G.casino（コイン・積み立て・記録）だけ 追加
'use strict';
(() => {
  const K = window.KZ; if (!K) return; const H = K.HOOK, G = () => K.G;
  const C = () => { const g = G(); g.casino = g.casino || { coin: 0, pot: 150, best: 0, played: 0, prize: {} }; return g.casino; };
  const sfx = s => { try { Music.sfx(s); } catch (_) {} };
  const stat = (k, d, m) => { if (K.stat) K.stat(k, d, m); };
  // ---------- 景品（カジノ限定） ----------
  if (!DATA.armor.some(a => a.name === '黄金の ベスト')) DATA.armor.push({ name: '黄金の ベスト', def: 24, price: 2500, ty: 'cloth', r: 1, add: true, note: 'カジノの 景品。どの 職業でも 着られる' });
  const PRIZES = [
    { id: 'hoshi', name: '星のかけら', cost: 40, give: { hoshikake: 1 }, sub: '高く 売れる きらめく かけら' },
    { id: 'kushi', name: 'ともしび串 ×3', cost: 30, give: { ganbari: 3 }, sub: 'ともしびゲージを 全回復' },
    { id: 'stew', name: '星のシチュー', cost: 120, give: { stew: 1 }, sub: 'みんなの HP・MP 全回復' },
    { id: 'niji', name: '虹ブロック ×20', cost: 100, blocks: { 10: 20 }, sub: '夜に 光る かざり' },
    { id: 'vest', name: '黄金の ベスト', cost: 1500, armor: '黄金の ベスト', once: true, sub: 'ぼうぎょ 24・どの 職業でも' },
    { id: 'title', name: '称号「カジノの 名士」', cost: 2000, title: true, once: true, sub: '大人の 遊び方を 知る者' },
  ];
  if (DATA.titles && !DATA.titles.some(t => t.id === 't_casino_vip')) DATA.titles.push({ id: 't_casino_vip', name: 'カジノの 名士', desc: '景品交換所で 称号を こうかんする', ok: g => !!(g.casino && g.casino.prize && g.casino.prize.title) });
  // ---------- 画面（DOM・軽い） ----------
  const css = document.createElement('style'); css.textContent = `
  #cz{position:fixed;inset:0;z-index:60;display:none;align-items:center;justify-content:center;background:radial-gradient(ellipse at 50% 40%,rgba(80,20,60,.92),rgba(10,5,20,.96));font-family:inherit;color:#fff;touch-action:manipulation}
  #cz.on{display:flex;pointer-events:auto!important}#cz *{pointer-events:auto!important}#cz .box{width:min(760px,94vw);max-height:94vh;display:flex;flex-direction:column;align-items:center;gap:8px}
  #cz .ttl{font-size:clamp(16px,3.2vh,22px);font-weight:bold;letter-spacing:.1em;text-shadow:0 0 12px #ff6ad5,0 0 24px #ffb84a}
  #cz .hud{display:flex;gap:14px;font-size:14px;opacity:.95}#cz .hud b{color:#ffd76a}
  #cz .reels{display:flex;gap:10px;padding:10px 14px;border-radius:16px;background:linear-gradient(#2a1030,#120818);box-shadow:0 0 0 3px #d8a13a inset,0 0 30px rgba(255,180,60,.35)}
  #cz .reel{width:clamp(64px,16vh,96px);height:clamp(72px,19vh,110px);border-radius:10px;background:linear-gradient(#fff,#f0e6d0 45%,#d8cbb0);color:#222;display:flex;align-items:center;justify-content:center;font-size:clamp(36px,10vh,62px);font-weight:bold;overflow:hidden;position:relative}
  #cz .reel.spin span{animation:czs .09s linear infinite;filter:blur(1.5px)}#cz .reel.stop{animation:czb .25s ease-out}
  #cz .reel.reach{box-shadow:0 0 0 4px #ff3d6e,0 0 26px #ff3d6e;animation:czr .35s ease-in-out infinite alternate}
  #cz .msg{min-height:1.6em;font-size:clamp(14px,3vh,18px);font-weight:bold;text-align:center}#cz .msg.big{font-size:clamp(22px,6vh,40px);color:#ffd76a;text-shadow:0 0 18px #ff9a2a;animation:czp .5s ease-out}
  #cz .btns{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}#cz button{all:unset;cursor:pointer;padding:10px 18px;border-radius:12px;background:linear-gradient(#ffcf5a,#e8902a);color:#3a1a00;font-weight:bold;font-size:clamp(14px,3vh,18px);box-shadow:0 3px 0 #9a5a10}
  #cz button.sub{background:linear-gradient(#5a4a7a,#3a2a5a);color:#fff;box-shadow:0 3px 0 #1a1030}#cz button:disabled{opacity:.4}#cz button:active{transform:translateY(2px);box-shadow:none}
  #cz .card{width:clamp(70px,18vh,104px);height:clamp(98px,26vh,146px);border-radius:10px;background:#fff;color:#c02040;display:flex;align-items:center;justify-content:center;font-size:clamp(26px,8vh,44px);font-weight:bold;box-shadow:0 6px 18px rgba(0,0,0,.5);transition:transform .35s}
  #cz .card.back{background:repeating-linear-gradient(45deg,#3a2a8a 0 8px,#4a3aa8 8px 16px);color:transparent}#cz .card.flip{transform:rotateY(180deg)}
  #cz .dice{display:flex;gap:16px}#cz .die{width:clamp(56px,14vh,84px);height:clamp(56px,14vh,84px);border-radius:14px;background:#fff;color:#222;display:flex;align-items:center;justify-content:center;font-size:clamp(30px,8vh,50px);font-weight:bold;box-shadow:0 5px 0 #bbb}
  #cz .die.roll{animation:czd .12s linear infinite}#cz .confetti{position:absolute;inset:0;pointer-events:none;overflow:hidden}
  #cz .confetti i{position:absolute;top:-10px;width:8px;height:14px;animation:czc 1.6s linear forwards}#cz .pot{font-size:13px;color:#ffd76a;letter-spacing:.05em}
  @keyframes czs{from{transform:translateY(-30%)}to{transform:translateY(30%)}}@keyframes czb{0%{transform:translateY(-8%)}60%{transform:translateY(5%)}100%{transform:none}}
  @keyframes czr{from{filter:brightness(1)}to{filter:brightness(1.25)}}@keyframes czp{from{transform:scale(.4);opacity:0}to{transform:none;opacity:1}}
  @keyframes czd{0%{transform:rotate(0) translateY(0)}50%{transform:rotate(180deg) translateY(-14px)}100%{transform:rotate(360deg) translateY(0)}}@keyframes czc{to{transform:translateY(105vh) rotate(720deg)}}`; document.head.appendChild(css);
  const el = document.createElement('div'); el.id = 'cz'; document.body.appendChild(el);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const show = html => { el.innerHTML = `<div class="box">${html}</div>`; el.classList.add('on'); };
  const hide = () => { el.classList.remove('on'); el.innerHTML = ''; };
  const $ = s => el.querySelector(s);
  const hud = () => `<div class="hud"><span>コイン <b>${C().coin}</b> 枚</span><span>所持金 <b>${G().gold}</b> G</span></div>`;
  const click = (sel) => new Promise(res => { const b = $(sel); if (!b) return res(); const f = () => { b.removeEventListener('click', f); res(); }; b.addEventListener('click', f); });
  // ボタンを 待つ（ms を こえたら 'timeout'）。キーボード：Enter／スペース＝最初の ボタン、Esc＝やめる
  const choose = (ids, ms) => new Promise(res => { let done = false; const fin = v => { if (done) return; done = true; cleanup(); res(v); };
    const fs = ids.map(id => { const b = $('#' + id); if (!b) return null; const f = () => fin(id); b.addEventListener('click', f); return [b, f]; });
    const key = e => { if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); fin('quit'); } else if (e.key === 'Enter' || e.key === ' ') { const first = ids.find(id => $('#' + id) && !$('#' + id).disabled); if (first) { e.stopPropagation(); e.preventDefault(); fin(first); } } };
    const tm = ms ? setTimeout(() => fin('timeout'), ms) : 0;
    function cleanup() { clearTimeout(tm); fs.forEach(x => x && x[0].removeEventListener('click', x[1])); removeEventListener('keydown', key, true); } addEventListener('keydown', key, true); });
  const confetti = () => { const c = document.createElement('div'); c.className = 'confetti'; for (let i = 0; i < 60; i++) { const s = document.createElement('i'); s.style.left = Math.random() * 100 + '%'; s.style.background = ['#ffd76a', '#ff6ad5', '#6ad5ff', '#9aff6a', '#fff'][i % 5]; s.style.animationDelay = Math.random() * .5 + 's'; c.appendChild(s); } el.appendChild(c); setTimeout(() => c.remove(), 2400); };
  const betRow = (bets) => bets.map(b => `<button id="b${b}" ${C().coin < b ? 'disabled' : ''}>${b}枚</button>`).join('') + '<button class="sub" id="quit">やめる</button>';
  // ---------- スロット ----------
  const SYM = [['🍒', 5, 5], ['🔔', 4, 10], ['⭐', 3, 20], ['灯', 2, 50], ['7', 1, 0]]; const TOT = 15; // 7 は ジャックポット（積み立て）
  const pickS = () => { let v = Math.random() * TOT; for (const s of SYM) if ((v -= s[1]) < 0) return s; return SYM[0]; };
  async function slot() { while (true) {
      show(`<div class="ttl">★ ラッキー スロット ★</div>${hud()}<div class="pot">ジャックポット：7 が 3つで ${C().pot} 枚！</div><div class="reels"><div class="reel" id="r0"><span>7</span></div><div class="reel" id="r1"><span>灯</span></div><div class="reel" id="r2"><span>⭐</span></div></div><div class="msg">かける 枚数を えらんでね</div><div class="btns">${betRow([1, 3, 10])}</div>`);
      const c = await choose(['b1', 'b3', 'b10', 'quit']); if (c === 'quit') return; const bet = +c.slice(1); C().coin -= bet; C().pot += Math.round(bet * .05); // 積み立ては かけ金の 5%（期待値は およそ 0.97） C().played++;
      // 結果は 先に 決める（目押しは「止める 楽しさ」。期待値は 表で 決まる）
      const res = [pickS(), pickS(), pickS()];
      $('.btns').innerHTML = '<button id="stop">ストップ！</button>'; $('.msg').textContent = 'ボタンで ひとつずつ 止めよう'; const reels = [0, 1, 2].map(i => $('#r' + i));
      reels.forEach(r => r.classList.add('spin')); const tick = setInterval(() => { reels.forEach(r => { if (r.classList.contains('spin')) r.firstChild.textContent = SYM[Math.floor(Math.random() * 5)][0]; }); sfx('blip'); }, 90);
      for (let i = 0; i < 3; i++) { await choose(['stop'], i === 2 && res[0] === res[1] ? 4000 : 2600);
        if (i === 2 && res[0] === res[1]) { reels[2].classList.add('reach'); $('.msg').textContent = 'リーチ！！'; $('.msg').className = 'msg big'; for (let k = 0; k < 6; k++) { sfx('heart'); await wait(160); } }
        reels[i].classList.remove('spin', 'reach'); reels[i].classList.add('stop'); reels[i].firstChild.textContent = res[i][0]; sfx('stamp'); if (i < 2) { await wait(120); $('.btns').innerHTML = '<button id="stop">ストップ！</button>'; } }
      clearInterval(tick);
      let win = 0, big = false; if (res[0] === res[1] && res[1] === res[2]) { if (res[0][0] === '7') { win = C().pot; C().pot = 150; big = true; } else win = bet * res[0][2]; if (res[0][2] >= 50) big = true; }
      else if (res.filter(s => s[0] === '🍒').length === 2) win = bet; // チェリー2つは かけ金が もどる
      const m = $('.msg'); if (win) { C().coin += win; C().best = Math.max(C().best, win); stat('slotWin'); if (big) stat('slotBig'); m.className = 'msg big'; m.textContent = big ? `だいあたり〜！！ ${win}枚！` : `あたり！ ${win}枚`; if (big) { confetti(); try { Music.jingle('levelup'); } catch (_) {} } else sfx('friend'); }
      else { m.className = 'msg'; m.textContent = 'ざんねん……'; sfx('miss'); }
      $('.hud').outerHTML = hud(); $('.btns').innerHTML = '<button id="again">もう一回</button><button class="sub" id="quit">やめる</button>'; K.save(); const n = await choose(['again', 'quit']); if (n === 'quit') return; } }
  // ---------- ハイ＆ロー（ダブルアップ） ----------
  const mul = n => n ? Math.floor(95 * 13 / n) / 100 : 0;
  const face = n => (['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'][n]) + ['♥', '♠', '♦', '♣'][n % 4];
  async function hilo() { while (true) {
      show(`<div class="ttl">♠ ハイ＆ロー ♥</div>${hud()}<div class="dice"><div class="card" id="c0">?</div><div class="card back" id="c1">?</div></div><div class="msg">かける 枚数を えらんでね</div><div class="btns">${betRow([5, 20, 50])}</div>`);
      const c = await choose(['b5', 'b20', 'b50', 'quit']); if (c === 'quit') return; let pot = +c.slice(1); C().coin -= pot; C().played++; let streak = 0;
      while (true) { const a = 1 + Math.floor(Math.random() * 13); $('#c0').textContent = face(a); $('#c1').className = 'card back'; $('#c1').textContent = '?'; sfx('cursor');
        const hiN = 13 - a, loN = a - 1; $('.msg').className = 'msg'; $('.msg').innerHTML = `いま <b>${pot}</b> 枚。 つぎは ${face(a)} より……？（A＝1・J＝11・Q＝12・K＝13）`;
        $('.btns').innerHTML = `<button id="hi" ${hiN ? '' : 'disabled'}>ハイ ×${mul(hiN)}</button><button id="lo" ${loN ? '' : 'disabled'}>ロー ×${mul(loN)}</button>`;
        const ch = await choose(['hi', 'lo']); if (ch === 'quit') { C().coin += pot; return; }
        const b = 1 + Math.floor(Math.random() * 13); for (let k = 0; k < 4; k++) { sfx('tally'); await wait(110); } $('#c1').className = 'card flip'; await wait(180); $('#c1').className = 'card'; $('#c1').textContent = face(b);
        const win = ch === 'hi' ? b > a : b < a;
        if (!win) { sfx('miss'); stat('hiloStreak', streak, 'max'); $('.msg').innerHTML = b === a ? 'おなじ 数…… こちらの かちです' : 'ざんねん！ ぜんぶ なくなった……'; $('.hud').outerHTML = hud(); break; }
        pot = Math.floor(pot * (ch === 'hi' ? mul(hiN) : mul(loN))); streak++; stat('hiloStreak', streak, 'max'); sfx('friend'); $('.msg').className = 'msg big'; $('.msg').textContent = `${streak}連勝！ ${pot}枚`; if (streak >= 4) confetti();
        $('.btns').innerHTML = `<button id="go">つづける（ダブルアップ）</button><button class="sub" id="take">うけとる</button>`; const d = await choose(['go', 'take']);
        if (d !== 'go') { C().coin += pot; C().best = Math.max(C().best, pot); $('.hud').outerHTML = hud(); $('.msg').className = 'msg'; $('.msg').textContent = `${pot}枚 うけとった！`; sfx('buy'); break; } }
      K.save(); $('.btns').innerHTML = '<button id="again">もう一回</button><button class="sub" id="quit">やめる</button>'; if (await choose(['again', 'quit']) === 'quit') return; } }
  // ---------- 丁半 ----------
  const DIE = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
  async function chohan() { while (true) {
      show(`<div class="ttl">🎲 丁半ばくち 🎲</div>${hud()}<div class="dice"><div class="die" id="d0">⚅</div><div class="die" id="d1">⚀</div></div><div class="msg">合計が 偶数なら「丁」、奇数なら「半」。当たれば 1.9倍</div><div class="btns">${betRow([10, 20, 50])}</div>`);
      const c = await choose(['b10', 'b20', 'b50', 'quit']); if (c === 'quit') return; const bet = +c.slice(1); C().coin -= bet; C().played++;
      $('.btns').innerHTML = '<button id="cho">丁（偶数）</button><button id="han">半（奇数）</button>'; $('.msg').textContent = 'さあ、張った 張った！'; const ch = await choose(['cho', 'han']);
      $('#d0').classList.add('roll'); $('#d1').classList.add('roll'); for (let k = 0; k < 8; k++) { $('#d0').textContent = DIE[1 + (k * 5) % 6]; $('#d1').textContent = DIE[1 + (k * 3) % 6]; sfx('tally'); await wait(100); }
      const a = 1 + Math.floor(Math.random() * 6), b = 1 + Math.floor(Math.random() * 6); $('#d0').classList.remove('roll'); $('#d1').classList.remove('roll'); $('#d0').textContent = DIE[a]; $('#d1').textContent = DIE[b]; sfx('stamp');
      const even = (a + b) % 2 === 0, win = (ch === 'cho') === even; if (win) { const g = Math.floor(bet * 1.9); C().coin += g; const t = G().town = G().town || {}; t.diceWins = (t.diceWins || 0) + 1; sfx('friend'); $('.msg').className = 'msg big'; $('.msg').textContent = `${even ? '丁' : '半'}！ ${g}枚！`; }
      else { sfx('miss'); $('.msg').textContent = `${even ? '丁' : '半'}…… はずれ`; }
      $('.hud').outerHTML = hud(); K.save(); $('.btns').innerHTML = '<button id="again">もう一回</button><button class="sub" id="quit">やめる</button>'; if (await choose(['again', 'quit']) === 'quit') return; } }
  // ---------- 支配人：コイン・景品 ----------
  async function manager() { const c0 = C();
    while (true) { const i = await K.menu({ title: `カジノの 支配人（コイン ${C().coin}枚）`, items: [{ label: 'コインを 買う', sub: '1枚 20G（お金には もどせません）' }, { label: '景品と こうかん', sub: 'ここでしか 手に入らない 品' }, { label: 'あそびかた', sub: 'スロット・ハイ＆ロー・丁半' }], where: 'side' });
      if (i < 0) return;
      if (i === 0) { const P = [10, 50, 100, 500]; const j = await K.menu({ title: 'コインを 買う', items: P.map(n => ({ label: `${n}枚`, sub: `${n * 20}G`, disabled: G().gold < n * 20 })), where: 'side' }); if (j >= 0) { G().gold -= P[j] * 20; C().coin += P[j]; sfx('buy'); K.hud(); K.save(); K.toast(`コインを ${P[j]}枚 買った（${C().coin}枚）`, 1400); } }
      if (i === 1) { const j = await K.menu({ title: `景品交換所（コイン ${C().coin}枚）`, items: PRIZES.map(p => ({ label: `${p.name}　${p.cost}枚`, sub: p.once && C().prize[p.id] ? 'こうかんずみ' : p.sub, disabled: C().coin < p.cost || (p.once && C().prize[p.id]) })), where: 'side' });
        if (j >= 0) { const p = PRIZES[j]; C().coin -= p.cost; C().prize[p.id] = (C().prize[p.id] || 0) + 1; const L = [];
          if (p.give) for (const [k, v] of Object.entries(p.give)) { K.gain(k, v); L.push(`${DATA.items[k].name}を ${v}こ 手に入れた！`); }
          if (p.blocks) for (const [k, v] of Object.entries(p.blocks)) { G().blk[k] = (G().blk[k] || 0) + v; L.push(`${DATA.blocks[k]}ブロックを ${v}こ 手に入れた！`); }
          if (p.armor && K.bal && K.bal.bag) { const ai = DATA.armor.findIndex(a => a.name === p.armor); if (ai > 0) { const b = K.bal.bag(); b.a[ai] = (b.a[ai] || 0) + 1; L.push(`${p.armor}を 手に入れた！（そうびの 袋へ）`); } }
          if (p.title) L.push('称号「カジノの 名士」を 手に入れた！');
          try { Music.jingle('levelup'); } catch (_) {} await K.say(L); K.hud(); K.save(); } }
      if (i === 2) await K.say([K.nm('カジノの 支配人', 'スロットは ボタンで リールを 止めます。 7が 3つ そろえば、つみたての ジャックポット！'), K.nm('カジノの 支配人', 'ハイ＆ローは 当てるたびに「つづける」か「うけとる」。 欲ばりすぎに ご用心。'), K.nm('カジノの 支配人', '丁半は サイコロ ふたつの 合計が 偶数か 奇数か。 ……あそびは、ほどほどが いちばんですよ。')]); } }
  const game = fn => async () => { if (C().coin < 1) { await K.say([K.nm('ディーラー', 'コインが ありませんね。 支配人から 買えますよ。')]); return; } try { await fn(); } finally { hide(); K.hud(); K.save(); } };
  // ---------- ラッキーナの 人に つなぐ ----------
  let wired = false;
  H.frame.push(() => { if (wired || !K.townLife || !K.townLife.people.length) return; wired = true;
    const set = (nm, fn) => { const p = K.townLife.people.find(q => q.town.key === 'lucky' && q.npc && q.npc.nm === nm); if (p) H.talks[p.id] = fn; };
    set('カジノの 支配人', manager); set('スロットの 係', game(slot)); set('カードの ディーラー', game(hilo)); set('ダイスの ディーラー', game(chohan)); });
  H.load.push(g => { if (g.casino) { g.casino.prize = g.casino.prize || {}; } });
  K.casino = { slot: game(slot), hilo: game(hilo), chohan: game(chohan), manager, C, PRIZES, hide };
})();
