import assert from 'node:assert/strict';
import {boot,idle,ROOT} from './lib.mjs';
import fs from 'node:fs';
import path from 'node:path';
const s=await boot({render:false});
try {
 const result=await s.page.evaluate(()=>{
  const K=KZ,B=World.Blocks,roofs=[];
  World.setRegion(1);const r=K.REG[1],a=r.ruinsRoof;
  let missing=0;for(let x=0;x<a.size;x++)for(let z=0;z<a.size;z++)if(!B.has(a.x+x,a.y,a.z+z))missing++;
  const entrance=[];for(let z=16;z<=17;z++)for(let h=0;h<6;h++)entrance.push(B.has(a.x,a.y-11+h,a.z+z));
  roofs.push({kind:'ruins',missing,entrance,altar:r.altar,midboss:r.midboss,chests:r.chests.filter(c=>/^r[0-5]$/.test(c.id)).map(c=>c.id)});
  World.setRegion(3);const p=K.REG[3].palaceRoof;missing=0;
  for(let x=-16;x<=16;x++)for(let z=-16;z<=16;z++)if(x*x+z*z<=256&&!B.has(p.x+x,p.y,p.z+z))missing++;
  roofs.push({kind:'palace',missing,frontOpen:!B.has(p.x,p.y-14,p.z+16),targetOpen:!B.has(p.x,p.y-14,p.z+4)});
  for(const sh of DATA.shrines){World.setRegion(sh.r);missing=0;for(let x=-7;x<=7;x++)for(let z=-7;z<=7;z++)if(!B.has(sh.pos.x+x,sh.ceiling,sh.pos.z+z))missing++;
   roofs.push({kind:sh.id,missing,headroom:sh.ceiling-sh.goal.y,gateOpen:!B.has(sh.pos.x,sh.pos.y+2,sh.pos.z+7),rings:sh.parts.rings.length});}
  World.setRegion(K.G.region);return roofs;
 });
 for(const r of result)assert.equal(r.missing,0,JSON.stringify(r));
 assert(result[0].entrance.every(x=>!x),'ruins entry remains open');assert.equal(result[0].chests.length,6);
 assert(result[1].frontOpen&&result[1].targetOpen,'palace front and story target remain open');
 for(const r of result.slice(2)){assert(r.gateOpen);assert(r.headroom>=5);}
 assert.equal(result.find(r=>r.kind==='s5').rings,6);
 const out=path.join(ROOT,'tests/out');fs.mkdirSync(out,{recursive:true});
 const views=[{r:1,get:()=>{const a=KZ.REG[1].ruinsEntrance;return {...a,y:World.hAt(a.x,a.z)+.03,yaw:Math.PI/2};},name:'ruins-entry'},
 {r:1,get:()=>{const a=KZ.REG[1].altar;return {...a,y:a.y+1,yaw:0};},name:'ruins-altar'},
 {r:3,get:()=>{const a=KZ.REG[3].palace;return {...a,z:a.z+10,y:World.hAt(a.x,a.z+10)+.03,yaw:Math.PI};},name:'palace-inside'}];
 const cameras=[];
 for(const v of views){await s.page.evaluate(r=>KZ.travel(r,KZ.REG[r].town.x,KZ.REG[r].town.z),v.r);await idle(s.page);
  await s.page.evaluate(code=>{const a=(0,eval)('('+code+')')();Object.assign(KZ.player,a,{vy:0,ground:true});Object.assign(KZ.cam,{yaw:a.yaw,pitch:.35,dist:6});delete window.__norender;},v.get.toString());
  // 迷路の壁にカメラが当たると距離はすぐ縮み、離れた後はゆっくり戻る。
  // 固定時間では描画速度により撮影位置が変わるため、安全距離が5回続くまで待つ。
  await s.page.waitForFunction(()=>{const safe=Number.isFinite(KZ.cam.cd)&&KZ.cam.cd>=1.2;window.__roofCamStable=safe?(window.__roofCamStable||0)+1:0;return window.__roofCamStable>=5;},{},{polling:100,timeout:10000});
  await s.page.evaluate(()=>{window.__roofCamStable=0;});cameras.push(await s.page.evaluate(()=>({cd:KZ.cam.cd,y:KZ.player.y})));
  await s.page.screenshot({path:path.join(out,`main-${v.name}.png`),timeout:60000});await s.page.evaluate(()=>window.__norender=1);
 }
 assert(cameras.every(c=>Number.isFinite(c.cd)&&c.cd>=1.2),JSON.stringify(cameras));
 assert.equal(s.errors.length,0,s.errors.join('\n'));
 console.log(JSON.stringify({roofs:result,cameras},null,2));console.log('PASS: roofs, old entrances/targets, six chests, seven trials and PC camera views');
} finally {await s.browser.close();}
