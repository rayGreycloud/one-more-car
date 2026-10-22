import './style.css';
import { createRun, chooseEquipment, handTotal, payout, bustRisk, pocket, hit, stand, advance, leaveTrain, EQUIPMENT, TRAINS, SIDE_JOBS } from './game.js';
import { mountGame } from './scene.js';
import { SoundEngine } from './audio.js';
import { RANKS, freshProfile, loadProfile, saveProfile, rankProgress, unlockedEquipment, earnReputation, recordRun } from './profile.js';
import { getGuideMessage, getTrainBriefing } from './guide.js';

const $ = (selector) => document.querySelector(selector);
const money = (value) => `$${value.toLocaleString('en-US')}`;
const icons = {
  train: '<path d="M4 16h17v-6h-7V4H8v8H4z"/><path d="M9 5h4v4H9zM3 16h19M15 10V7h3v3"/><circle cx="8" cy="19" r="2"/><circle cx="17" cy="19" r="2"/>',
  bag: '<path d="m8 3 1 5c-8 8-6 13 3 13s11-5 3-13l1-5-4 1zM8 8h8M12 11v7m-3-5h5m-4 3h5"/>',
  bolt: '<path d="m14 2-9 12h7l-2 8 10-13h-7z"/>',
  star: '<path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/>',
  hand: '<path d="M6 13V7a2 2 0 0 1 4 0v5-8a2 2 0 0 1 4 0v8-6a2 2 0 0 1 4 0v7l2-2c2-2 4 0 2 3l-5 7H9l-6-6c-2-3 0-5 3-2z"/>',
  diamond: '<path d="m3 8 5-5h8l5 5-9 14zM3 8h18M8 3l4 19 4-19"/>',
  shoe: '<path d="M5 3h4v10c0 5 6 5 6 0V3h4v10c0 11-14 11-14 0zM6 7h2m8 0h2M6 11h2m8 0h2"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  deck: '<rect x="7" y="3" width="13" height="17" rx="2"/><path d="M4 6H3v16h13M14 7l3 5-3 5-3-5z"/>',
  sound: '<path d="m3 9 4 0 5-5v16l-5-5H3zM16 8c3 2 3 6 0 8m3-11c5 4 5 10 0 14"/>',
  mute: '<path d="m3 9 4 0 5-5v16l-5-5H3zM17 9l5 6m0-6-5 6"/>',
};
function icon(name, size = 24) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.star}</svg>`;
}

$('#app').innerHTML = `
  <div class="page-shell">
    <header class="masthead">
      <a class="brand" href="./" aria-label="One More Car home"><span class="brand-mark">${icon('train', 31)}</span><span><span class="eyebrow">A BORDERLAND ORIGINAL</span><span class="wordmark">ONE MORE CAR<span class="brand-dot">.</span></span></span></a>
      <nav aria-label="Game controls"><button class="text-button" data-action="rules">How to play <span class="help-mark">?</span></button><button class="icon-button" id="sound-button" data-action="sound" aria-label="Enable sound" title="Enable sound">${icon('mute', 20)}</button><button class="icon-button" data-action="restart" aria-label="Start a new run" title="New run">↻</button></nav>
    </header>
    <div class="edition-line"><span>A LITTLE LUCK. A LITTLE LARCENY.</span><span>BLACKJACK • TRAIN ROBBERIES • BAD DECISIONS</span></div>
    <div class="rail-route" id="rail-route" aria-label="Your three-train route"></div>
    <main class="game-layout">
      <aside class="sidebar" aria-label="Run progress and equipment">
        <section class="job-ticket">
          <div class="ticket-art" aria-hidden="true"></div>
          <div class="eyebrow ticket-label">THE JOB <span id="train-number">01 / 03</span></div>
          <h1 id="train-name">The Sundown Local</h1>
          <p class="route" id="train-route">DRY CREEK → RED ROCK</p>
          <div class="ticket-perforation"></div>
          <div class="target-label"><span>TRAIN HAUL</span><span id="target-label">TARGET $180</span></div>
          <div class="haul-total" id="train-loot">$0<span> / $180</span></div>
          <div class="progress-track" role="progressbar" id="target-progress" aria-label="Train cash target" aria-valuemin="0" aria-valuemax="180" aria-valuenow="0"><span></span></div>
          <p class="target-note" id="target-note">Make the target in three carriages.</p>
          <div class="carriages" id="carriages" aria-label="Carriage progress"></div>
        </section>
        <button class="reputation-card" data-action="reputation" aria-label="View outlaw ranks and unlocks"><span class="eyebrow">YOUR REPUTATION <span id="rank-level">LV. 1</span></span><span class="rank-name" id="rank-name">Greenhorn</span><span class="reputation-track"><span id="reputation-fill"></span></span><span id="rank-progress">0 / 20 REP</span><small id="rank-unlock">Next: Steady Nerves</small></button>
        <section class="kit-section"><div class="section-heading"><h2>YOUR KIT</h2><span id="kit-count">0 / 3</span></div><div id="equipment-list"></div></section>
        <button class="shoe-button" data-action="shoe">${icon('deck', 23)}<span><strong id="shoe-count">52 cards in the shoe</strong><small>Inspect the remaining ranks</small></span><span>↗</span></button>
        <p class="sidebar-note">“Enough” is a word for honest folk.</p>
      </aside>
      <section class="play-area" aria-label="Blackjack table">
        <div class="table-heading"><div><span class="eyebrow" id="carriage-label">CARRIAGE 01 OF 03</span><h2 id="carriage-title">A promising start.</h2></div><div class="table-meta"><span class="rule-tag" id="rule-tag">★ AN EASY MARK</span><button class="mini-rank" id="mini-rank" data-action="reputation">LV. 1 · Greenhorn</button></div></div>
        <div class="mobile-target" id="mobile-target">Train haul $0 / $180</div>
        <div class="side-job" id="side-job"><span class="side-job-icon">${icon('star', 19)}</span><div><strong>There’s more to a job than the gold.</strong><span>Complete side jobs to grow your reputation.</span></div><span class="side-job-reward">+10 REP</span></div>
        <div class="table-frame"><div id="game-table" role="img" aria-label="Playing cards on a train carriage table. Card controls are available immediately after the canvas."></div></div>
        <div id="hand-access" class="hand-access" aria-label="Select a card to pocket"></div>
        <div class="table-ledger">
          <div class="alarm-block"><span class="eyebrow">HAND TOTAL · KEEP ≤ 21</span><div><strong id="alarm-value">—</strong><span class="out-of"> / 21</span><span class="risk-label" id="risk-label">WAITING TO BOARD</span></div><div class="alarm-track"><span id="alarm-fill"></span></div></div>
          <div class="payout-block"><span class="eyebrow">CASH OUT NOW</span><strong id="escape-value">$0</strong><span id="escape-math">Loose loot × getaway bonus</span></div>
          <div class="secured-block"><span class="eyebrow">ALREADY SAFE</span><strong id="secured-value">$0</strong><span>Yours, even if you bust.</span></div>
        </div>
        <div class="bonus-strip" id="bonus-strip" aria-label="Active equipment bonuses" hidden></div>
        <section class="guide-panel" id="guide-panel" aria-label="Dusty’s advice">
          <div class="dusty-portrait mood-welcome" id="guide-portrait" aria-hidden="true"></div>
          <div class="guide-copy"><span class="guide-name">DUSTY <span>YOUR GETAWAY GUIDE</span></span><strong id="guide-title"></strong><p id="guide-text"></p><small id="guide-hint"></small></div>
        </section>
        <div class="action-panel" id="action-panel">
          <div class="action-buttons"><button class="button button-primary" id="hit-button" data-action="hit" disabled><span class="action-copy"><strong>Draw a card</strong><small id="draw-detail">More loot. More risk.</small></span><kbd>H</kbd></button><button class="button button-escape" id="stand-button" data-action="stand" disabled><span class="action-copy"><strong id="cashout-label">Cash out</strong><small>End this hand safely</small></span><kbd>S</kbd></button><button class="button button-pocket" id="pocket-button" data-action="pocket" disabled>${icon('bag', 19)}<span class="action-copy"><strong id="pocket-label">Pocket a card</strong><small id="pocket-detail">Tap a card first</small></span><kbd>P</kbd></button></div>
          <p class="action-hint" id="action-hint">Select a card to secure its printed loot. Its alarm value stays.</p>
        </div>
        <div class="result-panel" id="result-panel" hidden></div>
        <p class="table-footnote"><span>POCKET ONCE. PUSH YOUR LUCK. DON’T GET GREEDY.</span><span>21 = PERFECT GETAWAY</span></p>
      </section>
    </main>
    <footer class="page-footer"><span>ONE MORE CAR <span class="footer-star">✦</span> THE FRONTIER DEMO</span><span id="run-stamp">THREE TRAINS BETWEEN YOU & FREEDOM</span></footer>
    <div id="announcement" class="sr-only" role="status" aria-live="polite"></div>
    <div id="reward-toast" class="reward-toast" role="status" hidden></div>
    <p id="save-notice" class="save-notice" hidden>Progress is saved for this session only. Browser storage is unavailable.</p>
  </div>
  <dialog id="game-dialog" aria-labelledby="dialog-title"><div id="dialog-content"></div></dialog>
