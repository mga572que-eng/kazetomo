import assert from 'node:assert/strict';
import { boot } from './lib.mjs';

const s = await boot();
try {
  const result = await s.page.evaluate(() => {
    const K = KZ;
    if (!K.save()) throw new Error('fixture save failed');
    const key = K.keyOf(K.SLOT), raw = localStorage.getItem(key);
    const old = JSON.parse(raw);
    delete old.G.homeGift;
    delete old.G.errands;
    delete old.G.inv.shinju;
    delete old.G.sp.haru;
    delete old.G.board.haru;
    localStorage.setItem(key, JSON.stringify(old));
    K.G.homeGift = { '0:yui': 999 };
    K.G.errands = { '0:yui': { st: 'done', next: 999 } };
    K.G.inv.shinju = 777;
    K.G.sp.haru = 88;
    K.G.board.haru = ['foreign-board-node'];
    const ok = K.load();
    return { ok, gift: K.G.homeGift || {}, errands: K.G.errands || {},
      pearls: K.G.inv.shinju || 0, sp: K.G.sp.haru, board: K.G.board.haru,
      savedParty: old.G.party.map(m => m.id), party: K.G.party.map(m => m.id),
      c2done: K.G.flags.c2done };
  });
  assert.equal(result.ok, true);
  assert.deepEqual(result.gift, {}, 'previous session gifts leaked into older save');
  assert.deepEqual(result.errands, {}, 'previous session errands leaked into older save');
  assert.equal(result.pearls, 0, 'previous inventory leaked into older save');
  assert.equal(result.sp, 0, 'previous skill points leaked into older save');
  assert.deepEqual(result.board, [], 'previous board leaked into older save');
  assert.deepEqual(result.party, result.savedParty);
  assert.equal(result.c2done, 1);
  const roundTrip = await s.page.evaluate(() => {
    const K = KZ, key = K.keyOf(K.SLOT), G = K.G;
    G.homeGift = { '0:yui': 12 };
    G.errands = { '0:yui': { st: 'done', next: 13 } };
    G.inv.shinju = 7;
    G.party[0].hp = 0;
    G.party[0].mp = 0;
    K.save();
    const saved = JSON.parse(localStorage.getItem(key)).G;
    G.homeGift = {}; G.errands = {}; G.inv.shinju = 99;
    G.party[0].hp = 1; G.party[0].mp = 1; G.job = {};
    const ok = K.load();
    return { ok, gift: K.G.homeGift, errands: K.G.errands, pearls: K.G.inv.shinju,
      hp: K.G.party[0].hp, mp: K.G.party[0].mp,
      job: K.G.job, savedJob: saved.job, team: K.G.team, savedTeam: saved.team };
  });
  assert.equal(roundTrip.ok, true);
  assert.deepEqual(roundTrip.gift, { '0:yui': 12 });
  assert.deepEqual(roundTrip.errands, { '0:yui': { st: 'done', next: 13 } });
  assert.equal(roundTrip.pearls, 7);
  assert.equal(roundTrip.hp, 0, 'loading must not revive a fallen ally');
  assert.equal(roundTrip.mp, 0, 'loading must not refill spent MP');
  assert.deepEqual(roundTrip.job, roundTrip.savedJob, 'job progress changed on load');
  assert.deepEqual(roundTrip.team, roundTrip.savedTeam);
  assert.deepEqual(s.errors, []);
  console.log('PASS: old save isolation and current save round trip (rewards, jobs, team, zero HP/MP)');
} finally { await s.browser.close(); }
