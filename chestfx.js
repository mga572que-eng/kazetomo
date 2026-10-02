// 宝箱の わくわく — 面白さ部署 ②（docs/design/fun-audit.md）
// 溜め（箱が 3回 ゆれる）→ ふたの すき間から 中身の 格で 色が ちがう 光 → ふたが 開いて 光の 柱 → 取った 物を カードで 大きく
// 格：ふつう＝白／めずらしい＝青／とくべつ＝金（武器・防具）。画面を タップすると とばせる。中身・セーブは かえない
'use strict';
(() => {
  const K = window.KZ; if (!K) return; const H = K.HOOK;
  const css = document.createElement('style'); css.textContent = `
  #cfx{position:fixed;inset:0;z-index:58;display:none;align-items:center;justify-content:center;flex-direction:column;gap:14px;background:radial-gradient(ellipse at 50% 55%,rgba(20,14,30,.55),rgba(5,3,10,.88));pointer-events:auto!important}
  #cfx.on{display:flex}#cfx *{pointer-events:none}
  #cfx .chest{position:relative;width:clamp(120px,30vh,180px);height:clamp(90px,22vh,130px);transform-origin:50% 100%}
  #cfx .body{position:absolute;left:0;right:0;bottom:0;height:62%;border-radius:8px 8px 12px 12px;background:linear-gradient(#b8742e,#7a4418);box-shadow:inset 0 0 0 5px #e8b44a,inset 0 -10px 0 rgba(0,0,0,.25),0 10px 24px rgba(0,0,0,.6)}
  #cfx .body::after{content:'';position:absolute;left:44%;top:-6%;width:12%;height:34%;border-radius:4px;background:linear-gradient(#ffe48a,#c88a20);box-shadow:0 0 0 2px #6a3a10}
  #cfx .lid{position:absolute;left:-3%;right:-3%;bottom:58%;height:42%;border-radius:40% 40% 6px 6px/70% 70% 6px 6px;background:linear-gradient(#c8843a,#8a5020);box-shadow:inset 0 0 0 5px #e8b44a;transform-origin:50% 100%;transition:transform .45s cubic-bezier(.3,1.6,.5,1)}
  #cfx .glow{position:absolute;left:8%;right:8%;bottom:56%;height:8%;border-radius:50%;background:var(--c);filter:blur(6px);opacity:0;transition:opacity .25s}
  #cfx .beam{position:absolute;left:50%;bottom:60%;width:20%;height:0;transform:translateX(-50%);background:linear-gradient(to top,var(--c),transparent);filter:blur(4px);opacity:.9;transition:height .5s ease-out}
  #cfx .rays{position:absolute;left:50%;top:50%;width:min(110vh,700px);height:min(110vh,700px);transform:translate(-50%,-50%);background:repeating-conic-gradient(var(--c) 0 6deg,transparent 6deg 24deg);opacity:0;border-radius:50%;mask-image:radial-gradient(circle,#000 10%,transparent 65%);-webkit-mask-image:radial-gradient(circle,#000 10%,transparent 65%);animation:cfr 8s linear infinite;transition:opacity .4s}
  #cfx.shake .chest{animation:cfs .32s ease-in-out}
  #cfx.peek .glow{opacity:1}#cfx.open .lid{transform:rotateX(0) translateY(-38%) rotate(-24deg)}#cfx.open .glow{opacity:1}#cfx.open .beam{height:min(60vh,360px)}#cfx.open .rays{opacity:.55}
  #cfx .card{opacity:0;transform:scale(.4);transition:all .35s cubic-bezier(.3,1.6,.5,1);padding:10px 22px;border-radius:14px;background:rgba(10,10,20,.85);box-shadow:0 0 0 2px var(--c),0 0 26px var(--c);text-align:center;color:#fff;font-weight:bold;font-size:clamp(16px,3.6vh,24px)}
  #cfx .card small{display:block;font-size:.62em;opacity:.85;letter-spacing:.2em;margin-bottom:2px;color:var(--c)}#cfx.reveal .card{opacity:1;transform:none}
  #cfx .skip{position:absolute;right:14px;bottom:10px;font-size:12px;opacity:.6;color:#fff}
  @keyframes cfs{0%,100%{transform:rotate(0)}25%{transform:rotate(-6deg) translateY(-3px)}75%{transform:rotate(6deg) translateY(-3px)}}@keyframes cfr{to{transform:translate(-50%,-50%) rotate(360deg)}}
  body.calm-fx #cfx .rays{display:none}`; document.head.appendChild(css);
  const el = document.createElement('div'); el.id = 'cfx'; document.body.appendChild(el);
  const COL = { common: '#fff6d8', rare: '#7ac8ff', legend: '#ffd24a' }, LBL = { common: 'GET', rare: 'めずらしい！', legend: 'とくべつな 品！' };
  const sfx = s => { try { Music.sfx(s); } catch (_) {} };
  // 演出（タップで とばせる）。格・見出しを 受けとる
  async function reveal(rarity, title, sub) { const calm = H.OPT && H.OPT.calm; let skip = false; const sp = (K.G && K.G.speed) || 1;
    el.style.setProperty('--c', COL[rarity] || COL.common); el.className = 'on';
    el.innerHTML = `<div class="rays"></div><div class="chest"><div class="glow"></div><div class="beam"></div><div class="body"></div><div class="lid"></div></div><div class="card"><small>${LBL[rarity] || ''}</small>${title}${sub ? `<div style="font-size:.6em;opacity:.8;margin-top:4px">${sub}</div>` : ''}</div><div class="skip">タップで とばす</div>`;
    const on = () => { skip = true; }; el.addEventListener('pointerdown', on); addEventListener('keydown', on, true);
    const w = ms => new Promise(r => { if (skip) return r(); const t = setTimeout(r, ms / sp); const iv = setInterval(() => { if (skip) { clearTimeout(t); clearInterval(iv); r(); } }, 30); setTimeout(() => clearInterval(iv), ms / sp + 50); });
    try {
      const n = rarity === 'legend' ? 3 : rarity === 'rare' ? 2 : 1; // 格が 高いほど 溜めが 長い
      for (let i = 0; i < n + 1 && !skip; i++) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); sfx(i === n ? 'stamp' : 'cursor'); if (i === n - 1) el.classList.add('peek'); await w(380 - i * 40); }
      el.classList.add('open'); sfx(rarity === 'legend' ? 'crit' : 'sparkle'); await w(rarity === 'common' ? 300 : 520);
      el.classList.add('reveal'); if (rarity === 'legend') { try { Music.jingle('levelup'); } catch (_) {} } else sfx('friend');
      await w(rarity === 'common' ? 650 : 1100);
    } finally { el.removeEventListener('pointerdown', on); removeEventListener('keydown', on, true); el.className = ''; el.innerHTML = ''; } }
  // 宝箱の 中身から 格と 見出しを 決める
  function gradeOf(L) { if (!L) return ['common', 'なにか']; const items = Object.entries(L.give || {});
    if (L.gear) { const [id, i] = L.gear; const g = DATA.gear[id] && DATA.gear[id][i]; return ['legend', g ? g.name : '武器']; }
    if (L.armor != null && DATA.armor[L.armor]) return ['legend', DATA.armor[L.armor].name];
    const rare = items.find(([k]) => /hoshikake|stew|shinju|nakayoshi/.test(k)) || (L.gold >= 800 ? ['gold', L.gold] : null);
    const first = items[0]; const name = first ? `${DATA.items[first[0]] ? DATA.items[first[0]].name : first[0]} ×${first[1]}` : `${L.gold || 0}ゴールド`;
    return [rare ? 'rare' : 'common', rare && rare[0] === 'gold' ? `${L.gold}ゴールド` : (rare ? `${DATA.items[rare[0]].name} ×${rare[1]}` : name)]; }
  H.chestFx = async c => { const [r, t] = gradeOf(c && c.loot); await reveal(r, t); };
  K.fun = Object.assign(K.fun || {}, { reveal, gradeOf });
})();
