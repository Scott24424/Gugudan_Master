import { calculateEarnedExp, getCharacterStage } from '../../src/utils/gamification';

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
});
