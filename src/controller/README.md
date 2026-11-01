# controller/

Decides what happens next: which screen runs, what a choice means, when to save. `GameFlow`, the `Screen` interface and one controller per screen type live here.

May import `model/`, `view/` and `content/`. Nothing else imports from here except `main.ts`.

---

## Table of Contents

- [Overview](#overview)
- [Screen](#screen)
- [GameFlow (in progress)](#gameflow-in-progress)
- [The screen controllers (in progress)](#the-screen-controllers-in-progress)
- [Crossing one chasm, start to finish](#crossing-one-chasm-start-to-finish)

---

## Overview

This is the folder that turns everyone's screens into a game. Right now it holds one file, the `Screen` contract, which everything else is being built against. GameFlow and the controllers are the next things to land, so the sections below describe the design they follow.

<img src="../../docs/images/cc-view.png" width="900" />\
*The runtime (C&C) view: what talks to what while the game runs. Connector names match the code where it exists; components marked "Not built yet" show the design. The live version is in [Figma](https://www.figma.com/design/LLtfHewfTMLycUXFUVuyEH).*

---

## Screen

**Purpose**\
The one contract every screen controller follows, so GameFlow can run any screen the same way without knowing which one it is.

**The contract**
   - **`start`**: Draws the screen and starts listening for input. GameFlow passes in a callback, `onDone`, which the screen calls **exactly once** when it finishes.
   - **`stop`**: Removes everything the screen drew and stops listening. A stopped screen never calls `onDone`.

**What a screen reports**\
An `Outcome`: either `done`, or a `choice` with the position of the option the player picked, in the order the screen shows them. A screen reports *what the player chose*; GameFlow decides what it *means*. For example, a chasm screen reports "the second log", and GameFlow works out that it was too long.

---

## GameFlow (in progress)

**Purpose**\
Runs the whole game: it plays the steps in `content/levels` in order, one screen at a time, and decides what happens after each one. It is the only thing that changes `PlayerProgress` (#6).

**After each screen**\
It checks the choice with `model/problems`, turns it into points with `model/rules`, updates `PlayerProgress`, the Hud and the sound, and (once SaveStore lands) saves a checkpoint, so a closed tab loses at most the current chasm (#68).

**Testing it**\
GameFlow gets its screens through a function it's given, so tests can pass in stand-in screens that report a choice right away. That way it can be tested before the real screens are wired up.

---

## The screen controllers (in progress)

Each one pairs a view from `view/` with the `Screen` contract:
   - **ChasmController**: Shows one chasm, takes only the first pick, locks the logs and reports the pick (#24).
   - **DialogueController**: Shows any dialogue scene one box per click and reports when it ends, including which button was picked on a Level done screen (#18).
   - **MedalController**: Shows the earned medal at the end (#43).
   - **TitleController, DuelShopController, ZiplineShopController**: The title screen and the two shop mini-games, planned for Sprint 2.

---

## Crossing one chasm, start to finish

How one answer moves through the game, once GameFlow and ChasmController are in place:
   1. GameFlow asks `problems` for this step's chasm, from the game's seed, the level and the chasm's position.
   2. GameFlow starts the chasm screen with it.
   3. The player clicks a log. The screen locks the logs, since each chasm allows one pick, and reports the log's position through `onDone`.
   4. GameFlow asks `problems` whether that log fits, is too short or is too long.
   5. GameFlow gets the points from `rules`, adds them to `PlayerProgress` and records the answer.
   6. GameFlow has the Hud redraw and plays the matching sound.
   7. GameFlow saves a checkpoint and moves on to the next step.
