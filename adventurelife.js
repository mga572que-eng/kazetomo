// 地域の支度・魚の朝市・家畜の世話。既存のIDと章フラグは変更しない。
'use strict';
(() => {
  const K=window.KZ,H=K.HOOK,W=World,dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  const coat=DATA.armor.length;
  DATA.armor.push({name:'ゆきぐにの あったかい ふく',def:12,ty:'cloth',r:1,add:true,warm:true,note:'ゆきやまの したく'});
  const init=g=>{g.fishStock=g.fishStock||{};g.adventure=g.adventure||{cold:0,care:{}};g.adventure.care=g.adventure.care||{};};init(K.G);H.load.push(init);
  const oldAppearance=H.appearance;
  const oldTrack=H.track;H.track=()=>K.interior?.cur?{t:'いえの なか。ものを しらべるか、入口から 外へ。',p:null}:oldTrack?oldTrack():null;
  H.appearance=id=>{const ai=K.G.eq[id]?.a||0,wi=K.G.eq[id]?.w||0,a=DATA.armor[ai],colors={cloth:'#668f9b',light:'#a19c83',heavy:'#798797',robe:'#8d6aa8'};return {...(oldAppearance?oldAppearance(id):{}),weaponTint:['#b6aca1','#abb6bd','#f2c56d','#9dcfdf','#b9a6ed'][wi%5],...(K.G.eq[id]?.a?{top:a?.warm?'#bc7350':(ai>6?['#668f9b','#94745e','#658472','#8d6aa8','#ac798b'][ai%5]:colors[a?.ty])||'#798797',shawl:a?.warm?'#efe2c5':undefined,...(a?.ty==='heavy'?{pauldron:'R',wide:1.1,trim:'#ccd4dd'}:a?.ty==='robe'?{robe:true}: {})}: {})};};
  const rows=[
    ['hamaiwashi','ハマイワシ',0,'day',12,[10,22],1,14],['aosuzuki','アオスズキ',0,'any',4,[40,70],2,30],
    ['akakarei','アカカレイ',0,'night',3,[20,40],2,28],['kawamabuna','カワマブナ',1,'day',8,[15,30],1,18],
    ['kirisake','キリサケ',1,'any',4,[40,75],2,38],['ginwakasa','ギンワカサ',1,'night',5,[8,18],1,22],
    ['sorakoaji','ソラコアジ',2,'day',7,[12,24],1,26],['kumonamazu','クモナマズ',2,'night',3,[40,70],3,50],
    ['awatai','アワタイ',3,'day',8,[20,45],2,36],['hikarisaba','ヒカリサバ',3,'night',6,[25,50],2,42],
    ['shinkaihirame','シンカイヒラメ',3,'any',3,[45,85],3,60],['pearluo','シンジュウオ',3,'any',1,[15,30],4,90]
  ];for(const [id,name,r,t,w,size,diff,price] of rows)DATA.fish.push({id,name,r,t,w,size,diff,price,desc:'この ちいきの みずで くらす さかな。あさいちで うれる。'});
  const morning=()=>K.G.tod*24>=5&&K.G.tod*24<10;
  async function market(){const g=K.G;init(g);if(!morning()){await K.say(['あさいちは あさ5じから 10じまで。つった さかなを もってきてね。']);return;}
    const stock=DATA.fish.filter(f=>g.fishStock[f.id]>0);if(!stock.length){await K.say(['つった さかなを しゅるいごとに かいとるよ。これから つった さかなを もってきてね。']);return;}
    const i=await K.menu({title:'さかなの あさいち',items:stock.map(f=>({label:f.name+' ×'+g.fishStock[f.id],sub:(f.price||f.diff*12)+'G / 1ぴき'}))});if(i<0)return;const f=stock[i],n=g.fishStock[f.id];g.fishStock[f.id]=0;g.gold+=n*(f.price||f.diff*12);K.save();K.hud();await K.say([`${f.name}を ${n}ひき うった！`]);}
  H.labels.fishMarket='さかなの あさいち';H.acts.fishMarket=market;
  H.target.push(cand=>{for(const t of K.townLife.TOWNS){if(!['shiomi','minato','awa'].includes(t.key)||t.r!==K.G.region)continue;const s=K.townLife.setupTown(t),p=s?.stalls[0]||s?.market[0];if(p)cand({town:t.key},'fishMarket',p.x,p.z,2.3);}});
  // 既存のツムギの会話を保ち、現在の旅支度の短い会話を追加する。
  const prevTalk=H.talks.tsumugi;
  H.talks.tsumugi=async n=>{if(K.G.region===1&&K.G.flags.c2arrive&&!K.G.adventure.coat){K.G.adventure.coat=1;const bag=K.bal.bag();bag.a[coat]=(bag.a[coat]||0)+1;await K.say([K.nm('ツムギ','きたの ゆきやまは とても さむいよ。これを きて いこう。'),'ゆきぐにの あったかい ふくを もらった。メニューの「そうび」で ソラに きせよう。']);K.save();}return prevTalk?await prevTalk(n):'pass';};
  let warning=0;
  const coldAt=(x,z)=>K.G.region===1&&W.biomeAt(x,z)==='snow';
  const warm=()=>!!DATA.armor[K.G.eq.sora?.a||0]?.warm;
  const rockyRide=()=>{const ref=K.fieldTravel.mountRef();return ref&&['iwanoko','iwagoron'].includes(K.member(ref)?.id);};
  function routeRule(x,z){if(K.G.region!==1||K.interior?.cur)return null;
    if(coldAt(x,z)&&!warm())return 'ゆきやまは さむい！ ミナトの ツムギから ふくを もらい、ソラに そうびしよう。';
    if(z<60&&K.hAt(x,z)>38&&K.G.stamMax<180&&!rockyRide())return 'この やまみちは がんばり9こ（180）が ひつよう。イワノコか イワゴロンに のっても すすめる。';
    if(z<-100&&K.hAt(x,z)>55&&!rockyRide())return 'この ごつごつした みちは イワノコか イワゴロンに のって すすもう。';
    return null;}
  const previousMove=H.routeMove;H.routeMove=(x,z,dt)=>{if(previousMove){const a=previousMove(x,z,dt);x=a.x;z=a.z;}warning=Math.max(0,warning-dt);const rule=routeRule(x,z);if(rule&&!(coldAt(K.player.x,K.player.z)&&!warm()&&z>K.player.z)){if(!warning){K.toast(rule,3500);warning=4;}K.player.vx=K.player.vz=0;return{x:K.player.x,z:K.player.z};}return{x,z};};
  const oldSpeed=H.travelSpeed;H.travelSpeed=s=>{s=oldSpeed?oldSpeed(s):s;const n=W.nAt(K.player.x,K.player.z);if(K.G.region===1&&K.player.z<60&&n[1]<.62&&!rockyRide()&&!K.player.glide)return Math.min(s,1.8);return s;};
  const previousSurface=H.travelStamina;H.travelStamina=s=>{s=previousSurface?previousSurface(s):s;if(K.fieldTravel&&K.fieldTravel.mounted())return 0;if(K.G.region===1&&K.player.z<60&&K.player.climb&&!rockyRide())s+=18;return s;};
  // 雪原の境界に支度の案内。条件はUIでも確認できる。
  H.menu.push(()=>({label:'たびの したく',sub:'ゆき・やま・あさいち',fn:()=>K.say(['ゆきぐにの ふく：ミナトの ツムギに はなし、ソラに そうび。','やまみち：がんばり9こ（180）か、イワノコ・イワゴロン。','きたの たかいやま：あったかい ふくと、イワノコ・イワゴロン。','さかなの あさいち：シオミ・ミナト・アワの里で あさ5じ〜10じ。'])}));
  // 世話係は既存の家畜小屋のそばの安全な地面だけに置く。
  const carers=[],mesh=W.makeMesh(W.human({skin:'#e2b894',hair:'#5a4232',top:'#609069',bottom:'#684832',hat:true,apron:true}),8);let cryT=0;
  H.frame.push((dt)=>{mesh.n=0;if(K.phase!=='field'||K.B.active)return;cryT-=dt;
    for(const t of K.townLife.TOWNS){if(t.r!==K.G.region||!t.farm)continue;const s=K.townLife.setupTown(t);if(!s)continue;
      for(let i=0;i<s.pens.length;i++){let c=carers.find(c=>c.id===t.key+i);if(!c){const a=K.townLife.near(t.r,s.pens[i],3,6,i+919,1)[0];if(a){c={...a,r:t.r,id:t.key+i,animals:s.hens.filter(e=>e.home===s.pens[i])};carers.push(c);}}if(!c||dist(c,K.player)>70)continue;const yaw=Math.atan2(K.player.x-c.x,K.player.z-c.z);mesh.set(mesh.n++,c.x,K.surfaceAt(c.x,c.z,K.hAt(c.x,c.z)+2),c.z,1,yaw);
        for(const e of c.animals)if(dist(e,K.player)<8&&cryT<=0){Music.sfx(e.cow?'cow':e.sheep?'sheep':e.goat?'goat':'hen');cryT=6;break;}}
    }});
  H.target.push(cand=>{for(const c of carers)if(c.r===K.G.region)cand(c,'animalCare',c.x,c.z,2.5);});H.labels.animalCare='しいくがかりと はなす';
  H.acts.animalCare=async c=>{const i=await K.menu({title:'しいくがかり',items:[{label:'えさを あげる',sub:'きのみ1こ',disabled:!(K.G.inv.mi>0)},{label:'はなす'}]});if(i===0){if(!(K.G.inv.mi>0))return;const day=Math.floor(K.G.play/600);if(K.G.adventure.care[c.id]===day){await K.say(['きょうは もう えさを あげたよ。ありがとう！']);return;}K.G.inv.mi--;K.G.adventure.care[c.id]=day;K.gain('pan',1);Music.sfx(c.animals[0]?.goat?'goat':'hen');K.save();await K.say(['ごはんを あげた！ おれいに パンを 1こ もらった。']);}else if(i===1)await K.say([K.nm('しいくがかり','ごはんと みず、こやの そうじが まいにちの しごとだよ。いきものに ちかづくときは ゆっくりね。')]);};
  K.adventureLife={coat,market,morning,routeRule,coldAt,warm,rockyRide,carers,rows};
  // 小さな登山用の尾根。既存の町・目標・プレイヤーブロックを避ける。
  const oldRegion=W.region;W.setRegion(1);
  const avoid=[...K.REG[1].houses,...(K.extraHouses||[]).filter(a=>a.r===1),...Object.values(K.REG[1]).filter(a=>a&&Number.isFinite(a.x)&&Number.isFinite(a.z)),...K.fieldExplore.sites.filter(a=>a.r===1),...K.fieldTravel.features.filter(a=>a.r===1),...(K.extraAreas||[]).filter(a=>a.rg===1)];
  let ridge=null;
  for(let x=-156;x<-48&&!ridge;x+=12)for(let z=-100;z<-30&&!ridge;z+=12){const center={x,z};if(avoid.some(a=>dist(a,center)<(a.r||20)+38))continue;let used=false;W.Blocks.each(1,key=>{const [a,,b]=key.split(',').map(Number);if(Math.abs(a-x)<22&&Math.abs(b-z)<22)used=true;});if(!used&&K.hAt(x,z)>20)ridge={x,z,height:K.hAt(x,z)+18};}
  if(ridge){W.addTerrainPatches(1,[{kind:'cliff',...ridge,radius:20}]);K.adventureLife.ridge=ridge;
    for(const a of [...K.REG[1].trees,...K.REG[1].rocks])if(dist(a,ridge)<22){a.state='gone';a.t=-1e9;}
    H.target.push(cand=>{if(K.G.region===1)cand(ridge,'mountainGuide',ridge.x,ridge.z+22,4);});H.labels.mountainGuide='やまみちの あんない';H.acts.mountainGuide=()=>K.say(['この さきは けわしい やまみち。がんばりを ふやし、イワノコか イワゴロンを なかまに しよう。','ゆきの ところへ いくなら、ミナトで あったかい ふくを もらって きていこう。']);}
  W.setRegion(oldRegion);
  const focus=document.createElement('div');focus.id='talkFocus';focus.style.cssText='position:fixed;left:50%;bottom:105px;transform:translateX(-50%);background:#172f3feb;color:#fff;border:2px solid #ffe288;padding:6px 14px;border-radius:8px;z-index:25;pointer-events:none;font-size:13px';document.body.append(focus);
  H.frame.push(()=>{const n=H.talking?K.NPCS.find(n=>n.id===H.talking):K.target?.type==='npc'?K.target.o:null;focus.hidden=!n||K.B.active;focus.textContent=n?(H.talking?'はなしている：':'はなす あいて：')+(n.nm||DATA.cast[n.id]?.name||'ひと'):'';});
  const frost=document.createElement('div');frost.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:8;box-shadow:inset 0 0 90px #b9e6ffa0';frost.innerHTML='<span style="position:absolute;left:16px;top:90px;background:#183e60cc;color:white;padding:5px 10px;font-size:12px;border-radius:5px"></span>';document.body.append(frost);
  H.frame.push(()=>{frost.hidden=K.phase!=='field'||K.B.active||!coldAt(K.player.x,K.player.z)||!!K.interior?.cur;frost.firstChild.textContent=warm()?'❄ さむい ちいき・ぼうかんふく あり':'❄ さむい！ あったかい ふくを きよう';});
})();
