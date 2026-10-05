import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, chooseEquipment, makeDeck, handTotal, pocket, hit, stand, advance, leaveTrain, payout, bustRisk, TRAINS, SIDE_JOBS } from '../src/game.js';

const card = (rank, suit = 'clubs') => makeDeck().find((item) => item.rank === rank && item.suit === suit);
function hand(ranks, gear = []) {
  const state = chooseEquipment(createRun(42), createRun(42).offers[0]);
  state.gear = gear;
  state.hand = ranks.map((rank, index) => card(rank, ['clubs', 'hearts', 'spades', 'diamonds'][index % 4]));
  return state;
}

test('a train has 52 unique cards and a seeded run reproduces both offers and deal', () => {
  assert.equal(new Set(makeDeck().map((item) => item.id)).size, 52);
  const a = createRun(1977);
  const b = createRun(1977);
  assert.deepEqual(chooseEquipment(a, a.offers[0]), chooseEquipment(b, b.offers[0]));
  assert.throws(() => createRun(NaN));
});

test('aces soften only as needed, including multiple aces', () => {
  assert.equal(handTotal([card('A'), card('A'), card('9')]), 21);
  assert.equal(handTotal([card('A'), card('K'), card('5')]), 16);
  assert.equal(handTotal([card('A'), card('A'), card('K')]), 12);
  assert.equal(handTotal([card('K'), card('Q'), card('2')]), 22);
});

test('pocketing keeps the alarm, removes loose value, and is allowed only once', () => {
  const before = hand(['10', '6']);
  const id = before.hand[0].id;
  const after = pocket(before, id);
  assert.equal(handTotal(after.hand), 16);
  assert.equal(after.secured, before.hand[0].loot);
  assert.equal(payout(after).base, before.hand[1].loot);
  assert.equal(pocket(after, before.hand[1].id), after);
  assert.equal(pocket(before, 'missing'), before);
  assert.equal(before.pocketedId, null);
});

test('busting preserves secured cash and settlement cannot pay twice', () => {
  let state = hand(['10', '6'], ['false-bottom']);
  state = pocket(state, state.hand[0].id);
  const banked = state.secured;
  assert.equal(banked, state.hand[0].loot * 2);
  state.deck = [card('K')];
  state = hit(state);
  assert.equal(state.phase, 'result');
  assert.equal(state.result.busted, true);
  assert.equal(state.result.loose, 0);
  assert.equal(state.trainLoot, banked);
  assert.equal(state.totalLoot, banked);
  assert.equal(stand(state), state);
  assert.equal(hit(state), state);
  assert.equal(pocket(state, state.hand[1].id), state);
});

test('a clean escape includes the pocket payout once, not twice', () => {
  let state = hand(['10', '8']);
  state = pocket(state, state.hand[0].id);
  const expected = state.secured + payout(state).amount;
  state = stand(state);
  assert.equal(state.trainLoot, expected);
  assert.equal(state.totalLoot, expected);
  assert.equal(state.result.total, expected);
});

test('Fast Hands boosts exactly the next draw, not printed pocket value', () => {
  let state = hand(['2', '3'], ['fast-hands']);
  state.deck = [card('2', 'spades'), card('4', 'diamonds')];
  state = pocket(state, state.hand[0].id);
  state = hit(state);
  assert.equal(state.hand[2].boosted, true);
  assert.equal(payout(state).base, state.hand[1].loot + state.hand[2].loot * 2);
  state = hit(state);
  assert.equal(state.hand[3].boosted, false);
});

test('equipment changes the scoring incentives and composes correctly', () => {
  let state = hand(['A', 'K'], ['all-or-nothing', 'lucky-horseshoe']);
  assert.equal(payout(state).escape, 6);
  assert.equal(payout(state).gearMultiplier, 2);
  state = pocket(state, state.hand[0].id);
  assert.equal(payout(state).gearMultiplier, 1);
  state = hand(['2', '3', '4', '2', '3'], ['light-fingers', 'payroll-tip']);
  assert.equal(payout(state).gearMultiplier, 2);
  assert.equal(payout(state).base, state.hand.reduce((sum, item) => sum + item.loot * (item.suit === 'diamonds' ? 2 : 1), 0));
});

