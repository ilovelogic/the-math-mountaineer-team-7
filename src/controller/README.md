# controller/

Decides what happens next, including which screen runs, what a choice means, and when to save. `GameFlow`, the `Screen` interface, and one controller per screen type live here.

May import `model/`, `view/`, and `content/`. Nothing else imports from here except `main.ts`.

---

## Table of Contents

- [Overview](#overview)
- [Screen](#screen)
- [GameFlow (in progress)](#gameflow-in-progress)
- [The screen controllers (in progress)](#the-screen-controllers-in-progress)
- [Crossing one chasm, start to finish](#crossing-one-chasm-start-to-finish)

---

## Overview

This is the folder that turns our separate screens into a game. Right now, it holds one file, the `Screen` contract, which everything else is being built against. GameFlow and the controllers are the next pieces to land, so the sections below describe the design they will follow.

<img src="../../docs/images/cc-view.png" width="900" />\
*The runtime (C&C) view, showing what talks to what while the game runs. Connector names match the code where it exists, and components marked "Not built yet" show the design. View the live version in [Figma](https://www.figma.com/design/LLtfHewfTMLycUXFUVuyEH).*

---

## Screen

**Purpose**\
Defines the one contract every screen controller follows, so that GameFlow can run any screen the same way without knowing which one it is.

**The contract**
   - **`start`**: Draws the screen and starts listening for input. GameFlow passes in a callback, `onDone`, which the screen calls exactly once when it finishes.
   - **`stop`**: Removes everything the screen drew and stops listening. A stopped screen never calls `onDone`.

**What a screen reports**\
Each screen reports an `Outcome`, which is either `done` or a `choice` holding the position of the option the player picked (in the order the screen shows them). A screen only reports what the player chose, and GameFlow decides what that choice means. For instance, a chasm screen reports "the second log", and GameFlow then works out that the log was too long.

---

## GameFlow (in progress)

**Purpose**\
Runs the whole game by playing the steps in `content/levels` in order, one screen at a time, and deciding what happens after each one. It is the only thing that changes `PlayerProgress` ([#6](https://github.com/ilovelogic/the-math-mountaineer-team-7/issues/6)).

**After each screen**\
Checks the player's choice with `model/problems`, turns it into points with `model/rules`, and updates `PlayerProgress`, the Hud, and the sound. Once SaveStore lands, it also saves a checkpoint after every step, so a closed tab loses at most the current chasm ([#68](https://github.com/ilovelogic/the-math-mountaineer-team-7/issues/68)).

**Testing it**\
GameFlow gets its screens through a function it's given. Accordingly, its tests can pass in stand-in screens that report a choice right away, which lets us test GameFlow before the real screens are wired up.

---

## The screen controllers (in progress)

Each one pairs a view from `view/` with the `Screen` contract:
   - **ChasmController**: Shows one chasm, takes only the first pick, locks the logs, and reports the pick ([#24](https://github.com/ilovelogic/the-math-mountaineer-team-7/issues/24)).
   - **DialogueController**: Shows any dialogue scene one box per click and reports when it ends, including which button was picked on a Level done screen ([#18](https://github.com/ilovelogic/the-math-mountaineer-team-7/issues/18)).
   - **MedalController**: Shows the earned medal at the end of the game ([#43](https://github.com/ilovelogic/the-math-mountaineer-team-7/issues/43)).
   - **TitleController, DuelShopController, and ZiplineShopController**: Run the title screen and the two shop mini-games, which are planned for Sprint 2.

---

## Crossing one chasm, start to finish

Once GameFlow and ChasmController are in place, a single answer moves through the game as follows:
   1. GameFlow asks `problems` for this step's chasm, using the game's seed, the level, and the chasm's position.
   2. GameFlow starts ChasmController with that chasm, and ChasmController has ChasmScreen draw it.
   3. The player clicks a log. ChasmController takes that first pick, locks the logs on ChasmScreen (since each chasm allows only one pick), and reports the log's position to GameFlow via `onDone`.
   4. GameFlow asks `problems` whether that log fits, is too short, or is too long.
   5. GameFlow gets the points from `rules`, adds them to `PlayerProgress`, and records the answer.
   6. GameFlow has the Hud redraw and plays the matching sound.
   7. GameFlow saves a checkpoint and moves on to the next step.
