import { TRAINS, SIDE_JOBS, handTotal, payout, pocket, bustRisk } from './game.js';

const money = (value) => `$${value.toLocaleString('en-US')}`;
const message = (mood, eyebrow, title, text, hint, emphasis = null) => ({ mood, eyebrow, title, text, hint, emphasis });

export function getTrainBriefing(trainIndex) {
  if (!Number.isInteger(trainIndex) || !TRAINS[trainIndex]) throw new RangeError('Unknown train.');
  const train = TRAINS[trainIndex];
  const rule = train.modifier === 'none'
    ? 'Draw cards for more loot, then cash out at 21 or less.' : train.description;
  return message('welcome', `JOB ${trainIndex + 1} OF ${TRAINS.length}`, train.name,
    `You need ${money(train.target)} across three carriages. ${rule}`,
    'Choose one free piece of gear. The cash target is required; the side job is optional.');
}

function resultMessage(state) {
  const train = TRAINS[state.trainIndex];
  const result = state.result;
  const shortfall = Math.max(0, train.target - state.trainLoot);
  const left = 2 - state.carriageIndex;
  const nextTrain = TRAINS[state.trainIndex + 1];
  let text = result.busted
    ? result.secured > 0
      ? `The loose loot is gone, but your pocketed ${money(result.secured)} stayed safe.`
      : 'The guards took the loose loot. Nothing was pocketed this time.'
    : `${money(result.total)} kept: ${money(result.loose)} cashed out and ${money(result.secured)} already pocketed.`;
  let hint;
  if (shortfall > 0) {
    hint = left > 0
      ? `${money(shortfall)} still needed, with ${left} ${left === 1 ? 'carriage' : 'carriages'} left. The side job is optional.`
      : `${money(shortfall)} short of the target. Finish the job to end this run; your reputation stays.`;
  } else {
    text += nextTrain
      ? ` Next up: ${nextTrain.name}. ${nextTrain.description}`
      : ' This is the final train—finish it to win the run.';
    if (left === 0) {
      hint = `Target cleared. Finish the job to ${nextTrain ? 'ride to the next train' : 'win'}. No side job required.`;
    } else if (state.sideJobComplete) {
      hint = `Both goals met. Leave now to ${nextTrain ? 'ride on' : 'win'}, or play ${left} more ${left === 1 ? 'carriage' : 'carriages'} for extra rewards.`;
    } else {
      hint = `Cash target met. Play the remaining ${left} ${left === 1 ? 'carriage' : 'carriages'} to ${nextTrain ? 'ride on' : 'win'}, or complete the optional side job to leave early.`;
    }
  }
  return message(result.busted ? 'concern' : 'cheer', `CARRIAGE ${state.carriageIndex + 1} RESULT`,
    result.busted ? result.secured > 0 ? 'Good thing we hid some cash.' : 'Well, the guards noticed.'
      : result.perfect ? 'The perfect getaway, partner.' : 'Money in the saddlebag!',
    text, hint);
}

export function getGuideMessage(state, selectedId = null) {
  if (!state) {
    return message('welcome', 'YOUR TRAIL GUIDE', "I'm Dusty. Let's ride!",
      'Draw cards for loot. Cash out at 21 or less. Pocket one find to keep its cash safe if you bust.',
      'Clear each train’s cash target to ride on. Side jobs are optional.');
  }
  if (state.phase === 'won') {
    return message('cheer', 'ALL TRAINS CLEARED', 'We made it west!',
      `${money(state.totalLoot)} earned and ${state.reputationEarned} REP gained this run. That’s a story worth telling.`,
      'Your reputation and gear unlocks carry into the next run.');
  }
  if (state.phase === 'lost') {
    const train = TRAINS[state.trainIndex];
    return message('concern', 'END OF THE LINE', 'A new trail next time.',
      `We banked ${money(state.trainLoot)} of the ${money(train.target)} needed on ${train.name}.`,
      'Your reputation stays. Try another gear choice on your next run.');
  }
  if (state.phase === 'camp') {
    const briefing = getTrainBriefing(state.trainIndex);
    const job = SIDE_JOBS.find((item) => item.id === state.sideJobId);
    return { ...briefing, hint: `Choose one free piece of gear. ${job.name} is an optional side job worth ${job.reward} REP.` };
  }
  if (state.phase === 'result') return resultMessage(state);

  const total = handTotal(state.hand);
  const score = payout(state).amount;
  const risk = bustRisk(state);
  const percent = Math.round(risk * 100);
  const selected = !state.pocketedId && state.hand.find((card) => card.id === selectedId);
  if (selected) {
    const secured = pocket(state, selected.id);
    return message('welcome', 'POCKET PREVIEW', 'Here’s the tradeoff.',
      `Pocket the ${selected.rank} of ${selected.suit} for ${money(secured.secured)} safe cash. Cash-out payout changes from ${money(score)} to ${money(payout(secured).amount)}.`,
      `Your hand total stays ${total}. That card still counts toward 21.`, 'pocket');
  }
  if (total === 21) {
    return message('cheer', 'PERFECT TOTAL', 'Twenty-one. Time to vanish.',
      `Cash out ${money(score)} now.${state.secured ? ` Your pocketed ${money(state.secured)} is already safe.` : ''}`,
      risk === 1 ? 'Every remaining card would bust this hand.' : '21 earns the best getaway multiplier. You can collect it now.', 'stand');
  }
  if (state.pocketedId) {
    const hint = risk === 0
      ? 'The next card cannot bust this hand. Draw a card for more loot.'
      : risk >= 0.6
        ? `${percent}% chance of busting on the next draw. Cash out ${money(score)} to keep the loose loot too.`
        : `Cash out ${money(score)}, or draw a card with a ${percent}% bust risk.`;
    return message(risk >= 0.6 ? 'concern' : 'welcome', 'POCKET USED', state.boostNext ? 'Fast hands, careful feet.' : 'Your stash is safe.',
      `${money(state.secured)} stays yours even if you bust. The pocketed card still counts toward 21.${state.boostNext ? ' Your next drawn card earns double loose loot.' : ''}`,
      hint, risk === 0 ? 'hit' : risk >= 0.6 ? 'stand' : null);
  }
  if (risk === 0) {
    return message('welcome', 'ROOM FOR ONE MORE', 'A safe next step.',
      `Your hand totals ${total}. None of the remaining cards can bust you on this draw.`,
      'Draw a card for more loot. A later draw may still bust, so check again afterward.', 'hit');
  }
  if (risk >= 0.6) {
    return message('concern', 'WATCH YOUR STEP', 'Getting mighty close.',
      `${percent}% of the remaining cards would bust this hand. Cash out now to collect ${money(score)}.`,
      'Still feeling bold? Select a card to preview pocketing some cash first.', 'stand');
  }
  return message('welcome', 'YOUR NEXT MOVE', 'A promising haul, partner.',
    `Your hand totals ${total}. Cash out ${money(score)}, or draw a card with a ${percent}% bust risk.`,
    'You can pocket one find first. Its cash survives a bust; its card still counts toward 21.');
}