test('train modifiers affect printed diamond loot and sub-18 escapes', () => {
  const diamonds = makeDeck(1).filter((item) => item.suit === 'diamonds');
  for (const item of diamonds) assert.equal(item.loot, card(item.rank, item.suit).loot + 10);
  const state = hand(['10', '7']);
  const regular = payout(state).amount;
  state.trainIndex = 2;
  assert.equal(payout(state).amount, Math.floor(regular / 2));
  state.hand[1] = card('8');
  assert.equal(payout(state).escape, 2.5);
});

test('bust odds use the remaining shoe and account for soft aces', () => {
  const state = hand(['A', '6']);
  state.deck = [card('K'), card('4'), card('A')];
  assert.equal(bustRisk(state), 0);
  state.hand = [card('10'), card('6')];
  assert.equal(bustRisk(state), 1 / 3);
});

test('carriages share the shoe and a missed target ends the run', () => {
  let state = chooseEquipment(createRun(19), createRun(19).offers[0]);
  const firstCards = new Set(state.hand.map((item) => item.id));
  const remaining = state.deck.length;
  state = advance(stand(state));
  assert.equal(state.deck.length, remaining - 2);
  assert.ok(state.hand.every((item) => !firstCards.has(item.id)));
  state.carriageIndex = 2;
  state.trainLoot = 0;
  state.hand = [card('2'), card('3')];
  state.gear = [];
  state = advance(stand(state));
  assert.equal(state.phase, 'lost');
  assert.equal(advance(state), state);
});

test('successful trains offer new equipment, refresh the shoe, and ultimately win', () => {
  let state = createRun(77);
  for (let train = 0; train < 3; train++) {
    assert.equal(state.phase, 'camp');
    assert.ok(state.offers.every((id) => !state.gear.includes(id)));
    state = chooseEquipment(state, state.offers[0]);
    assert.equal(state.deck.length, 50);
    for (let carriage = 0; carriage < 3; carriage++) {
      state = stand(state);
      if (carriage === 2) state.trainLoot = Math.max(state.trainLoot, TRAINS[train].target);
      state = advance(state);
    }
  }
  assert.equal(state.phase, 'won');
  assert.equal(state.gear.length, 3);
  assert.equal(state.history.length, 9);
});

test('across random deals, card conservation and accounting hold through full runs', () => {
  for (let seed = 0; seed < 150; seed++) {
    let state = createRun(seed);
    for (let action = 0; action < 150; action++) {
      if (state.phase === 'camp') state = chooseEquipment(state, state.offers[0]);
      else if (state.phase === 'result') state = advance(state);
      else if (state.phase === 'playing') {
        if (!state.pocketedId && handTotal(state.hand) >= 12) state = pocket(state, state.hand[0].id);
        state = handTotal(state.hand) < 17 ? hit(state) : stand(state);
      } else break;
      const seen = [...state.deck, ...state.hand].map((item) => item.id);
      assert.equal(new Set(seen).size, seen.length);
      assert.ok(state.trainLoot >= 0);
      assert.ok(Number.isFinite(state.totalLoot));
      const settled = state.history.reduce((sum, item) => sum + item.total, 0);
      assert.equal(state.totalLoot, settled + (state.phase === 'playing' ? state.secured : 0));
      assert.equal(state.reputationEarned, state.rewards.reduce((sum, reward) => sum + reward.amount, 0));
      assert.equal(new Set(state.rewards.map((reward) => reward.id)).size, state.rewards.length);
    }
    assert.ok(['won', 'lost'].includes(state.phase));
  }
});

