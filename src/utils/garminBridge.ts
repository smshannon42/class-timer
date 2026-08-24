import { soundEngine } from './audio';

export interface GarminCommand {
  action: 'toggle_start' | 'toggle_mute' | 'skip_track';
}

class GarminBridgeManager {
  private listener: ((cmd: GarminCommand) => void) | null = null;

  public init(callback: (cmd: GarminCommand) => void) {
    this.listener = callback;
    
    // Listen for custom window events (can be triggered by webview or companion bridge handlers)
    if (typeof window !== 'undefined') {
      window.addEventListener('garmin-command', ((e: CustomEvent<GarminCommand>) => {
        if (e.detail && this.listener) {
          this.listener(e.detail);
        }
      }) as EventListener);
    }
  }

  // Helper to simulate or inject a command from a mobile bridge
  public handleIncomingPayload(payload: GarminCommand) {
    console.log("Received Garmin Bridge Command:", payload);
    if (payload.action === 'toggle_mute') {
      soundEngine.isMuted = !soundEngine.isMuted;
    }
    if (this.listener) {
      this.listener(payload);
    }
  }
}

export const garminBridge = new GarminBridgeManager();
