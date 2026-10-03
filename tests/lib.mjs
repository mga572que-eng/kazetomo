// 回帰テストの 共通部品（Playwright）。使い方は tests/README.md
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url); // 全体に 入れた playwright も 使えるように（NODE_PATH）
const { chromium } = require('playwright');
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const GAME = pathToFileURL(path.join(ROOT, 'index.html')).href;
// ゲームを 開いて、第3章の デバッグ開始で フィールドに 立つ（描画なしで 速く）
export async function boot({ render = false, chapter = '#btnCh3' } = {}) {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true }); const page = await ctx.newPage(); const errors = [];
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  page.on('pageerror', e => errors.push(e.message));
  await ctx.addInitScript(r => { localStorage.setItem('kz-guide-seen', 'x'); if (!r) window.__norender = 1; }, render);
  try {
    await page.goto(GAME + '#debug', {waitUntil:'domcontentloaded', timeout:60000});
    const splash=page.locator('#splash');if(await splash.isVisible())await splash.click({timeout:60000});
    for(const selector of [chapter,'.slot[data-n="1"]','#nameForm button'])await page.locator(selector).click({timeout:60000});
    await page.waitForFunction(()=>document.getElementById('title').hidden);
  } catch (error) { await browser.close(); throw error; }
  await idle(page); await page.evaluate(() => { KZ.G.tips = new Proxy(KZ.G.tips || {}, { get: () => 1 }); });
  return { browser, page, errors };
}
// 会話や メニューを Enter で 進め、フィールドに もどるまで 待つ
export async function idle(page, max = 400) { let ok = 0; for (let i = 0; i < max; i++) { const busy = await page.evaluate(() => KZ.busy || KZ.phase !== 'field' || !document.getElementById('dlg').hidden || KZ.MENUS.length).catch(() => true);
  if (!busy) { if (++ok >= 3) return; await page.waitForTimeout(100); continue; } ok = 0; await page.keyboard.press('Enter').catch(() => {}); await page.waitForTimeout(90); } }
export const act = (page, js, arg) => { page.evaluate(new Function('arg', `return KZ.run(() => (${js})(arg))`), arg); };
