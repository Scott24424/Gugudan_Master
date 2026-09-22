import { getKoreanErrorMessage } from '../../src/utils/authErrors';

describe('authErrors utility', () => {
  it('translates invalid credentials error', () => {
    const res = getKoreanErrorMessage('Invalid login credentials');
    expect(res).toBe('이메일 또는 비밀번호가 올바르지 않습니다.');
  });

  it('translates user already registered error', () => {
    const res = getKoreanErrorMessage('User already registered');
    expect(res).toBe('이미 등록된 이메일 계정입니다. 로그인해 주세요.');
  });

  it('translates password length error', () => {
    const res = getKoreanErrorMessage('Password should be at least 6 characters');
    expect(res).toBe('비밀번호는 최소 6자 이상이어야 합니다.');
  });

  it('translates email not confirmed error', () => {
    const res = getKoreanErrorMessage('Email not confirmed');
    expect(res).toBe('이메일 인증이 완료되지 않았습니다. 메일함을 확인해 주세요.');
  });

  it('translates network or fetch error', () => {
    const res = getKoreanErrorMessage('Failed to fetch from network');
    expect(res).toBe('네트워크 연결 상태를 확인해 주세요.');
  });

  it('returns default fallback when empty string provided', () => {
    const res = getKoreanErrorMessage('');
    expect(res).toBe('인증 처리 중 오류가 발생했습니다.');
  });

  it('returns raw message if unknown error', () => {
    const res = getKoreanErrorMessage('Custom internal error');
    expect(res).toBe('Custom internal error');
  });
});
