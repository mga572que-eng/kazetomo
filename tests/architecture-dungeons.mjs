// Geometry/progression contract test. No real saves, no chapter walkthrough.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const regions = Array.from({ length: 4 }, () => new Map());
let region = 0;
const key = (x,y,z) => `${x},${y},${z}`;
const Blocks = {
  has:(x,y,z)=>regions[region].has(key(x,y,z)), get:(x,y,z)=>regions[region].get(key(x,y,z)),
  isProt:(x,y,z)=>regions[region].has(key(x,y,z)),
  set:(x,y,z,t,p,r)=>regions[r??region].set(key(x,y,z),t),
  rm:(x,y,z,r)=>regions[r??region].delete(key(x,y,z)), move:()=>{}
};
const outsideTrack={t:'outside objective',p:{x:10,z:20}};
const H = { push:[],frame:[],fx:[],target:[],labels:{},acts:{},load:[],mapMarks:[],menu:[],track:()=>outsideTrack };
const beacons=Array.from({length:5},()=>({lit:true,x:100,z:100,y:20}));
let saves=0;
const K={HOOK:H,G:{region:0,lh:[1,1,1],gold:0},REG:[{beacons},{},{},{lh:beacons}],player:{x:228.5,z:227.5,y:71},
 trail:[],cam:{},extraAreas:[],phase:'field',say:async()=>{},confirm:async()=>false,toast:()=>{},gain:()=>{},save:()=>saves++,hud:()=>{},fieldSong:()=>'',surfaceAt:()=>21};
