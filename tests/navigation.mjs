// Targeted PC navigation checks; isolated browser, no user saves.
import {boot,idle} from './lib.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
const s=await boot({render:true,chapter:'#btnNew'});
const out=fileURLToPath(new URL('./out/',import.meta.url));fs.mkdirSync(out,{recursive:true});
try {
 await s.page.evaluate(()=>KZ.travel(0,0,0));await idle(s.page);
 const result=await s.page.evaluate(()=>{
  const K=KZ,g=K.G,r=K.REG[0];g.order=0;g.track=null;g.flags.metYui=1;g.flags.metGen=1;g.flags.mio=1;
  g.lit=[0,0,0,0,0];r.beacons.forEach(b=>b.lit=false);g.trial=[{},{},{},{},{}];g.req={};
  const key=DATA.reqs.find(q=>q.key===0);
  g.req[key.id]={s:'a',step:0};g.trial[0].shards=0;
  const collecting=K.objective();
  g.trial[0].shards=3;g.req[key.id]={s:'d',step:key.steps.length};
  const b1=r.beacons[1];K.player.x=b1.x;K.player.z=b1.z;
  const before=K.objective();g.trial[0].seen=1;r.beacons[0].guard=true;
  const afterGuard=K.objective();
  const firstLocked=before.p===r.beacons[0]&&afterGuard.p===r.beacons[0];
  r.beacons[0].lit=true;g.order=1;g.req[DATA.reqs.find(q=>q.key===1).id]={s:'d'};
  const next=K.objective();
  // Restore first-lighthouse fixture for screenshots, no save writes.
  r.beacons[0].lit=false;g.order=0;g.trial[0]={};K.player.x=0;K.player.z=0;
  const nav=K.navigationGoal();
  const norm=p=>({x:p.x,z:p.z});
  return {collecting:!!collecting.p,firstLocked,nextIsFirst:next.p===r.beacons[0],nav:{...nav,p:norm(nav.p)},b0:norm(r.beacons[0])};
 });
 assert.ok(result.collecting,'Missing-shard objective needs coordinates');assert.ok(result.firstLocked,'Completed key/guard must keep first lighthouse');assert.equal(result.nextIsFirst,false,'After lighting advance normally');
 assert.deepEqual(result.nav.p,result.b0);assert.equal(result.nav.name,'野原の灯台');assert.ok(result.nav.distance>0);
 for(const width of [844,667]){
  await s.page.setViewportSize({width,height:width===844?390:375});
  await s.page.waitForFunction(()=>document.querySelector('#mmap').dataset.marker==='edge');
  const box=await s.page.locator('#mapGoalText').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width,'Destination label within viewport');
  assert.match(await s.page.locator('#mapGoalText').innerText(),/野原の灯台/);
  await s.page.screenshot({path:out+`NAVIGATION_${width}.png`});
 }
 await s.page.evaluate(()=>{const b=KZ.REG[0].beacons[0];KZ.player.x=b.x-12;KZ.player.z=b.z;});
 await s.page.waitForFunction(()=>document.querySelector('#mmap').dataset.marker==='star');
 assert.match(await s.page.locator('#mapGoalText').innerText(),/東/);
 // Existing tracking contract: a quest in another region must not show a bogus local marker.
 await s.page.evaluate(()=>{KZ.G.track='base';KZ.G.baseLv=0;KZ.G.region=1;});
 await s.page.waitForFunction(()=>document.querySelector('#mmap').dataset.marker==='none');
 assert.match(await s.page.locator('#mapGoalText').innerText(),/風灯の島/);
 await s.page.evaluate(()=>{KZ.G.track='no-such-quest';KZ.G.region=0;});
 await s.page.waitForFunction(()=>KZ.G.track===null);
 assert.equal(s.errors.length,0,s.errors.join('\n'));
 console.log('PASS: first lighthouse, shards, guard, next objective, destination/direction/distance, edge/star, cross-region and stale tracking; 844x390 and 667x375.');
}finally{await s.browser.close();}
