export const SUITS = [
  { id: 'diamonds', symbol: '♦', name: 'Valuables', base: 18 },
  { id: 'clubs', symbol: '♣', name: 'Freight', base: 10 },
  { id: 'spades', symbol: '♠', name: 'Contraband', base: 12 },
  { id: 'hearts', symbol: '♥', name: 'Provisions', base: 8 },
];

export const EQUIPMENT = [
  { id: 'false-bottom', name: 'False Bottom', icon: 'bag', label: 'PLAY IT SAFE', description: 'Pocketing locks in your getaway multiplier +1.' },
  { id: 'fast-hands', name: 'Fast Hands', icon: 'bolt', label: 'KEEP MOVING', description: 'Pocket a find. Your next drawn card is worth three times as much loose loot.' },
  { id: 'all-or-nothing', name: 'All or Nothing', icon: 'star', label: 'BET THE FARM', description: 'Escape without pocketing a card for a ×1.4 payout.' },
  { id: 'light-fingers', name: 'Light Fingers', icon: 'hand', label: 'TRAVEL LIGHT', description: 'Escape with four or more cards for a ×2 payout.' },
  { id: 'payroll-tip', name: 'Payroll Tip', icon: 'diamond', label: 'INSIDE INFORMATION', description: 'Unsecured diamonds contribute ×1.75 their printed loot value.' },
  { id: 'lucky-horseshoe', name: 'Lucky Horseshoe', icon: 'shoe', label: 'MAKE YOUR OWN LUCK', description: 'Exactly 21 pays ×10 instead of ×4.' },
  { id: 'steady-nerves', name: 'Steady Nerves', icon: 'star', label: 'HOLD YOUR NERVE', description: 'Escapes at 18–20 pay ×3.25 instead of ×2.5.' },
  { id: 'mixed-cargo', name: 'Mixed Cargo', icon: 'deck', label: 'A LITTLE OF EVERYTHING', description: 'Escape with three different unsecured suits for a ×2.5 payout.' },
];

const BASE_GEAR = new Set(EQUIPMENT.slice(0, 6).map((item) => item.id));

export const SIDE_JOBS = [
  { id: 'inside-job', name: 'Inside Job', description: 'Pocket a find, then escape at 18–21.', reward: 10 },
  { id: 'long-game', name: 'Long Game', description: 'Escape with at least four cards.', reward: 10 },
  { id: 'perfect-crime', name: 'Perfect Crime', description: 'Make a perfect getaway at exactly 21.', reward: 10 },
];

export const TRAINS = [
  { name: 'The Sundown Local', place: 'DRY CREEK → RED ROCK', target: 200, rule: 'An easy mark', description: 'Three carriages. One fresh deck. Make $200 to ride on.', modifier: 'none' },
  { name: 'The Gilded Express', place: 'RED ROCK → COPPER RIDGE', target: 420, rule: 'Armored payroll', description: 'Every diamond carries an extra $10 in printed loot.', modifier: 'payroll' },
  { name: 'The Last Train West', place: 'COPPER RIDGE → FREEDOM', target: 560, rule: 'Federal escort', description: 'Escapes below 18 earn only half their usual multiplier.', modifier: 'escort' },
];

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const has = (state, id) => state.gear.includes(id);
// Payouts round down to whole dollars; the epsilon absorbs float error such as 45 × 1.4 = 62.999….
const whole = (value) => Math.floor(value + 1e-9);
// Gear tuning, balanced by simulating full runs: each item lifts a run's win rate by a similar amount.
const GEAR = {
  fastHands: 3, allOrNothing: 1.4, payrollTip: 1.75, horseshoe: 10, steadyNerves: 3.25,
  lightFingers: { cards: 4, multiplier: 2 }, mixedCargo: { suits: 3, multiplier: 2.5 },
};

