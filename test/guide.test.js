import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, chooseEquipment, makeDeck, pocket, hit, stand, advance, leaveTrain, payout, bustRisk, TRAINS } from '../src/game.js';
import { getGuideMessage, getTrainBriefing } from '../src/guide.js';

function playing(cards, gear = [], seed = 12) {
  const camp = createRun(seed);
  const state = chooseEquipment(camp, camp.offers[0]);
  const deck = makeDeck();
  state.hand = cards.map(([rank, suit]) => deck.find((card) => card.rank === rank && card.suit === suit));
  state.deck = deck.filter((card) => !state.hand.some((drawn) => drawn.id === card.id));
  state.gear = gear;
  return state;
}

function drawNext(state, rank, suit) {
  const card = state.deck.find((item) => item.rank === rank && item.suit === suit);
  state.deck = [...state.deck.filter((item) => item.id !== card.id), card];
  return hit(state);
}

test('welcome and train briefings teach required targets and optional side jobs', () => {
  const welcome = getGuideMessage(null);
  assert.equal(welcome.mood, 'welcome');
  assert.equal(welcome.emphasis, null);
  assert.match(welcome.title, /Dusty/);
  assert.match(welcome.hint, /Side jobs are optional/);
  for (const [index, train] of TRAINS.entries()) {
    const briefing = getTrainBriefing(index);
    assert.equal(briefing.title, train.name);
    assert.ok(briefing.text.includes(`$${train.target}`));
    assert.match(briefing.hint, /cash target is required; the side job is optional/);
    if (index > 0) assert.ok(briefing.text.includes(train.description));
  }
  assert.throws(() => getTrainBriefing(-1), RangeError);
  assert.throws(() => getTrainBriefing(TRAINS.length), RangeError);
  const camp = getGuideMessage(createRun(12));
  assert.match(camp.hint, /Inside Job is an optional side job worth 10 REP/);
});

test('soft aces never produce false danger advice, including a safe draw at 21', () => {
  let state = playing([['A', 'clubs'], ['6', 'hearts']]);
  assert.equal(bustRisk(state), 0);
  let guide = getGuideMessage(state);
  assert.equal(guide.emphasis, 'hit');
  assert.match(guide.text, /None of the remaining cards can bust you on this draw/);
  state = playing([['A', 'clubs'], ['K', 'diamonds']]);
  assert.equal(bustRisk(state), 0);
  guide = getGuideMessage(state);
  assert.equal(guide.emphasis, 'stand');
  assert.equal(guide.mood, 'cheer');
  assert.ok(guide.text.includes(`$${payout(state).amount}`));
  assert.doesNotMatch(`${guide.text} ${guide.hint}`, /would bust|will bust|always bust/);
  state = playing([['10', 'clubs'], ['8', 'hearts'], ['3', 'diamonds']]);
  assert.equal(bustRisk(state), 1);
  assert.match(getGuideMessage(state).hint, /Every remaining card would bust/);
});

test('high-risk advice uses remaining cards and offers the exact cash-out value', () => {
  const state = playing([['10', 'clubs'], ['8', 'hearts']]);
  const guide = getGuideMessage(state);
  assert.ok(bustRisk(state) >= 0.6);
  assert.equal(guide.mood, 'concern');
  assert.equal(guide.emphasis, 'stand');
  assert.ok(guide.text.includes(`${Math.round(bustRisk(state) * 100)}%`));
  assert.ok(guide.text.includes(`$${payout(state).amount}`));
});

test('selected-card preview includes insurance, forfeited bonuses, and unchanged hand total without mutation', () => {
  const state = playing([['10', 'diamonds'], ['6', 'clubs']], ['false-bottom', 'all-or-nothing']);
  const before = structuredClone(state);
  const guide = getGuideMessage(state, state.hand[0].id);
  assert.equal(guide.emphasis, 'pocket');
  assert.match(guide.text, /lock its \$28 at ×2\.75: \$77 safe cash/);
  assert.match(guide.hint, /Waiting could lock a bigger multiplier/);
  assert.match(guide.text, /from \$107 to \$28/);
  assert.match(guide.hint, /hand total stays 16/);
  assert.deepEqual(state, before);
  assert.notEqual(getGuideMessage(state, 'not-a-card').emphasis, 'pocket');
});

