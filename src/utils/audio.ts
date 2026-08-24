class SoundEngine {
  public isMuted: boolean = false;

  private playSound(path: string) {
    if (this.isMuted) return;
    const audio = new Audio(path);
    audio.play().catch((err) => console.warn("Audio play blocked/failed:", err));
  }

  playWorkGo() {
    this.playSound('/sounds/Mario Kart Start.mp3');
  }

  playCountdownTick() {
    this.playSound('/sounds/Timer 3beeps.mp3');
  }

  playRest() {
    this.playSound('/sounds/Pkmn Level.mp3');
  }

  playCompletion() {
    this.playSound('/sounds/Mario completion.mp3');
  }

  playCleanupChime() {
    this.playSound('/sounds/Timer 3beeps.mp3');
  }
}

export const soundEngine = new SoundEngine();