function random(state) {
  state.rng = (state.rng + 0x6d2b79f5) >>> 0;
  let t = state.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function shuffle(items, state) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random(state) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function makeDeck(trainIndex = 0) {
  return SUITS.flatMap((suit) => RANKS.map((rank, index) => ({
    id: `${suit.id}-${rank}`,
    rank,
    suit: suit.id,
    value: rank === 'A' ? 11 : Math.min(index + 1, 10),
    loot: suit.base + (rank === 'A' ? 8 : Math.min(index + 1, 10))
      + (TRAINS[trainIndex].modifier === 'payroll' && suit.id === 'diamonds' ? 10 : 0),
    boosted: false,
  })));
}

export function handTotal(hand) {
  let total = hand.reduce((sum, card) => sum + card.value, 0);
  let aces = hand.filter((card) => card.rank === 'A').length;
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

function gearBonus(id, detail) {
  return { id, label: EQUIPMENT.find((item) => item.id === id).name, detail };
}

function escapeScore(total, state) {
  const bonuses = [];
  if (total > 21) return { multiplier: 0, bonuses };
  let multiplier = total === 21 ? 4 : total >= 18 ? 2.5 : total >= 16 ? 1.75 : total >= 12 ? 1.25 : 1;
  if (total === 21 && has(state, 'lucky-horseshoe')) {
    multiplier = GEAR.horseshoe;
    bonuses.push(gearBonus('lucky-horseshoe', `Getaway ×${GEAR.horseshoe}`));
  }
  if (total >= 18 && total <= 20 && has(state, 'steady-nerves')) {
    multiplier = GEAR.steadyNerves;
    bonuses.push(gearBonus('steady-nerves', `Getaway ×${GEAR.steadyNerves}`));
  }
  if (TRAINS[state.trainIndex].modifier === 'escort' && total < 18) {
    multiplier *= 0.5;
    bonuses.push({ id: 'federal-escort', label: 'Federal Escort', detail: 'Getaway ×½' });
  }
  return { multiplier, bonuses };
}

export function escapeMultiplier(total, state) {
  return escapeScore(total, state).multiplier;
}

export function payout(state) {
  const loose = state.hand.filter((card) => card.id !== state.pocketedId);
  let boostedLoot = false;
  let payrollLoot = false;
  const base = loose.reduce((sum, card) => {
    const payroll = has(state, 'payroll-tip') && card.suit === 'diamonds';
    boostedLoot ||= card.boosted;
    payrollLoot ||= payroll;
    return sum + whole(card.loot * (card.boosted ? GEAR.fastHands : 1) * (payroll ? GEAR.payrollTip : 1));
  }, 0);
  const total = handTotal(state.hand);
  const { multiplier: escape, bonuses } = escapeScore(total, state);
  const allOrNothing = has(state, 'all-or-nothing') && !state.pocketedId;
  const lightFingers = has(state, 'light-fingers') && state.hand.length >= GEAR.lightFingers.cards;
  const mixedCargo = has(state, 'mixed-cargo') && new Set(loose.map((card) => card.suit)).size >= GEAR.mixedCargo.suits;
  const gearMultiplier = (allOrNothing ? GEAR.allOrNothing : 1) * (lightFingers ? GEAR.lightFingers.multiplier : 1)
    * (mixedCargo ? GEAR.mixedCargo.multiplier : 1);
  if (total <= 21) {
    if (boostedLoot) bonuses.push(gearBonus('fast-hands', `Boosted find ×${GEAR.fastHands}`));
    if (payrollLoot) bonuses.push(gearBonus('payroll-tip', `Diamonds ×${GEAR.payrollTip}`));
    if (allOrNothing) bonuses.push(gearBonus('all-or-nothing', `Payout ×${GEAR.allOrNothing}`));
    if (lightFingers) bonuses.push(gearBonus('light-fingers', `Payout ×${GEAR.lightFingers.multiplier}`));
    if (mixedCargo) bonuses.push(gearBonus('mixed-cargo', `Payout ×${GEAR.mixedCargo.multiplier}`));
  }
  return { base, escape, gearMultiplier, amount: whole(base * escape * gearMultiplier), bonuses };
}

// Pocketing locks in the getaway multiplier showing right now, never below ×1.
// False Bottom adds +1 to that locked multiplier.
export function pocketValue(state, cardId) {
  const card = state.hand.find((item) => item.id === cardId);
  if (!card) return null;
  const locked = Math.max(1, escapeMultiplier(handTotal(state.hand), state));
  const multiplier = locked + (has(state, 'false-bottom') ? 1 : 0);
  return { locked, multiplier, amount: whole(card.loot * multiplier) };
}

export function bustRisk(state) {
  if (!state.deck.length) return 0;
  return state.deck.filter((card) => handTotal([...state.hand, card]) > 21).length / state.deck.length;
}

function allowedUnlocks(unlockedGear) {
  return EQUIPMENT.filter((item) => !BASE_GEAR.has(item.id) && unlockedGear.includes(item.id)).map((item) => item.id);
}

function offers(state, newlyUnlocked = []) {
  const available = EQUIPMENT.filter((item) => !has(state, item.id)
    && (BASE_GEAR.has(item.id) || state.unlockedGear.includes(item.id)));
  const choices = shuffle(available, state).slice(0, 3).map((item) => item.id);
  const guaranteed = newlyUnlocked.find((id) => available.some((item) => item.id === id));
  if (guaranteed && !choices.some((id) => newlyUnlocked.includes(id))) choices[choices.length - 1] = guaranteed;
  return choices;
}

function award(state, id, label, amount) {
  if (state.rewards.some((reward) => reward.id === id)) return;
  state.rewards.push({ id, label, amount });
  state.reputationEarned += amount;
}

export function createRun(seed, unlockedGear = []) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new Error('Seed must be an unsigned 32-bit integer.');
  const state = {
    seed, rng: seed, phase: 'camp', trainIndex: 0, carriageIndex: 0,
    trainLoot: 0, carriedIn: 0, totalLoot: 0, gear: [], deck: [], hand: [],
    pocketedId: null, pocketMultiplier: 0, secured: 0, boostNext: false, result: null, history: [], offers: [],
    unlockedGear: allowedUnlocks(unlockedGear),
    sideJobId: SIDE_JOBS[seed % SIDE_JOBS.length].id, sideJobComplete: false,
    rewards: [], reputationEarned: 0,
  };
  state.offers = offers(state);
  return state;
}

function draw(state) {
  const card = state.deck.pop();
  if (!card) throw new Error('The train deck is empty.');
  card.boosted = state.boostNext;
  state.boostNext = false;
  state.hand.push(card);
}

function deal(state) {
  state.phase = 'playing';
  state.hand = [];
  state.pocketedId = null;
  state.pocketMultiplier = 0;
  state.secured = 0;
  state.boostNext = false;
  state.result = null;
  draw(state);
  draw(state);
}

export function chooseEquipment(state, id) {
  if (state.phase !== 'camp' || !state.offers.includes(id) || state.gear.length >= 3) return state;
  const next = structuredClone(state);
  next.gear.push(id);
  next.offers = [];
  next.deck = shuffle(makeDeck(next.trainIndex), next);
  deal(next);
  return next;
}

export function pocket(state, cardId) {
  if (state.phase !== 'playing' || state.pocketedId || handTotal(state.hand) > 21) return state;
  const value = pocketValue(state, cardId);
  if (!value) return state;
  const next = structuredClone(state);
  next.pocketedId = cardId;
  next.pocketMultiplier = value.multiplier;
  next.secured = value.amount;
  next.trainLoot += next.secured;
  next.totalLoot += next.secured;
  next.boostNext = has(state, 'fast-hands');
  return next;
}

function settle(state, busted) {
  const score = busted ? { ...payout(state), amount: 0 } : payout(state);
  const alarm = handTotal(state.hand);
  const perfect = !busted && alarm === 21;
  const previousReputation = state.reputationEarned;
  const rewardPrefix = `train-${state.trainIndex}-carriage-${state.carriageIndex}`;
  award(state, `${rewardPrefix}-resolved`, 'Carriage searched', 2);
  if (!busted) award(state, `${rewardPrefix}-safe`, 'Clean getaway', 2);
  if (perfect) award(state, `${rewardPrefix}-perfect`, 'Perfect getaway', 3);
  const sideJobCompleted = !state.sideJobComplete && !busted && (
    (state.sideJobId === 'inside-job' && Boolean(state.pocketedId) && alarm >= 18)
    || (state.sideJobId === 'long-game' && state.hand.length >= 4)
    || (state.sideJobId === 'perfect-crime' && perfect)
  );
  if (sideJobCompleted) {
    const job = SIDE_JOBS.find((item) => item.id === state.sideJobId);
    state.sideJobComplete = true;
    award(state, `train-${state.trainIndex}-side-job`, job.name, job.reward);
  }
  state.trainLoot += score.amount;
  state.totalLoot += score.amount;
  state.phase = 'result';
  state.result = {
    busted, perfect,
    loose: score.amount, secured: state.secured, total: score.amount + state.secured,
    alarm, breakdown: score,
    reputation: state.reputationEarned - previousReputation, sideJobCompleted,
  };
  state.history.push({ trainIndex: state.trainIndex, carriageIndex: state.carriageIndex, ...state.result });
}

export function hit(state) {
  if (state.phase !== 'playing' || !state.deck.length) return state;
  const next = structuredClone(state);
  draw(next);
  if (handTotal(next.hand) > 21) settle(next, true);
  return next;
}

export function stand(state) {
  if (state.phase !== 'playing') return state;
  const next = structuredClone(state);
  settle(next, false);
  return next;
}

function finishTrain(next, unlockedGear) {
  if (next.trainLoot < TRAINS[next.trainIndex].target) {
    next.phase = 'lost';
    return next;
  }
  award(next, `train-${next.trainIndex}-cleared`, 'Train target cleared', 8);
  if (next.trainIndex === TRAINS.length - 1) {
    award(next, 'run-won', 'Made it west', 12);
    next.phase = 'won';
  } else {
    const allowed = allowedUnlocks(unlockedGear);
    const newlyUnlocked = allowed.filter((id) => !next.unlockedGear.includes(id));
    next.unlockedGear = allowed;
    // Cash above the target rides along and counts toward the next train's target.
    next.carriedIn = next.trainLoot - TRAINS[next.trainIndex].target;
    next.trainLoot = next.carriedIn;
    next.trainIndex++;
    next.carriageIndex = 0;
    next.phase = 'camp';
    next.hand = [];
    next.pocketedId = null;
    next.pocketMultiplier = 0;
    next.secured = 0;
    next.boostNext = false;
    next.result = null;
    next.sideJobId = SIDE_JOBS[(next.seed + next.trainIndex) % SIDE_JOBS.length].id;
    next.sideJobComplete = false;
    next.offers = offers(next, newlyUnlocked);
  }
  return next;
}

export function advance(state, unlockedGear = state.unlockedGear) {
  if (state.phase !== 'result') return state;
  const next = structuredClone(state);
  if (next.carriageIndex < 2) {
    next.carriageIndex++;
    deal(next);
    return next;
  }
  return finishTrain(next, unlockedGear);
}

export function leaveTrain(state, unlockedGear = state.unlockedGear) {
  if (state.phase !== 'result' || !state.sideJobComplete || state.trainLoot < TRAINS[state.trainIndex].target) return state;
  return finishTrain(structuredClone(state), unlockedGear);
}
