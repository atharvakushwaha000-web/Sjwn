// Audio synthesizer using Web Audio API for native-like subtle sound effects
class SoundHapticService {
  private ctx: AudioContext | null = null;
  public soundEnabled: boolean = true;
  private lastEpisodeTickTime: number = 0;

  constructor() {
    // Lazy init AudioContext on first user interaction
    const saved = localStorage.getItem('episode_splitter_sound_enabled');
    if (saved !== null) {
      this.soundEnabled = saved === 'true';
    }
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    localStorage.setItem('episode_splitter_sound_enabled', String(enabled));
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Very short soft confirmation sound (80ms dual sine ping)
  public playVideoSelected() {
    this.vibrate(20);
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880.0, now + 0.08); // A5

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch {
      // Ignore audio failure
    }
  }

  // Very subtle click for processing started
  public playProcessingStarted() {
    this.vibrate(30);
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.04);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Ignore audio failure
    }
  }

  // Soft tick when an episode completes (rate limited to avoid audio spam if many episodes)
  public playEpisodeCompleted() {
    const nowMs = Date.now();
    if (nowMs - this.lastEpisodeTickTime < 250) return;
    this.lastEpisodeTickTime = nowMs;

    this.vibrate(10);
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.03);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.035);
    } catch {
      // Ignore audio failure
    }
  }

  // Short pleasant completion chime (harmonic triad C6 - E6 - G6)
  public playProcessingCompleted() {
    this.vibrate([30, 50, 40]);
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + idx * 0.06;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.36);
      });
    } catch {
      // Ignore audio failure
    }
  }

  // Short neutral error tone
  public playError() {
    this.vibrate([60, 40, 60]);
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.linearRampToValueAtTime(190, now + 0.16);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.18);
    } catch {
      // Ignore audio failure
    }
  }

  // Subtle button press haptic
  public triggerButtonHaptic() {
    this.vibrate(15);
  }

  private vibrate(pattern: number | number[]) {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignore haptics failure
      }
    }
  }
}

export const soundService = new SoundHapticService();
