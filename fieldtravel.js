// 川・橋・崖の寄り道と、道の駅・馬・仲間モンスター・手こぎ舟。
'use strict';
(() => {
  const K=window.KZ; if(!K||typeof World==='undefined'||!K.fieldExplore)return;
  const W=World,B=W.Blocks,H=K.HOOK,features=[],stops=[];
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  function guards(r){const R=K.REG[r];return [...(R.houses||[]),...(R.beacons||[]),...(R.lh||[]),...(K.extraHouses||[]).filter(h=>h.r===r),...(K.NPCS||[]).filter(n=>n.r===r),...Object.values(R).filter(a=>a&&Number.isFinite(a.x)&&Number.isFinite(a.z)),...(K.extraAreas||[]).filter(a=>a.rg===r).map(a=>({...a,pad:(a.r||20)+8})),...(K.townLife.TOWNS||[]).filter(t=>t.r===r).map(t=>({...t.at(),pad:35})),...K.fieldExplore.sites.filter(s=>s.r===r),...(DATA.shrines||[]).filter(s=>s.r===r&&s.pos).map(s=>s.pos)].filter(Boolean);}
  function plot(r,rad,want){let best;const protectedPlaces=guards(r);for(let x=-180;x<=180;x+=8)for(let z=-160;z<=180;z+=8){if(protectedPlaces.some(a=>dist(a,{x,z})<rad+(a.pad||14)))continue;let min=Infinity,max=-Infinity,free=true;for(let dx=-rad;dx<=rad;dx+=6)for(let dz=-rad;dz<=rad;dz+=6){const y=K.hAt(x+dx,z+dz);min=Math.min(min,y);max=Math.max(max,y);if(K.blocked(x+dx,z+dz,y))free=false;}if(!free||min<2||max-min>5)continue;const score=max-min+dist({x,z},want)*.03;if(!best||score<best.score)best={x,z,score};}return best;}
  const startRegion=W.region;
  W.setRegion(1);const river=plot(1,34,{x:55,z:80});
  if(river){const bankHeight=Math.max(K.hAt(river.x-13,river.z),K.hAt(river.x+13,river.z));W.setTerrainPatches(1,[{kind:'river',x:river.x,z:river.z,width:3,length:30,height:-2.5}]);
    const y=Math.ceil(bankHeight),put=(x,Y,z,t)=>{if(!B.has(x,Y,z))B.set(x,Y,z,t,true,1);};
    for(let x=-14;x<=14;x++)for(let z=-2;z<=2;z++){const X=river.x+x,Z=river.z+z,ground=Math.floor(K.hAt(X+.5,Z+.5));
      // 両端は一段ずつ上がれる。橋の下は水が通る。
      const deck=Math.min(y,Math.max(ground, y-Math.max(0,Math.abs(x)-10)));
      put(X,deck,Z,0);if(Math.abs(z)===2&&Math.abs(x)<12&&x%3===0){put(X,deck+1,Z,5);put(X,deck+2,Z,5);}
    }
    features.push({id:'river_bridge',r:1,...river,y:y+1,name:'せせらぎの はし',text:'かわの おとを ききながら、 はしを わたってみよう。'});
  }
  W.setRegion(0);const cliff=plot(0,18,{x:-60,z:-50});
  if(cliff){const height=K.hAt(cliff.x,cliff.z)+7;W.setTerrainPatches(0,[{kind:'cliff',x:cliff.x,z:cliff.z,radius:12,height}]);
    // 西側の段で上れる展望台。崖側へ押し出す処理はしない。
    for(let x=-15;x<=-4;x++){const top=Math.ceil(height-Math.max(0,-x-5));for(let z=-1;z<=1;z++){const X=cliff.x+x,Z=cliff.z+z;for(let y=Math.floor(K.hAt(X+.5,Z+.5));y<top;y++)if(!B.has(X,y,Z))B.set(X,y,Z,1,true,0);}}
    features.push({id:'cliff_view',r:0,...cliff,y:height,name:'かぜの がけ',text:'がけの うえから、 うみと しまを ながめられる。 ふちには きをつけよう。'});
  }
  // 地形に埋まる木・岩と、橋の通路を塞ぐ自然物は既存IDを残して非表示にする。
  function clearRoutes(){const old=W.region;for(const f of features.filter(f=>['river_bridge','cliff_view'].includes(f.id))){W.setRegion(f.r);const R=K.REG[f.r],near=p=>f.id==='river_bridge'?Math.abs(p.x-f.x)<17&&Math.abs(p.z-f.z)<34:dist(p,f)<18;
    for(const p of [...(R.trees||[]),...(R.rocks||[])])if(near(p)){p.state='gone';p.t=-1e9;}
  }W.setRegion(old);}
  clearRoutes();H.load.push(clearRoutes);
  W.setRegion(startRegion);
  const init=g=>{g.travel ||= {};g.travel.stops ||= {};};init(K.G);
  for(const s of K.fieldExplore.sites.filter(s=>s.kind==='camp')){
    const stop={id:'rest_'+s.id,r:s.r,x:s.x+5,z:s.z+2,name:['うみかぜの みちのえき','かわみちの みちのえき','そらの みちのえき','あわの みちのえき'][s.r]};
    W.setRegion(s.r);stop.y=K.hAt(stop.x,stop.z);stops.push(stop);
    for(const x of [3,7])for(let y=Math.min(Math.floor(K.hAt(s.x+x+.5,s.z+4.5)),Math.floor(stop.y));y<Math.floor(stop.y)+4;y++){if(!B.has(s.x+x,y,s.z+4))B.set(s.x+x,y,s.z+4,5,true,s.r);}
    for(let x=3;x<=7;x++)for(let z=3;z<=5;z++){const y=Math.floor(stop.y)+4;if(!B.has(s.x+x,y,s.z+z))B.set(s.x+x,y,s.z+z,3,true,s.r);}
  }
  W.setRegion(startRegion);
  // 本編の船着き場の横に、手こぎ舟の小さな桟橋を追加。
  for(const r of [0,1]){W.setRegion(r);const p=K.REG[r].pier;if(!p)continue;const x=Math.round(p.x),z=Math.round(p.z)-7;
    const put=(X,Z)=>{const y=Math.max(0,Math.min(1,Math.floor(K.hAt(X+.5,Z+.5))));if(!B.has(X,y,Z))B.set(X,y,Z,0,true,r);};
    for(let a=1;a<=12;a++)for(let b=-1;b<=1;b++)put(x+a,z+b);
    for(let b=0;b<=8;b++)for(let a=-1;a<=1;a++)put(x+12+a,z+b);
    const dock={id:'row_dock_'+r,r,x:x+12,z:z+6,y:1,dock:true,name:'てこぎぶねの ふなつきば'};stops.push(dock);
    features.push({...dock,text:'ここから てこぎぶねで、 うみべや かわを まわってみよう。'});
  }
  W.setRegion(startRegion);
  let ride=null;const mons={};
  function inside(){return !!K.lhDungeon?.here()||!!K.interior?.cur;}
  function mounted(){if(!ride)return false;if(ride.r!==K.G.region||inside()||K.player.glide||K.player.climb||K.phase!=='field'||(ride.ref&&(!K.G.team.includes(ride.ref)||!(K.member(ride.ref)?.hp>0)))){ride=null;return false;}if(ride.kind==='horse'&&(K.G.region>1||K.player.swim)){ride=null;return false;}return true;}
  const water=()=>[0,1].includes(K.G.region)&&K.hAt(K.player.x,K.player.z)<-.8&&K.player.y<1.6;
  function board(kind,ref){if(!['horse','boat','mon'].includes(kind))return false;if(inside()||K.phase!=='field'||K.player.glide)return false;
    if(kind==='horse'&&(!K.G.travel.horse||K.G.region>1||K.player.swim))return false;
    if(kind==='boat'&&(!K.G.travel.boat||!water()))return false;
    if(kind==='mon'&&(!ref||!K.G.team.includes(ref)||K.member(ref)?.kind!=='mon'||!(K.member(ref)?.hp>0)))return false;
    ride={kind,ref,r:K.G.region};return true;}
  function horseGeo(){const g=W.Geo(),brown=W.solid([.48,.27,.13]),dark=W.solid([.2,.12,.08]);W.ico(g,.75,[0,1,0],brown,0,0,.65);W.seg(g,[0,1.2,.35],[0,1.9,.7],.22,.15,6,brown);W.ico(g,.28,[0,1.9,.86],brown,0,0,.6);for(const x of [-.34,.34])for(const z of [-.42,.42])W.seg(g,[x,.1,z],[x,1,z],.08,.11,4,dark);W.seg(g,[0,1.1,-.55],[0,.5,-.9],.05,.025,4,dark);W.ico(g,.22,[0,1.63,.67],dark,0,0,.4);return g;}
  function boatGeo(){const g=W.Geo(),wood=[.5,.29,.12,0],dark=W.solid([.27,.14,.07]);
    const tri=(a,b,c,col)=>{const u=b.map((v,i)=>v-a[i]),v=c.map((q,i)=>q-a[i]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],l=Math.hypot(...n)||1;for(const p of [a,b,c]){g.p.push(...p);g.n.push(...n.map(x=>x/l));g.c.push(...col);}};
    const rim=[[0,1.8],[.65,1],[.7,-1],[0,-1.6],[-.7,-1],[-.65,1]];
    for(let i=0;i<rim.length;i++){const a=rim[i],b=rim[(i+1)%rim.length],lo=[a[0]*.75,-.16,a[1]*.8],next=[b[0]*.75,-.16,b[1]*.8],hi=[a[0],.35,a[1]],nh=[b[0],.35,b[1]];
      tri([0,.16,0],[lo[0],.16,lo[2]],[next[0],.16,next[2]],wood);tri(lo,next,hi,wood);tri(next,nh,hi,wood);tri(hi,next,lo,wood);tri(hi,nh,next,wood);W.seg(g,hi,nh,.035,.035,4,dark);
    }
    W.seg(g,[-.5,.16,0],[.5,.16,0],.09,.09,4,dark);
    for(const side of [-1,1])W.seg(g,[side*.55,.25,0],[side*1.2,.02,-.85],.025,.05,4,dark);
    return g;
  }
  const horse=W.makeMesh(horseGeo(),5),boat=W.makeMesh(boatGeo(),3);
  H.frame.push((dt,time)=>{horse.n=boat.n=0;for(const s of stops)if(s.r===K.G.region&&s.r<2&&dist(s,K.player)<70){if(s.dock)boat.set(boat.n++,s.x+2.5,-.12,s.z+2,1,0);else horse.set(horse.n++,s.x+4,s.y,s.z+2,1,Math.PI/2);}
    for(const m of Object.values(mons))m.n=0;
    if(!mounted())return;const p=K.player;
    if(ride.kind==='boat'){if(!water()){ride=null;return;}boat.set(boat.n++,p.x,-.12+Math.sin(time*2)*.035,p.z,1,p.yaw);}
    else if(ride.kind==='horse')horse.set(horse.n++,p.x,p.y,p.z,1,p.yaw);
    else {const m=K.member(ride.ref),mesh=mons[m.id]||(mons[m.id]=W.makeMesh(W.speciesGeo(DATA.species[m.id]),1));mesh.set(0,p.x,p.y,p.z,1.35,p.yaw);mesh.n=1;}
  });
  H.load.push(g=>{init(g);const wasBoat=ride?.kind==='boat';ride=null;if(wasBoat&&g.pos){Object.assign(K.player,g.pos,{vx:0,vy:0,vz:0,swim:false,glide:false});}horse.n=boat.n=0;for(const m of Object.values(mons))m.n=0;});
  const priorSavePosition=H.savePosition;
  H.savePosition=()=>{if(!mounted()||ride.kind!=='boat')return priorSavePosition?priorSavePosition():null;
    const p=K.player,good=p.good;if(good?.r===K.G.region&&K.hAt(good.x,good.z)>.2&&!K.blocked(good.x,good.z,good.y))return {...good};
    const dock=stops.filter(s=>s.r===K.G.region&&s.dock).sort((a,b)=>dist(a,p)-dist(b,p))[0];
    const at=dock||K.REG[K.G.region].pier;return {x:at.x+.5,z:at.z+.5,y:K.surfaceAt(at.x+.5,at.z+.5,99)};
  };
  const prevSpeed=H.travelSpeed;H.travelSpeed=base=>{base=prevSpeed?prevSpeed(base):base;if(!mounted())return base;if(ride.kind==='boat')return water()?8.5:base;return Math.min(12,base*(ride.kind==='horse'?1.65:1.4));};
  const prevSurface=H.travelSurface;H.travelSurface=ground=>{ground=prevSurface?prevSurface(ground):ground;return mounted()&&ride.kind==='boat'&&water()?Math.max(.05,ground):ground;};
  const prevStamina=H.travelStamina;H.travelStamina=amount=>mounted()?0:prevStamina?prevStamina(amount):amount;
  async function rideMenu(){const items=[{label:'あるく',kind:'walk'},{label:'うまに のる',kind:'horse',disabled:!K.G.travel.horse||K.G.region>1},{label:'ふねに のる（水のうえ）',kind:'boat',disabled:!K.G.travel.boat||!water()}];
    for(const ref of K.G.team){const m=K.member(ref);if(m?.kind==='mon'&&m.hp>0)items.push({label:`${DATA.species[m.id].name}に のる`,kind:'mon',ref});}
    const n=await K.menu({title:'のりもの',items});if(n<0)return;const a=items[n];if(a.kind==='walk'){ride=null;return;}if(!board(a.kind,a.ref))K.toast('ここでは のれない。 そとで ためしてみよう。',1800);
  }
  H.menu.push(()=>({label:'のりもの',sub:mounted()?`いま：${ride.kind==='horse'?'うま':ride.kind==='boat'?'ふね':'なかま'}`:'うま・なかま・ふね',fn:rideMenu}));
  H.target.push(cand=>{for(const s of stops)if(s.r===K.G.region&&Math.abs(K.player.y-s.y)<3)cand(s,'roadStop',s.x+.5,s.z+.5,2.8);for(const f of features)if(f.r===K.G.region&&Math.abs(K.player.y-f.y)<4)cand(f,'roadView',f.x,f.z,2.5);});
  H.labels.roadStop=t=>t.o.name;H.labels.roadView=t=>t.o.name+'を ながめる';H.acts.roadView=async f=>K.say([f.text]);
  H.acts.roadStop=async s=>{init(K.G);K.G.travel.stops[s.id]=1;const i=await K.menu({title:s.name,items:[{label:'ひとやすみ（30ゴールド）'},{label:'パンを かう（20ゴールド）'},{label:'うま・ふねを かりる（むりょう）',disabled:s.r>1},{label:'みちの はなし'},{label:'やめる'}]});
    if(i===0||i===1){const cost=i===0?30:20;if(K.G.gold<cost){K.toast('おかねが たりない',1200);return;}K.G.gold-=cost;if(i===1)K.gain('pan',1);else{for(const m of [...K.G.party,...K.G.mons]){m.hp=m.st.hp;m.mp=m.st.mp;}K.G.stam=K.G.stamMax;}K.save();K.hud();}
    else if(i===2&&s.r<2){K.G.travel.horse=1;K.G.travel.boat=1;K.save();await K.say(['うまと てこぎぶねを かりられるように なった。','メニューの「のりもの」で えらぼう。 ふねは みずの うえで のれる。','この ちいきの なかで つかえる。 たびの ふねや しょうの すすみは そのままだ。']);}
    else if(i===3){const nearby=K.fieldExplore.sites.filter(a=>a.r===s.r&&!K.G.fieldExplore?.[a.id]).sort((a,b)=>dist(a,s)-dist(b,s))[0];await K.say([nearby?`このあたりには「${nearby.name}」が あるよ。 いしや ランタンを さがしてごらん。`:'このあたりの よりみちは、 もう ぜんぶ みつけたんだね。']);}
  };
  H.mapMarks.push((r,pos)=>stops.filter(s=>s.r===r&&K.G.travel.stops[s.id]).map(s=>`<span class="mk lit" style="${pos(s.x,s.z)}" title="${s.name}">♧</span>`));
  K.fieldTravel={features,stops,board,dismount:()=>{ride=null;for(const m of Object.values(mons))m.n=0;},mounted,offset:()=>mounted()?(ride.kind==='boat'?-.4:.9):0,mountRef:()=>mounted()?ride.ref:null,water};
})();
