# content/

Holds data only, with no logic, including the level steps, dialogue scripts, shop text, and settings (point values, medal limits, and toggles).

Imports nothing. Change a number here instead of in code.

---

## Table of Contents

- [Overview](#overview)
- [levels](#levels)
- [dialogueScripts](#dialoguescripts)
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

**The current script**\
Starts with the title, the intro, and the "how crossing works" scene, followed by three levels of five chasms each. Levels 1 and 2 end with a Level done step, while Level 3 goes straight to the medal. As a result of each chasm being its own step, a closed tab loses at most one chasm.

---

## dialogueScripts

**Purpose**\
Stores the story text, with one scene per key. Each scene is a list of boxes, and each box has a speaker and a line of text. Today, there are four scenes, which are `intro` (the avalanche and the missing friend), `howCrossingWorks` (how to pick a log), and the two Level done messages, `levelDoneAllPoints` and `levelDoneUnder100`. The Level done scenes mark where the level number goes with `{level}`, which `model/levelDone` fills in, so the same words serve every level.

**Adding a scene**\
Add a new key with its boxes, and then add a `dialogue` step naming that key in `levels`.

---

## settings

**Purpose**\
Keeps the values we expect to tweak while playtesting, each with a comment explaining what it does. Today, that's `pointsPerChasm` (10, matching the "+10" in the mockups), `medalLimits` (150, 135, 105 and 75, which are 100%, 90%, 70% and 50% of the 150 points a player can earn, matching the Medal requirements card), and `dialogueTransitionMs` (250, how long clicks are ignored after a dialogue box changes). Feature toggles will join them as those features land.
