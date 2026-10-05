# One More Dive

A blackjack roguelike about deep-sea salvage in a tiny, patched-together submarine exploring a flooded city.

The central temptation: **there is something valuable down there, and your submarine can probably handle one more thing.**

## Core gameplay

Every card represents an object recovered from the wreck: a rusted engine, a porcelain bathtub, or a mysterious sealed box. Its number represents the **strain it puts on the submarine**.

- **Hit:** recover another object and add its strain to the current total.
- **Stand:** surface with the current haul.
- **Bust:** exceed 21 strain and trigger an emergency ascent, losing that dive's cargo.

The distinctive mechanic is **jettisoning**. Once per dive, throw one recovered card overboard to remove its strain, sacrificing its value. This adds a decision beyond hit or stand: *which part of this promising haul should you abandon to keep going?*

## What makes the concept distinctive

### A wreck is a finite deck

Each wreck gives you several dives to meet a salvage quota. The deck does not reset between dives, so recovering heavy objects changes the odds on later dives. You gradually learn what remains below.

### Equipment changes what is worth keeping

Choose equipment between wrecks to build different relationships with risk. For example:

- **Crusher:** throwing away machinery doubles the next object's payout.
- **Museum contract:** relics become extremely valuable, provided you finish the dive without jettisoning anything.

The strongest gameplay hook is **sacrificing part of your haul to make the rest more valuable**.

### Wrecks change the rules

Environmental conditions make you reconsider an established strategy. For example:

- **Magnetic research station:** metal objects put more strain on the submarine.
- **Collapsing hotel:** fewer dives are available to meet the quota.

## Theme and presentation

**Cozy machinery above, eerie discoveries below.**

Use chunky switches, a pressure gauge, a cluttered cargo hold, and strange objects emerging from darkness. The submarine visibly fills with the things you collect.

## First prototype

Keep the initial version small:

- Hit, surface, and one jettison per dive.
- Cards with a strain number and one of four salvage types.
- Three dives to meet a quota.
- A choice of equipment between wrecks.

Test whether the jettison decision feels good before adding a larger upgrade system.