`;

let state = null;
let selectedId = null;
let scene = null;
let dialogKind = '';
let soundEnabled = false;
const soundEngine = new SoundEngine();
let profileLoad;
try { profileLoad = loadProfile(window.localStorage); }
catch { profileLoad = { profile: freshProfile(), available: false }; }
let profile = profileLoad.profile;
let storageAvailable = profileLoad.available;
let recentPromotion = null;
let toastTimer;
let guideKey = '';
const cashCounters = new WeakMap();
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const dialog = $('#game-dialog');
const querySeed = new URLSearchParams(window.location.search).get('seed');
const linkedSeed = querySeed !== null && /^\d{1,10}$/.test(querySeed) && Number(querySeed) <= 0xffffffff ? Number(querySeed) : null;

function announce(message) { $('#announcement').textContent = message; }
function randomSeed() { return crypto.getRandomValues(new Uint32Array(1))[0]; }

function showMoney(element, value) {
  const previous = cashCounters.get(element);
  if (previous?.target === value) return;
  if (previous?.frame) cancelAnimationFrame(previous.frame);
  const counter = { target: value, value: previous?.value ?? value, frame: null };
  cashCounters.set(element, counter);
  if (!previous || reduceMotion.matches) { element.textContent = money(value); counter.value = value; return; }
  const from = counter.value;
  const started = performance.now();
  const tick = (now) => {
    const progress = Math.min(1, (now - started) / 480);
    counter.value = Math.round(from + (value - from) * (1 - (1 - progress) ** 3));
    element.textContent = money(counter.value);
    if (progress < 1) counter.frame = requestAnimationFrame(tick);
  };
  counter.frame = requestAnimationFrame(tick);
}

function persistProfile() {
  try { storageAvailable = saveProfile(window.localStorage, profile); }
  catch { storageAvailable = false; }
  $('#save-notice').hidden = storageAvailable;
}

async function enableSound(enabled) {
  try {
    soundEnabled = await soundEngine.setEnabled(enabled);
    profile.sound = soundEnabled;
    persistProfile();
    $('#sound-button').innerHTML = icon(soundEnabled ? 'sound' : 'mute', 20);
    $('#sound-button').setAttribute('aria-label', soundEnabled ? 'Mute sound' : 'Enable sound');
    $('#sound-button').title = soundEnabled ? 'Mute sound' : 'Enable sound';
  } catch { announce('Sound could not be enabled in this browser. Try the sound button again.'); }
}

function rewardToast(title, detail) {
  const toast = $('#reward-toast');
  clearTimeout(toastTimer);
  toast.innerHTML = `<div class="dusty-portrait mood-cheer" aria-hidden="true"></div><div><strong>${title}</strong><span>${detail}</span></div>`;
  toast.hidden = false;
  toastTimer = setTimeout(() => { toast.hidden = true; }, 5500);
}

function promotionBanner() {
  return recentPromotion ? `<div class="promotion-banner">${icon('star', 25)}<div><strong>Level ${recentPromotion.level} · ${recentPromotion.name}</strong><span>${recentPromotion.reward}</span></div></div>` : '';
}

function profileSummary() {
  const { rank, next } = rankProgress(profile);
  return `<div class="career-summary"><strong>LV. ${rank.level} ${rank.name} · ${profile.reputation} REP</strong><span>${next ? `${next.reputation - profile.reputation} REP until ${next.name}` : 'Frontier Legend · keep chasing your best take'}</span></div>`;
}

function guideMarkup(message, extraClass = '') {
  return `<div class="guide-panel modal-guide ${extraClass}"><div class="dusty-portrait mood-${message.mood}" aria-hidden="true"></div><div class="guide-copy"><span class="guide-name">DUSTY <span>YOUR GETAWAY GUIDE</span></span><strong>${message.title}</strong><p>${message.text}</p>${message.hint ? `<small>${message.hint}</small>` : ''}</div></div>`;
}

function renderGuide() {
  const message = getGuideMessage(state, selectedId);
  const nextKey = JSON.stringify(message);
  if (guideKey !== nextKey) {
    guideKey = nextKey;
    $('#guide-portrait').className = `dusty-portrait mood-${message.mood}`;
    $('#guide-title').textContent = message.title;
    $('#guide-text').textContent = message.text;
    $('#guide-hint').textContent = message.hint;
    $('#guide-hint').hidden = !message.hint;
    $('#guide-panel').dataset.mood = message.mood;
    if (!reduceMotion.matches) $('#guide-portrait').animate([{ transform: 'translateY(5px) rotate(-3deg)' }, { transform: 'translateY(0) rotate(0)' }], { duration: 320, easing: 'ease-out' });
  }
  for (const action of ['hit', 'stand', 'pocket']) $(`#${action}-button`).classList.toggle('guide-suggested', state?.phase === 'playing' && message.emphasis === action);
}

