class SoundEngine {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private playTone(freq: number, duration: number, type: OscillatorType = 'sine', count = 1, interval = 0.1) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    for (let i = 0; i < count; i++) {
      const startTime = this.ctx.currentTime + (i * (duration + interval));
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    }
  }

  playCountdownTick() { this.playTone(800, 0.15, 'sine'); }
  playWorkGo() { this.playTone(1200, 0.35, 'triangle'); }
  playRest() { this.playTone(440, 0.4, 'sawtooth'); }
  playCleanupChime() { this.playTone(950, 0.25, 'sine', 3, 0.08); }
}

export const soundEngine = new SoundEngine();
