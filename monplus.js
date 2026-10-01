// ともしびアイランド — なかまモンスターせんようかシステム (monplus.js)
// せんようそうび（くびわ・おまもり・かくいしなど）・なつきどかくせい・にんげん×モンスターきずなれんけいわざ・ステータス/UIかくちょう
'use strict';
(() => {
  const K = window.KZ; if (!K) return;
  const H = K.HOOK, G = () => K.G, who = K.who, nm = K.nm, R = Math.random;

  // ---------------- 1. セーブデータのしょきかとごかんせいかくほ ----------------
  const initialize = g => {
    g.monEq = g.monEq && typeof g.monEq === 'object' && !Array.isArray(g.monEq) ? g.monEq : {};       // { [uid]: 'm_collar_wata' } なかまモンスターのそうびひん
    g.monAwake = g.monAwake && typeof g.monAwake === 'object' && !Array.isArray(g.monAwake) ? g.monAwake : {}; // { [uid]: 1 } なつきど100かくせいフラグ
    g.inv = g.inv || {};
  };
  H.load.push(initialize); H.init.push(initialize); initialize(G());

  // ---------------- 2. モンスターせんようそうびデータ ----------------
  // しゅぞく・けいとう・アーキタイプにおうじたせんようぐ
  DATA.monGear = {
    m_collar_wata: {
      name: 'わたげのくびわ', arch: ['fluff'],
      desc: 'かいふくわざのこうかりょう +30%。 まいターン HP 5% かいふく。',
      price: 1200, sell: 480,
      eff: { healUp: 0.3, regen: 0.05 }
    },
    m_amulet_rock: {
      name: 'がんのおまもり', arch: ['quad', 'golem'], type: ['earth'],
      desc: 'ぼうぎょ +25。',
      price: 1500, sell: 600,
      eff: { def: 25, cut: 0.15 }
    },
    m_bell_wave: {
      name: 'なみしぶきのすず', arch: ['blob', 'fish'], type: ['water'],
      desc: 'しょうひMP −20%。',
      price: 1600, sell: 640,
      eff: { mpSave: 0.2, waterPow: 0.2 }
    },
    m_ring_star: {
      name: 'ほしくずのリング', arch: ['sprite'], type: ['light', 'dark'],
      desc: 'すばやさ +15。 かいしんりつ +10%。',
      price: 2200, sell: 880,
      eff: { spd: 15, crit: 0.1 }
    },
    m_feather_sky: {
      name: 'てんしょうのかざきりはね', arch: ['bird'], type: ['wind'],
      desc: 'すばやさ +25。 せんせいこうどう。',
      price: 2800, sell: 1120,
      eff: { spd: 25, first: 0.12 }
    },
    m_core_ancient: {
      name: 'こだいのかくいし', arch: ['golem'],
      desc: 'さいだいHP +60、ぼうぎょ +20。',
      price: 3600, sell: 1440,
      eff: { hp: 60, def: 20, immuneAil: true }
    },
    m_leaf_sacred: {
      name: 'せいじゅのわかば', arch: ['plant'], type: ['grass'],
      desc: 'みかたぜんいんが まいターン HP 3% かいふく。',
      price: 3200, sell: 1280,
      eff: { aura: 0.03, grassPow: 0.2 }
    },
    m_pearl_abyss: {
      name: 'しんかいのくろしんじゅ', arch: ['fish', 'blob'],
      desc: 'ぜんのうりょく +10。',
      price: 4500, sell: 1800,
      eff: { allStat: 10, resistSea: 0.5 }
    },
    m_ribbon_kizuna: {
      name: 'きずなのリボン', all: true,
      desc: 'なつきどのじょうしょうが 2ばい。',
      price: 2000, sell: 800,
      eff: { expUp: 0.15, bondUp: 2 }
    }
  };

  // かくしゅショップ・アイテムていぎにとうろく
  for (const [k, v] of Object.entries(DATA.monGear)) {
    DATA.items[k] = { name: v.name, price: v.price, sell: v.sell, cat: 'mat', desc: v.desc, isMonGear: true };
  }
  H.shopExtra = (prev => r => [...(prev ? prev(r) : []), ...(r === 0 ? ['m_collar_wata', 'm_ribbon_kizuna'] : r === 1 ? ['m_amulet_rock', 'm_bell_wave', 'm_leaf_sacred'] : r === 2 ? ['m_ring_star', 'm_feather_sky'] : ['m_core_ancient', 'm_pearl_abyss'])])(H.shopExtra);

  // そうびてきせいはんてい
  function canEquipMon(m, gKey) {
    const g = DATA.monGear[gKey]; if (!g) return false;
    if (g.all) return true;
    const S = DATA.species[m.id]; if (!S) return false;
    if (g.arch && g.arch.includes(S.arch)) return true;
    if (g.type && g.type.includes(S.type)) return true;
    return false;
  }

  // ---------------- 3. にんげん × モンスター きずなれんけいわざ ----------------
  // パーティにたいしょうのモンスターしゅぞくとなつきど50いじょうのなかまがいるときはつどうかのう
  const MON_COMBOS = [
    {
      id: 'cb_sora_wata', hu: 'sora', arch: 'fluff',
      name: 'ホムラぽこぽこ', mp: 7, tg: 'enemies', power: 2.2, type: 'fire',
      desc: 'ソラ＋わたげぞく：ほのおをまとっためんもうでぜんたいこうげき＋みかたぜんいんしょうかいふく'
    },
    {
      id: 'cb_mio_mizu', hu: 'mio', arch: 'blob',
      name: 'ミナモぷるぷるわ', mp: 8, tg: 'party', heal: 50, healPct: 0.3, cure: true, type: 'water',
      desc: 'ミオ＋スライムぞく：うつくしいうたときよらかなみずでみかたぜんたいをだいかいふく・ちりょう'
    },
    {
      id: 'cb_riku_iwa', hu: 'riku', arch: 'quad',
      name: 'イワネたいらんつき', mp: 9, tg: 'enemy', power: 4.4, type: 'earth',
      desc: 'リク＋よつあし/がんせきぞく：だいちをわりきょがんとともにてき1からだをつらぬくごうげき'
    },
    {
      id: 'cb_sana_hoshi', hu: 'sana', arch: 'sprite',
      name: 'せいやのアカリまい', mp: 10, tg: 'enemies', power: 2.4, type: 'light',
      desc: 'サナ＋せいれいぞく：ぎんがのかがやきでぜんたいはじゃこうげき＋みかたぜんいんのかいしんりつ+20%'
    },
    {
      id: 'cb_haru_taka', hu: 'haru', arch: 'bird',
      name: 'てんしょうカザネあらし', mp: 10, tg: 'enemies', power: 2.3, type: 'wind', buff: 'spd',
      desc: 'ハル＋とりぞく：てんくうのぼうふうをよびてきぜんたいこうげき＋みかたのすばやさ2ばい'
    },
    {
      id: 'cb_kaito_puku', hu: 'kaito', arch: 'fish',
      name: 'だいうずミナモうち', mp: 11, tg: 'enemy', power: 4.8, type: 'water',
      desc: 'カイト＋ぎょぞく：きょだいいかりとおおなみをたたきこむたんたいちょうぜつはかいだげき'
    }
  ];

  for (const c of MON_COMBOS) {
    DATA.skills[c.id] = { ...c, verb: 'くりだした', fx: c.type || 'slash' };
  }

  // ---------------- 4. ステータスけいさんフック (HOOK.calc) ----------------
  H.calc.push((m, st, mul, pas, extra) => {
    if (m.kind !== 'mon') return;
    const g = G();

    // ① なつきど（bond）によるきほんそこあげ
    const bond = m.bond || 0;
    if (bond >= 50) {
      mul.hp = (mul.hp || 0) + 0.05;
      mul.atk = (mul.atk || 0) + 0.05;
      mul.def = (mul.def || 0) + 0.05;
      mul.spd = (mul.spd || 0) + 0.05;
    }
    if (bond >= 100) {
      mul.hp = (mul.hp || 0) + 0.05;
      mul.atk = (mul.atk || 0) + 0.05;
      mul.def = (mul.def || 0) + 0.05;
      mul.spd = (mul.spd || 0) + 0.05;
      pas.crit = (pas.crit || 0) + 0.05;
    }

    // ② かくせいボーナス (g.monAwake)
    if (g.monAwake && g.monAwake[m.uid]) {
      mul.hp = (mul.hp || 0) + 0.15;
      mul.mp = (mul.mp || 0) + 0.15;
      mul.atk = (mul.atk || 0) + 0.10;
      mul.def = (mul.def || 0) + 0.10;
      pas.regen = (pas.regen || 0) + 0.03; // まいターンHP3%じどうかいふく
    }

    // ③ せんようそうびのこうかはんえい
    const eqKey = g.monEq && g.monEq[m.uid];
    if (eqKey && DATA.monGear[eqKey]) {
      const gEff = DATA.monGear[eqKey].eff || {};
      if (gEff.hp) st.hp += gEff.hp;
      if (gEff.def) st.def += gEff.def;
      if (gEff.spd) st.spd += gEff.spd;
      if (gEff.allStat) {
        st.hp += gEff.allStat;
        st.mp += gEff.allStat;
        st.atk += gEff.allStat;
        st.def += gEff.allStat;
        st.spd += gEff.allStat;
      }
      if (gEff.healUp) pas.healUp = (pas.healUp || 0) + gEff.healUp;
      if (gEff.regen) pas.regen = (pas.regen || 0) + gEff.regen;
      if (gEff.aura) pas.aura = (pas.aura || 0) + gEff.aura;
      if (gEff.crit) pas.crit = (pas.crit || 0) + gEff.crit;
      if (gEff.mpSave) pas.mpSave = (pas.mpSave || 0) + gEff.mpSave;
      if (gEff.first) pas.first = (pas.first || 0) + gEff.first;
    }
  });

  // ---------------- 5. バトルれんけい・かばうはんてい ----------------
  // せんとうちゅうのれんけいこうほにモンスターれんけいをこんにゅう
  const origCombos = DATA.combos;
  function updateBattleCombos() {
    const P = K.battleParty();
    const curMons = P.filter(m => m.kind === 'mon');
    const dynamic = [];

    for (const c of MON_COMBOS) {
      const hu = P.find(m => m.id === c.hu && m.hp > 0 && !(m.sleep > 0));
      if (!hu) continue;
      const mon = curMons.find(m => {
        const S = DATA.species[m.id];
        return S && S.arch === c.arch && m.hp > 0 && !(m.sleep > 0) && (m.bond || 0) >= 50;
      });
      if (mon && hu.mp >= c.mp && mon.mp >= c.mp) {
        dynamic.push({ ...c, a: hu.id, b: mon.uid, partnerId: mon.uid });
      }
    }
    DATA.combos = [...origCombos, ...dynamic];
  }

  H.battleEnd.push(() => {
    DATA.combos = origCombos; // せんとうしゅうりょうごにふくげん
  });

  // せんとうフレームかいしじにコンボをこうしん
  H.frame.push(() => {
    if (document.body.classList.contains('inbattle')) {
      updateBattleCombos();
    }
  });

  H.battleEnd.push((result,specs,opts,party)=>{
    if(result==='win') for(const m of party||[]) if(m.kind==='mon'&&m.hp>0){
      if(G().monEq[m.uid]==='m_ribbon_kizuna')m.bond=Math.min(100,(m.bond||0)+1);
      const hp=m.hp/m.st.hp,mp=m.mp/Math.max(1,m.st.mp);K.calc(m);m.hp=Math.max(1,Math.round(m.st.hp*hp));m.mp=Math.round(m.st.mp*mp);
    }
  });
  K.monPlus={gear:DATA.monGear,combos:MON_COMBOS,canEquipMon,updateBattleCombos,initialize};
  // ---------------- 6. モンスターしょうさいパネル（monPanel）かくちょう ----------------
  // K.monPanel をあんぜんにフックして、せんようそうび・かくせい・なつきどしょうさいをついかひょうじ
  const prevMonPanel = K.monPanel;
  K.monPanel = async function(m) {
    if (m.kind === 'human') return prevMonPanel(m);
    initialize(G());
    while (true) {
      const key=G().monEq[m.uid], gear=DATA.monGear[key], awake=!!G().monAwake[m.uid];
      const i=await K.menu({title:K.nameOf(m),items:[
        {label:'くわしく みる',sub:'Lv'+m.lv+' / なつき '+(m.bond||0)},
        {label:'せんよう そうび',sub:gear?gear.name:'なし'},
        {label:'きずな かくせい',sub:awake?'かくせいずみ':'なつき100で かくせい',disabled:awake||(m.bond||0)<100}
      ],where:'center'});
      if(i<0)return;
      if(i===0)await prevMonPanel(m);
      if(i===1)await changeMonGearMenu(m);
      if(i===2)await awakeEvent(m);
    }
  };
  // そうびへんこうダイアログ
  async function changeMonGearMenu(m) {
    const g = G();
    const storedKey = g.monEq && g.monEq[m.uid];
    const eqKey = DATA.monGear[storedKey] ? storedKey : null;
    const usableGears = Object.keys(g.inv).filter(k => DATA.monGear[k] && g.inv[k] > 0 && canEquipMon(m, k));

    const items = [
      ...(eqKey ? [{ label: '【はずす】', sub: DATA.monGear[eqKey].name }] : []),
      ...usableGears.map(k => ({ label: DATA.monGear[k].name, sub: DATA.monGear[k].desc }))
    ];

    if (!items.length) {
      await K.say(['そうびできる モンスターそうしょくひんを もっていません。', '（どうぐやで くびわや おまもりを かうか、 たからばこから てにいります）']);
      return;
    }

    const sel = await K.menu({ title: `${K.nameOf(m)}の そうび`, items, where: 'side' });
    if (sel < 0) return;

    if (eqKey && sel === 0) {
      g.inv[eqKey] = (g.inv[eqKey] || 0) + 1;
      delete g.monEq[m.uid];
      Music.sfx('pick');
      K.toast('そうびを はずした', 1200);
    } else {
      const pickKey = usableGears[eqKey ? sel - 1 : sel];
      if (!pickKey || !(g.inv[pickKey] > 0) || !canEquipMon(m, pickKey)) return;
      if (eqKey) g.inv[eqKey] = (g.inv[eqKey] || 0) + 1; // つけかえときはきゅうそうびをインベントリへ
      g.inv[pickKey]--;
      g.monEq[m.uid] = pickKey;
      Music.sfx('friend');
      K.toast(`${DATA.monGear[pickKey].name}を そうびした！`, 1400);
    }

    refitVitals(m);
    if (!K.save()) K.toast('そうびの きろくを ほぞんできませんでした');
    K.hud();
  }

  // HP0を保ち、最大値の変化でHP/MPがあふれないようにする。
  function refitVitals(m) {
    const alive = m.hp > 0, hr = m.st.hp > 0 ? m.hp / m.st.hp : 0;
    const mr = m.st.mp > 0 ? m.mp / m.st.mp : 0;
    K.calc(m);
    m.hp = alive ? Math.min(m.st.hp, Math.max(1, Math.round(m.st.hp * hr))) : 0;
    m.mp = Math.min(m.st.mp, Math.max(0, Math.round(m.st.mp * mr)));
  }

  // かくせいイベント
  async function awakeEvent(m) {
    const g = G();
    if (g.monAwake[m.uid] || (m.bond || 0) < 100) return;
    const soraPresent = g.team.includes('sora');
    Music.jingle('light', K.fieldSong());
    await K.say([
      `${K.nameOf(m)}と ${G().name}の ふかい きずなが、 まばゆい ひかりを はなった！`,
      ...(soraPresent ? [who('sora', 'joy', `${K.nameOf(m)}！ からだから ひかりが あふれてるよ！`)] : []),
      `${K.nameOf(m)}は「きずなかくせい」を とげた！`,
      '（さいだいHP・MPと こうげき・ぼうぎょが あがり、 まいターン HPが じどうかいふくする！）'
    ]);
    g.monAwake[m.uid] = 1;
    refitVitals(m);
    if (!K.save()) K.toast('かくせいの きろくを ほぞんできませんでした');
    K.hud();
  }

})();