function showDialog(kind, html) {
  dialogKind = kind;
  $('#dialog-content').innerHTML = html;
  if (!dialog.open) dialog.showModal();
  const first = dialog.querySelector('[autofocus], button');
  first?.focus({ preventScroll: true });
  dialog.scrollTop = 0;
}

function closeDialog() {
  dialog.close();
  dialogKind = '';
}

function showWelcome() {
  showDialog('welcome', `<div class="welcome-art railroad-illustration"><span>THREE TRAINS BETWEEN YOU & FREEDOM</span></div><div class="modal-body welcome-body"><span class="eyebrow">BLACKJACK WITH A GETAWAY PLAN</span><h2 id="dialog-title">Howdy, partner.</h2>${guideMarkup({ mood: 'welcome', title: 'I’m Dusty. I’ll show you the ropes.', text: 'Collect loot without going over 21. Take $180 from the first train’s three hands to reach the next stop.', hint: 'The card number adds to your hand. The dollar amount is its loot.' })}<div class="welcome-rules"><span><b>01</b> <strong>Draw a card</strong> for more loot and a bigger hand.</span><span><b>02</b> <strong>Cash out</strong> before your hand goes over 21.</span><span><b>03</b> <strong>Pocket one card</strong> to keep its cash, even in a bust.</span></div>${profile.reputation ? profileSummary() : ''}<label class="sound-choice"><input type="checkbox" id="welcome-sound" ${profile.sound ? 'checked' : ''}> Sound effects & quiet train ambience</label><button class="button button-primary wide" data-action="start" autofocus>Let’s ride ${icon('arrow', 20)}</button><p class="modal-fine">5–10 minutes per run. Earn reputation and unlock gear. No real money.</p></div>`);
}

