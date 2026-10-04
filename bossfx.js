// ボス戦の 怖さと 演出 — 面白さ部署 ③（docs/design/fun-audit.md）
// ・登場：画面が 暗くなり、心音 → 地鳴り → 名前と 二つ名の 大見出し（タップで とばせる）
// ・HPが 半分を 切ると「ようすが かわった！」赤い 気配。攻撃が すこし 強くなる（×1.1）
// ・仲間の HPが 少ないと 心音と 赤い ふち
// ・とどめで 白い 光
// 二つ名は 本編で 起きた ことだけを ことばに した（新しい 過去は 足さない）。セーブは かえない
'use strict';
(() => {
  const K = window.KZ; if (!K) return; const H = K.HOOK;
  const EPI = { tsutakage: '森の ツタを あやつる まもの', rikuDuel: 'さすらいの 槍使い', iwaoni: '岩山の 地ひびき', umikage: '夜の 波に ひそむ まもの', tobaridori: '夜を つれてくる 翼', yomikage: '宵の 祠に 待つ 者',
    yoiyami: '夜を まとう 王', ishigakiG: '遺跡を まもる 石の 巨人', sanaShadow: '星の 声に のまれた 巫女', hoshikui: '星を 飲みこむ まもの', tsumujikaze: '祠を うずまく あらし', kumokurage: '雲を ただよう しびれ',
    hoshigarasu: '星を ついばむ 黒い 翼', seishouG: '塔を まもる 星晶の 巨人', amahami: '天を 喰らう もの', hoshimoriB: '消えるものを しまう 守り手', kaisouG: '藻の 灯の樹の 番人', kaniG: '甲羅の 灯の樹の 番人', ikaG: '雷の 灯の樹の 番人',
    fukami: '光の とどかぬ 底の 王', shinen: '深淵に ねむる 古き 主' };
  const css = document.createElement('style'); css.textContent = `
  #bfx2{position:fixed;inset:0;z-index:57;display:none;align-items:center;justify-content:center;flex-direction:column;background:#000;pointer-events:auto!important;opacity:0;transition:opacity .35s}
  #bfx2.on{display:flex}#bfx2.vis{opacity:.92}#bfx2 *{pointer-events:none}
  #bfx2 .ep{color:#d8c8ff;font-size:clamp(13px,3vh,18px);letter-spacing:.35em;opacity:0;transform:translateY(8px);transition:all .6s .2s}
  #bfx2 .nm{color:#fff;font-size:clamp(30px,10vh,64px);font-weight:900;letter-spacing:.12em;text-shadow:0 0 18px rgba(255,60,90,.9),0 0 46px rgba(160,0,40,.8);opacity:0;transform:scale(1.6);filter:blur(6px);transition:all .55s cubic-bezier(.2,1.4,.4,1)}
  #bfx2 .line{width:0;height:2px;background:linear-gradient(90deg,transparent,#ff4a6a,transparent);margin:8px 0;transition:width .6s}
  #bfx2.show .ep{opacity:1;transform:none}#bfx2.show .nm{opacity:1;transform:none;filter:none}#bfx2.show .line{width:min(70vw,520px)}
  #bfx2 .skip{position:absolute;right:14px;bottom:10px;font-size:12px;color:#fff;opacity:.5}
  .bvig{position:fixed;inset:0;z-index:31;pointer-events:none;opacity:0;transition:opacity .4s}
  #bvR.on{opacity:1;box-shadow:inset 0 0 90px rgba(220,30,60,.55);animation:bfr 1.6s ease-in-out infinite alternate}
  #bvD.on{opacity:1;box-shadow:inset 0 0 70px rgba(255,0,0,.5);animation:bfd 1.1s ease-in-out infinite}
  #bflash{position:fixed;inset:0;z-index:57;background:#fff;opacity:0;pointer-events:none;transition:opacity .5s}
  #bbanner{position:fixed;left:0;right:0;top:32%;z-index:57;text-align:center;font-weight:900;font-size:clamp(20px,6vh,36px);color:#fff;text-shadow:0 0 14px #ff2a50,0 2px 0 #000;pointer-events:none;opacity:0;transform:scale(1.4);transition:all .3s}
  #bbanner.on{opacity:1;transform:none}
  @keyframes bfr{from{opacity:.55}to{opacity:1}}@keyframes bfd{0%,100%{opacity:.2}15%{opacity:1}30%{opacity:.4}45%{opacity:.9}}`; document.head.appendChild(css);
  const ov = document.createElement('div'); ov.id = 'bfx2'; document.body.appendChild(ov);
  const fl = document.createElement('div'); fl.id = 'bflash'; document.body.appendChild(fl);
  const bn = document.createElement('div'); bn.id = 'bbanner'; document.body.appendChild(bn);
  const vR = document.createElement('div'); vR.id = 'bvR'; vR.className = 'bvig'; document.body.appendChild(vR); const vD = document.createElement('div'); vD.id = 'bvD'; vD.className = 'bvig'; document.body.appendChild(vD);
  const vig = (e, on) => e.classList.toggle('on', !!on);
  const sfx = s => { try { Music.sfx(s); } catch (_) {} };
  const calm = () => !!(H.OPT && H.OPT.calm);
  const banner = async (t, ms = 1400) => { bn.textContent = t; bn.classList.add('on'); await new Promise(r => setTimeout(r, ms)); bn.classList.remove('on'); };
  // 登場
  H.bossIntro = async (F, opts) => { const f = (F || []).find(x => x.boss); if (!f) return; let skip = false; const sp = (K.G && K.G.speed) || 1;
    const w = ms => new Promise(r => { if (skip) return r(); const t = setTimeout(r, ms / sp); const iv = setInterval(() => { if (skip) { clearTimeout(t); clearInterval(iv); r(); } }, 30); setTimeout(() => clearInterval(iv), ms / sp + 60); });
    ov.innerHTML = `<div class="ep">${EPI[f.bid] || ''}</div><div class="line"></div><div class="nm">${K.esc ? K.esc(f.name) : f.name}</div><div class="line"></div><div class="skip">タップで とばす</div>`;
    const on = () => { skip = true; }; ov.addEventListener('pointerdown', on); addEventListener('keydown', on, true);
    try { ov.className = 'on'; void ov.offsetWidth; ov.classList.add('vis');
      if (!calm()) { for (let i = 0; i < 2; i++) { sfx('heart'); await w(420); } const bt = document.getElementById('battle'); if (bt) { bt.classList.remove('quake'); void bt.offsetWidth; bt.classList.add('quake'); } sfx('stamp'); await w(300); }
      ov.classList.add('show'); sfx('crit'); await w(calm() ? 900 : 1700);
    } finally { ov.removeEventListener('pointerdown', on); removeEventListener('keydown', on, true); ov.classList.remove('vis'); await new Promise(r => setTimeout(r, 300)); ov.className = ''; ov.innerHTML = ''; } };
  // 戦闘中：怒り・心音・とどめ
  let hbT = 0;
  H.frame.push((dt) => { const B = K.B; const bt = document.getElementById('battle'); if (!B || !B.active || !bt) return; const F = B.F || [], P = B.P || [];
    const boss = F.find(f => f.boss); if (!boss) { vig(vR, 0); vig(vD, 0); return; }
    if (!boss.rage && boss.hp > 0 && boss.hp < boss.max * .5) { boss.rage = 1; boss.atk = Math.round(boss.atk * 1.1); vig(vR, 1); sfx('crit'); banner(`${boss.name}の ようすが かわった！`); }
    if (boss.hp <= 0 && !boss.finished) { boss.finished = 1; vig(vR, 0); vig(vD, 0); if (!calm()) { fl.style.transition = 'none'; fl.style.opacity = '.95'; void fl.offsetWidth; fl.style.transition = 'opacity 1.2s'; fl.style.opacity = '0'; } sfx('crit'); }
    const low = P.some(m => m.hp > 0 && m.st && m.hp < m.st.hp * .25); vig(vD, low && boss.hp > 0 && !calm());
    if (low && boss.hp > 0) { hbT -= dt; if (hbT <= 0) { hbT = 1.1; sfx('heart'); } } });
  H.battleEnd.push(() => { vig(vR, 0); vig(vD, 0); });
  K.bossFx = { EPI, banner };
})();