test('locked gear stays out of offers and unlock pools normalize without changing seeded deals', () => {
  for (let seed = 0; seed < 100; seed++) {
    const state = createRun(seed);
    assert.ok(!state.offers.includes('steady-nerves'));
    assert.ok(!state.offers.includes('mixed-cargo'));
    assert.deepEqual(createRun(seed, ['unknown', 'false-bottom']), state);
    assert.deepEqual(createRun(seed, ['steady-nerves', 'mixed-cargo']), createRun(seed, ['mixed-cargo', 'steady-nerves', 'steady-nerves']));
    assert.equal(state.sideJobId, SIDE_JOBS[seed % 3].id);
  }
  const seen = new Set(Array.from({ length: 100 }, (_, seed) => createRun(seed, ['steady-nerves', 'mixed-cargo']).offers).flat());
  assert.ok(seen.has('steady-nerves'));
  assert.ok(seen.has('mixed-cargo'));
});

test('newly unlocked equipment receives a slot at the next camp and completed side jobs reset', () => {
  for (let seed = 0; seed < 100; seed++) {
    let state = createRun(seed);
    state = chooseEquipment(state, state.offers[0]);
    state = stand(state);
    state.sideJobComplete = true;
    state = advance(state, ['steady-nerves']);
    assert.equal(state.phase, 'playing');
    assert.deepEqual(state.unlockedGear, []);
    state.carriageIndex = 2;
    state.trainLoot = TRAINS[0].target;
    state = advance(stand(state), ['steady-nerves']);
    assert.equal(state.phase, 'camp');
    assert.ok(state.offers.includes('steady-nerves'));
    assert.ok(!state.offers.includes('mixed-cargo'));
    assert.ok(state.offers.every((id) => !state.gear.includes(id)));
    assert.equal(new Set(state.offers).size, 3);
    assert.deepEqual(state.unlockedGear, ['steady-nerves']);
    assert.equal(state.sideJobComplete, false);
    assert.equal(state.sideJobId, SIDE_JOBS[(seed + 1) % 3].id);
  }
});

test('Steady Nerves rewards exactly 20 and Mixed Cargo counts only unsecured suits', () => {
  let state = hand(['K', 'Q'], ['steady-nerves', 'all-or-nothing']);
  assert.equal(payout(state).escape, 3.5);
  assert.equal(payout(state).gearMultiplier, 2);
  state.hand[1] = card('9');
  assert.equal(payout(state).escape, 2.5);
  state.hand[1] = card('A');
  assert.equal(payout(state).escape, 4);
  state = hand(['2', '3', '4'], ['mixed-cargo', 'all-or-nothing']);
  assert.equal(payout(state).gearMultiplier, 3);
  state = pocket(state, state.hand[0].id);
  assert.equal(payout(state).gearMultiplier, 1);
  state = hand(['2', '3', '4', '2'], ['mixed-cargo']);
  state.hand[3] = card('5', 'clubs');
  state = pocket(state, state.hand[0].id);
  assert.equal(payout(state).gearMultiplier, 1.5);
});

test('resolved hands grant reputation once, including insurance busts', () => {
  let state = hand(['10', '8']);
  state.sideJobId = 'perfect-crime';
  state = stand(state);
  assert.equal(state.result.reputation, 4);
  assert.equal(state.reputationEarned, 4);
  assert.equal(state.result.sideJobCompleted, false);
  assert.equal(stand(state), state);
  assert.equal(hit(state), state);
  const next = advance(state);
  assert.equal(next.reputationEarned, 4);
  assert.equal(advance(next), next);
  state = hand(['10', '8']);
  state = pocket(state, state.hand[0].id);
  state.deck = [card('10', 'spades')];
  state = hit(state);
  assert.equal(state.result.reputation, 2);
  assert.equal(state.reputationEarned, 2);
  assert.equal(state.sideJobComplete, false);
  assert.equal(state.result.sideJobCompleted, false);
});

