/**
 * Firebase Realtime Database Service
 * 
 * Manages Firebase Web SDK connection, realtime listeners on `/lab/esp32-01/latest`
 * and `/lab/esp32-01/history`, connection state handling, and direct REST simulation utilities.
 */

class FirebaseService {
  constructor() {
    this.app = null;
    this.database = null;
    this.latestRef = null;
    this.historyRef = null;
    this.connectedRef = null;
    this.isConnected = false;

    // Listeners and callbacks
    this.onLatestCallback = null;
    this.onHistoryCallback = null;
    this.onStatusCallback = null;
    this.onErrorCallback = null;
  }

  /**
   * Initialize Firebase SDK with current configuration
   */
  init(config, callbacks = {}) {
    this.onLatestCallback = callbacks.onLatest || null;
    this.onHistoryCallback = callbacks.onHistory || null;
    this.onStatusCallback = callbacks.onStatus || null;
    this.onErrorCallback = callbacks.onError || null;

    try {
      this.notifyStatus("connecting", "Connecting to Firebase Realtime Database...");

      // Clean up previous app instance if exists
      if (firebase.apps && firebase.apps.length > 0) {
        firebase.apps.forEach(app => app.delete());
      }

      // Initialize App
      this.app = firebase.initializeApp(config);
      this.database = firebase.database();

      // Monitor .info/connected
      this.connectedRef = this.database.ref(".info/connected");
      this.connectedRef.on("value", (snapshot) => {
        const connected = snapshot.val() === true;
        this.isConnected = connected;
        if (connected) {
          this.notifyStatus("connected", "Connected to Firebase Realtime Database");
        } else {
          this.notifyStatus("connecting", "Disconnected / Reconnecting to Firebase...");
        }
      });

      // 1. Setup /lab/esp32-01/latest Realtime Listener
      this.latestRef = this.database.ref(IOT_CONFIG.latestPath);
      this.latestRef.on(
        "value",
        (snapshot) => {
          const val = snapshot.val();
          if (this.onLatestCallback) {
            this.onLatestCallback(val);
          }
        },
        (error) => {
          console.error("Error reading /latest:", error);
          this.notifyError("Failed to listen to /latest: " + error.message);
        }
      );

      // 2. Setup /lab/esp32-01/history Realtime Listener (limit to last 100 entries for performance)
      this.historyRef = this.database.ref(IOT_CONFIG.historyPath).limitToLast(100);
      this.historyRef.on(
        "value",
        (snapshot) => {
          const val = snapshot.val();
          const historyList = [];

          if (val) {
            Object.keys(val).forEach((key) => {
              historyList.push({
                pushId: key,
                ...val[key]
              });
            });
            // Sort by timestamp ascending (or fallback key)
            historyList.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
          }

          if (this.onHistoryCallback) {
            this.onHistoryCallback(historyList);
          }
        },
        (error) => {
          console.error("Error reading /history:", error);
          this.notifyError("Failed to listen to /history: " + error.message);
        }
      );

    } catch (err) {
      console.error("Firebase initialization failed:", err);
      this.notifyError("Initialization error: " + err.message);
    }
  }

  /**
   * Stop all active listeners
   */
  detach() {
    if (this.latestRef) this.latestRef.off();
    if (this.historyRef) this.historyRef.off();
    if (this.connectedRef) this.connectedRef.off();
  }

  notifyStatus(state, message) {
    if (this.onStatusCallback) {
      this.onStatusCallback(state, message);
    }
  }

  notifyError(message) {
    if (this.onErrorCallback) {
      this.onErrorCallback(message);
    }
  }

  /**
   * ESP32 Simulation Utility:
   * Perform HTTP PUT to /latest.json and HTTP POST to /history.json via REST
   * Exactly mimicking ESPHome's L5 dual-operation!
   */
  async simulateEsp32Upload(temp, humi, light, customTimestamp = null) {
    const config = getFirebaseConfig();
    let dbUrl = config.databaseURL.replace(/\/$/, "");

    const timestamp = customTimestamp || Math.floor(Date.now() / 1000);
    const payload = {
      temp: parseFloat(Number(temp).toFixed(1)),
      humi: parseFloat(Number(humi).toFixed(1)),
      light: Math.round(Number(light)),
      timestamp: timestamp
    };

    const results = {
      latestStatus: 0,
      historyStatus: 0,
      payload: payload
    };

    try {
      // 1. PUT to latest.json
      const latestResp = await fetch(`${dbUrl}${IOT_CONFIG.latestPath}.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      results.latestStatus = latestResp.status;

      // 2. POST to history.json
      const historyResp = await fetch(`${dbUrl}${IOT_CONFIG.historyPath}.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      results.historyStatus = historyResp.status;

      return results;
    } catch (err) {
      console.error("Simulation error:", err);
      throw err;
    }
  }
}

// Global service instance
const firebaseService = new FirebaseService();
