# model/

Game state and math in plain TypeScript: problems, rules, medals, `Dialogue`, `PlayerProgress` and `SaveStore`.

Never imports Konva, `view/` or `controller/`, so every model runs in Vitest without a browser. Take seeds and times as parameters instead of calling `Math.random()` or `Date.now()`.

---

## Table of Contents

- [Overview](#overview)
- [PlayerProgress](#playerprogress)
- [Dialogue](#dialogue)
- [problems](#problems)
- [rules](#rules)
- [Still to come](#still-to-come)

---

## Overview

The model is everything the game *knows*, kept apart from everything it *draws*. It may read `content/` (for example, `rules` reads point values from `content/settings`), but nothing in here knows that screens exist. That's what lets every file in this folder be tested with plain inputs and outputs.

Two habits hold the folder together:
   - **Nothing random or time-based is read directly.** Problems come from a seed, and `Dialogue` is handed the click's time. So the same inputs always give the same result, in the game and in tests.
   - **Only GameFlow changes progress.** Everything else reads it through a read-only view, so there's one place where points and steps can change.

---

## PlayerProgress

**Purpose**\
Where the player is and how they're doing: the game's seed, the current level, step and topic, the points so far, and every answer they've given. GameFlow owns it and is the only thing that changes it.

**What it holds**
   - `seed`: Picked once when a game starts and never changed. Every chasm is rebuilt from it, so a saved game gets the same chasms back.
   - `level`, `step`, `topic`: Where the player is. `step` is a position in the game's list of steps in `content/levels`.
   - `points`: The running total.
   - `answers`: Every pick so far, oldest first, each recording the step it was made on and whether the log fit, was too short or was too long.

**How it changes**
   - **`addPoints`** adds to the total. Zero is allowed, since a wrong pick earns nothing; a negative number is refused.
   - **`moveTo`** goes to another step, and also changes the level and topic when a new level starts.
   - **`recordAnswer`** adds a pick to `answers`.

**Saving**\
`toJSON` turns the progress into plain data that's safe to store, and `fromJSON` rebuilds it, refusing anything that isn't a valid save. The saved data carries a version number, so a later save format can tell old saves apart.

**ProgressView**\
A read-only version of the type, with the values and none of the methods. The Hud and screens receive this, so they can show progress but can't change it.

---

## Dialogue

**Purpose**\
Remembers which dialogue box the player is on. Each accepted click moves forward exactly one box, and clicks that arrive during a short transition after a box changes are ignored, so a fast double click never skips a box.

**How it's used**\
A controller creates one per scene from that scene's lines and the transition length, then on each click asks it to **`advance`**, passing the time of the click. `advance` says whether the click counted, so the controller knows to redraw. **`current`** gives the box to show, and **`isFinished`** turns true once the player clicks past the last box. A box can carry `choices`, which is how a scene ends with buttons, as on the Level done screens.

---

## problems

**Purpose**\
Makes the chasms and checks the player's pick.

**Where the numbers come from**\
Each level has a list of five whole-number right triangles (`triplesByLevel`), such as 3-4-5 and 5-12-13 in Level 1, with larger numbers in later levels. **`makeChasm`** takes the game's seed, the level and the chasm's position in that level. It shuffles the level's triangles using the seed, so every game meets them in a different order, then picks the one at that position.

**The logs**\
Every chasm offers three logs: the one that fits (the hypotenuse, `c`) and two wrong lengths, shuffled. The wrong logs are always different from `c` and from each other. Each could be too short or too long, so a chasm can have two short logs.

**Checking a pick**\
**`checkPick`** compares the picked log to `c` and reports `'fits'`, `'tooShort'` or `'tooLong'`.

**Seeded random numbers**\
**`makeRng`** turns a seed into a generator of random numbers that repeat exactly for the same seed. That's what makes a saved game and a test both reproducible.

---

## rules

**Purpose**\
Small, pure rules that turn outcomes into points and, later, into decisions about what happens next.

**Points**\
**`pointsFor`** gives the points for a pick: only the log that fits earns any, and how many comes from `content/settings` (10 per chasm today). A log that's too short falls into the chasm, and one that's too long smashes the item waiting on the other side, so neither earns points.

---

## Still to come

   - **medals**: Turns the final points into a medal. In review in PR #121.
   - **SaveStore**: Saves a checkpoint after every step and loads it back when the player picks Continue (#67).
   - **More problem types**: The duel question (#56) and the 3D zipline problem (#62), each in its own file next to `problems`.
   - **More rules**: Skipping a level after winning the duel (#58), the zipline's points (#63), and the easier round after struggling (#88).