const World={Blocks,get region(){return region;},setRegion:r=>region=r};
vm.runInNewContext(fs.readFileSync(new URL('../lighthouses.js',import.meta.url),'utf8'),{window:{KZ:K},World,Music:{sfx:()=>{},jingle:()=>{}},DATA:{items:{shizuku:{name:'s'},pan:{name:'p'}}}});
assert.equal(K.lhDuns.length,8);
for(const d of K.lhDuns){
 region=d.r;K.G.region=d.r;K.lhDungeon.reset(d);
 assert.equal(d.architecture.floors,4);
 assert.equal(d.parts.shards.length,3);
 assert.equal(d.parts.hop.length,4);
 for(const b of [1,-45]){const roofH=b===1?13:16;assert.ok(Blocks.has(d.x,d.y+roofH-1,d.z+b),'end walls meet ceiling');}
 for(let a=-6;a<=6;a++){assert.ok(Blocks.has(d.x+a,d.y+15,d.z-28),'roof height transition closed');assert.ok(Blocks.has(d.x+a,d.y+15,d.z-40),'final partition meets ceiling');}
 assert.ok(d.parts.door1.length&&d.parts.door2.length&&d.parts.door3.length);
 for(const [x,y,z]of d.architecture.roof)assert.ok(Blocks.has(x,y,z),'complete roof');
 for(let b=-41;b>=-44;b--){assert.ok(Blocks.has(d.x,d.y-b-36,d.z+b),'one metre stair');assert.ok(!Blocks.has(d.x,d.y-b-35,d.z+b),'no extra block making a two metre step');}
 assert.ok(d.goalP.y===d.y+9);
 assert.ok(regions[d.r].size<24000,'dungeon-only block budget');
 const prior=regions[d.r].size;K.lhDungeon.reset(d);assert.equal(regions[d.r].size,prior,'reset must replace architecture');
 K.player.x=d.x+.5;K.player.z=d.z-43.5;K.player.y=d.y+9;
 assert.equal(K.lhDungeon.floorOf(d),4);assert.ok(K.lhDungeon.progress(d).includes('4かい'));
 assert.equal(H.track().p,null);assert.ok(H.track().t.includes('4かい'));
 const gold=K.G.gold;await H.acts.lhdGoal(d);assert.equal(K.G.gold,gold,'cannot skip the three puzzles');
 K.lhSt[K.lhDungeon.key(d)]={o1:1,o2:1,got:[0,1,2]};
 await H.acts.lhdGoal(d);assert.equal(K.G.gold,gold+d.reward.gold);
 await H.acts.lhdGoal(d);assert.equal(K.G.gold,gold+d.reward.gold,'reward once');
}
assert.equal(saves,8);
K.player.x=0;K.player.z=0;assert.equal(H.track(),outsideTrack,'outside track preserves previous result');
console.log('PASS dungeon roofs, four floors, reset, puzzle gates and reward-once; dungeon blocks',regions.map(r=>r.size));
if(process.argv.includes('--render')){
 const {boot,idle}=await import('./lib.mjs');
 const {browser,page,errors}=await boot({render:false,chapter:'#btnNew'});
 try{
  const out=new URL('./out/',import.meta.url);fs.mkdirSync(out,{recursive:true});
  await page.evaluate(async()=>{const K=KZ;K.G.flags.tut1=1;await K.travel(0,228.5,227.5);K.lhDungeon.reset(K.lhDuns[0]);K.enemies=[];});await idle(page);
  await page.evaluate(()=>{delete window.__norender;});
  for(const [name,a,b,h]of [['entry',0,-2,1],['shards',5,-39,9],['fourth',0,-44,9]]){
   await page.evaluate(([a,b,h])=>{const K=KZ,d=K.lhDuns[0],p=K.player;p.x=d.x+a+.5;p.z=d.z+b+.5;p.y=d.y+h;p.vx=p.vy=p.vz=0;p.yaw=Math.PI;K.cam.yaw=Math.PI;K.cam.pitch=.3;K.cam.tp=null;K.cam.cd=null;K.cam.pa=0;},[a,b,h]);
   await page.waitForFunction(()=>Math.hypot(KZ.cam.eye[0]-KZ.player.x,KZ.cam.eye[2]-KZ.player.z)<14,{},{timeout:30000});await page.waitForTimeout(300);
   await page.waitForFunction(()=>!document.getElementById('tip').classList.contains('on')&&!document.getElementById('areaBn')?.classList.contains('on'),{},{timeout:15000});
   const r=await page.evaluate(()=>{const K=KZ,d=K.lhDuns[0],roof=K.player.z>=d.z-28?d.y+13:d.y+16;let blocks=0;World.Blocks.each(0,()=>blocks++);return{floor:K.lhDungeon.floorOf(d),eye:K.cam.eye,roof,blocks,stats:World.stats()};});
   assert.ok(r.blocks<24000,'region-wide block budget');assert.ok(r.eye[1]<r.roof,'camera stays below roof');
   await page.screenshot({path:new URL(`DUNGEON_${name.toUpperCase()}.png`,out).pathname.replace(/^\/([A-Z]:)/,'$1')});console.log(name,r);
  }
  // Only the short final staircase: all three puzzles are already cleared in this isolated fixture.
  await page.evaluate(()=>{const K=KZ,d=K.lhDuns[0],p=K.player;K.lhSt[K.lhDungeon.key(d)]={o1:1,o2:1,got:[0,1,2]};for(const[a,h,b]of d.parts.door3)World.Blocks.rm(d.x+a,d.y+h,d.z+b,d.r);p.x=d.x+.5;p.z=d.z-39.7;p.y=d.y+5.02;p.ground=true;p.vx=p.vy=p.vz=0;p.yaw=Math.PI;K.cam.yaw=Math.PI;K.cam.pitch=.3;K.cam.tp=null;K.cam.cd=null;K.cam.pa=0;K.cam.inAt=0;});
  // Keep normal keyboard input and collision physics; stop at the fourth floor, with 120 frames as the upper bound.
  await page.keyboard.down('KeyW');try{console.log('staircase trace',await page.evaluate(()=>{window.__norender=1;const trace=[];for(let i=0;i<120;i++){__dbg.sim(1,33);if(i<4||i%30===0)trace.push({i,z:KZ.player.z,y:KZ.player.y,yaw:KZ.cam.yaw,inp:window.__inp,phase:KZ.phase});if(KZ.lhDungeon.floorOf(KZ.lhDuns[0])===4){trace.push({arrivedAt:i,z:KZ.player.z,y:KZ.player.y,stuck:KZ.stuckAt(KZ.player)});break;}}delete window.__norender;return trace;}));}finally{await page.keyboard.up('KeyW');}await page.waitForTimeout(300);
  const walked=await page.evaluate(()=>{const K=KZ,d=K.lhDuns[0];return{floor:K.lhDungeon.floorOf(d),x:K.player.x,z:K.player.z,y:K.player.y,goal:d.goalP};});
  console.log('fourth staircase walk',walked);assert.equal(walked.floor,4,'ordinary movement climbs to fourth floor');
  assert.deepEqual(errors,[]);console.log('PASS real dungeon render, staircase movement, camera clearance and region block budget');
 }finally{await browser.close();}
}
