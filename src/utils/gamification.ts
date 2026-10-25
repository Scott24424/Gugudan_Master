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
 * Calculates bonus experience points when a user achieves a perfect score on a full session (10+ questions).
 * 왜 필요한가: 10문제 전승(100점 만점) 달성 시 추가 성취 동기를 부여하기 위해 기본 획득량의 20% 보너스를 지급함.
 */
export function calculatePerfectBonusExp(
  category: string,
  totalQuestions: number,
  correctCount: number
): number {
  if (totalQuestions < 10 || correctCount < totalQuestions) {
    return 0;
  }
  const perQuestion = calculateEarnedExp(category);
  return Math.round(perQuestion * totalQuestions * 0.2);
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

export interface CharacterStageInfo {
  stage: string;
  emoji: string;
  name: string;
  nextEvolutionLevel: number | null;
}

const STAGE_META: Record<string, { emoji: string; name: string; nextEvolutionLevel: number | null }> = {
  egg: { emoji: '🥚', name: '신비한 알', nextEvolutionLevel: 5 },
  baby_monster: { emoji: '🐣', name: '아기 몬스터', nextEvolutionLevel: 10 },
  cool_monster: { emoji: '🦕', name: '멋쟁이 다이노', nextEvolutionLevel: 20 },
  dragon: { emoji: '🐉', name: '전설의 드래곤', nextEvolutionLevel: null },
};

/**
 * Returns unified character stage metadata (emoji, Korean name, next evolution level)
 * to prevent duplicate mapping tables across UI components.
 */
export function getCharacterStageInfo(level: number): CharacterStageInfo {
  const stage = getCharacterStage(level);
  const meta = STAGE_META[stage] ?? STAGE_META.egg;
  return {
    stage,
    emoji: meta.emoji,
    name: meta.name,
    nextEvolutionLevel: meta.nextEvolutionLevel,
  };
}

/**
 * Calculates updated level and remaining experience given starting exp, level, and added exp.
 * Level N requires (N * 100) experience points to advance to Level N+1.
 * Any leftover exp carries over to subsequent levels.
 *
 * @param currentExp - Starting experience points within current level
 * @param currentLevel - Starting player level (minimum 1)
 * @param addedExp - Additional experience points gained
 * @returns An object containing the new exp and level
 */
export function calculateNextLevelAndExp(
  currentExp: number,
  currentLevel: number,
  addedExp: number
): { exp: number; level: number } {
  const safeExp = Number.isFinite(currentExp) ? Math.max(0, Math.floor(currentExp)) : 0;
  const safeAdded = Number.isFinite(addedExp) ? Math.max(0, Math.floor(addedExp)) : 0;
  let level = Number.isFinite(currentLevel) && currentLevel >= 1 ? Math.floor(currentLevel) : 1;
  let exp = safeExp + safeAdded;

  while (exp >= level * 100) {
    exp -= level * 100;
    level += 1;
  }

  return { exp, level };
}
