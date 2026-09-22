import { fetchProfile, upsertProfile, insertSession } from '../../src/lib/api';
import { supabase } from '../../src/lib/supabaseClient';

jest.mock('../../src/lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('Supabase API client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchProfile', () => {
    it('returns profile data when found', async () => {
      const maybeSingleMock = jest.fn().mockResolvedValue({
        data: { exp: 50, level: 2 },
        error: null,
      });
      const eqMock = jest.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      (supabase.from as jest.Mock).mockReturnValue({ select: selectMock });

      const profile = await fetchProfile('user-123');

      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(selectMock).toHaveBeenCalledWith('exp, level');
      expect(eqMock).toHaveBeenCalledWith('id', 'user-123');
      expect(profile).toEqual({ exp: 50, level: 2 });
    });

    it('returns null when profile is not found', async () => {
      const maybeSingleMock = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      const eqMock = jest.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      (supabase.from as jest.Mock).mockReturnValue({ select: selectMock });

      const profile = await fetchProfile('user-unknown');

      expect(profile).toBeNull();
    });

    it('returns null and logs error when Supabase query fails', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const maybeSingleMock = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database connection error' },
      });
      const eqMock = jest.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      (supabase.from as jest.Mock).mockReturnValue({ select: selectMock });

      const profile = await fetchProfile('user-err');

      expect(profile).toBeNull();
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  describe('upsertProfile', () => {
    it('successfully upserts and returns updated profile', async () => {
      const singleMock = jest.fn().mockResolvedValue({
        data: { exp: 80, level: 3 },
        error: null,
      });
      const selectMock = jest.fn().mockReturnValue({ single: singleMock });
      const upsertMock = jest.fn().mockReturnValue({ select: selectMock });
      (supabase.from as jest.Mock).mockReturnValue({ upsert: upsertMock });

      const result = await upsertProfile('user-123', 80, 3);

      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(upsertMock).toHaveBeenCalledWith({ id: 'user-123', exp: 80, level: 3 });
      expect(result).toEqual({ exp: 80, level: 3 });
    });

    it('returns null and logs error when upsert fails', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const singleMock = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Upsert constraint failed' },
      });
      const selectMock = jest.fn().mockReturnValue({ single: singleMock });
      const upsertMock = jest.fn().mockReturnValue({ select: selectMock });
      (supabase.from as jest.Mock).mockReturnValue({ upsert: upsertMock });

      const result = await upsertProfile('user-123', 80, 3);

      expect(result).toBeNull();
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  describe('insertSession', () => {
    it('successfully inserts a learning session', async () => {
      const insertMock = jest.fn().mockResolvedValue({ error: null });
      (supabase.from as jest.Mock).mockReturnValue({ insert: insertMock });

      const success = await insertSession('user-123', 'gugudan', 10, 9, 90);

      expect(supabase.from).toHaveBeenCalledWith('learning_sessions');
      expect(insertMock).toHaveBeenCalledWith({
        user_id: 'user-123',
        category: 'gugudan',
        total_questions: 10,
        correct_count: 9,
        earned_exp: 90,
      });
      expect(success).toBe(true);
    });

    it('returns false and logs error on insertion error', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const insertMock = jest.fn().mockResolvedValue({
        error: { message: 'Foreign key violation' },
      });
      (supabase.from as jest.Mock).mockReturnValue({ insert: insertMock });

      const success = await insertSession('user-123', 'gugudan', 10, 9, 90);

      expect(success).toBe(false);
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });
});
