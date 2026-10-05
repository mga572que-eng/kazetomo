// 画面の 大きさの 検査：iPhoneの ホーム画面アプリで 縦→横に 回しても 黒い 部分が でない・測りなおしで ゆれない
import assert from 'node:assert/strict';
import { createRequire } from 'node:module'; const require = createRequire(import.meta.url); const { chromium } = require('playwright');
import { GAME } from './lib.mjs';
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148' });
  // iOS の ホーム画面アプリ：standalone・screen は 縦の まま
  await ctx.addInitScript(() => { Object.defineProperty(navigator, 'standalone', { get: () => true }); Object.defineProperty(screen, 'width', { get: () => 390 }); Object.defineProperty(screen, 'height', { get: () => 844 }); window.__norender = 1; localStorage.setItem('kz-guide-seen', 'x'); });
  const page = await ctx.newPage(); await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort()); const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(GAME, { waitUntil: 'domcontentloaded', timeout: 60000 }); await page.waitForFunction(() => window.KZ && KZ.applyRatio, null, { timeout: 60000 });
  // 縦で 起動（下に 帯が でる 状況を まねる：innerHeight が 画面より 小さい）
  await page.setViewportSize({ width: 390, height: 780 }); await page.waitForTimeout(1000);
  const snap = () => page.evaluate(() => { const c = document.getElementById('game'), r = c.getBoundingClientRect(); return { iw: innerWidth, ih: innerHeight, cw: Math.round(r.width), ch: Math.round(r.height), bw: c.width, bh: c.height, appW: getComputedStyle(document.documentElement).getPropertyValue('--app-w').trim(), appH: getComputedStyle(document.documentElement).getPropertyValue('--app-h').trim() }; });
  const p0 = await snap();
  // 横に 回す
  await page.setViewportSize({ width: 844, height: 390 }); await page.waitForTimeout(1200);
  const p1 = await snap();
  assert(p1.cw >= 844 && p1.ch >= 390, '横に しても キャンバスが 画面を うめない（黒い 部分）：' + JSON.stringify({ p0, p1 }));
  assert(Math.abs(p1.bw / p1.bh - p1.cw / p1.ch) < .02, 'キャンバスの 中身が ひずむ：' + JSON.stringify(p1));
  assert.equal(p1.appW, p1.cw + 'px'); assert.equal(p1.appH, p1.ch + 'px');
  // 測りなおしが つづいても 値が かわらない（ゆれない）
  const keys = await page.evaluate(async () => { const out = []; for (let k = 0; k < 12; k++) { dispatchEvent(new Event('resize')); window.visualViewport && visualViewport.dispatchEvent(new Event('resize')); await new Promise(r => setTimeout(r, 60)); const s = getComputedStyle(document.documentElement); out.push(s.getPropertyValue('--app-w') + 'x' + s.getPropertyValue('--app-h') + ':' + document.getElementById('game').width); } return out; });
  assert(new Set(keys).size === 1, '測りなおしの たびに 大きさが かわる：' + keys.join(' '));
  // 縦に もどして また 横
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(900); await page.setViewportSize({ width: 844, height: 390 }); await page.waitForTimeout(1200);
  const p2 = await snap(); assert(p2.cw >= 844 && p2.ch >= 390, '2回目の 回転で 黒い 部分：' + JSON.stringify(p2));
  assert.equal(errors.length, 0, errors.join('\n'));
  console.log('PASS: iOS ホーム画面アプリの 縦→横・横→縦→横で 画面いっぱい、ひずみなし、測りなおしで ゆれない', JSON.stringify({ p0, p1, p2 }));
} finally { await browser.close(); }
