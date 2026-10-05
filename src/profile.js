export const PROFILE_KEY = 'one-more-car.profile.v1';

export const RANKS = [
  { level: 1, name: 'Greenhorn', reputation: 0, reward: 'Six pieces of equipment to discover.', gear: null },
  { level: 2, name: 'Bandit', reputation: 20, reward: 'Steady Nerves joins the equipment pool.', gear: 'steady-nerves' },
  { level: 3, name: 'Outlaw', reputation: 70, reward: 'Mixed Cargo joins the equipment pool.', gear: 'mixed-cargo' },
  { level: 4, name: 'Legend', reputation: 150, reward: 'A golden table and a name the frontier remembers.', gear: null },
];

export function freshProfile() {
  return { version: 1, reputation: 0, runs: 0, wins: 0, bestTake: 0, sound: true };
}

export function normalizeProfile(value) {
  if (!value || value.version !== 1) return freshProfile();
  const profile = freshProfile();
  for (const field of ['reputation', 'runs', 'wins', 'bestTake']) {
    if (Number.isSafeInteger(value[field]) && value[field] >= 0) profile[field] = value[field];
  }
  profile.wins = Math.min(profile.wins, profile.runs);
  if (typeof value.sound === 'boolean') profile.sound = value.sound;
  return profile;
}

export function rankProgress(profile) {
  const rank = RANKS.findLast((item) => profile.reputation >= item.reputation);
  const next = RANKS[rank.level];
  return { rank, next, fraction: next ? (profile.reputation - rank.reputation) / (next.reputation - rank.reputation) : 1 };
}

export function unlockedEquipment(profile) {
  return RANKS.filter((rank) => rank.gear && profile.reputation >= rank.reputation).map((rank) => rank.gear);
}

export function earnReputation(profile, amount) {
  if (!Number.isSafeInteger(amount) || amount < 0) throw new RangeError('Reputation must be a nonnegative integer.');
  const next = { ...profile, reputation: Math.min(Number.MAX_SAFE_INTEGER, profile.reputation + amount) };
  const promotions = RANKS.filter((rank) => profile.reputation < rank.reputation && next.reputation >= rank.reputation);
  return { profile: next, promotions };
}

export function recordRun(profile, state) {
  if (!['won', 'lost'].includes(state.phase)) return profile;
  return { ...profile, runs: profile.runs + 1, wins: profile.wins + Number(state.phase === 'won'), bestTake: Math.max(profile.bestTake, state.totalLoot) };
}

export function loadProfile(storage) {
  try {
    const raw = storage.getItem(PROFILE_KEY);
    return { profile: normalizeProfile(raw ? JSON.parse(raw) : null), available: true };
  } catch {
    return { profile: freshProfile(), available: false };
  }
}

export function saveProfile(storage, profile) {
  try { storage.setItem(PROFILE_KEY, JSON.stringify(profile)); return true; }
  catch { return false; }
}
