class SoundEngine {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;
  public soundType: 'WHISTLE' | 'SYNTH' = 'WHISTLE';

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  // Crisp pip tone on countdown seconds 2 and 1
  playPipCountdown() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime); // A5

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {
      console.warn('Audio playback error', e);
    }
  }

  playCountdownTick() {
    this.playPipCountdown();
  }

  // Dual-frequency sports whistle blast for Work Go
  playWhistle() {
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(2800, now);
      osc2.frequency.setValueAtTime(3100, now);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.45);
      osc2.stop(now + 0.45);
    } catch (e) {
      console.warn('Audio playback error', e);
    }
  }

  // Work Go cue on 0
  playWorkGo() {
    if (this.isMuted) return;
    if (this.soundType === 'WHISTLE') {
      this.playWhistle();
    } else {
      this.initCtx();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.25); // Slur to A5

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.45);
      } catch (e) {
        console.warn('Audio playback error', e);
      }
    }
  }

  // 1-Second Classic Arena / Gym Buzzer when Work is done (Rest or Finish)
  playRest() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Classic low-frequency gritty sports buzzer
      osc1.type = 'sawtooth';
      osc2.type = 'square';

      osc1.frequency.setValueAtTime(155, now);
      osc2.frequency.setValueAtTime(160, now); // Slight detune creates the authentic gym horn buzz

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.setValueAtTime(0.4, now + 0.85); // Sustain for ~0.85s
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0); // Clean fade out at exactly 1.0s

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.0);
      osc2.stop(now + 1.0);
    } catch (e) {
      console.warn('Audio playback error', e);
    }
  }
}

export const soundEngine = new SoundEngine();
