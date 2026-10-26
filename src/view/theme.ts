/** Every color in the game. Names match the Palette styles in the Figma mockups. */
export const colors = {
  skyDay: '#C9E6E9',
  skyNight: '#162C43',
  stormSky: '#9FB3BB',
  snow: '#E6F2EE',
  ice: '#A9D6E5',
  rockLight: '#577E91',
  rock: '#405E7B',
  rockDark: '#233E5C',
  stone: '#8C7B6B',
  stoneDark: '#5E5248',
  stoneGround: '#3A322B',
  pine: '#2F5D50',
  pineLight: '#4F7F6A',
  wood: '#C28A57',
  woodDark: '#8A5A33',

  ink: '#183A43',
  mutedText: '#597079',
  white: '#FFFFFF',
  panel: '#F0F3F1',
  teal: '#287C7B',
  orange: '#C95A35',
  peach: '#FFAB72',
  cream: '#FFE2A0',
  purple: '#ACA7D7',
  skin: '#E9BA7B',

  gold: '#E3B341',
  silver: '#B9C4C9',
  bronze: '#B8733E',
} as const;

const FONT = 'Inter, sans-serif';

/**
 * Text styles from the mockups, ready to spread into a `Konva.Text`:
 * `new Konva.Text({ ...text.body, text: 'Hi' })`. They're all ink colored, so
 * set `fill` after the spread for white text on a button or the top bar.
 */
export const text = {
  title: { fontFamily: FONT, fontSize: 40, fontStyle: '600', lineHeight: 1.25, fill: colors.ink },
  subtitle: { fontFamily: FONT, fontSize: 18, fontStyle: 'normal', lineHeight: 1.33, fill: colors.ink },
  dialog: { fontFamily: FONT, fontSize: 20, fontStyle: 'normal', lineHeight: 1.4, fill: colors.ink },
  body: { fontFamily: FONT, fontSize: 16, fontStyle: 'normal', lineHeight: 1.5, fill: colors.ink },
  /** Buttons, the top bar and the side-length tags on logs. */
  label: { fontFamily: FONT, fontSize: 16, fontStyle: '600', lineHeight: 1.25, fill: colors.ink },
  /** Side lengths on the chasm drawing, such as `12 m` and `c = ?`. */
  math: { fontFamily: FONT, fontSize: 18, fontStyle: '600', lineHeight: 1.33, fill: colors.ink },
  formula: { fontFamily: FONT, fontSize: 28, fontStyle: '600', lineHeight: 1.29, fill: colors.ink },
} as const;
// '600' is Figma's Semi Bold. Konva's lineHeight is a multiple of fontSize,
// so Figma's 20 px line on 16 px text becomes 1.25.

// Optional documentation
// - as const: makes every value read-only, so code that tries to change a color or style at runtime won't compile.
// - fontStyle: '600': the font weight, as in CSS; 'normal' is 400.
// - { ...text.body, text: 'Hi' }: the spread `...` copies every property of text.body into the new object; properties after it add to or override them.
