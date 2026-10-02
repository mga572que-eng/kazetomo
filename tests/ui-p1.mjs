// 分離したPCブラウザでの横画面検査。iPhone実機検査ではない。
import {boot,idle} from './lib.mjs';
import path from 'node:path';
import assert from 'node:assert/strict';
const s=await boot({render:true});
try {
 await s.page.evaluate(()=>KZ.travel(0,30,40));await idle(s.page);
 await s.page.evaluate(()=>{KZ.G.auto=false;KZ.G.party.slice(0,4).forEach(m=>{m.lv=29;KZ.calc(m);m.hp=m.st.hp;m.st.mp=163;m.mp=163;});KZ.runBattle([{sp:'watapoko',lv:3}]);});
 await s.page.waitForSelector('#bCmd .m-battle:not(.one) .m-item', {timeout:60000});
 const check=async()=>{const r=await s.page.evaluate(()=>({
  nums:[...document.querySelectorAll('#bParty .pc-num')].map(e=>({w:e.clientWidth,sw:e.scrollWidth,h:e.clientHeight,lh:parseFloat(getComputedStyle(e).lineHeight)})),
  bottom:document.querySelector('#bBottom').getBoundingClientRect().top,
  controls:document.querySelector('.bctl').getBoundingClientRect().top,
  names:[...document.querySelectorAll('.foe-name')].map(e=>e.getBoundingClientRect().bottom)
 }));console.log(JSON.stringify(r));assert.equal(r.nums.length,4);assert(r.nums.every(n=>n.sw<=n.w+1&&n.h<=n.lh+1),'HP/MP must fit one line');assert(r.controls>=r.bottom,'controls overlap battlefield');assert(r.names.every(y=>y<=r.bottom+1),'enemy label behind controls');};
 await check();await s.page.screenshot({path:path.resolve('../../outputs/UI_P1_GAME_NORMAL.png')});
 await s.page.getByRole('button',{name:/とくぎ/}).click();await s.page.waitForTimeout(600);
 await s.page.screenshot({path:path.resolve('../../outputs/UI_P1_GAME_SKILLS.png')});await check();
 await s.page.screenshot({path:path.resolve('../../outputs/UI_P1_GAME_SKILLS.png')});
 assert.equal(s.errors.length,0,s.errors.join('\n'));console.log('PASS: real desktop game UI, 4 allies, three-digit MP, normal and skills');
} finally {await s.browser.close();}
