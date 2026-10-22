# One More Car

A playable Old West blackjack roguelike built with **Phaser 3**, vanilla JavaScript, and Vite. Rob three trains, pocket one find for insurance, and reach each train's cash target.

## Run locally

Use Node.js 22.12+ (Node.js 24 recommended).

```sh
npm ci
npm run dev
```

Open the local URL Vite prints. The game supports mouse, touch, and keyboard. The welcome screen offers optional sound; audio starts only after pressing **Let’s ride**. The header sound button mutes effects and train ambience, and the choice is remembered.

## Build and preview

```sh
npm test
npm run build
npm run preview
```

The production site is generated in `dist/`. Tests use Node's built-in test runner in the current process and cover scoring, soft aces, pocket insurance, equipment, finite decks, train progression, one-time reputation rewards, side jobs, unlocks, profile persistence, and accounting across seeded runs. Phaser's bundled engine produces a size warning; the application and engine are separate cached chunks.

## Deploy to Vercel

1. Put this folder in a Git repository and import it into Vercel.
2. Set the project root to the folder containing `package.json`.
3. Use the **Vite** framework preset, **`npm run build`** as the build command, and **`dist`** as the output directory. These settings are also supplied in `vercel.json`.
4. Use Node.js **24.x** and deploy.

The app is a static site. It requires no backend, database, API keys, environment variables, or runtime asset services. Phaser, styles, illustrations, and sound generation are all bundled or generated locally. No deployment has been performed by creating these files.

## How to play

- **Draw a card / H:** draw another card. Above 21, you bust and lose unsecured loot. The button shows the current chance of busting.
- **Cash out / S:** end the hand and collect the displayed loose-loot payout.
- **Pocket / P:** first select a card by clicking it or pressing **1–9**. Pocket its printed loot once per hand. It stays safe through a bust, keeps contributing to the hand total, and no longer earns loose-loot bonuses. Dusty explains the exact payout tradeoff before you choose.
- **Enter:** advance after a resolved carriage when focus is outside another button.
- **Inspect the shoe:** see the remaining rank counts; draw order stays hidden.

Aces count as 1 or 11, face cards as 10. Three carriages share a 52-card shoe. Each train starts a fresh shoe and a new cash target; loot from earlier trains does not count toward the next train's target. Payouts round down to whole dollars.

| Hand total | Base escape multiplier |
| --- | --- |
| 2–11 | ×1 |
| 12–15 | ×1.25 |
| 16–17 | ×1.75 |
| 18–20 | ×2.5 |
| 21 | ×4 |

Choose one free equipment item before each train. Gear stacks across the run, with three slots in total. The second train carries richer diamonds; the final train halves escape multipliers below 18. The live payout preview includes active equipment and train modifiers.

Each train also has an optional **side job** worth 10 reputation: pocket and escape at 18–21, escape with four cards, or finish at exactly 21. Once both the cash target and side job are complete, you can leave early. Staying earns additional cash and carriage reputation; leaving skips those rewards. Normal train completion requires only the cash target.

## Reputation and replay

Reputation is awarded immediately: +2 for finishing a carriage (including busts), +2 more for escaping safely, +3 more for a perfect 21, +10 per completed side job, +8 per cleared train, and +12 for winning a run. These rewards stack and are granted once per event.

| Rank | Career reputation | Reward |
| --- | --- | --- |
| Greenhorn | 0 | Six starting equipment choices |
| Bandit | 20 | Steady Nerves: exactly 20 pays ×3.5 |
| Outlaw | 70 | Mixed Cargo: three unsecured suits give ×1.5 |
| Legend | 150 | Golden table and badge |

Unlocks add equipment choices; each run still starts with an empty kit. Promotions during a run put a newly unlocked item in the next camp's offers. The reputation panel shows ranks, unlocks, and reward amounts. The ending screen shows this run's reputation, career best take, and completed wins.

Reputation, unlocks, completed-run records, and sound preference are saved locally in this browser (`one-more-car.profile.v1`). There is no account or cloud sync. If browser storage is unavailable, the game reports that progress lasts only for the current session. **The active run is not saved**; refreshing starts a new run while keeping earned reputation.

For a reproducible deal, append an unsigned 32-bit seed to the URL, for example `/?seed=42`. The same seed, unlock pool, equipment choices, and actions reproduce the run. Unlocking more equipment changes camp randomization and subsequent deals. The ending screen can replay the same seed with current unlocks.

## Game feel and accessibility

Dusty, a cartoon coyote guide, welcomes the player, explains the current risk and pocketing tradeoff, reacts to hand results, and introduces each train's cash target and special rule. His welcome, cheer, and concern expressions match the advice. Suggested actions receive a visual highlight, and updates are announced through the existing screen-reader status region. Guidance uses the real scoring and remaining deck, including soft aces; it does not know the next card.

An illustrated train runs through the welcome screen, camp, and job ticket. Cargo cards have distinct gold, freight, contraband, and provisions artwork, with blackjack value and printed loot labeled separately. The route shows all three trains and marks completed stops. Artwork sources and generation prompts are recorded in [ASSETS.md](ASSETS.md).

Cards deal and turn over, pocketed loot flies into the saddlebag, escapes shower coins, perfect hands sparkle, and busts shake the table. A moving desert, passing frontier buildings, steam, and an alarm lantern bring the train to life. Synthesized card, coin, whistle, reward, and rank-up sounds require no downloaded audio. Train ambience grows slightly quicker as bust risk rises; hiding the tab or muting stops it.

Active equipment bonuses appear beside the payout. Selecting a card previews the exact insurance-versus-payout tradeoff. Keyboard card controls and status announcements accompany the canvas. The app respects the operating system's **reduced motion** preference, including card effects and cash counters.

## Project layout

- `src/game.js`: deterministic game rules, train data, and equipment effects.
- `src/scene.js`: Phaser canvas, card interaction, procedural landscape, and card illustrations.
- `src/main.js`: accessible controls, dialogs, keyboard input, progression UI, and run flow.
- `src/guide.js`: rule-aware Dusty dialogue, result explanations, and train briefings.
- `src/profile.js`: validated career profile, rank thresholds, unlocks, and local storage helpers.
- `src/audio.js`: procedural sound effects and train ambience with mute/visibility lifecycle handling.
- `src/style.css`: responsive layout and Old West presentation.
- `test/game.test.js`, `test/profile.test.js`, and `test/guide.test.js`: automated rules, career, and guidance tests.
- `public/assets/`: generated character expressions and frontier train illustration.
- `one-more-car.md`: the original concept; implementation values are defined in `src/game.js`.

Cash targets and multipliers are initial demo balance values. The key playtest question is whether equipment changes which card you pocket and when you choose to escape.
