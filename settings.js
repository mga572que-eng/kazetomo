// 風灯の島 — せってい（音量・文字速度・画質・操作）と 自動画質
'use strict';
(() => {
  const K = window.KZ; if (!K) return;
  const KEY = 'kazetomo-opt';
  const DEF = { bgm: 75, se: 70, text: 1, quality: 'auto', lefty: false, look: 1, calm: false, ratio: 'auto', b3d: 'mix', fall: true, fpv: false };
  let O = { ...DEF }; try { Object.assign(O, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
  if (O.rv !== 2) { O.ratio = 'auto'; O.rv = 2; try { localStorage.setItem(KEY, JSON.stringify(O)); } catch (e) {} } // 旧版の 比率バグ対策：一度 自動に もどす
  if ((O.rv | 0) < 3) { if (O.b3d === true) O.b3d = 'mix'; O.rv = 3; try { localStorage.setItem(KEY, JSON.stringify(O)); } catch (e) {} } // 2026-10-03：戦闘は 2Dの 絵＋3Dの けしき を 標準に（1回だけ）
  const store = () => { try { localStorage.setItem(KEY, JSON.stringify(O)); } catch (e) {} };
  let autoMax = 2, autoQ = null;
  function apply() {
    Music.setVol(O.bgm / 100, O.se / 100);
    K.HOOK.OPT.text = O.text; K.HOOK.OPT.look = O.look; K.HOOK.OPT.lefty = O.lefty; K.HOOK.OPT.calm = O.calm; K.HOOK.OPT.b3d = O.b3d === true; K.HOOK.OPT.mix = O.b3d === 'mix'; K.HOOK.OPT.fall = O.fall !== false; K.HOOK.OPT.fpv = !!O.fpv;
    document.body.classList.toggle('lefty', !!O.lefty); document.body.classList.toggle('calm', !!O.calm);
    if (O.quality === 'auto') { if (autoQ == null) autoQ = World.quality; World.setQuality(autoQ); } else World.setQuality({ low: 0, mid: 1, high: 2 }[O.quality]);
  }
  // 画面の 大きさ（2026-10-05 作りなおし）
  // ・前は 縦向きで 決めた 大きさ（px）が キャンバスに のこり、横にすると 半分が 黒くなった／測るたびに 値が かわり、文字や ボタンが 上下に ゆれた
  // ・いまは「測る → 前と 同じなら 何もしない」。回転の あとは 数回 測りなおして 落ちつかせる。キャンバスの 大きさは いつも 同じ 方法で 決める
  let lastKey = '';
  function measure() { const vv = window.visualViewport, de = document.documentElement;
    // 回転の 途中は visualViewport と innerWidth が くいちがう ことが ある → 向きが そろう 値を 使う
    let iw = Math.round(vv ? vv.width * (vv.scale || 1) : innerWidth), ih = Math.round(vv ? vv.height * (vv.scale || 1) : innerHeight);
    if ((iw > ih) !== (innerWidth > innerHeight)) { iw = innerWidth; ih = innerHeight; }
    iw = Math.max(iw, de.clientWidth || 0); ih = Math.max(ih, de.clientHeight || 0);
    return { iw, ih }; }
  function applyRatio() { const r = { '16:9': 16 / 9, '19.5:9': 19.5 / 9, '4:3': 4 / 3, '3:2': 3 / 2 }[O.ratio] || 0; const { iw, ih } = measure(); if (!iw || !ih) return;
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const standalone = navigator.standalone === true || matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches;
    let w = iw, h = ih, x = 0, y = 0, fixed = false;
    if (r) { w = iw; h = iw / r; if (h > ih) { h = ih; w = ih * r; } x = (iw - w) / 2; y = (ih - h) / 2; fixed = true; }
    else if (ios && standalone && screen.width && screen.height) { // iOS の ホーム画面アプリで 下に 黒い帯が でる 対策：いまの 向きの 画面いっぱい
      const land = iw > ih, sw = land ? Math.max(screen.width, screen.height) : Math.min(screen.width, screen.height), sh = land ? Math.min(screen.width, screen.height) : Math.max(screen.width, screen.height);
      if (sh - ih > 4 || sw - iw > 4) { w = sw; h = sh; fixed = true; } }
    w = Math.round(w); h = Math.round(h); x = Math.round(x); y = Math.round(y);
    const key = [w, h, x, y, fixed ? 1 : 0, r].join(','); if (key === lastKey) return; lastKey = key; // 同じなら 何もしない（ゆれの もと を 断つ）
    const b = document.body, de = document.documentElement, cvs = document.getElementById('game');
    window.__vw = fixed ? w : 0; window.__vh = fixed ? h : 0;
    if (fixed) { Object.assign(b.style, { position: 'fixed', left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px', transform: r ? 'translateZ(0)' : '' }); de.style.height = r ? '' : h + 'px'; de.style.background = r ? '#000' : ''; }
    else { ['position', 'left', 'top', 'width', 'height', 'transform'].forEach(k => b.style[k] = ''); de.style.height = ''; de.style.background = ''; }
    if (cvs) { if (fixed && !r) Object.assign(cvs.style, { width: w + 'px', height: h + 'px', bottom: 'auto', right: 'auto' }); else ['width', 'height', 'bottom', 'right'].forEach(k => cvs.style[k] = ''); } // 前の 向きの px を のこさない
    de.style.setProperty('--app-w', w + 'px'); de.style.setProperty('--app-h', h + 'px');
    try { World.resize(); } catch (e) {} }
  // 回転・ツールバーの 出入りの あとは、すぐ・次の 描画・0.15秒・0.4秒・0.8秒で 測りなおす（同じなら 何もしない）
  let settleT = []; const settle = () => { applyRatio(); requestAnimationFrame(applyRatio); settleT.forEach(clearTimeout); settleT = [150, 400, 800].map(ms => setTimeout(applyRatio, ms)); };
  K.applyRatio = () => { lastKey = ''; applyRatio(); }; addEventListener('resize', settle); if (window.visualViewport) visualViewport.addEventListener('resize', settle); addEventListener('orientationchange', settle); addEventListener('pageshow', settle);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) settle(); });
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
          ${seg('視点', 'fpv', [[false, '三人称（うしろから）'], [true, '一人称（目線）']])}
          ${seg('落下ダメージ', 'fall', [[true, 'あり'], [false, 'なし']])}
          ${seg('戦闘の 表示', 'b3d', [['mix', '2Dの 絵＋3Dの けしき'], [true, '立体（3D）'], [false, '平面（2D・軽い）']])}
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
  // 視点の きりかえ（メニュー「そのほか」と Vキー）
  const toggleView = () => { O.fpv = !O.fpv; apply(); store(); K.toast(O.fpv ? '一人称（目線）に した' : '三人称（うしろから）に した', 1200); };
  K.toggleView = toggleView;
  K.HOOK.menu.push(() => ({ label: '視点', sub: O.fpv ? 'いま：一人称' : 'いま：三人称', fn: async () => { toggleView(); return 'close'; } }));
  addEventListener('keydown', e => { if (e.code === 'KeyV' && !e.repeat && K.phase === 'field' && !(K.MENUS && K.MENUS.length) && !/INPUT|TEXTAREA/.test((e.target && e.target.tagName) || '')) toggleView(); });
  K.HOOK.menu.push(() => ({ label: 'せってい', sub: '音・画質・操作', fn: openSettings }));
  // タイトルにも ⚙
  const tm = document.getElementById('titleMenu');
  if (tm) { const b = document.createElement('button'); b.className = 't-btn'; b.type = 'button'; b.id = 'btnOpt'; b.textContent = '⚙ せってい'; b.onclick = () => { Music.init(); Music.sfx('ok'); openSettings(); }; tm.appendChild(b); }
})();
