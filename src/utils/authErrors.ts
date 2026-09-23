export function getKoreanErrorMessage(errorMsg: string): string {
  if (!errorMsg) {
    return '인증 처리 중 오류가 발생했습니다.';
  }
  if (errorMsg.includes('Invalid login credentials')) {
    return '이메일 또는 비밀번호가 올바르지 않습니다.';
  }
  if (errorMsg.includes('User already registered')) {
    return '이미 등록된 이메일 계정입니다. 로그인해 주세요.';
  }
  if (errorMsg.includes('Password should be at least 6 characters')) {
    return '비밀번호는 최소 6자 이상이어야 합니다.';
  }
  if (errorMsg.includes('Email not confirmed')) {
    return '이메일 인증이 완료되지 않았습니다. 메일함을 확인해 주세요.';
  }
  if (errorMsg.includes('Email signups are disabled')) {
    return '이메일 회원가입이 비활성화되어 있습니다. Supabase 콘솔(Authentication -> Providers -> Email)에서 신규 가입(Allow new users to sign up)을 켜주세요.';
  }
  if (errorMsg.toLowerCase().includes('network') || errorMsg.toLowerCase().includes('fetch')) {
    return '네트워크 연결 상태를 확인해 주세요.';
  }
  return errorMsg;
}
