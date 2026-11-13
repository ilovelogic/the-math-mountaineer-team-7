/** The pages of the zipline shop, in the order of the "Mini-game 2: Clothing shop" flow in the mockups. */
export type ZiplinePage =
  | 'deal'
  | 'problem'
  | 'tutorial'
  | 'answer'
  | 'right'
  | 'wrong'
  | 'solution'
  | 'onwardDressed'
  | 'onwardPacked';

/** What one zipline page says, and the words on its buttons, in the order the page shows them. */
export interface ZiplinePageText {
  text: string;
  choices: string[];
}

/**
 * Each zipline page's text, worded as in the Clothing shop mockups. The answer page's
 * buttons are the engineers' guesses, so it has none here. The problem's numbers go
 * where the text says {length}, {width}, {height}, {floor} (length² + width²),
 * {squared} (the diagonal²) and {diagonal}; model/zipline fills them in.
 */
export const ziplineText: Record<ZiplinePage, ZiplinePageText> = {
  deal: {
    text:
      'Hi, I’m the shop owner. It seems you aren’t carrying any money. If you would like, you can solve ' +
      'a problem for me in exchange for clothes!',
    choices: ['Sure!', 'No, I’ll head out'],
  },
  problem: {
    text:
      'I want to install a zip line in my store from the top corner, where my office is, to the exit in the ' +
      'bottom corner. I need to know how long the diagonal is, so that I can buy the right amount of zip line. ' +
      'My engineers know it is one of three lengths, but they cannot figure out which. If you pick the right ' +
      'one, you can have my best outfit! You’ll only have one chance, so you might want some preparation!',
    choices: ['View tutorial', 'Answer right now'],
  },
  tutorial: {
    text:
      'The Pythagorean theorem works in 3D too! The floor’s diagonal makes a right triangle with the length ' +
      'and width, so floor² = length² + width². The zip line makes one with the floor’s diagonal and the ' +
      'height, so x² = length² + width² + height².',
    choices: ['Back to the store owner’s problem'],
  },
  answer: {
    text: 'Which of my engineers’ guesses is the right value for x?',
    choices: [],
  },
  right: {
    text: 'I called my engineers and they came and installed the zip line! It fits perfectly! Here are your stylish clothes.',
    choices: ['Put them on', 'Store them in your backpack'],
  },
  wrong: {
    text:
      'Oh no! I called my engineers and told them to use that length. They say it was wrong, so no free ' +
      'clothes for you. Do you want to find out how they have now solved it, or just leave?',
    choices: ['View explanation', 'Straight back to the trail'],
  },
  solution: {
    text:
      'First, the floor’s diagonal: floor² = {length}² + {width}² = {floor}. The zip line makes a right ' +
      'triangle with it and the {height}\u00a0m height, so x² = {floor} + {height}² = {squared}, and x = √{squared} = {diagonal}\u00a0m.',
    choices: ['Now continue along the trail'],
  },
  onwardDressed: {
    text: 'And the adventure continues!',
    choices: ['Hike to the next chasm'],
  },
  onwardPacked: {
    text: 'And the adventure continues!',
    choices: ['Hike to the next chasm'],
  },
};
// Optional documentation
// - Record<ZiplinePage, ZiplinePageText>: an object with exactly one entry for each page name, so leaving a page out or misspelling one doesn't compile.
// - 'a' + 'b': joins two strings, so a long line can be split across lines of code.
// - \u00a0: a space that never breaks a line, so "11 m" always stays together.
