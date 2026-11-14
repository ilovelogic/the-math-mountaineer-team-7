/**
 * The words for the chasm's hint (#84), as in the "Pick a log: hint open" mockup: the
 * button that opens it, the formula card, and the line and button the dialog box shows
 * while the card is open.
 */
export const hintText = {
  button: 'Hint',
  formula: 'a² + b² = c²',
  caption: 'c is the diagonal. a and b are the two sides you can see.',
  line: 'Hint: the right log is exactly as long as the diagonal of the gap.',
  back: 'Back to the chasm',
} as const;
// Optional documentation
// - as const: makes every string read-only, so code can't change the hint's wording at runtime.
