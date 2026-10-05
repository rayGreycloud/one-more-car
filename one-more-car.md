# One More Car

An Old West blackjack roguelike about robbing moving trains across a sunbaked frontier.

**Working title.** A companion concept to [One More Dive](one-more-dive.md).

The central temptation: **you have enough to get away, but the next compartment might hold the payroll.**

## The fantasy

You are an outlaw working your way toward one final score. Each train carries a different mix of freight, valuables, and trouble. Search its carriages, pocket what you can, and escape before the guards close in.

The setting supplies the decisions: take another risk, secure a little money, or leave with a bigger haul. Your equipment determines which kind of outlaw you become.

## Core gameplay

Each carriage is one blackjack hand. Begin with two cards, then decide how thoroughly to search it.

Every card represents a find and shows two things: its **blackjack value**, which contributes to the alarm total, and its **dollar value**, which contributes to the haul. Number cards use their number, face cards count as 10, and aces count as 1 or 11.

- **Hit — search another compartment:** draw a card and increase the alarm total.
- **Stand — make your escape:** collect the payout from your remaining loose loot.
- **Bust — exceed 21:** the guards force you out, and you lose the carriage's unsecured loot. The carriage is spent.
- **Exactly 21 — a perfect getaway:** earn the highest base escape multiplier.

Safe totals closer to 21 earn better escape multipliers. The proposed scoring structure is **loose loot value × escape multiplier × equipment bonuses**. The multiplier curve and dollar values need playtesting.

## The distinctive mechanic: pocket one find

Once per carriage, while your total is still safe, you may **pocket the proceeds of one card**.

- Its printed dollar value is secured immediately and survives a bust.
- It gives up the escape multiplier and any bonuses that apply to loose loot.
- The card stays visible and continues contributing to the blackjack total. Securing the money does not undo the noise you already made.
- You cannot replace the pocketed card or pocket anything after busting.

This creates a timing decision: **secure something valuable now, or keep it exposed for a larger payout?** Waiting may reveal a better find, but the next draw might bust before you can secure it.

For example, at a total of 16 you might pocket the payroll card, then risk another search. A bust preserves the payroll's basic value; a safe escape pays bonuses only on the loot you left unsecured.

## The run

Each train contains three carriages and a cash target. Money from successful escapes and pocketed finds counts toward that target. Missing it after the third carriage ends the run.

Use one 52-card shoe for the train, without reshuffling between carriages. All drawn cards leave the shoe regardless of whether their loot was collected or lost. The remaining cards become useful information for later decisions.

Between trains, stop at camp and choose equipment. Later trains demand larger payouts and introduce a clearly announced complication. Equipment choices are free rewards in the first prototype, keeping money focused on the train's target.

## Equipment creates different approaches

Illustrative effects to test:

| Equipment | Effect | Strategy |
| --- | --- | --- |
| False Bottom | Double the printed payout of your pocketed find. | Build a reliable income from insurance. |
| Fast Hands | After pocketing, double the loose-loot value of your next drawn card. | Secure something early, then keep searching. |
| All or Nothing | Double your loose-loot payout if you escape without pocketing anything. | Keep the whole haul exposed for a larger score. |
| Light Fingers | Increase the payout for escaping with five or more drawn cards. | Favor long hands with smaller values. |
| Payroll Tip | Diamonds remaining in your loose haul pay more. | Keep particular valuables exposed instead of automatically pocketing them. |
| Lucky Horseshoe | Increase the perfect-getaway bonus at exactly 21. | Build toward precise finishes. |

The strongest combinations should change **what you pocket, when you pocket it, and whether you take another card**.

## Trains change the problem

Introduce one complication at a time, announced before play:

- **Express train:** only two carriages are available to meet the target.
- **Armored payroll:** diamonds have larger dollar values, increasing the cost of securing them without a multiplier.
- **Federal escort:** safe exits below 18 receive a reduced escape multiplier.

These conditions change the risk calculation while keeping card values and legal actions readable.

## Theme and presentation

Dusty sunset colors, woodcut illustrations, worn playing cards, brass locks, and green banknotes. The table is a carriage floor rocking beneath your cards. A moving landscape and the train's rhythm make each pause feel temporary.

Pocketing a find stamps it with a saddlebag seal. As the total approaches 21, footsteps approach and carriage lamps sway. A perfect getaway gets a sharp whistle and a satisfying cascade of coins.

Keep ranks, suits, the alarm total, and secured versus exposed money clear at a glance.

## First prototype

- Three trains, each with three carriages and a cash target.
- Hit, stand, and one pocket action per carriage.
- Standard blackjack values and one finite shoe per train.
- Six equipment options with three equipment slots.
- One train complication introduced after the basic loop is understood.

The first design test is whether **pocketing feels like an interesting sacrifice**. Compare the same deals with different equipment: players should sometimes pocket early, sometimes wait, and sometimes keep everything exposed. If securing the highest-value card immediately is always best, revise the payout incentives before adding more content.
