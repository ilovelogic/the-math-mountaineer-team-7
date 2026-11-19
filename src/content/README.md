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
- [ziplineText](#ziplinetext)
- [hintText](#hinttext)
- [settings](#settings)

---

## Overview

Anything we expect to change while writing the story or playtesting lives here, so that changing it means editing a list rather than digging through game code. Other folders read from here, while nothing here reads from anywhere else.

---

## levels

**Purpose**\
Lists the game's script, which is every step in the order the player meets it, starting after the title screen. GameFlow plays these one at a time and saves a checkpoint after each.

**The kinds of steps**
   - `dialogue`: A story scene, named by its key in `dialogueScripts`.
   - `chasm`: One chasm, with its level, topic, and position within the level. The problem itself is built from the game's seed, so every game gets different chasms.
   - `levelDone`: The end of a level. GameFlow picks the "all points" or "under 100%" message based on the level's points.
   - `medal`: The end screen.
   - `shopOffer`: A shop asks whether the player wants to come in, with its `shop` (`'supplies'` or `'clothing'`). It must come right before that shop's `shopGame` step, which GameFlow checks when it starts: accepting plays the mini-game, and declining skips it with no points.
   - `shopGame`: The shop's mini-game, the math duel (#55) or the zipline (#61). A supplies `shopGame` must have a Level done step somewhere after it, since winning the duel skips to the step after it, and GameFlow checks this when it starts.

**The current script**\
Starts with the intro, then the "how crossing works" scene, then the supply shop and its math duel, followed by three levels of five chasms each. The crossing scene comes before the shop so every player sees it before their first chasm, even one who skips Level 1 (#192). Levels 1 and 2 end with a Level done step, while Level 3 goes straight to the medal. Winning the duel and taking the shortcut skips Level 1 for its 50 points, going straight to the start of Level 2. Level 2 opens at the clothing shop, whose zipline challenge pays 50 points for the right answer. As a result of each chasm being its own step, a closed tab loses at most one chasm.

---

## dialogueScripts

**Purpose**\
Stores the story text, with one scene per key. Each scene is a list of boxes, and each box has a speaker and a line of text. Today, there are four scenes, which are `intro` (the avalanche and the missing friend), `howCrossingWorks` (how to pick a log), and the two Level done messages, `levelDoneAllPoints` and `levelDoneUnder100`. The Level done scenes mark where the level number goes with `{level}`, which `model/levelDone` fills in, so the same words serve every level.

**Adding a scene**\
Add a new key with its boxes, and then add a `dialogue` step naming that key in `levels`.

---

## shopText

**Purpose**\
Stores each shop's offer: what the shop says when the player walks up to it, and the words on its accept and decline buttons, worded as in the shop offer mockups. The fields are named, so nobody has to remember which button comes first. `ACCEPT` (0) and `DECLINE` (1) are the positions the two buttons report, accept first as the teal button, and GameFlow reads the choice with them.

---

## duelText

**Purpose**\
Stores the math duel's text, one entry per page of the "Mini-game 1: Math duel" mockups (`challenge`, `tutorialOffer`, `tutorial`, `duel`, `won`, `climb`, `lost` and `solution`), each with its words and its buttons in the order they're shown. DuelShopController decides where each button leads. The duel page's buttons are the question's options, so it lists none. The tutorial and solution pages say how to use the theorem in words, while DuelScreen draws the triangle and the worked steps from the question's numbers. The duel page's text goes on the card with the question instead of in the dialog box. `ownerProgressText` holds the words beside the store owner's progress pie on the duel page.

**The Explanation card**\
`duelExplanation` holds the words on the lost page's gray card: a title, `Correct answer: {answer}`, where DuelScreen puts the question's answer, and the line under it.

---

## ziplineText

**Purpose**\
Stores the zipline shop's text, one entry per page of the "Mini-game 2: Clothing shop" mockups (`deal`, `problem`, `tutorial`, `answer`, `right`, `wrong`, `solution`, `onwardDressed` and `onwardPacked`), each with its words and its buttons in the order they're shown. ZiplineShopController decides where each button leads. The answer page's buttons are the engineers' three guesses, so it lists none. Where the text needs the problem's numbers, it says `{length}`, `{width}`, `{height}`, `{floor}`, `{squared}` or `{diagonal}`, and `fillZiplineText` in [model/](../model/README.md#zipline) fills them in.

---

## hintText

**Purpose**\
Stores the chasm hint's words, as in the "Pick a log: hint open" mockup (#84): the Hint button's label, the formula and its caption for the formula card, and the line and Back button the dialog box shows while the card is open. Keeping them here means rewording the hint never touches the chasm screen.

---

## settings

**Purpose**\
Keeps the values we expect to tweak while playtesting, each with a comment explaining what it does. Today, that's `pointsPerChasm` (10, matching the "+10" in the mockups), `medalLimits` (150, 135, 105 and 75, which are 100%, 90%, 70% and 50% of the 150 points a player can earn, matching the Medal requirements card), `pointsPerSkippedLevel` (50, Level 1's full points, for skipping it by winning the math duel), `dialogueTransitionMs` (250, how long clicks are ignored after a dialogue box changes), and `loadingScreenDelayMs` (1000, how long loading can take before the loading screen appears, long enough that the sounds' 400 to 500 ms warm-up on a normal load never shows it), and `ownerSolveMs` (30000, how long the store owner takes to solve the duel question, a first guess to tune in playtesting). Feature toggles will join them as those features land.
