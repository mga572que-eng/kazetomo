// レシピ帳 — 作れる もの（ブロック・作業台・料理）と、足りない 材料・材料の 手に入れ方を ひと目で
// ・作れる ものが 上。足りない 材料は 赤で「あと いくつ」。材料の 名前を 押すと 手に入る 場所
// ・ブロックは この 画面から そのまま つくれる。作業台と 料理は、その 場所で（ここでは 確認だけ）
// セーブ：追加なし
'use strict';
(() => {
  const K = window.KZ; if (!K) return; const H = K.HOOK, G = () => K.G, esc = s => K.esc ? K.esc(String(s)) : String(s);
  const inv = k => (G().inv[k] || 0);
  const times = r => Math.min(...Object.entries(r.need).map(([k, v]) => Math.floor(inv(k) / v)));
  const nameOf = (kind, r) => kind === 'cook' ? DATA.items[r.out].name : `${DATA.blocks[r.out]}ブロック ×${r.n}`;
  const lists = () => [
    { kind: 'block', title: 'ブロック（どこでも）', L: DATA.recipes || [] },
    { kind: 'adv', title: '作業台で（わが家の 作業台）', L: K.advRecipes || [] },
    { kind: 'cook', title: '料理（たき火・かまど）', L: DATA.cook || [] }];
  const count = () => lists().reduce((a, s) => a + s.L.filter(r => times(r) > 0).length, 0);
  let css = false; const addCss = () => { if (css) return; css = true; const st = document.createElement('style'); st.textContent = `
    .rb{text-align:left;max-width:640px;margin:0 auto}.rb h3{text-align:center}.rb h4{margin:.6em 0 .3em;font-size:.95em;opacity:.85}.rb .row{display:flex;align-items:center;gap:.5em;padding:.35em .4em;border-radius:8px;background:rgba(255,255,255,.05);margin:.25em 0;width:100%;box-sizing:border-box}
    .rb .row.ok{background:rgba(120,220,140,.12)}.rb .nm{flex:1;font-weight:bold}.rb .mt{display:flex;flex-wrap:wrap;gap:.3em;font-size:.82em}.rb .mt button{all:unset;cursor:pointer;padding:.1em .4em;border-radius:6px;background:rgba(255,255,255,.08)}
    .rb .mt .short{color:#ff9b8a}.rb .go{all:unset;cursor:pointer;padding:.25em .7em;border-radius:8px;background:#e8a040;color:#2a1a0a;font-weight:bold;font-size:.85em}.rb .n{font-size:.8em;opacity:.8;min-width:4.5em;text-align:right}
    .rb .src{font-size:.8em;opacity:.9;padding:.4em;border-radius:8px;background:rgba(0,0,0,.25);margin:.4em 0;min-height:1.2em}`; document.head.appendChild(st); };
  function html() { let h = '<div class="rb"><h3>📜 レシピ帳</h3><div class="src" id="rbSrc">材料の 名前を 押すと、手に入る 場所が 出ます。</div>';
    for (const s of lists()) { if (!s.L.length) continue; h += `<h4>${s.title}</h4>`;
      const rows = s.L.map((r, i) => ({ r, i, t: times(r) })).sort((a, b) => (b.t > 0) - (a.t > 0));
      for (const { r, i, t } of rows) { const mats = Object.entries(r.need).map(([k, v]) => { const have = inv(k), sh = have < v; return `<button data-src="${k}" class="${sh ? 'short' : ''}">${esc(DATA.items[k] ? DATA.items[k].name : k)} ${have}/${v}${sh ? `（あと${v - have}）` : ''}</button>`; }).join('');
        const btn = s.kind === 'block' && t > 0 ? `<button class="go" data-make="${i}">つくる</button>` : '';
        h += `<div class="row${t > 0 ? ' ok' : ''}"><div style="flex:1"><div class="nm">${esc(nameOf(s.kind, r))}</div><div class="mt">${mats}</div></div><span class="n">${t > 0 ? `${t}回 つくれる` : 'たりない'}</span>${btn}</div>`; } }
    return h + '</div>'; }
  async function open() { addCss(); const p = K.panel(html(), 'wide');
    const el = K.MENUS[K.MENUS.length - 1] && K.MENUS[K.MENUS.length - 1].el;
    const wire = () => { if (!el) return;
      el.querySelectorAll('[data-src]').forEach(b => b.onclick = () => { const it = DATA.items[b.dataset.src] || {}; const s = el.querySelector('#rbSrc'); if (s) s.textContent = `${it.name || b.dataset.src}：${it.src || it.desc || '手に入る 場所は まだ わからない'}`; });
      el.querySelectorAll('[data-make]').forEach(b => b.onclick = () => { const r = DATA.recipes[+b.dataset.make]; if (!r || times(r) < 1) return; for (const [k, v] of Object.entries(r.need)) G().inv[k] -= v; G().blk[r.out] = (G().blk[r.out] || 0) + r.n; G().mat = r.out; Music.sfx('place'); K.hud();
        K.toast(`${DATA.blocks[r.out]}ブロックを ${r.n}こ つくった`, 1200); const box = el.querySelector('.rb'); if (box) { box.outerHTML = html(); wire(); } }); };
    wire(); await p; }
  H.menu.push(() => { const n = (() => { try { return count(); } catch (_) { return 0; } })(); return { label: 'レシピ帳', sub: n ? `作れる もの ${n}` : '作れる ものと 材料', fn: open }; });
  K.recipeBook = { open, count, times };
})();