function showCamp() {
  const train = TRAINS[state.trainIndex];
  const job = SIDE_JOBS.find((item) => item.id === state.sideJobId);
  showDialog('camp', `<div class="camp-art railroad-illustration"><span>TRAIN ${state.trainIndex + 1} OF 3</span><strong>${train.name}</strong></div><div class="modal-body"><span class="eyebrow">${state.trainIndex === 0 ? 'BEFORE YOU BOARD' : 'TRAIN CLEARED · +8 REPUTATION'}</span><h2 id="dialog-title">Pick your free gear.</h2>${guideMarkup(getTrainBriefing(state.trainIndex))}${promotionBanner()}<div class="gear-choices">${state.offers.map((id) => {
    const gear = EQUIPMENT.find((item) => item.id === id);
    return `<button class="gear-choice" data-action="equip" data-id="${id}"><span class="gear-choice-icon">${icon(gear.icon, 30)}</span><span class="eyebrow">${gear.label}</span><strong>${gear.name}</strong><span>${gear.description}</span><span class="choose-label">TAKE IT ${icon('arrow', 15)}</span></button>`;
  }).join('')}</div><div class="next-job"><span>${icon('star', 29)}</span><div><strong>Optional side job · ${job.name} · +${job.reward} REP</strong><p>${job.description}</p></div></div><p class="modal-fine">Pick one item to board. Equipment works automatically and stays for this run.</p></div>`);
}

function showEnd() {
  const won = state.phase === 'won';
  showDialog('end', `<div class="end-art ${won ? 'end-win' : ''}"><div class="dusty-portrait mood-${won ? 'cheer' : 'concern'}" aria-hidden="true"></div><span>${won ? 'THE FRONTIER IS YOURS' : 'END OF THE LINE'}</span></div><div class="modal-body welcome-body"><span class="eyebrow">${won ? 'THREE TRAINS. ONE VERY GOOD STORY.' : TRAINS[state.trainIndex].name.toUpperCase()}</span><h2 id="dialog-title">${won ? 'Gone with the gold.' : 'The trail ends here.'}</h2><p class="dusty-quote">“${getGuideMessage(state).text}” <span>— Dusty</span></p><div class="end-score"><span>TOTAL TAKE</span><strong>${money(state.totalLoot)}</strong><small>${state.history.filter((item) => !item.busted).length} clean escapes · ${state.history.filter((item) => item.perfect).length} perfect getaways</small><b class="earned-rep">+${state.reputationEarned} REPUTATION THIS RUN</b><small>Best take ${money(profile.bestTake)} · ${profile.wins} successful ${profile.wins === 1 ? 'run' : 'runs'}</small></div>${promotionBanner()}${profileSummary()}<button class="button button-primary wide" data-action="new-run">Ride again ${icon('arrow', 18)}</button><button class="text-button replay-button" data-action="replay">Replay this seed with current unlocks</button></div>`);
}

function reconcileDialog() {
  if (!state) { if (dialogKind !== 'welcome') showWelcome(); }
  else if (state.phase === 'camp') { if (dialogKind !== 'camp') showCamp(); }
  else if (['won', 'lost'].includes(state.phase)) { if (dialogKind !== 'end') showEnd(); }
}