test('pocketed cash and pending Fast Hands remain distinct from the cash-out payout', () => {
  let state = playing([['2', 'clubs'], ['3', 'hearts']], ['fast-hands']);
  state = pocket(state, state.hand[0].id);
  let guide = getGuideMessage(state);
  assert.match(guide.text, /\$12 is locked in at ×1 and stays yours even if you bust/);
  assert.match(guide.text, /next drawn card earns double loose loot/);
  assert.equal(guide.emphasis, 'hit');
  state = drawNext(state, '4', 'diamonds');
  guide = getGuideMessage(state);
  assert.doesNotMatch(guide.text, /next drawn card earns double/);
  assert.match(guide.text, /pocketed card still counts toward 21/);
});

test('bust results preserve insurance and report the true remaining target', () => {
  let state = playing([['10', 'diamonds'], ['6', 'clubs']], ['false-bottom']);
  state = pocket(state, state.hand[0].id);
  state = drawNext(state, 'K', 'spades');
  const guide = getGuideMessage(state);
  assert.equal(state.result.busted, true);
  assert.equal(guide.mood, 'concern');
  assert.match(guide.text, /pocketed \$77 stayed safe/);
  assert.match(guide.hint, /\$123 still needed, with 2 carriages left/);
  assert.equal(guide.emphasis, null);
});

test('successful results announce next train rules without making the side job mandatory', () => {
  let state = playing([['10', 'diamonds'], ['8', 'clubs']], ['all-or-nothing']);
  state.trainLoot = 60;
  state = stand(state);
  let guide = getGuideMessage(state);
  assert.equal(state.result.total, 161);
  assert.equal(state.sideJobComplete, false);
  assert.match(guide.text, /\$161 kept: \$161 cashed out and \$0 already pocketed/);
  assert.ok(guide.text.includes(TRAINS[1].name));
  assert.ok(guide.text.includes(TRAINS[1].description));
  assert.match(guide.hint, /Anything extra rides with you to the next train\. Play the remaining 2 carriages to ride on, or complete the optional side job/);
  state = stand(advance(state));
  state = stand(advance(state));
  guide = getGuideMessage(state);
  assert.match(guide.hint, /Finish the job to ride to the next train. No side job required/);
  state = advance(state);
  assert.equal(state.phase, 'camp');
  guide = getGuideMessage(state);
  assert.equal(guide.title, TRAINS[1].name);
  assert.match(guide.text, /\$420/);
  assert.match(guide.text, new RegExp(`The \\$${state.carriedIn} you carried over already counts`));
  assert.match(guide.text, /extra \$10/);
});

test('early departure, final victory, and failure guidance match progression rules', () => {
  let state = playing([['A', 'clubs'], ['K', 'diamonds']], ['all-or-nothing'], 2);
  state = stand(state);
  assert.equal(state.sideJobComplete, true);
  assert.match(getGuideMessage(state).hint, /Leave now to ride on/);
  assert.equal(leaveTrain(state).phase, 'camp');
  state = playing([['A', 'clubs'], ['K', 'diamonds']], ['all-or-nothing', 'lucky-horseshoe'], 2);
  state.trainIndex = 2;
  state.carriageIndex = 2;
  state = stand(state);
  assert.ok(state.trainLoot >= TRAINS[2].target);
  assert.match(getGuideMessage(state).text, /pocketed\. This is the final train/);
  assert.match(getGuideMessage(state).text, /final train—finish it to win/);
  assert.match(getGuideMessage(state).hint, /Finish the job to win. No side job required/);
  state = advance(state);
  assert.equal(state.phase, 'won');
  assert.equal(getGuideMessage(state).mood, 'cheer');
  assert.match(getGuideMessage(state).title, /made it west/);
  state = playing([['2', 'clubs'], ['3', 'hearts']]);
  state.carriageIndex = 2;
  state = stand(state);
  assert.match(getGuideMessage(state).hint, /short of the target.*end this run/);
  state = advance(state);
  assert.equal(state.phase, 'lost');
  assert.equal(getGuideMessage(state).mood, 'concern');
  assert.match(getGuideMessage(state).text, /\$23 of the \$200 needed/);
  assert.match(getGuideMessage(state).hint, /reputation stays/);
});