test('each side job checks its own condition and pays only once per train', () => {
  for (const job of SIDE_JOBS) {
    let state = hand(job.id === 'inside-job' ? ['10', '8'] : job.id === 'long-game' ? ['2', '3', '4', '5'] : ['A', 'K']);
    state.sideJobId = job.id;
    if (job.id === 'inside-job') state = pocket(state, state.hand[0].id);
    state = stand(state);
    assert.equal(state.sideJobComplete, true, job.id);
    assert.equal(state.result.sideJobCompleted, true, job.id);
    assert.equal(state.result.reputation, job.id === 'perfect-crime' ? 17 : 14);
    assert.equal(state.rewards.filter((reward) => reward.id.endsWith('side-job')).length, 1);
    const firstReputation = state.reputationEarned;
    const completedHand = state.hand;
    state = advance(state);
    state.hand = completedHand;
    if (job.id === 'inside-job') state = pocket(state, state.hand[0].id);
    state = stand(state);
    assert.equal(state.result.sideJobCompleted, false);
    assert.equal(state.result.reputation, job.id === 'perfect-crime' ? 7 : 4);
    assert.equal(state.reputationEarned, firstReputation + state.result.reputation);
    assert.equal(state.rewards.filter((reward) => reward.id.endsWith('side-job')).length, 1);
  }
  let state = hand(['10', '8']);
  state.sideJobId = 'inside-job';
  assert.equal(stand(state).sideJobComplete, false);
  state = hand(['2', '3']);
  state.sideJobId = 'inside-job';
  assert.equal(stand(pocket(state, state.hand[0].id)).sideJobComplete, false);
  state.sideJobId = 'long-game';
  assert.equal(stand(state).sideJobComplete, false);
  state.sideJobId = 'perfect-crime';
  assert.equal(stand(state).sideJobComplete, false);
});

test('early departure requires both objectives and grants no rewards for skipped carriages', () => {
  let state = chooseEquipment(createRun(2), createRun(2).offers[0]);
  state.gear = [];
  state.hand = [card('A', 'clubs'), card('K', 'diamonds')];
  assert.equal(leaveTrain(state), state);
  state = stand(state);
  assert.equal(state.trainLoot, 184);
  assert.equal(state.sideJobComplete, true);
  assert.equal(state.reputationEarned, 17);
  const insufficient = { ...state, trainLoot: 179 };
  assert.equal(leaveTrain(insufficient), insufficient);
  const unfinished = { ...state, sideJobComplete: false };
  assert.equal(leaveTrain(unfinished), unfinished);
  const continuing = advance(state);
  assert.equal(continuing.phase, 'playing');
  assert.equal(continuing.carriageIndex, 1);
  assert.equal(continuing.reputationEarned, 17);
  const next = leaveTrain(state, ['steady-nerves']);
  assert.equal(next.phase, 'camp');
  assert.equal(next.trainIndex, 1);
  assert.equal(next.carriageIndex, 0);
  assert.equal(next.history.length, 1);
  assert.equal(next.reputationEarned, 25);
  assert.equal(next.rewards.filter((reward) => reward.id.endsWith('resolved')).length, 1);
  assert.equal(next.totalLoot, 184);
  assert.equal(next.trainLoot, 0);
  assert.ok(next.offers.includes('steady-nerves'));
  assert.equal(leaveTrain(next), next);
  assert.equal(advance(next), next);
});

test('normal and early train endings grant clear and victory rewards once, never on failure', () => {
  for (const early of [false, true]) {
    let state = hand(['10', '8']);
    state.trainIndex = 2;
    state.carriageIndex = early ? 0 : 2;
    state.trainLoot = TRAINS[2].target;
    state.sideJobComplete = true;
    state = stand(state);
    const prior = state.reputationEarned;
    state = early ? leaveTrain(state) : advance(state);
    assert.equal(state.phase, 'won');
    assert.equal(state.reputationEarned, prior + 20);
    assert.equal(state.rewards.filter((reward) => reward.id === 'train-2-cleared').length, 1);
    assert.equal(state.rewards.filter((reward) => reward.id === 'run-won').length, 1);
    assert.equal(advance(state), state);
    assert.equal(leaveTrain(state), state);
  }
  let state = hand(['2', '3']);
  state.carriageIndex = 2;
  state = stand(state);
  const prior = state.reputationEarned;
  state = advance(state);
  assert.equal(state.phase, 'lost');
  assert.equal(state.reputationEarned, prior);
  assert.ok(!state.rewards.some((reward) => reward.id.endsWith('cleared') || reward.id === 'run-won'));
});

