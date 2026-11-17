# model/

Maintains the game state and math in plain TypeScript. From it, get the chasm and duel problems, the zipline problem, rules, medals, the Level done messages, `Dialogue`, `PlayerProgress` and `SaveStore`.

Never imports Konva, `view/` or `controller/`, so every model runs in Vitest without a browser. Take seeds and times as parameters instead of calling `Math.random()` or `Date.now()`.

---

## Table of Contents

- [Overview](#overview)
- [PlayerProgress](#playerprogress)
- [Dialogue](#dialogue)
- [problems](#problems)
- [zipline](#zipline)
- [rules](#rules)
- [levelDone](#leveldone)
- [medals](#medals)
- [SaveStore](#savestore)
- [Still to come](#still-to-come)

---

## Overview

The model is everything the game knows, kept apart from all it draws. It may read `content/` (e.g., `rules` reads point values from `content/settings`), but nothing in here is aware that screens exist. That's what lets each file in this folder be tested with plain inputs and outputs.

Two decisions are essential to the folder:
   - **Nothing random or time-based is read directly.** Problems come from a seed, and `Dialogue` is handed the click's time. As a result, the same inputs always give the same result, in the game and in tests.
   - **Only GameFlow changes progress.** Everything else reads it through a read-only view, so there's one place where points and steps can change.

---

## PlayerProgress

**Purpose**\
Where the player is and how they're doing. Here, we have the game's seed, the current level, step and topic, the points so far, and every answer they've given. GameFlow owns it and is the only thing that changes it.

**What it holds**
   - `seed`: Picked once when a game starts and never changed. Every chasm is rebuilt from it, so a saved game gets the same chasms back.
   - `level`, `step`, `topic`: Where the player is. `step` is a position in the game's list of steps in `content/levels`.
   - `points`: The running total.
   - `answers`: Every pick so far, oldest first, each recording the step it was made on, that step's level and topic, and whether the log fit, was too short or was too long. Only a log that fits is right.
   - `levelAttempts`: The score of every finished attempt at each level, oldest first, so a retry adds to the list instead of replacing the earlier score.

**How it changes**
   - **`addPoints`** adds to the total. Zero is allowed, since a wrong pick earns nothing, but a negative number is refused.
   - **`moveTo`** goes to another step, and also changes the level and topic when a new level starts.
   - **`recordAnswer`** adds a pick to `answers`, with the current level and topic.
   - **`removePoints`** takes points back when the player restarts a level, so its points can be earned again. The answers stay, since they're the record of every pick, and it never takes more than the player has.
   - **`recordLevelAttempt`** adds a finished attempt's level and points to `levelAttempts`. GameFlow calls it after the last chasm of each level.

**Saving**\
`toJSON` turns the progress into plain data that's safe to store, and `fromJSON` rebuilds it, refusing anything that isn't a valid save. The saved data carries a version number, so a later save format can tell old saves apart. Version 2 added each answer's level and topic, so a version 1 save is refused and the player starts a new game. Within version 2, a save from before `levelAttempts` existed loads with an empty list.

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
Every chasm offers three logs: the one that fits (the hypotenuse, `c`) and two wrong lengths, shuffled. The wrong logs are always different from `c` and from each other. Each could be too short or too long, so a chasm can have two logs that are both shorter than the correct one.

**Checking a pick**\
**`checkPick`** compares the picked log to `c` and reports `'fits'`, `'tooShort'` or `'tooLong'`.

**The worked steps**\
**`solutionSteps`** gives the three lines the "How to find the right log" page shows for a chasm, using its own numbers: `c² = a² + b²`, then the squares filled in and added, then the square root and the log that fits (for 5 and 12, `c = √169 = 13 m. The 13 m log fits.`).

**The duel question**\
**`makeDuelQuestion`** takes the game's seed and gives the supply shop's duel: one of Level 1's triangles (since winning skips Level 1, and small numbers suit a timed race) with three answers, `c` and two wrong ones made by **`answerChoices`**. `correct` is where `c` sits.

**Answer choices**\
**`answerChoices`** makes the three answers for the duel and the zipline: the right one and two wrong ones, each 1 to 3 away from it and different from each other, shuffled. The right answer is equally likely to be the smallest, middle or largest of the three, so always picking the middle number doesn't win. The chasm logs don't use it, since their wrong logs are meant to range much further from `c`.

**Seeded random numbers**\
**`makeRng`** turns a seed into a generator of random numbers that repeat exactly for the same seed. That's what makes a saved game and a test both reproducible.

---

## zipline

**Purpose**\
Makes the clothing shop's zipline problem and checks the player's guess (#61). The store is a box, and the zip line runs along its space diagonal, from the top corner by the office to the exit at the opposite bottom corner, so this is the Pythagorean theorem in 3D.

**Where the numbers come from**\
`ziplineBoxes` lists boxes whose diagonal is a whole number, such as 2 × 3 × 6 with a diagonal of 7, leaving out boxes that wouldn't look like a store. **`makeZiplineProblem`** takes the game's seed, picks one of them, and makes three guesses with `answerChoices` (each wrong one within 3 of the diagonal). `correct` is where the diagonal sits, and the same seed always gives the same problem, so a loaded save shows the same one.

**Checking a guess**\
**`checkZiplineAnswer`** says whether the guess at a position is the diagonal, and refuses a position that isn't one of the three.

**Filling in the text**\
**`fillZiplineText`** puts the problem's numbers into a page's text from `content/ziplineText`, wherever it says `{length}`, `{width}`, `{height}`, `{floor}` (length² + width²), `{squared}` (the diagonal²) or `{diagonal}`. Anything else in braces is left alone.

---

## rules

**Purpose**\
Small, pure rules that turn outcomes into points and, later, into decisions about what happens next.

**Points**\
**`pointsFor`** gives the points for a pick: only the log that fits earns any, and how many comes from `content/settings` (10 per chasm today). A log that's too short falls into the chasm, and one that's too long smashes the item waiting on the other side, so neither earns points.

**`ziplinePoints`** gives the points for the zipline guess: `pointsPerZipline` from `content/settings` (50) for the right answer, and nothing for a wrong one. Leaving the shop before guessing never reaches it, so it earns nothing too.

**Results by topic**\
**`isRight`** says whether a pick was right, which only the log that fits is. **`resultsByTopic`** takes the progress's `answers` and gives, for each topic in the order it was first played, its level, how many picks were right and how many were made. Every pick counts, including ones made again after a level restart. The end screen shows these counts.

---

## levelDone

**Purpose**\
Gives GameFlow the dialogue for the end of Levels 1 and 2.

**How it works**\
**`levelDoneLines`** takes the level, the points earned on that level alone (not the game's total), and the most the player could have earned on it. A player with every point is congratulated with one button to continue, and anyone short of that is offered a restart. The words themselves live in `content/dialogueScripts`, with `{level}` marking where the level number goes.

**The choices**\
On the restart offer, choice 0 restarts the level and choice 1 moves on. GameFlow reads the choice by its position, so a test pins that order, and reordering the buttons in content fails it instead of quietly changing what they do.

---

## medals

**Purpose**\
Turns the final points into a medal, which is diamond, gold, silver, bronze, or none.

**How it works**\
**`medalFor`** takes the points and the medal limits from `content/settings` (150, 135, 105 and 75 today), and gives the best medal whose limit the points reach. It refuses negative points, and limits that don't strictly decrease from diamond down to bronze, since either one means a mistake somewhere else.

---

## SaveStore

**Purpose**\
Puts one checkpoint into the browser's storage and gets it back, so closing the tab doesn't lose the player's progress.

**The storage is passed in**\
In the game, `main.ts` passes in the browser's `localStorage`. In the tests, a pretend storage stands in, one that can be empty, hold garbage, or refuse to work, so every failure case is tested without a browser.

**When something goes wrong**\
**`save`** fails quietly if storage is blocked. **`load`** returns `null` when there's no save, when the save can't be read, or when it isn't a valid save, since it checks each one with `PlayerProgress.fromJSON`. As a result, anything `load` does return is safe to continue from.

---

## Still to come

   - **More rules**: Skipping a level after winning the duel (#58), and the easier round after struggling (#88), which will read `levelAttempts`.
