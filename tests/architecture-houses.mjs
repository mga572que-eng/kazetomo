import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {boot,idle} from './lib.mjs';
const {browser,page,errors}=await boot({render:true});
try {
 await fs.mkdir(new URL('./out/',import.meta.url),{recursive:true});
 const state=await page.evaluate(async()=>{
  const K=KZ;await K.travel(0,30,40); await K.wait(300);K.G.tips=new Proxy(K.G.tips||{}, {get:()=>1});
  const h=K.interior.houses(0).find(h=>h.id==='yui'); const before={pitch:K.cam.pitch,dist:K.cam.dist};
  await K.interior.enter(h); const R=K.interior.ROOM[0]; const B=World.Blocks;
  return {before, roof:[-7,0,7].flatMap(x=>[-7,0,7].map(z=>B.has(R.x+x,R.y+7,R.z+z))),wall:B.has(R.x+8,R.y+2,R.z),door:B.has(R.x,R.y+2,R.z+8), keys:K.interior.cur.props.filter(p=>p.key).map(p=>p.key), player:{x:K.player.x,y:K.player.y,z:K.player.z}, houses:K.townBuildings.buildings.length};
 });
 assert.ok(state.roof.every(Boolean),'ceiling covers room');assert.equal(state.wall,true);assert.equal(state.door,false);assert.ok(state.keys.every(k=>k.startsWith('0:yui:')));assert.ok(state.houses>0);
 await page.evaluate(()=>{const K=KZ,R=K.interior.ROOM[0];K.player.x=R.x+.5;K.player.z=R.z+3;K.cam.yaw=Math.PI;});
 await page.waitForTimeout(1200);
 for(const [name,yaw,pitch] of [['front',Math.PI,.35],['side',Math.PI/2,.55],['high',0,1]]){
  await page.evaluate(({yaw,pitch})=>{KZ.cam.yaw=yaw;KZ.cam.pitch=pitch;},{yaw,pitch}); await page.waitForTimeout(600);
  const m=await page.evaluate(()=>({eye:KZ.cam.eye,player:[KZ.player.x,KZ.player.y,KZ.player.z],dist:KZ.cam.cd}));
  assert.ok(m.eye.every(Number.isFinite));assert.ok(m.dist>=1.2,`camera keeps character visible ${name}`);
  await page.screenshot({path:fileURLToPath(new URL(`./out/HOUSE_${name}.png`,import.meta.url))});
 }
 await page.evaluate(()=>KZ.interior.leave());await idle(page);
 const restored=await page.evaluate(()=>({pitch:KZ.cam.pitch,dist:KZ.cam.dist,cur:KZ.interior.cur}));assert.equal(restored.pitch,state.before.pitch);assert.equal(restored.dist,state.before.dist);assert.equal(restored.cur,null);assert.deepEqual(errors,[]);
 console.log('PASS closed ceiling, walls, doorway, camera 3 angles, furniture keys and camera restore',state);
} finally {await browser.close();}
