import assert from 'node:assert/strict';
import { boot } from './lib.mjs';

const cases = [
  {
    name: '第1章', chapter: '#btnNew',
    check: s => {
      assert.equal(s.region, 0);
      assert.equal(s.flags.cleared, undefined);
      assert.deepEqual(s.party, ['sora']);
      assert.ok(s.objective.length > 0, '第1章の次の目的が表示されない');
    }
  },
  {
    name: '第2章', chapter: '#btnCh2',
    check: s => {
      assert.equal(s.region, 0);
      assert.equal(s.flags.cleared, 1);
      assert.equal(s.flags.c2done, undefined);
      assert.deepEqual(s.party, ['sora', 'mio', 'riku']);
      assert.deepEqual(s.beacons, [true, true, true, true, true]);
      assert.match(s.objective, /第2章|クロウ|霧の大陸/);
    }
  },
  {
    name: '第3章', chapter: '#btnCh3',
    check: s => {
      assert.equal(s.region, 1);
      assert.equal(s.flags.c2done, 1);
      assert.equal(s.flags.c3done, undefined);
      assert.deepEqual(s.party, ['sora', 'mio', 'riku', 'sana']);
      assert.match(s.objective, /第3章|ツムギ|星笛|天空/);
    }
  },
  {
    name: '第4章', chapter: '#btnCh4',
    check: s => {
      assert.equal(s.region, 0);
      assert.equal(s.flags.c3done, 1);
      assert.equal(s.flags.c3reunion, 1);
      assert.equal(s.flags.c4start, 1);
      assert.equal(s.flags.c4done, undefined);
      assert.ok(s.party.includes('haru'));
      assert.ok(s.party.includes('kaito'));
      assert.match(s.objective, /岬|あわの鈴|海の底/);
    },
    saveRoundTrip: true
  }
];

for (const c of cases) {
  const { browser, page, errors } = await boot({ chapter: c.chapter });
  try {
    const snapshot = await page.evaluate(() => ({
      region: KZ.G.region,
      flags: { ...KZ.G.flags },
      party: KZ.G.party.map(m => m.id),
      team: [...KZ.G.team],
      unresolvedTeam: KZ.G.team.filter(ref => !KZ.member(ref)),
      beacons: KZ.REG[0].beacons.map(b => !!b.lit),
      objective: (KZ.objective() || {}).t || ''
    }));
    c.check(snapshot);
    assert.equal(new Set(snapshot.party).size, snapshot.party.length, `${c.name}: 仲間IDが重複している`);
    assert.deepEqual(snapshot.unresolvedTeam, [], `${c.name}: 隊列に解決できない参照がある`);

    if (c.saveRoundTrip) {
      const restored = await page.evaluate(() => {
        Object.assign(KZ.G.flags, {
          c4arrive: 1, c4elder: 1, c4done: 1,
          ruinsStar: 1, towerStars: 1, palaceTide: 1
        });
        KZ.G.lh = [1, 1, 1];
        KZ.save();
        Object.assign(KZ.G.flags, {
          c4arrive: 0, c4elder: 0, c4done: 0,
          ruinsStar: 0, towerStars: 0, palaceTide: 0
        });
        KZ.G.lh = [0, 0, 0];
        const ok = KZ.load();
        return {
          ok,
          flags: { ...KZ.G.flags },
          lh: [...KZ.G.lh],
          objective: (KZ.objective() || {}).t || ''
        };
      });
      assert.equal(restored.ok, true);
      for (const key of ['c4arrive', 'c4elder', 'c4done', 'ruinsStar', 'towerStars', 'palaceTide']) {
        assert.equal(restored.flags[key], 1, `保存から ${key} を復元できない`);
      }
      assert.deepEqual(restored.lh, [1, 1, 1]);
      assert.match(restored.objective, /^自由に 旅しよう/, '第4章完了後に自由行動へ移らない');
    }

    assert.deepEqual(errors, [], `${c.name}: ページエラー ${errors.join(' / ')}`);
    console.log(`OK ${c.name}: ${snapshot.objective}`);
  } finally {
    await browser.close();
  }
}

console.log('章の進行ゲート: 第1章から第4章、保存復元まで成功');
