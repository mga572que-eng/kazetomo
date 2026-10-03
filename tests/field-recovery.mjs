// 本体の関数を取り出し、回復の消費・保存・対象判定を検査する。
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const src=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
const member=(hp=100,mp=40)=>({hp,mp,st:{hp:100,mp:40}});
let P=[member(),member()],saved=null,saves=0;
const ctx={G:{inv:{ganbari:2,stew:2},stam:100,stamMax:100},DATA:{items:{ganbari:{stam:true},stew:{healAll:true}}},player:{tired:false},allMembers:()=>P,Music:{sfx:()=>{}},hud:()=>{},save:()=>{saves++;saved=JSON.parse(JSON.stringify({G:ctx.G,P}));}};
vm.createContext(ctx);
for(const [a,b] of [['function fieldSkillUseful','function fieldSkillTargets'],['function useSharedRecoveryField','async function itemMenu']]){
 const start=src.indexOf(a),end=src.indexOf(b,start);assert(start>=0&&end>start);vm.runInContext(src.slice(start,end),ctx);
}
assert.equal(ctx.useSharedRecoveryField('ganbari'),false);assert.equal(ctx.G.inv.ganbari,2);assert.equal(saves,0);
ctx.G.stam=0;ctx.player.tired=true;assert.equal(ctx.useSharedRecoveryField('ganbari'),true);assert.equal(ctx.G.stam,100);assert.equal(ctx.player.tired,false);assert.equal(ctx.G.inv.ganbari,1);assert.equal(saved.G.stam,100);
assert.equal(ctx.useSharedRecoveryField('stew'),false);assert.equal(ctx.G.inv.stew,2);
P[1].hp=0;P[0].mp=0;assert.equal(ctx.useSharedRecoveryField('stew'),true);assert.equal(ctx.G.inv.stew,1);assert(P.every(m=>m.hp===100&&m.mp===40));assert(saved.P.every(m=>m.hp===100&&m.mp===40));
assert.equal(ctx.useSharedRecoveryField('stew'),false);assert.equal(ctx.G.inv.stew,1);
ctx.G.inv.stew=0;P[0].hp=1;assert.equal(ctx.useSharedRecoveryField('stew'),false);assert.equal(P[0].hp,1);assert.equal(ctx.useSharedRecoveryField('missing'),false);
assert.equal(ctx.fieldSkillUseful({heal:30},member()),false);assert.equal(ctx.fieldSkillUseful({heal:30},member(60)),true);assert.equal(ctx.fieldSkillUseful({heal:30},member(0)),false);
assert.equal(ctx.fieldSkillUseful({revive:.5},member(0)),true);assert.equal(ctx.fieldSkillUseful({revive:.5},member()),false);
assert.equal(ctx.fieldSkillUseful({cure:true},{...member(),ail:'poison'}),true);assert.equal(ctx.fieldSkillUseful({cure:true},{...member(),sleep:2}),true);assert.equal(ctx.fieldSkillUseful({cure:true},member()),false);
console.log('PASS: field recovery preserves full-state inventory, saves restored values, and filters healing/revival/cure targets');
const attrs={},bar={dataset:{},style:{setProperty:()=>{}},classList:{toggle:()=>{},remove:()=>{}},setAttribute:(k,v)=>{attrs[k]=String(v);},innerHTML:''};ctx.$=()=>bar;
const start=src.indexOf('function stamHud()'),end=src.indexOf('\nfunction ',start+1);assert(start>=0&&end>start);vm.runInContext(src.slice(start,end),ctx);
for(const max of [100,140,300]){ctx.G.stamMax=max;ctx.G.stam=max/2;ctx.stamHud();assert.equal(attrs['aria-valuemax'],String(max));assert.equal(attrs['aria-valuenow'],String(max/2));assert(bar.innerHTML.includes(`--stam-unit:${2000/max}%`));assert(bar.innerHTML.includes('width:50%'));}
console.log('PASS: stamina capacity, current value, fill ratio and 20-point divisions stay consistent');
