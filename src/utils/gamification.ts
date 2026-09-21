/**
 * Calculates earned experience points based on the problem category.
 *
 * @param category - Category identifier (e.g. 'gugudan', '2x1', '3x1', '2x2')
 * @returns Earned experience points as a number
 */
export function calculateEarnedExp(category: string): number {
  switch (category) {
    case 'gugudan':
      return 10;
    case '2x1':
      return 20;
    case '3x1':
      return 30;
    case '2x2':
      return 40;
    default:
      return 0;
  }
}

/**
 * Determines the character growth stage according to current level.
 * Stages:
 * - Level < 5: 'egg'
 * - Level 5 - 9: 'baby_monster'
 * - Level 10 - 19: 'cool_monster'
 * - Level >= 20: 'dragon'
 *
 * @param level - Current player level
 * @returns Identifier of the character stage
 */
export function getCharacterStage(level: number): string {
  if (level >= 20) {
    return 'dragon';
  }
  if (level >= 10) {
    return 'cool_monster';
  }
  if (level >= 5) {
    return 'baby_monster';
  }
  return 'egg';
}