test('scoring feedback follows active loose-loot effects and disappears after a bust', () => {
  let state = hand(['2', '3'], ['fast-hands', 'payroll-tip', 'mixed-cargo']);
  state.deck = [card('5', 'clubs'), card('4', 'diamonds')];
  state = pocket(state, state.hand[0].id);
  assert.deepEqual(payout(state).bonuses, []);
  state = hit(state);
  assert.deepEqual(payout(state).bonuses, [
    { id: 'fast-hands', label: 'Fast Hands', detail: 'Boosted find ×2' },
    { id: 'payroll-tip', label: 'Payroll Tip', detail: 'Diamonds ×2' },
  ]);
  state = hit(state);
  const score = payout(state);
  assert.deepEqual(score.bonuses, [
    { id: 'fast-hands', label: 'Fast Hands', detail: 'Boosted find ×2' },
    { id: 'payroll-tip', label: 'Payroll Tip', detail: 'Diamonds ×2' },
    { id: 'mixed-cargo', label: 'Mixed Cargo', detail: 'Payout ×1.5' },
  ]);
  assert.equal(score.base, 114);
  assert.equal(score.amount, 213);
  state.deck = [card('10', 'spades')];
  state = hit(state);
  assert.equal(state.result.busted, true);
  assert.deepEqual(state.result.breakdown.bonuses, []);
  assert.deepEqual(payout(state).bonuses, []);
});

test('pocketing removes feedback for forfeited bonuses and False Bottom is not a loose-payout bonus', () => {
  let state = hand(['2', '3', '4'], ['payroll-tip', 'mixed-cargo', 'all-or-nothing']);
  state.hand[2] = card('4', 'diamonds');
  assert.deepEqual(payout(state).bonuses.map((bonus) => bonus.id), ['payroll-tip', 'all-or-nothing', 'mixed-cargo']);
  state = pocket(state, state.hand[2].id);
  assert.deepEqual(payout(state).bonuses, []);
  state = hand(['2', '3'], ['false-bottom']);
  assert.deepEqual(payout(state).bonuses, []);
  state = pocket(state, state.hand[0].id);
  assert.deepEqual(payout(state).bonuses, []);
  assert.equal(state.secured, 24);
});

test('getaway and whole-payout feedback identify exactly the multipliers that apply', () => {
  let state = hand(['A', 'K'], ['lucky-horseshoe', 'steady-nerves']);
  assert.deepEqual(payout(state).bonuses, [{ id: 'lucky-horseshoe', label: 'Lucky Horseshoe', detail: 'Getaway ×6' }]);
  state.hand[0] = card('10', 'clubs');
  assert.deepEqual(payout(state).bonuses, [{ id: 'steady-nerves', label: 'Steady Nerves', detail: 'Getaway ×3.5' }]);
  state.hand[0] = card('9', 'clubs');
  assert.deepEqual(payout(state).bonuses, []);
  state.hand[0] = card('7', 'clubs');
  state.trainIndex = 2;
  assert.deepEqual(payout(state).bonuses, [{ id: 'federal-escort', label: 'Federal Escort', detail: 'Getaway ×½' }]);
  state.hand[0] = card('8', 'clubs');
  assert.deepEqual(payout(state).bonuses, []);
  state = hand(['2', '3', '4', '2', '3'], ['all-or-nothing', 'light-fingers']);
  assert.deepEqual(payout(state).bonuses, [
    { id: 'all-or-nothing', label: 'All or Nothing', detail: 'Payout ×2' },
    { id: 'light-fingers', label: 'Light Fingers', detail: 'Payout ×2' },
  ]);
  assert.equal(payout(state).gearMultiplier, 4);
  state.hand.pop();
  assert.deepEqual(payout(state).bonuses, [{ id: 'all-or-nothing', label: 'All or Nothing', detail: 'Payout ×2' }]);
  assert.equal(payout(state).gearMultiplier, 2);
});
