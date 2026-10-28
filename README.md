# The Math Mountaineer
A fun and educational game presented by JAPASTA

## Getting Started

### Requirements
...

### Installation
...

### Run the Game
...

### Test the Project
...

### Project Structure
...

## Pull Request Details 𖠿

One task → one branch → one pull request (PR). Every PR is squashed into a single commit on `main`, so **the PR title is the commit message**. Commits on your own branch can say anything.

### 1. Branch Name

Name the branch after the issue: `<issue number>-<short-name>`.

```
17-dialogue-model
23-chasm-screen
```

### 2. Size and scope

- **One task per PR.** If you find a second related task/patch that needs implementing, open an issue for it instead of fixing it in the same PR.
- **Tests go in the same PR** as the code they test.
- **Aim for under about 300 changed lines.** If a task is bigger, split it into PRs that each still build and pass the tests, such as "model + tests" and then "view".
- **Only touch your own files.** Changing a file someone else owns (for example `GameFlow` or `view/components`) means asking their permission and coordinating with them first.

### 3. Title

```
type(area): what it does, see examples below for format
```

| `type` | Use it for |
|---|---|
| `feat` | something the player or the team can now do |
| `fix` | a bug fix |
| `test` | tests only |
| `refactor` | same behavior, cleaner code |
| `docs` | README, comments, docs/ |
| `chore` | setup, CI, dependencies, assets |

`area` is the folder you changed: `model`, `view`, `controller`, `content` or `ci`. Leave it out, along with the parentheses, when the change isn't in one of those folders, such as the README, `docs/` or project setup files: `docs: add pull request guidelines to the README`.

Good titles:

```
feat(model): track the current dialogue box, one box per click
feat(view): draw the chasm, side lengths and logs
fix(controller): ignore clicks after the first pick
chore(ci): run type check and tests on every pull request
```

Write it as a command that finishes the sentence "This PR will…". Keep it under about 70 characters, and leave off the final period.

### 4. Description 𓂃✍︎

Fill in this template. Once #101 adds it to the repo, it appears automatically when you open a PR; until then, copy it from here:

```markdown
Closes #‹insert your task’s issue number here›

## What
One or two sentences: what changes.

## Why
The reason, or the user story it serves.

## How it works
A few sentences on your approach: how the code is organized and why you chose it.

## How to use it
A short example of calling your code, or the steps to see it in the game.

## How to check
- [ ] `npm test` passes
- What the tests cover, plus a screenshot or GIF for anything on screen

## Notes (optional)
Anything a reviewer or a future teammate should know: stand-ins you used, limits, follow-up issues.
```

The first line links the PR to your task (for example, `Closes #17`). When the PR is merged, GitHub closes that issue and moves its card to Done on the board.

### 5. Before you ask for a review ✔

- Read your own diff on GitHub first, then delete stray `console.log`s and commented-out code.
- CI must be green.
- Open the PR as a **Draft** while you're still working, and mark it **Ready for review** when it's done.
- Request a review from your usual reviewer below. Any teammate can approve, though, so if they haven't gotten to it, whoever has time first can review it.

| Author | Usual reviewer |
|---|---|
| Andrew, Toby, Angel | Anne |
| Anne, Jonathan | Andrew |
| Skye | Toby |
| Pranav | Jonathan |

### 6. Reviewing

- **Review within one day**, and always before the next standup to keep us on track ✧｡٩(ˊᗜˋ )و✧*. A PR waiting for review blocks people just as unfinished code does (•́ ᴖ •̀).
- **Approve when the PR makes the code better**, even if it isn't perfect. Small fixes can be follow-up issues.
- **Start each PR comment with a label** so the author knows what matters:
  - `Must fix:` blocks approval: a bug, a broken test, or a break from the module view.
  - `Question:` asks the author to explain something.
  - `Nit:` is a small style point the author may ignore.
- Be kind and specific. Comment on the code, not the person.

### 7. Merging 𑣲🫂⋆˚࿔

- Merge needs **1 approval and green CI**.
- The **author** clicks **Squash and merge**, checks that the commit title matches the PR title, and deletes the branch.
- If `main` moved on and your branch is out of date, use **Update branch** on the PR page, re-run the tests, and then merge.
