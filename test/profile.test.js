import test from 'node:test';
import assert from 'node:assert/strict';
import { freshProfile, normalizeProfile, rankProgress, unlockedEquipment, earnReputation, recordRun, loadProfile, saveProfile } from '../src/profile.js';

test('promotions unlock lateral equipment exactly at each threshold', () => {
  let profile = earnReputation(freshProfile(), 19).profile;
  assert.equal(rankProgress(profile).rank.name, 'Greenhorn');
  assert.deepEqual(unlockedEquipment(profile), []);
  const promotion = earnReputation(profile, 1);
  assert.equal(promotion.promotions[0].name, 'Bandit');
  profile = promotion.profile;
  assert.deepEqual(unlockedEquipment(profile), ['steady-nerves']);
  assert.equal(earnReputation(profile, 0).promotions.length, 0);
  profile = earnReputation(profile, 50).profile;
  assert.deepEqual(unlockedEquipment(profile), ['steady-nerves', 'mixed-cargo']);
  assert.equal(rankProgress(profile).fraction, 0);
  profile = earnReputation(profile, 100).profile;
  assert.equal(rankProgress(profile).rank.name, 'Legend');
  assert.equal(rankProgress(profile).fraction, 1);
  assert.equal(rankProgress(profile).next, undefined);
});

test('bad saved data is bounded and does not produce impossible career stats', () => {
  assert.deepEqual(normalizeProfile({ version: 2, reputation: 999 }), freshProfile());
  const profile = normalizeProfile({ version: 1, reputation: -3, wins: 20, runs: 2, bestTake: '100', sound: false });
  assert.equal(profile.reputation, 0);
  assert.equal(profile.wins, 2);
  assert.equal(profile.bestTake, 0);
  assert.equal(profile.sound, false);
  assert.throws(() => earnReputation(profile, NaN), RangeError);
});

test('completed runs record wins and best take; abandoned runs do not', () => {
  let profile = freshProfile();
  assert.equal(recordRun(profile, { phase: 'playing' }), profile);
  profile = recordRun(profile, { phase: 'won', totalLoot: 1500 });
  profile = recordRun(profile, { phase: 'lost', totalLoot: 100 });
  assert.deepEqual([profile.runs, profile.wins, profile.bestTake], [2, 1, 1500]);
});

test('profile survives storage round trip and reports unavailable or malformed storage', () => {
  const values = new Map();
  const storage = { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value) };
  const profile = earnReputation(freshProfile(), 35).profile;
  assert.equal(saveProfile(storage, profile), true);
  assert.deepEqual(loadProfile(storage), { profile, available: true });
  const blocked = { getItem() { throw new Error('Blocked'); }, setItem() { throw new Error('Blocked'); } };
  assert.equal(saveProfile(blocked, profile), false);
  assert.equal(loadProfile(blocked).available, false);
  assert.deepEqual(loadProfile({ getItem: () => '{bad json' }).profile, freshProfile());
});
