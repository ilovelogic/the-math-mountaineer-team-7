# content/

Data only, no logic: the level steps, dialogue scripts, shop text and settings (point values, medal limits, toggles).

Imports nothing. Change a number here instead of in code.

---

## Table of Contents

- [Overview](#overview)
- [levels](#levels)
- [dialogueScripts](#dialoguescripts)
- [settings](#settings)

---

## Overview

Anything we expect to change while writing the story or playtesting lives here, so changing it means editing a list, not digging through game code. Other folders read from here; nothing here reads from anywhere else.

---

## levels

**Purpose**\
The game's script: every step in the order the player meets it. GameFlow plays these one at a time and saves a checkpoint after each.

**The kinds of steps**
   - `title`: The title screen.
   - `dialogue`: A story scene, named by its key in `dialogueScripts`.
   - `chasm`: One chasm, with its level, topic and position within the level. The problem itself is built from the game's seed, so every game gets different chasms.
   - `levelDone`: The end of a level. GameFlow picks the "all points" or "under 100%" message from the level's points.
   - `medal`: The end screen.

**The current script**\
The title, the intro and "how crossing works" scenes, then three levels of five chasms each. Levels 1 and 2 end with a Level done step, and Level 3 goes straight to the medal. Each chasm is its own step, so a closed tab loses at most one chasm.

---

## dialogueScripts

**Purpose**\
The story text, one scene per key. Each scene is a list of boxes, and each box has a speaker and a line of text. Today there are two scenes: `intro` (the avalanche and the missing friend) and `howCrossingWorks` (how to pick a log).

**Adding a scene**\
Add a new key with its boxes, then add a `dialogue` step naming that key in `levels`.

---

## settings

**Purpose**\
Values we expect to tweak while playtesting, each with a comment saying what it does. Today that's `pointsPerChasm` (10, matching the "+10" in the mockups). Medal limits and feature toggles will join it as those features land.