function render() {
  const focusedCard = document.activeElement?.closest('#hand-access [data-id]')?.dataset.id;
  const train = TRAINS[state?.trainIndex || 0];
  const total = state ? handTotal(state.hand) : 0;
  const playing = state?.phase === 'playing';
  const score = state ? payout(state) : { amount: 0, base: 0, escape: 1, gearMultiplier: 1 };
  $('#rail-route').innerHTML = TRAINS.map((stop, index) => {
    const complete = state?.phase === 'won' || index < (state?.trainIndex || 0);
    const current = index === (state?.trainIndex || 0) && !complete;
    return `<div class="rail-stop ${current ? 'current' : ''} ${complete ? 'complete' : ''}" ${current ? 'aria-current="step"' : ''}><span class="stop-number">${complete ? '✓' : `0${index + 1}`}</span><div><strong>${stop.name.replace('The ', '')}</strong><span>${complete ? 'CLEARED' : `${money(stop.target)} TO RIDE ON`}</span></div></div>`;
  }).join('');
  const { rank, next, fraction } = rankProgress(profile);
  $('#rank-level').textContent = `LV. ${rank.level}`;
  $('#rank-name').textContent = rank.name;
  $('#reputation-fill').style.width = `${fraction * 100}%`;
  $('#rank-progress').textContent = next ? `${profile.reputation} / ${next.reputation} REP` : `${profile.reputation} REP · LEGEND`;
  $('#rank-unlock').textContent = next ? `Next: ${next.gear ? EQUIPMENT.find((item) => item.id === next.gear).name : 'Golden table'}` : 'The frontier knows your name.';
  $('#mini-rank').textContent = `LV. ${rank.level} · ${rank.name} · ${profile.reputation} REP`;
  $('.page-shell').classList.toggle('legend-rank', rank.level === 4);
  $('#save-notice').hidden = storageAvailable;
  const job = SIDE_JOBS.find((item) => item.id === state?.sideJobId);
  if (job) {
    const ready = playing && !state.sideJobComplete && (job.id === 'inside-job' ? state.pocketedId && total >= 18 : job.id === 'long-game' ? state.hand.length >= 4 : total === 21);
    $('#side-job').classList.toggle('complete', state.sideJobComplete);
    $('#side-job').classList.toggle('ready', Boolean(ready));
    $('#side-job').innerHTML = `<span class="side-job-icon">${state.sideJobComplete ? '✓' : icon('star', 19)}</span><div><strong>${state.sideJobComplete ? 'SIDE JOB COMPLETE' : `OPTIONAL · ${job.name.toUpperCase()}`}</strong><span>${state.sideJobComplete ? `${job.name} · Your name is getting around.` : ready ? 'Ready to claim. Cash out to collect.' : job.description}</span></div><span class="side-job-reward">${state.sideJobComplete ? 'EARNED ' : '+'}${job.reward} REP</span>`;
  }
  $('#train-number').textContent = `${String((state?.trainIndex || 0) + 1).padStart(2, '0')} / 03`;
  $('#train-name').textContent = train.name;
  $('#train-route').textContent = train.place;
  $('#target-label').textContent = `TARGET ${money(train.target)}`;
  $('#train-loot').innerHTML = `${money(state?.trainLoot || 0)}<span> / ${money(train.target)}</span>`;
  const progress = $('#target-progress');
  progress.setAttribute('aria-valuemax', train.target);
  progress.setAttribute('aria-valuenow', Math.min(state?.trainLoot || 0, train.target));
  progress.querySelector('span').style.width = `${Math.min(100, ((state?.trainLoot || 0) / train.target) * 100)}%`;
  $('#target-note').textContent = (state?.trainLoot || 0) >= train.target ? state.carriageIndex === 2 ? 'Target cleared. Finish the job to collect your reward.' : state.sideJobComplete ? 'Both goals met. Leave after this hand, or stay for more.' : 'Target cleared. Finish the side job to leave early, or play the remaining carriages.' : `${money(Math.max(0, train.target - (state?.trainLoot || 0)))} to make the target.`;
  $('#carriages').innerHTML = [0, 1, 2].map((i) => {
    const record = state?.history.find((item) => item.trainIndex === state.trainIndex && item.carriageIndex === i);
    return `<div class="carriage-stop ${i === (state?.carriageIndex || 0) ? 'current' : ''} ${record ? 'completed' : ''}"><span>${record ? (record.busted ? '×' : '✓') : icon('train', 18)}</span><small>${record ? money(record.total) : `CAR ${i + 1}`}</small></div>`;
  }).join('');
  $('#kit-count').textContent = `${state?.gear.length || 0} / 3`;
  $('#equipment-list').innerHTML = [0, 1, 2].map((i) => {
    const gear = EQUIPMENT.find((item) => item.id === state?.gear[i]);
    return gear ? `<div class="kit-item ${score.bonuses?.some((bonus) => bonus.id === gear.id) ? 'active' : ''}"><span class="kit-icon">${icon(gear.icon, 24)}</span><div><strong>${gear.name}</strong><p>${gear.description}</p></div></div>`
      : `<div class="kit-empty"><span>+</span><span>${i === 0 ? 'Your first edge awaits' : `Unlock after train ${i}`}</span></div>`;
  }).join('');
  $('#shoe-count').textContent = `${state?.deck.length ?? 52} cards in the shoe`;
  $('#carriage-label').textContent = `HAND ${(state?.carriageIndex || 0) + 1} OF 3 · TRAIN ${(state?.trainIndex || 0) + 1} OF 3`;
  $('#carriage-title').textContent = state?.result?.busted ? 'The guards caught on.' : total === 21 ? 'The perfect moment.' : ['A promising start.', 'Still feeling lucky?', 'One last score.'][state?.carriageIndex || 0];
  $('#rule-tag').textContent = `★ ${train.rule.toUpperCase()}`;
  $('#rule-tag').title = train.description;
  $('#mobile-target').textContent = `Train haul ${money(state?.trainLoot || 0)} / ${money(train.target)} · ${train.name}`;
  $('#alarm-value').textContent = state?.hand.length ? total : '—';
  $('#alarm-value').classList.toggle('danger', total > 21);
  $('#alarm-fill').style.width = `${Math.min(100, total / 21 * 100)}%`;
  $('#alarm-fill').style.backgroundColor = total > 21 ? '#b84732' : total >= 18 ? '#b47e35' : '#5f7757';
  $('#risk-label').textContent = playing ? `${Math.round(bustRisk(state) * 100)}% BUST RISK` : state?.result?.busted ? 'BUSTED' : state?.result ? 'MADE IT OUT' : 'WAITING TO BOARD';
  showMoney($('#escape-value'), state?.result?.loose ?? score.amount);
  $('#escape-math').textContent = `${money(score.base)} × ${Number((score.escape * score.gearMultiplier).toFixed(3))}`;
  showMoney($('#secured-value'), state?.secured || 0);
  const bonuses = score.bonuses || [];
  $('#bonus-strip').hidden = !bonuses.length || !state?.hand.length;
  $('#bonus-strip').innerHTML = bonuses.map((bonus) => `<span class="bonus-badge ${bonus.id === 'federal-escort' ? 'penalty' : ''}">${bonus.label}<b>${bonus.detail}</b></span>`).join('');
  $('#hit-button').disabled = !playing;
  $('#stand-button').disabled = !playing;
  $('#draw-detail').textContent = playing ? `${Math.round(bustRisk(state) * 100)}% chance to bust` : 'More loot. More risk.';
  $('#cashout-label').textContent = playing ? `Cash out ${money(score.amount)}` : 'Cash out';
  const selected = state?.hand.find((card) => card.id === selectedId);
  $('#pocket-button').disabled = !playing || Boolean(state.pocketedId) || !selected;
  $('#pocket-label').textContent = state?.pocketedId ? 'Pocket used' : selected ? `Pocket ${money(selected.loot * (state.gear.includes('false-bottom') ? 2 : 1))}` : 'Pocket a card';
  $('#pocket-detail').textContent = state?.pocketedId ? 'Once per hand' : selected ? 'Keep this cash through a bust' : 'Tap a card first';
  $('#action-hint').textContent = state?.pocketedId ? `${money(state.secured)} is safe.${state.boostNext ? ' Fast Hands: your next find is worth double.' : ''} The card still counts toward 21.` : selected ? `Keep ${money(selected.loot * (state.gear.includes('false-bottom') ? 2 : 1))} now. Cash-out payout: ${money(score.amount)} → ${money(payout(pocket(state, selectedId)).amount)}. Hand total stays ${total}.` : 'Tap a card to preview pocketing it. The cash stays safe; the card still counts toward 21.';
  $('#action-panel').hidden = state?.phase === 'result';
  const resultPanel = $('#result-panel');
  resultPanel.hidden = state?.phase !== 'result';
  if (state?.result) {
    const result = state.result;
    resultPanel.classList.toggle('busted', result.busted);
    const canLeave = state.carriageIndex < 2 && state.sideJobComplete && state.trainLoot >= train.target;
    resultPanel.innerHTML = `<div><span class="eyebrow">${result.busted ? 'FORCED TO FLEE' : result.perfect ? 'A PERFECT GETAWAY' : 'CLEAN GETAWAY'}</span><h3>${result.busted ? `${money(result.secured)} made it out.` : `${money(result.total)} in the saddlebag.`}</h3><p>${result.busted ? 'Loose loot lost. Anything pocketed stays yours.' : `${money(result.loose)} from your escape + ${money(result.secured)} already pocketed.`}</p><span class="result-rep">+${result.reputation} REP${result.sideJobCompleted ? ` · ${job.name} complete!` : ''}</span></div><div class="result-actions"><button class="button ${result.busted ? 'button-escape' : 'button-primary'}" data-action="advance">${state.carriageIndex < 2 ? 'Next carriage' : 'Finish the job'} ${icon('arrow', 18)}</button>${canLeave ? '<button class="text-button" data-action="leave">Both goals met · Leave train now ↗</button>' : ''}</div>`;
  }
  $('#hand-access').innerHTML = state?.hand.map((card, index) => `<button data-action="select" data-id="${card.id}" aria-pressed="${selectedId === card.id}" ${!playing || state.pocketedId ? 'disabled' : ''}>Card ${index + 1}: ${card.rank} of ${card.suit}, loot ${money(card.loot)}${state.pocketedId === card.id ? ', pocketed' : ''}</button>`).join('') || '';
  $('#run-stamp').textContent = state ? `RUN #${state.seed} · TOTAL TAKE ${money(state.totalLoot)}` : 'THREE TRAINS BETWEEN YOU & FREEDOM';
  $('.table-frame').classList.toggle('many-cards', (state?.hand.length || 0) >= 4);
  $('.table-frame').classList.toggle('crowded-cards', (state?.hand.length || 0) >= 7);
  renderGuide();
  scene?.sync(state, selectedId);
  soundEngine.setDanger(playing ? bustRisk(state) : 0);
  soundEngine.setScene(!state ? 'welcome' : ['won', 'lost'].includes(state.phase) ? 'end' : state.phase);
  if (focusedCard && playing && !state.pocketedId) {
    [...$('#hand-access').children].find((button) => button.dataset.id === focusedCard)?.focus({ preventScroll: true });
  }
}

