using Toybox.WatchUi as Ui;
using Toybox.Graphics as Gfx;
using Toybox.Comms as Comms;
using Toybox.System as Sys;

class ATPWatchView extends Ui.View {

    private var currentModeText = "ATP TIMER";
    private var timerText = "00:20";
    private var isRunning = false;

    function initialize() {
        View.initialize();
    }

    function onUpdate(dc) {
        dc.setColor(Gfx.COLOR_BLACK, Gfx.COLOR_BLACK);
        dc.clear();

        // Top Status Banner
        dc.setColor(Gfx.COLOR_BLUE, Gfx.COLOR_TRANSPARENT);
        dc.drawText(dc.getWidth() / 2, 20, Gfx.FONT_SMALL, currentModeText, Gfx.TEXT_JUSTIFY_CENTER);

        // Center Giant Timer Display
        dc.setColor(Gfx.COLOR_WHITE, Gfx.COLOR_TRANSPARENT);
        dc.drawText(dc.getWidth() / 2, dc.getHeight() / 2 - 25, Gfx.FONT_NUMBER_HOT, timerText, Gfx.TEXT_JUSTIFY_CENTER);

        // Bottom HUD Footer (Button Map)
        dc.setColor(Gfx.COLOR_LIGHT_GRAY, Gfx.COLOR_TRANSPARENT);
        dc.drawText(dc.getWidth() / 2, dc.getHeight() - 40, Gfx.FONT_TINY, "[START] Toggle | [LAP] Mute", Gfx.TEXT_JUSTIFY_CENTER);
    }

    // Handle Physical Button Presses
    function onKey(evt) {
        var key = evt.getKey();
        
        // Start/Stop button (Top Right / Select)
        if (key == Ui.KEY_ENTER || key == Ui.KEY_START) {
            sendBluetoothCommand({ "action" => "toggle_start" });
            return true;
        }
        
        // Lap button (Bottom Right / Mute music)
        if (key == Ui.KEY_LAP) {
            sendBluetoothCommand({ "action" => "toggle_mute" });
            return true;
        }

        return false;
    }

    private function sendBluetoothCommand(payload) {
        if (Comms has :startJsonTransmission) {
            Comms.startJsonTransmission(
                payload,
                {},
                method(:onTransmissionComplete)
            );
            Sys.println("Sent BLE Command: " + payload["action"]);
        }
    }

    function onTransmissionComplete(status, data) {
        if (status == 0) {
            Sys.println("Command delivered successfully to phone!");
        } else {
            Sys.println("Transmission failed with status: " + status);
        }
    }
}
