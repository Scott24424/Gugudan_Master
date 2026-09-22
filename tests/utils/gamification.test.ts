import { calculateEarnedExp, calculateNextLevelAndExp, getCharacterStage } from '../../src/utils/gamification';

describe('Gamification Logic', () => {
  describe('calculateEarnedExp', () => {
    it('calculates correct exp for gugudan', () => {
      expect(calculateEarnedExp('gugudan')).toBe(10);
    });

    it('calculates correct exp for specific multiplication categories', () => {
      expect(calculateEarnedExp('2x1')).toBe(20);
      expect(calculateEarnedExp('3x1')).toBe(30);
      expect(calculateEarnedExp('2x2')).toBe(40);
    });

    it('returns 0 exp for unknown category', () => {
      expect(calculateEarnedExp('unknown')).toBe(0);
      expect(calculateEarnedExp('')).toBe(0);
    });
  });

  describe('getCharacterStage', () => {
    it('returns egg for level below 5', () => {
      expect(getCharacterStage(1)).toBe('egg');
      expect(getCharacterStage(4)).toBe('egg');
      expect(getCharacterStage(0)).toBe('egg');
    });

    it('returns baby_monster for level between 5 and 9', () => {
      expect(getCharacterStage(5)).toBe('baby_monster');
      expect(getCharacterStage(9)).toBe('baby_monster');
    });

    it('returns cool_monster for level between 10 and 19', () => {
      expect(getCharacterStage(10)).toBe('cool_monster');
      expect(getCharacterStage(19)).toBe('cool_monster');
    });

    it('returns dragon for level 20 and above', () => {
      expect(getCharacterStage(20)).toBe('dragon');
      expect(getCharacterStage(99)).toBe('dragon');
    });
  });

  describe('calculateNextLevelAndExp', () => {
    it('returns unchanged level and exp when addedExp is 0', () => {
      expect(calculateNextLevelAndExp(40, 1, 0)).toEqual({ exp: 40, level: 1 });
    });

    it('accumulates exp without level up when below requirement', () => {
      expect(calculateNextLevelAndExp(30, 1, 40)).toEqual({ exp: 70, level: 1 });
    });

    it('levels up to Level 2 exactly when hitting 100 exp for Level 1', () => {
      expect(calculateNextLevelAndExp(0, 1, 100)).toEqual({ exp: 0, level: 2 });
    });

    it('carries over surplus exp when leveling up', () => {
      // 80 + 40 = 120 -> level up to 2, 20 exp remaining
      expect(calculateNextLevelAndExp(80, 1, 40)).toEqual({ exp: 20, level: 2 });
    });

    it('handles multi-level jump correctly', () => {
      // Level 1 -> requires 100
      // Level 2 -> requires 200
      // 350 exp starting from 0, level 1:
      // 350 - 100 = 250 (Lv 2)
      // 250 - 200 = 50 (Lv 3)
      expect(calculateNextLevelAndExp(0, 1, 350)).toEqual({ exp: 50, level: 3 });
    });

    it('handles negative or invalid inputs gracefully', () => {
      expect(calculateNextLevelAndExp(-10, 0, 50)).toEqual({ exp: 50, level: 1 });
      expect(calculateNextLevelAndExp(NaN, NaN, 20)).toEqual({ exp: 20, level: 1 });
    });
  });
});