function start(seed) {
  closeDialog();
  selectedId = null;
  recentPromotion = null;
  $('#reward-toast').hidden = true;
  state = createRun(seed, unlockedEquipment(profile));
  render();
  reconcileDialog();
}

function updateState(next, cue) {
  if (next === state) return;
  const boarding = next.phase === 'playing' && (state.phase === 'camp' || next.carriageIndex !== state.carriageIndex);
  const rewards = next.rewards.filter((item) => !state.rewards.some((old) => old.id === item.id));
  const amount = rewards.reduce((sum, item) => sum + item.amount, 0);
  const earned = earnReputation(profile, amount);
  profile = earned.profile;
  if (['won', 'lost'].includes(next.phase) && next.phase !== state.phase) profile = recordRun(profile, next);
  if (amount || ['won', 'lost'].includes(next.phase)) persistProfile();
  if (earned.promotions.length) recentPromotion = earned.promotions.at(-1);
  state = next;
  if (!state.hand.some((card) => card.id === selectedId) || state.phase !== 'playing' || state.pocketedId) selectedId = null;
  render();
  reconcileDialog();
  if (boarding) {
    const compactDesktop = window.matchMedia('(min-width: 821px) and (max-height: 850px)').matches;
    $(compactDesktop ? '.table-frame' : '.play-area').scrollIntoView({ block: 'start' });
  }
  const resultCue = state.phase === 'won' ? 'win' : state.phase === 'lost' ? 'lose' : state.phase === 'result' ? (state.result.busted ? 'bust' : state.result.perfect ? 'perfect' : 'escape') : cue;
  soundEngine.play(earned.promotions.length ? 'levelup' : state.result?.sideJobCompleted && state.phase === 'result' ? 'contract' : resultCue, { value: state.result?.total });
  if (earned.promotions.length) {
    rewardToast(`LEVEL UP · ${recentPromotion.name.toUpperCase()}`, recentPromotion.reward);
    scene?.celebrate('rank', { label: `LEVEL ${recentPromotion.level} · ${recentPromotion.name.toUpperCase()}` });
  } else if (state.phase === 'result' && state.result.sideJobCompleted) {
    rewardToast('SIDE JOB COMPLETE · +10 REP', SIDE_JOBS.find((item) => item.id === state.sideJobId).name);
    scene?.celebrate('contract', { amount: 10, label: 'SIDE JOB COMPLETE' });
  }
  const guide = getGuideMessage(state, selectedId);
  announce(`Dusty: ${guide.title} ${guide.text} ${guide.hint}${amount ? ` ${amount} reputation earned.` : ''}`);
}

