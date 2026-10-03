// ともしびアイランド — アプリ化（ホーム画面に追加の案内・全画面・自動アップデート・画面スリープ防止）
'use strict';
(() => {
  const BUILD = '20261003183335';
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);
  const inApp = /Line\/|FBAN|FBAV|Instagram|Twitter|MicroMessenger|KAKAOTALK/i.test(ua);
  const iosOther = isIOS && /CriOS|FxiOS|EdgiOS/.test(ua);
  const touch = matchMedia('(pointer:coarse)').matches || navigator.maxTouchPoints > 0;
  const standalone = () => matchMedia('(display-mode: fullscreen)').matches || matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const inFrame = (() => { try { return window.top !== window; } catch (e) { return true; } })();
  const web = /^https?:/.test(location.protocol) && !inFrame;
  const LS = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };
  document.documentElement.classList.toggle('is-app', standalone());

  // ---------- service worker（オフラインでも遊べる・つねに最新） ----------
  if (web && 'serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));

  // ---------- スタイル ----------
  const css = document.createElement('style');
  css.textContent = `
  #pwaGuide{position:fixed;inset:0;z-index:200;display:grid;place-items:center;background:radial-gradient(ellipse at 50% 30%,#1d3350 0%,#0b1016 70%);padding:calc(14px + env(safe-area-inset-top,0px)) calc(16px + env(safe-area-inset-right,0px)) calc(14px + env(safe-area-inset-bottom,0px)) calc(16px + env(safe-area-inset-left,0px));overflow:auto;font-family:var(--ui)}
  #pwaGuide .pg{width:min(620px,100%);display:grid;gap:12px;text-align:center;color:#f4f0e6}
  #pwaGuide .pg-top{display:flex;align-items:center;justify-content:center;gap:12px}
  #pwaGuide img{width:64px;height:64px;border-radius:16px;box-shadow:0 6px 18px rgba(0,0,0,.4)}
  #pwaGuide h2{margin:0;font-family:var(--pixel);font-size:clamp(18px,4.2vw,24px);color:#f3c15a;letter-spacing:.04em}
  #pwaGuide .lead{margin:0;font-size:14px;line-height:1.6;color:#d9d3c3}
  #pwaGuide ol{margin:0;padding:0;list-style:none;display:grid;gap:8px;text-align:left}
  #pwaGuide li{display:grid;grid-template-columns:34px 1fr auto;gap:10px;align-items:center;background:rgba(255,255,255,.06);border:1px solid rgba(244,240,230,.18);border-radius:12px;padding:9px 12px;font-size:15px;line-height:1.45}
  #pwaGuide li b.n{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:#f3c15a;color:#1a1208;font-family:var(--pixel);font-size:16px}
  #pwaGuide li svg,#pwaGuide li img{width:30px;height:30px;border-radius:8px;box-shadow:none}
  #pwaGuide .row{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
  #pwaGuide button{font:inherit;border-radius:999px;padding:11px 20px;border:2px solid #f3c15a;background:transparent;color:#f4f0e6;font-family:var(--pixel);font-size:15px;cursor:pointer}
  #pwaGuide button.main{background:#f3c15a;color:#1a1208;font-weight:700}
  #pwaGuide .note{font-size:12px;color:#a9a393;margin:0}
  #pwaGuide .arrow{position:fixed;bottom:calc(6px + env(safe-area-inset-bottom,0px));left:50%;transform:translateX(-50%);font-size:34px;animation:pgb 1s ease-in-out infinite;color:#f3c15a}
  @keyframes pgb{50%{transform:translate(-50%,8px)}}
  #pwaUpd{position:fixed;left:50%;top:calc(8px + env(safe-area-inset-top,0px));transform:translateX(-50%);z-index:190;background:#f3c15a;color:#1a1208;border:none;border-radius:999px;padding:8px 16px;font-family:var(--pixel);font-size:13px;box-shadow:0 4px 14px rgba(0,0,0,.4)}
  html,body{touch-action:manipulation;overscroll-behavior:none}
  @media (max-height:520px){#pwaGuide .pg{gap:7px;width:min(860px,100%)}#pwaGuide ol{grid-template-columns:1fr 1fr;gap:6px}#pwaGuide li{padding:6px 10px;font-size:13px;grid-template-columns:28px 1fr auto}#pwaGuide li b.n{width:26px;height:26px;font-size:14px}#pwaGuide li svg,#pwaGuide li img{width:26px;height:26px}#pwaGuide .pg-top img{width:40px;height:40px}#pwaGuide .lead{font-size:13px}#pwaGuide .note{font-size:11px}#pwaGuide button{padding:8px 18px}}
  @media (orientation:landscape){#pwaGuide .arrow{display:none}}`;
  document.head.appendChild(css);

  const SHARE = '<svg viewBox="0 0 30 30"><rect x="7" y="11" width="16" height="15" rx="3" fill="none" stroke="#7fc4ff" stroke-width="2.4"/><path d="M15 3v15M10 8l5-5 5 5" fill="none" stroke="#7fc4ff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const PLUS = '<svg viewBox="0 0 30 30"><rect x="5" y="5" width="20" height="20" rx="5" fill="none" stroke="#f4f0e6" stroke-width="2.4"/><path d="M15 10v10M10 15h10" stroke="#f4f0e6" stroke-width="2.4" stroke-linecap="round"/></svg>';
  const DOTS = '<svg viewBox="0 0 30 30"><circle cx="15" cy="7" r="2.6" fill="#f4f0e6"/><circle cx="15" cy="15" r="2.6" fill="#f4f0e6"/><circle cx="15" cy="23" r="2.6" fill="#f4f0e6"/></svg>';
  const ICON = '<img src="icons/icon-192.png" alt="">';
  const step = (n, html, ic = '') => `<li><b class="n">${n}</b><span>${html}</span>${ic}</li>`;

  let bip = null; addEventListener('beforeinstallprompt', e => { e.preventDefault(); bip = e; const b = document.getElementById('pgInstall'); if (b) b.hidden = false; });
  addEventListener('appinstalled', () => { LS.set('kz-installed', '1'); close(); });

  function steps() {
    if (inApp) return { lead: 'いまは アプリ内ブラウザで ひらいています。<br>まずは ふつうのブラウザで ひらきなおしてください。', list: [step(1, '右上（または下）の メニュー ' , DOTS), step(2, isIOS ? '「Safariで開く」を えらぶ' : '「ブラウザで開く」「Chromeで開く」を えらぶ'), step(3, 'ひらいた先で もう一度 この案内が 出ます')] };
    if (isIOS) return { lead: 'ホーム画面に 追加すると、<b>アドレスバーも タブもない 全画面</b>で あそべます。', arrow: !iosOther,
      list: [step(1, iosOther ? 'アドレスバーの 右の <b>共有</b>ボタンを タップ' : '画面下（iPadは右上）の <b>共有</b>ボタンを タップ', SHARE), step(2, '下へ スクロールして <b>「ホーム画面に追加」</b>', PLUS), step(3, '右上の <b>「追加」</b>を タップ'), step(4, 'ホーム画面の <b>ともしびアイランド</b>から ひらく', ICON)] };
    if (isAndroid) return { lead: 'アプリとして 入れると、<b>全画面・横向き固定</b>で あそべます。', install: true,
      list: [step(1, '下の <b>「アプリとして入れる」</b>を タップ<br><small>（ボタンが 出ないときは 右上の ⋮ メニュー）</small>', DOTS), step(2, '<b>「インストール」</b>または <b>「ホーム画面に追加」</b>'), step(3, 'ホーム画面の <b>ともしびアイランド</b>から ひらく', ICON)] };
    return { lead: 'パソコンでも そのまま あそべます。<br>アドレスバー右の インストールボタンで アプリにも できます。', install: true, list: [step(1, 'アドレスバー右の <b>インストール</b>アイコン（または ⋮ → 「アプリをインストール」）'), step(2, 'F11 で 全画面にも できます')] };
  }
  function open(force) {
    if (document.getElementById('pwaGuide')) return; const s = steps();
    const el = document.createElement('div'); el.id = 'pwaGuide'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'アプリとして あそぶ 方法');
    el.innerHTML = `<div class="pg"><div class="pg-top">${ICON}<h2>アプリにして どっぷり あそぼう</h2></div><p class="lead">${s.lead}</p><ol>${s.list.join('')}</ol>
      <div class="row">${s.install ? `<button type="button" class="main" id="pgInstall" ${bip ? '' : 'hidden'}>アプリとして入れる</button>` : ''}<button type="button" class="${s.install && bip ? '' : 'main'}" id="pgLater">このまま あそぶ</button></div>
      <p class="note">セーブは この端末の ブラウザに 保存されます。アプリに しても 同じ URL なら 引きつがれます（iPhoneは ホーム画面版と Safari版で 別の セーブに なります）。<br>アップデートは 自動で とどきます。</p></div>${s.arrow ? '<div class="arrow">▼</div>' : ''}`;
    document.body.appendChild(el);
    el.querySelector('#pgLater').onclick = () => { LS.set('kz-guide-seen', BUILD); close(); goFull(); };
    const ib = el.querySelector('#pgInstall'); if (ib) ib.onclick = async () => { if (!bip) return; bip.prompt(); const r = await bip.userChoice.catch(() => null); bip = null; if (r && r.outcome === 'accepted') { LS.set('kz-installed', '1'); close(); } };
  }
  function close() { const el = document.getElementById('pwaGuide'); if (el) el.remove(); }
  window.KZ_PWA = { open, standalone };
  // 初回だけ 自動で 案内（アプリで ひらいているときは 出さない）
  if (!standalone() && touch && !LS.get('kz-guide-seen') && !inFrame) addEventListener('DOMContentLoaded', () => setTimeout(() => open(), 300));
  // タイトルに「アプリにする」ボタン
  addEventListener('DOMContentLoaded', () => { const tm = document.getElementById('titleMenu'); if (!tm || standalone() || inFrame) return;
    const b = document.createElement('button'); b.className = 't-btn'; b.type = 'button'; b.textContent = '📲 アプリにする'; b.onclick = () => open(true); tm.appendChild(b); });

  // ---------- ブラウザで あそぶときは 最初の タップで 全画面＋横向き ----------
  async function goFull() {
    if (inFrame || !touch) return false;
    const d = document.documentElement;
    const rq = d.requestFullscreen || d.webkitRequestFullscreen;
    if (!standalone() && !document.fullscreenElement && !document.webkitFullscreenElement && rq) {
      try { await rq.call(d, { navigationUI: 'hide' }); } catch (e) {}
    }
    try {
      if (screen.orientation && typeof screen.orientation.lock === 'function') {
        await screen.orientation.lock('landscape');
      }
    } catch (e) {}
    return innerWidth >= innerHeight;
  }
  addEventListener('DOMContentLoaded', () => {
    const sp = document.getElementById('splash');
    if (sp) sp.addEventListener('click', goFull);
    const button = document.getElementById('btnLandscape');
    if (button) button.addEventListener('click', async () => {
      button.disabled = true;
      try {
        if (!await goFull()) {
          document.getElementById('orientationHelp').textContent = 'スマホの かいてんロックを はずして、よこむきに してください。';
        }
      } finally { button.disabled = false; }
    });
  });
  if (standalone()) goFull();

  // ---------- 拡大・ダブルタップズームを 止める（iOS） ----------
  document.addEventListener('gesturestart', e => e.preventDefault(), { passive: false });

  // ---------- 画面スリープ防止（あそんでいる間） ----------
  let lock = null; const wake = async () => { try { if ('wakeLock' in navigator && document.visibilityState === 'visible' && !lock) { lock = await navigator.wakeLock.request('screen'); lock.addEventListener('release', () => { lock = null; }); } } catch (e) {} };
  document.addEventListener('pointerdown', wake, { once: false, passive: true }); document.addEventListener('visibilitychange', wake);

  // ---------- 自動アップデート ----------
  const onTitle = () => { const t = document.getElementById('title'), s = document.getElementById('splash'); return (t && !t.hidden) || (s && !s.hidden && getComputedStyle(s).display !== 'none'); };
  async function check() { if (!web || BUILD.startsWith('__')) return; try { const r = await fetch('version.json?t=' + Date.now(), { cache: 'no-store' }); if (!r.ok) return; const v = await r.json(); if (!v.build || v.build === BUILD) return;
      if (onTitle()) { location.reload(); return; }
      if (document.getElementById('pwaUpd')) return; const b = document.createElement('button'); b.id = 'pwaUpd'; b.type = 'button'; b.textContent = '✨ 新しい版が とどきました — タップで 更新（セーブは のこります）';
      b.onclick = () => { try { const K = window.KZ; if (K && K.phase === 'field' && !K.busy) K.save(); } catch (e) {} location.reload(); }; document.body.appendChild(b); } catch (e) {} }
  addEventListener('load', () => setTimeout(check, 2500)); document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); }); setInterval(check, 10 * 60 * 1000);
})();
