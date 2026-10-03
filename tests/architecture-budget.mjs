// Construction budget and player-built block retention in an isolated PC browser.
import assert from 'node:assert/strict';
import {boot,idle} from './lib.mjs';
const s=await boot({render:false});
try {
 const rows=[];
 for(let r=0;r<4;r++) {
  await s.page.evaluate(r=>KZ.travel(r,KZ.REG[r].town.x+2,KZ.REG[r].town.z+4),r);await idle(s.page);
  const result=await s.page.evaluate(async r=>{
   const K=KZ,B=World.Blocks,rows=[];
   const snap=label=>{let visible=0,hidden=0,protectedCount=0;B.each(r,(k,t,p)=>{if(t===19)hidden++;else visible++;if(p)protectedCount++;});const placed=B.placed(r).slice().sort();rows.push({r,label,visible,hidden,protectedCount,placed:placed.length});return placed;};
   const houses=K.interior.houses(r);
   const room=K.interior.ROOM[r], playerCell={x:room.x+2,y:room.y+7,z:room.z+2};
   if(houses.length){B.rm(playerCell.x,playerCell.y,playerCell.z,r);B.set(playerCell.x,playerCell.y,playerCell.z,8,false,r);}
   const initial=snap('region loaded with player-block fixture');
   // Count geometry only: skip cosmetic fades in this isolated context, not runtime files.
   const fade=K.fade,wait=K.wait;K.fade=async()=>{};K.wait=async()=>{};
   try{for(const h of houses){await K.interior.enter(h);snap(`house:${h.id}`);await K.interior.leave();}}
   finally{K.fade=fade;K.wait=wait;}
   for(const d of K.lhDuns.filter(d=>d.r===r)){K.lhDungeon.reset(d);snap(`lighthouse:${d.i}`);}
   const final=B.placed(r).slice().sort();
   return {rows,initial,final,houses:houses.length,playerRetained:!houses.length||(B.get(playerCell.x,playerCell.y,playerCell.z)===8&&!B.isProt(playerCell.x,playerCell.y,playerCell.z))};
  },r);
  assert.deepEqual(result.final,result.initial,`region ${r} construction must not add player-save blocks`);
  assert.equal(result.playerRetained,true,`region ${r} house rebuild must retain the player's saved block`);
  rows.push(...result.rows);
 }
 const retention=await s.page.evaluate(()=>{
  const d=KZ.lhDuns[0],B=World.Blocks;World.setRegion(d.r);const x=d.x+2,y=d.y+13,z=d.z-3;
  B.rm(x,y,z,d.r);B.set(x,y,z,8,false,d.r);
  const before=B.placed(d.r).slice().sort();KZ.lhDungeon.reset(d);
  return {same:JSON.stringify(before)===JSON.stringify(B.placed(d.r).slice().sort()),type:B.get(x,y,z),protected:B.isProt(x,y,z)};
 });
 assert.equal(retention.same,true);assert.equal(retention.type,8);assert.equal(retention.protected,false);
 for(const row of rows)assert(row.visible<=24000,`${row.r}/${row.label}: ${row.visible} > 24000`);
 assert.equal(s.errors.length,0,s.errors.join('\n'));
 console.log(JSON.stringify(rows,null,2));console.log('PASS: all constructed regions below 24000 visible blocks; protected construction excluded from placed saves; dungeon rebuild retains player block');
}finally{await s.browser.close();}
