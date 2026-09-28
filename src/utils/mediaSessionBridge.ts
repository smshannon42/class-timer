// Bridge routing Garmin Fenix 5 Bluetooth AVRCP media commands directly to the workout timer
export class MediaSessionBridge {
  private silentAudio: HTMLAudioElement | null = null;
  private isArmed: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // 1-second silent audio base64 payload to hold the OS media lock
      this.silentAudio = new Audio(
        'data:audio/mp3;base64,SUQzBAAAAAABEVRYWFQAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQAN//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMAAAAAAAAAAAAAAAAAAAAAAAD/85DEAAAAAAAAAAAAAAAAAAAAAANIAAAAAFVYAAAPkAAADSAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
      );
      this.silentAudio.loop = true;
    }
  }

  // Arm the silent loop on user interaction so the phone/PC grants OS media ownership
  armAudio() {
    if (this.silentAudio && !this.isArmed) {
      this.silentAudio.play().then(() => {
        this.isArmed = true;
      }).catch(() => {});
    }
  }

  setupHandlers(callbacks: {
    onTogglePlayPause: () => void;
    onSkip: () => void;
    onReset: () => void;
    title: string;
    artist: string;
  }) {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    // Updates what shows up on your Garmin screen
    navigator.mediaSession.metadata = new MediaMetadata({
      title: callbacks.title || 'Workout Timer',
      artist: callbacks.artist || 'Coach Shannon',
      album: 'Gym Console',
    });

    navigator.mediaSession.setActionHandler('play', () => {
      callbacks.onTogglePlayPause();
      this.armAudio();
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      callbacks.onTogglePlayPause();
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      callbacks.onSkip();
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => {
      callbacks.onReset();
    });
  }
}

export const mediaBridge = new MediaSessionBridge();
