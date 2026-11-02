import { dialogueScripts } from '../content/dialogueScripts';
import type { DialogueLine } from './Dialogue';

/**
 * The dialogue for the end of a level: congratulations when the player earned every
 * point on it, and otherwise an offer to restart it. GameFlow passes the points earned
 * on this level alone (not the game's total) and the most it could have earned, then
 * plays the lines with the DialogueController. The choices keep their order from
 * content, which GameFlow relies on: on the restart offer, choice 0 restarts the level
 * and choice 1 moves on.
 */
export function levelDoneLines(level: number, points: number, possiblePoints: number): DialogueLine[] {
  const scene = points >= possiblePoints ? dialogueScripts.levelDoneAllPoints : dialogueScripts.levelDoneUnder100;
  return scene.map((line) => ({
    ...line,
    text: fillLevel(line.text, level),
    choices: line.choices.map((choice) => fillLevel(choice, level)),
  }));
}
// Optional documentation
// - import type { DialogueLine }: imports only the type, which TypeScript uses for checking and then removes, so nothing from Dialogue.ts is loaded at runtime.
// - condition ? a : b: gives a when the condition is true and b otherwise.
// - scene.map((line) => ...): makes a new array by running the function on each line, so the content's own lines are never changed.
// - { ...line, text: ... }: copies every property of line into a new object; the properties after it replace the copied ones.

// Content marks where the level number goes with {level}.
function fillLevel(text: string, level: number): string {
  return text.replaceAll('{level}', String(level));
}
// Optional documentation
// - text.replaceAll(find, replacement): returns a copy of text with every occurrence of find replaced; the original string is unchanged.
// - String(level): turns the number into text, such as 2 into '2'.
