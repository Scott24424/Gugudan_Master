export type SoundType = 'correct' | 'wrong' | 'complete' | 'levelup';

/**
 * Web Audio API 기반의 무의존성 효과음 재생 유틸리티.
 * 왜 외부 오디오 파일을 쓰지 않는가: 네트워크 로딩 지연 없이 즉각적인 청각 피드백을 제공하고,
 * 브라우저 정책이나 테스트 환경(SSR/JSDOM)에서도 에러 없이 안전하게 폴백하기 위함.
 */
export function playQuizSound(type: SoundType, muted = false): void {
  if (muted || typeof window === 'undefined') return;

  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const audioCtx = new AudioCtx();

    if (type === 'correct') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.07); // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.16);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.16);
    } else if (type === 'wrong') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(180, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } else if (type === 'complete') {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        const startTime = audioCtx.currentTime + idx * 0.08;
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.18, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
        osc.start(startTime);
        osc.stop(startTime + 0.2);
      });
    } else if (type === 'levelup') {
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        const startTime = audioCtx.currentTime + idx * 0.09;
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.22, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.28);
        osc.start(startTime);
        osc.stop(startTime + 0.28);
      });
    }
  } catch {
    // Non-blocking fallback when audio context is blocked by browser autoplay policy
  }
}
