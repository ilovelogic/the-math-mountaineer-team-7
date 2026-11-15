/** The pages of the math duel, in the order of the "Mini-game 1: Math duel" flow in the mockups. */
export type DuelPage = 'challenge' | 'tutorialOffer' | 'tutorial' | 'duel' | 'won' | 'climb' | 'lost' | 'solution';

/** What one duel page says, and the words on its buttons, in the order the page shows them. */
export interface DuelPageText {
  text: string;
  choices: string[];
}

/**
 * Each duel page's text, worded as in the Math duel mockups. The duel page's buttons are
 * the question's options, so it has none here. The tutorial and solution text stand in
 * until #158 draws those pages.
 */
export const duelText: Record<DuelPage, DuelPageText> = {
  challenge: {
    text:
      'I’m the store owner. You seem to be broke. Tell you what, let’s have a math duel using the Pythagorean ' +
      'Theorem and see who wins! If you win, I’ll give you the shoes you need for the shortcut. Otherwise, you get nothing.',
    choices: ['Alright, let’s battle!', 'I’ll just leave'],
  },
  tutorialOffer: {
    text:
      'Before we battle, would you like a helpful explanation of how to use the Pythagorean Theorem? When we have ' +
      'our contest, we will compete over just one problem, so you will have only one chance at winning! And if you ' +
      'give the wrong answer, even if I have not answered yet, you automatically lose.',
    choices: ['Yes, view tutorial', 'Let’s battle now!'],
  },
  tutorial: {
    text: 'The Pythagorean theorem says that in a right triangle, a² + b² = c², where c is the longest side.',
    choices: ['Let’s battle now!'],
  },
  duel: {
    text: 'Solve for x.',
    choices: [],
  },
  won: {
    text:
      'Alright, you won! Here is a bag of everything you need to scale a mountainside. There is an ice axe, ' +
      'crampons, mountaineering boots, and a climbing harness.',
    choices: ['Go scale the mountainside', 'Turn down the gear and take the normal path'],
  },
  climb: {
    text: 'Look at you, scaling a mountainside and skipping a level! Quite impressive.',
    choices: ['Proceed to Level 2'],
  },
  lost: {
    text: 'Sorry, friend, it looks like I beat you fair and square. You can find out the correct solution or just head out now.',
    choices: ['Understand the solution', 'Leave now'],
  },
  solution: {
    text: 'The Pythagorean theorem says that in a right triangle, a² + b² = c², where c is the longest side.',
    choices: ['Back to the trail'],
  },
};
// Optional documentation
// - Record<DuelPage, DuelPageText>: an object with exactly one entry for each page name, so leaving a page out or misspelling one doesn't compile.
// - 'a' + 'b': joins two strings, so a long line can be split across lines of code.
