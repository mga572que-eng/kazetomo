// 風灯の島 — せってい（音量・文字速度・画質・操作）と 自動画質
'use strict';
(() => {
  const K = window.KZ; if (!K) return;
  const KEY = 'kazetomo-opt';
  const DEF = { bgm: 75, se: 70, text: 1, quality: 'auto', lefty: false, look: 1, calm: false, ratio: 'auto', b3d: true, fall: true };
  let O = { ...DEF }; try { Object.assign(O, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
  if (O.rv !== 2) { O.ratio = 'auto'; O.rv = 2; try { localStorage.setItem(KEY, JSON.stringify(O)); } catch (e) {} } // 旧版の 比率バグ対策：一度 自動に もどす
  const store = () => { try { localStorage.setItem(KEY, JSON.stringify(O)); } catch (e) {} };
  let autoMax = 2, autoQ = null;
  function apply() {
    Music.setVol(O.bgm / 100, O.se / 100);
    K.HOOK.OPT.text = O.text; K.HOOK.OPT.look = O.look; K.HOOK.OPT.lefty = O.lefty; K.HOOK.OPT.calm = O.calm; K.HOOK.OPT.b3d = O.b3d !== false; K.HOOK.OPT.fall = O.fall !== false;
    document.body.classList.toggle('lefty', !!O.lefty); document.body.classList.toggle('calm', !!O.calm);
    if (O.quality === 'auto') { if (autoQ == null) autoQ = World.quality; World.setQuality(autoQ); } else World.setQuality({ low: 0, mid: 1, high: 2 }[O.quality]);
  }
  function applyRatio() { const r = { '16:9': 16 / 9, '19.5:9': 19.5 / 9, '4:3': 4 / 3, '3:2': 3 / 2 }[O.ratio] || 0; const vv = window.visualViewport; const iw = vv ? vv.width : innerWidth, ih = vv ? vv.height : innerHeight; const b = document.body;
    if (!r) { window.__vw = 0; window.__vh = 0; ['position', 'left', 'top', 'width', 'height', 'transform'].forEach(k => b.style[k] = ''); document.documentElement.style.height = ''; document.documentElement.style.background = '';
      // iOS の ホーム画面アプリで 下に 黒い帯が でる 不具合（innerHeight が 画面より 小さい）対策：画面いっぱいに 広げる
      const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const standalone = navigator.standalone === true || matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches;
      if (ios && standalone && screen.width && screen.height) { const land = innerWidth > innerHeight; const sw = land ? Math.max(screen.width, screen.height) : Math.min(screen.width, screen.height), sh = land ? Math.min(screen.width, screen.height) : Math.max(screen.width, screen.height);
        if (sh - innerHeight > 4 || sw - innerWidth > 4) { window.__vw = sw; window.__vh = sh; document.documentElement.style.height = sh + 'px'; Object.assign(b.style, { position: 'fixed', left: '0px', top: '0px', width: sw + 'px', height: sh + 'px' }); const cvs = document.getElementById('game'); if (cvs) Object.assign(cvs.style, { width: sw + 'px', height: sh + 'px', bottom: 'auto', right: 'auto' }); } } }
    else { let w = iw, h = iw / r; if (h > ih) { h = ih; w = ih * r; } window.__vw = Math.round(w); window.__vh = Math.round(h); Object.assign(b.style, { position: 'fixed', left: Math.round((iw - w) / 2) + 'px', top: Math.round((ih - h) / 2) + 'px', width: Math.round(w) + 'px', height: Math.round(h) + 'px', transform: 'translateZ(0)' }); document.documentElement.style.background = '#000'; }
    const de = document.documentElement; de.style.setProperty('--app-w', (window.__vw || iw) + 'px'); de.style.setProperty('--app-h', (window.__vh || ih) + 'px');
    try { World.resize(); } catch (e) {} }
  K.applyRatio = applyRatio; addEventListener('resize', applyRatio); if (window.visualViewport) visualViewport.addEventListener('resize', applyRatio); addEventListener('orientationchange', () => setTimeout(applyRatio, 300));
  apply(); applyRatio();
  // ---- 自動画質（3秒ごとに平均FPSを見る） ----
  // ヒステリシス：一度 下げたら このセッションでは 上げない（ユーザーが 画質を えらび直すと 解除）。 計測は フィールド操作中だけ（メニュー・戦闘・会話中や 復帰直後は 捨てる）
  let acc = 0, frames = 0, good = 0, warm = 0; K.autoQLock = false;
  const sampling = md => md === 'field' && K.phase === 'field' && !(K.MENUS && K.MENUS.length) && !document.body.classList.contains('inbattle') && !document.hidden;
  K.HOOK.frame.push((dt, T, r, md) => {
    if (O.quality !== 'auto') return;
    if (!sampling(md)) { acc = 0; frames = 0; warm = 0; return; }
    if ((warm += dt) < 1.5) return; acc += dt; frames++;
    if (acc < 3) return; const fps = frames / acc; acc = 0; frames = 0;
    if (fps < 36 && World.quality > 0) { autoQ = World.quality - 1; World.setQuality(autoQ); good = 0; K.autoQLock = true; warm = 0; K.toast(`画質を 自動で 下げました（${['低', '中', '高'][autoQ]}）`, 1600); }
    else if (!K.autoQLock && fps > 57 && World.quality < autoMax) { if (++good >= 4) { autoQ = World.quality + 1; World.setQuality(autoQ); good = 0; warm = 0; } } else good = 0;
  });
  // ---- UI ----
  function seg(name, key, opts) { return `<div class="opt-row"><span>${name}</span><div class="seg">${opts.map(([v, l]) => `<button type="button" data-k="${key}" data-v="${v}" class="${String(O[key]) === String(v) ? 'on' : ''}">${l}</button>`).join('')}</div></div>`; }
  function slider(name, key) { return `<div class="opt-row"><span>${name}</span><input type="range" min="0" max="100" step="5" value="${O[key]}" data-k="${key}"><b>${O[key]}</b></div>`; }
  function openSettings() {
    return new Promise(res => {
      const el = document.createElement('div'); el.className = 'win panel wide opt';
      const M = { el, panel: true, items: [], res };
      const paint = () => {
        el.innerHTML = `<button class="m-x solo" type="button" aria-label="とじる">✕</button><h3>せってい</h3>
          ${slider('BGM', 'bgm')}${slider('効果音', 'se')}
          ${seg('文字の 速さ', 'text', [[.6, 'ゆっくり'], [1, 'ふつう'], [1.8, 'はやい'], [6, 'しゅんかん']])}
          ${seg('画質', 'quality', [['auto', 'じどう'], ['low', '低'], ['mid', '中'], ['high', '高']])}
          ${seg('カメラ感度', 'look', [[.6, '低'], [1, '中'], [1.5, '高']])}
          ${seg('操作の 左右', 'lefty', [[false, 'スティック左'], [true, 'スティック右']])}
          ${seg('落下ダメージ', 'fall', [[true, 'あり'], [false, 'なし']])}
          ${seg('戦闘の 表示', 'b3d', [[true, '立体（3D）'], [false, '平面（2D・軽い）']])}
          ${seg('画面の ゆれ', 'calm', [[false, 'あり'], [true, 'へらす']])}
          ${seg('画面の 比率', 'ratio', [['auto', 'じどう（おすすめ）'], ['19.5:9', 'iPhone（ノッチあり）'], ['16:9', 'iPhone SE・16:9'], ['3:2', '3:2'], ['4:3', 'iPad・4:3']])}
          <p class="st-eq">いまの 画質：${['低', '中', '高'][World.quality]}（${O.quality === 'auto' ? 'じどう調整中' : '固定'}）</p>`;
        el.querySelector('.m-x').onclick = () => { Music.sfx('cancel'); K.closeMenu(M, -1); };
        el.querySelectorAll('.seg button').forEach(b => b.onclick = () => { const k = b.dataset.k; let v = b.dataset.v; v = v === 'true' ? true : v === 'false' ? false : isNaN(+v) ? v : +v; O[k] = v; if (k === 'quality') { autoQ = null; K.autoQLock = false; } apply(); if (k === 'ratio') applyRatio(); store(); Music.sfx('cursor'); paint(); });
        el.querySelectorAll('input[type=range]').forEach(r => r.oninput = () => { O[r.dataset.k] = +r.value; r.nextElementSibling.textContent = r.value; apply(); store(); });
        el.querySelectorAll('input[type=range]').forEach(r => r.onchange = () => Music.sfx('cursor'));
      };
      paint(); document.getElementById('ui').appendChild(el); K.MENUS.push(M);
    });
  }
  K.openSettings = openSettings;
  K.HOOK.menu.push(() => ({ label: 'せってい', sub: '音・画質・操作', fn: openSettings }));
  // タイトルにも ⚙
  const tm = document.getElementById('titleMenu');
  if (tm) { const b = document.createElement('button'); b.className = 't-btn'; b.type = 'button'; b.id = 'btnOpt'; b.textContent = '⚙ せってい'; b.onclick = () => { Music.init(); Music.sfx('ok'); openSettings(); }; tm.appendChild(b); }
})();