function moveOn(transition) {
  let next = transition(state, unlockedEquipment(profile));
  // Train-clear reputation may unlock gear for this very camp. Recompute the
  // pure transition before committing, so no reward or RNG draw is applied twice.
  if (next.phase === 'camp') {
    const amount = next.reputationEarned - state.reputationEarned;
    next = transition(state, unlockedEquipment(earnReputation(profile, amount).profile));
  }
  updateState(next, 'deal');
}

function selectCard(id) {
  if (dialog.open || state?.phase !== 'playing' || state.pocketedId) return;
  selectedId = selectedId === id ? null : id;
  render();
  if (selectedId) announce('Card selected. Press P or choose Pocket to secure it.');
}

function showRules() {
  showDialog('rules', `<div class="modal-body"><div class="modal-heading"><span class="eyebrow">DUSTY’S FIELD GUIDE</span><button class="icon-button" data-action="close" aria-label="Close instructions">×</button></div><h2 id="dialog-title">Know when to leave.</h2><div class="how-card"><div class="sample-card"><strong>9 ♦</strong><span>$27 LOOT</span></div><p><b>Two numbers. Two jobs.</b><br>The 9 adds to your hand total. The $27 adds to your loot. Keep your total at 21 or less.</p></div><div class="rules-list"><p><b>Draw a card</b> for more loot. Number cards count as printed, faces as 10, and aces as 1 or 11. Aces adjust automatically. Above 21, you bust and lose loose loot.</p><p><b>Cash out</b> to end the hand and keep the payout shown. The closer you get to 21, the better the multiplier.</p><p><b>Pocket one card</b> by selecting it first. Its printed loot is immediately safe, even in a bust. The card still counts toward 21, but no longer earns loose-loot bonuses. The preview shows the tradeoff before you choose.</p><p><b>Clear three trains.</b> Each has three hands and its own cash target. Choose free gear before boarding; it works automatically and stacks throughout the run. Side jobs earn extra reputation, but are optional.</p></div><div class="multiplier-table"><span>TOTAL</span><span>2–11</span><span>12–15</span><span>16–17</span><span>18–20</span><span>21</span><b>PAYOUT</b><b>×1</b><b>×1.25</b><b>×1.75</b><b>×2.5</b><b>×4</b></div><p class="modal-fine">Gear and the Federal Escort can change these multipliers. The payout preview includes them. Fractional dollars round down. Each train starts a fresh 52-card deck, shared across its three hands.</p><p class="keyboard-guide"><kbd>H</kbd> Draw <kbd>S</kbd> Cash out <kbd>1–9</kbd> Select a card <kbd>P</kbd> Pocket <kbd>Enter</kbd> Next carriage</p><button class="button button-escape wide" data-action="close">Got it. Let’s ride.</button></div>`);
}

