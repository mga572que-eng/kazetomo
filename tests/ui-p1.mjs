// 分離したPCブラウザでの横画面検査。iPhone実機検査ではない。
import {boot,idle} from './lib.mjs';
import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const out=fileURLToPath(new URL('./out/',import.meta.url));fs.mkdirSync(out,{recursive:true});

const check=async page=>{const r=await page.evaluate(()=>({
 nums:[...document.querySelectorAll('#bParty .pc-num')].map(e=>({w:e.clientWidth,sw:e.scrollWidth,h:e.clientHeight,lh:parseFloat(getComputedStyle(e).lineHeight)})),
 bottom:document.querySelector('#bBottom').getBoundingClientRect().top,
 controls:document.querySelector('.bctl').getBoundingClientRect().top,
 names:[...document.querySelectorAll('.foe-name')].map(e=>e.getBoundingClientRect().toJSON()),
 allyNames:[...document.querySelectorAll('.al-n')].filter(e=>getComputedStyle(e).visibility!=='hidden'&&parseFloat(getComputedStyle(e).opacity)>.5).map(e=>e.getBoundingClientRect().bottom),
 root:[...document.querySelectorAll('.m-battle:not(.one) .m-l')].map(e=>({h:e.getBoundingClientRect().height,lh:parseFloat(getComputedStyle(e).lineHeight)}))
}));console.log(JSON.stringify(r));assert.equal(r.nums.length,4);assert(r.nums.every(n=>n.sw<=n.w+1&&n.h<=n.lh+1),'HP/MP must fit one line');assert(r.controls>=r.bottom,'controls overlap battlefield');assert.equal(r.names.length,3);assert(r.names.every(q=>q.bottom<=r.bottom+1),'enemy label behind controls');assert(r.allyNames.every(y=>y<=r.bottom+1),'ally name behind controls');
 const names=r.names.sort((a,b)=>a.left-b.left);assert(names.every((q,i)=>!i||names[i-1].right<=q.left),'enemy names overlap');assert(r.root.every(q=>q.h<=q.lh+1),'root command wraps');};
const start=async page=>{await page.evaluate(()=>KZ.setupCh3());await page.evaluate(()=>KZ.travel(0,30,40));await idle(page);
 await page.evaluate(()=>{KZ.G.auto=false;KZ.G.party.slice(0,4).forEach(m=>{m.lv=29;KZ.calc(m);m.hp=m.st.hp;m.st.mp=163;m.mp=163;});KZ.runBattle([{sp:'mizumochi',lv:3},{sp:'iwanoko',lv:3},{sp:'watapoko',lv:3}]);});
 await page.waitForSelector('#bCmd .m-battle:not(.one) .m-item',{timeout:60000});};
const snap=(page,name)=>page.screenshot({path:path.join(out,name),timeout:90000});

for(const size of [{width:844,height:390,prefix:'UI_P1_GAME'},{width:667,height:375,prefix:'UI_P1_667'}]){
 const s=await boot({render:true,viewport:{width:size.width,height:size.height}});
 try{
  await start(s.page);await snap(s.page,`${size.prefix}_NORMAL.png`);await check(s.page);
  await s.page.getByRole('button',{name:/とくぎ/}).click();await s.page.waitForTimeout(600);await snap(s.page,`${size.prefix}_SKILLS.png`);await check(s.page);
  const compact=await s.page.evaluate(()=>[...document.querySelectorAll('.m-battle.one .m-item:not(.on) .m-h')].every(e=>getComputedStyle(e).webkitLineClamp==='1'));assert(compact,'unselected skill descriptions must be compact');
  if(size.width===667){await s.page.keyboard.press('Escape');await s.page.waitForTimeout(300);await check(s.page);
   await s.page.getByRole('button',{name:/たたかう/}).click();await s.page.waitForSelector('.foe.preview');
   const before=await s.page.locator('.foe.preview').getAttribute('id');await s.page.keyboard.press('ArrowDown');await s.page.waitForFunction(id=>document.querySelector('.foe.preview')?.id!==id,before);
   const weak=await s.page.evaluate(()=>({n:document.querySelectorAll('.foe.preview').length,box:document.querySelector('.foe.preview .foe-weak').getBoundingClientRect().toJSON(),bottom:document.getElementById('bBottom').getBoundingClientRect().top,width:innerWidth}));assert.equal(weak.n,1);assert(weak.box.bottom<=weak.bottom&&weak.box.left>=0&&weak.box.right<=weak.width,'selected weakness outside battlefield');
   await snap(s.page,'UI_P1_667_TARGET.png');await s.page.keyboard.press('Escape');assert.equal(await s.page.locator('.foe.preview').count(),0,'preview remains after cancelling target selection');}
  assert.equal(s.errors.length,0,s.errors.join('\n'));
 }finally{await s.browser.close();}
}
console.log('PASS: desktop 844/667, 4 allies, three-digit MP, 3 enemy labels, ally labels, commands and skill descriptions');
