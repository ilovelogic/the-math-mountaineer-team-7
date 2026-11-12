# content/

Holds data only, with no logic, including the level steps, dialogue scripts, shop text, and settings (point values, medal limits, and toggles).

Imports nothing. Change a number here instead of in code.

---

## Table of Contents

- [Overview](#overview)
- [levels](#levels)
- [dialogueScripts](#dialoguescripts)
- [shopText](#shoptext)
- [duelText](#dueltext)
- [settings](#settings)

---

## Overview

Anything we expect to change while writing the story or playtesting lives here, so that changing it means editing a list rather than digging through game code. Other folders read from here, while nothing here reads from anywhere else.

---

## levels

**Purpose**\
Lists the game's script, which is every step in the order the player meets it. GameFlow plays these one at a time and saves a checkpoint after each.

**The kinds of steps**
   - `title`: The title screen.
   - `dialogue`: A story scene, named by its key in `dialogueScripts`.
   - `chasm`: One chasm, with its level, topic, and position within the level. The problem itself is built from the game's seed, so every game gets different chasms.
   - `levelDone`: The end of a level. GameFlow picks the "all points" or "under 100%" message based on the level's points.
   - `medal`: The end screen.
   - `shopOffer`: A shop asks whether the player wants to come in, with its `shop` (`'supplies'` or `'clothing'`). It must come right before that shop's `shopGame` step, which GameFlow checks when it starts: accepting plays the mini-game, and declining skips it with no points.
   - `shopGame`: The shop's mini-game, the math duel (#55) or the zipline (#61). Neither is built yet, so the current script has no shop steps.

**The current script**\
Starts with the title, the intro, and the "how crossing works" scene, followed by three levels of five chasms each. Levels 1 and 2 end with a Level done step, while Level 3 goes straight to the medal. As a result of each chasm being its own step, a closed tab loses at most one chasm.

---

## dialogueScripts

**Purpose**\
Stores the story text, with one scene per key. Each scene is a list of boxes, and each box has a speaker and a line of text. Today, there are five scenes, which are `intro` (the avalanche and the missing friend), `howCrossingWorks` (how to pick a log), the two Level done messages, `levelDoneAllPoints` and `levelDoneUnder100`, and `titlePlaceholder` (the game's title and a Start button, which stands in for the title screen until #70). The Level done scenes mark where the level number goes with `{level}`, which `model/levelDone` fills in, so the same words serve every level. The title placeholder isn't named by any step; the screen factory plays it for the title step.

**Adding a scene**\
Add a new key with its boxes, and then add a `dialogue` step naming that key in `levels`.

---

## shopText

**Purpose**\
Stores each shop's offer: what the shop says when the player walks up to it, and the words on its accept and decline buttons, worded as in the shop offer mockups. The fields are named, so nobody has to remember which button comes first. `ACCEPT` (0) and `DECLINE` (1) are the positions the two buttons report, accept first as the teal button, and GameFlow reads the choice with them.

---

## duelText

**Purpose**\
Stores the math duel's text, one entry per page of the "Mini-game 1: Math duel" mockups (`challenge`, `tutorialOffer`, `tutorial`, `duel`, `won`, `climb`, `lost` and `solution`), each with its words and its buttons in the order they're shown. DuelShopController decides where each button leads. The duel page's buttons are the question's options, so it lists none, and the tutorial and solution text stand in until #158 draws those pages.

---

## settings

**Purpose**\
Keeps the values we expect to tweak while playtesting, each with a comment explaining what it does. Today, that's `pointsPerChasm` (10, matching the "+10" in the mockups), `medalLimits` (150, 135, 105 and 75, which are 100%, 90%, 70% and 50% of the 150 points a player can earn, matching the Medal requirements card), and `dialogueTransitionMs` (250, how long clicks are ignored after a dialogue box changes). Feature toggles will join them as those features land.