function showShoe() {
  if (!state || state.phase === 'camp') return;
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  showDialog('shoe', `<div class="modal-body"><div class="modal-heading"><span class="eyebrow">COUNTING ISN’T CHEATING</span><button class="icon-button" data-action="close" aria-label="Close remaining deck">×</button></div><h2 id="dialog-title">What’s left in the shoe.</h2><p>${state.deck.length} cards remain. Every drawn card stays out until the next train.</p><div class="rank-grid">${ranks.map((rank) => `<div><strong>${rank}</strong><span>${state.deck.filter((card) => card.rank === rank).length} left</span></div>`).join('')}</div><p class="modal-fine">Bust risk is calculated from these remaining cards and your current hand. The draw order stays hidden.</p><button class="button button-escape wide" data-action="close">Back to the job</button></div>`);
}

function showReputation() {
  const current = rankProgress(profile).rank;
  showDialog('reputation', `<div class="modal-body"><div class="modal-heading"><span class="eyebrow">A NAME THAT TRAVELS</span><button class="icon-button" data-action="close" aria-label="Close reputation">×</button></div><h2 id="dialog-title">From greenhorn to legend.</h2><p>Every carriage builds your reputation, even when the job goes wrong. Your rank and equipment unlocks stay between runs.</p>${profileSummary()}<div class="rank-trail">${RANKS.map((rank) => `<div class="rank-stop ${current.level >= rank.level ? 'unlocked' : ''}"><span class="rank-badge">${current.level >= rank.level ? '★' : rank.level}</span><div><strong>${rank.name} <small>${rank.reputation} REP</small></strong><p>${rank.reward}</p></div></div>`).join('')}</div><div class="rep-guide"><span>Finish a carriage <b>+2</b></span><span>Clean getaway <b>+2</b></span><span>Perfect 21 <b>+3</b></span><span>Side job <b>+10</b></span><span>Clear a train <b>+8</b></span><span>Make it west <b>+12</b></span></div><p class="modal-fine">Rewards add together. New equipment is offered at camp; every run starts with an empty kit. Leave a train early only after its cash target and side job are complete—you skip the remaining carriage rewards. Progress is stored in this browser.</p><button class="button button-escape wide" data-action="close">Back to the trail</button></div>`);
}

async function action(name, element) {
  if (name === 'start') {
    const enabled = $('#welcome-sound').checked;
    await enableSound(enabled);
    return start(linkedSeed ?? randomSeed());
  }
  if (name === 'new-run') return start(randomSeed());
  if (name === 'replay') return start(state.seed);
  if (name === 'equip') { const next = chooseEquipment(state, element.dataset.id); recentPromotion = null; closeDialog(); return updateState(next, 'equip'); }
  if (name === 'close') { closeDialog(); return reconcileDialog(); }
  if (name === 'rules') return showRules();
  if (name === 'shoe') return showShoe();
  if (name === 'reputation') return showReputation();
  if (name === 'restart') {
    if (!state) return showWelcome();
    return showDialog('restart', `<div class="modal-body"><span class="eyebrow">LEAVING SO SOON?</span><h2 id="dialog-title">Start a fresh run?</h2><p>Your current haul and equipment will be left behind. Earned reputation and unlocks stay with you.</p><div class="confirm-buttons"><button class="button button-primary" data-action="new-run">New run</button><button class="button button-escape" data-action="close" autofocus>Keep riding</button></div></div>`);
  }
  if (name === 'sound') {
    await enableSound(!soundEnabled);
    if (soundEnabled) soundEngine.play('pocket');
    return;
  }
  if (dialog.open) return;
  if (name === 'select') return selectCard(element.dataset.id);
  if (!state) return;
  if (name === 'hit') return updateState(hit(state), 'deal');
  if (name === 'stand') return updateState(stand(state), 'escape');
  if (name === 'pocket' && selectedId) return updateState(pocket(state, selectedId), 'pocket');
  if (name === 'advance') return moveOn(advance);
  if (name === 'leave') return moveOn(leaveTrain);
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (button && !button.disabled) action(button.dataset.action, button);
});

document.addEventListener('keydown', (event) => {
  if (dialog.open || event.repeat || event.ctrlKey || event.metaKey || event.altKey || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
  const key = event.key.toLowerCase();
  if (/^[1-9]$/.test(key) && state?.hand[Number(key) - 1]) { event.preventDefault(); selectCard(state.hand[Number(key) - 1].id); }
  const commands = { h: 'hit', s: 'stand', p: 'pocket' };
  if (commands[key]) { event.preventDefault(); action(commands[key]); }
  if (key === 'enter' && state?.phase === 'result' && event.target.tagName !== 'BUTTON') { event.preventDefault(); action('advance'); }
});

dialog.addEventListener('cancel', (event) => {
  event.preventDefault();
  if (['rules', 'shoe', 'restart', 'reputation'].includes(dialogKind)) { closeDialog(); reconcileDialog(); }
});

mountGame(selectCard, (readyScene) => {
  scene = readyScene;
  $('#game-table canvas')?.setAttribute('aria-hidden', 'true');
  render();
});
render();
showWelcome();
