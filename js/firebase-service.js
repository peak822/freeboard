/**
 * Firebase Realtime Database Service
 * 
 * Manages Firebase Web SDK connection, dynamic `/lab` device discovery,
 * realtime listeners on `/lab/<device>/latest` and `/lab/<device>/history`,
 * connection state handling, diagnostics reporting, and direct REST simulation utilities.
 */

class FirebaseService {
  constructor() {
    this.app = null;
    this.database = null;
    this.labRef = null;
    this.latestRef = null;
    this.historyRef = null;
    this.connectedRef = null;
    this.isConnected = false;
    this.activeDeviceId = IOT_CONFIG.activeDeviceId || "esp32-01";
    this.discoveredDevices = [this.activeDeviceId];
    this.queryLimit = IOT_CONFIG.queryLimit || 200;

    // Diagnostics stats
    this.diagnostics = {
      devicesCount: 1,
      devicesList: ["esp32-01"],
      totalHistoryReceived: 0,
      validRecordsCount: 0,
      incompleteRecordsCount: 0,
      filteredCount: 0,
      lastSyncTime: null
    };

    // Listeners and callbacks
    this.onLatestCallback = null;
    this.onHistoryCallback = null;
    this.onDevicesCallback = null;
    this.onStatusCallback = null;
    this.onErrorCallback = null;
    this.onDiagnosticsCallback = null;
  }

  /**
   * Initialize Firebase SDK with current configuration
   */
  init(config, callbacks = {}) {
    this.onLatestCallback = callbacks.onLatest || null;
    this.onHistoryCallback = callbacks.onHistory || null;
    this.onDevicesCallback = callbacks.onDevices || null;
    this.onStatusCallback = callbacks.onStatus || null;
    this.onErrorCallback = callbacks.onError || null;
    this.onDiagnosticsCallback = callbacks.onDiagnostics || null;

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

      // 1. Setup Dynamic Device Discovery under /lab
      this.setupDeviceDiscovery();

      // 2. Setup Active Device Listeners (/latest and /history)
      this.attachDeviceListeners(this.activeDeviceId);

    } catch (err) {
      console.error("Firebase initialization failed:", err);
      this.notifyError("Initialization error: " + err.message);
    }
  }

  /**
   * Dynamic Device Discovery under /lab
   */
  setupDeviceDiscovery() {
    try {
      this.labRef = this.database.ref(IOT_CONFIG.baseLabPath);
      this.labRef.on(
        "value",
        (snapshot) => {
          const labData = snapshot.val();
          if (labData && typeof labData === "object") {
            const devices = Object.keys(labData).filter(key => typeof labData[key] === "object");
            if (devices.length > 0) {
              this.discoveredDevices = devices;
              this.diagnostics.devicesCount = devices.length;
              this.diagnostics.devicesList = devices;

              if (this.onDevicesCallback) {
                this.onDevicesCallback(devices, this.activeDeviceId);
              }
            }
          }
        },
        (error) => {
          // If lab root permission fails, fallback to active device
          console.warn("Lab root discovery restricted, using active device:", error.message);
        }
      );
    } catch (e) {
      console.warn("Device discovery setup warning:", e);
    }
  }

  /**
   * Attach listeners for a specific device ID
   */
  attachDeviceListeners(deviceId) {
    this.activeDeviceId = deviceId;
    IOT_CONFIG.activeDeviceId = deviceId;
    const latestPath = `${IOT_CONFIG.baseLabPath}/${deviceId}/latest`;
    const historyPath = `${IOT_CONFIG.baseLabPath}/${deviceId}/history`;

    // Detach previous listeners if active
    if (this.latestRef) this.latestRef.off();
    if (this.historyRef) this.historyRef.off();

    // 1. Setup /latest Realtime Listener
    this.latestRef = this.database.ref(latestPath);
    this.latestRef.on(
      "value",
      (snapshot) => {
        const val = snapshot.val();
        if (this.onLatestCallback) {
          this.onLatestCallback(val, deviceId);
        }
      },
      (error) => {
        console.error(`Error reading ${latestPath}:`, error);
        this.notifyError(`Failed to listen to ${latestPath}: ` + error.message);
      }
    );

    // 2. Setup /history Realtime Listener
    let queryRef = this.database.ref(historyPath);
    if (this.queryLimit > 0) {
      queryRef = queryRef.limitToLast(this.queryLimit);
    }

    this.historyRef = queryRef;
    this.historyRef.on(
      "value",
      (snapshot) => {
        const val = snapshot.val();
        const historyList = [];
        let validCount = 0;
        let incompleteCount = 0;

        if (val && typeof val === "object") {
          Object.keys(val).forEach((key) => {
            const item = val[key];
            if (item && typeof item === "object") {
              const hasTemp = item.temp !== undefined && item.temp !== null && !isNaN(Number(item.temp));
              const hasHumi = item.humi !== undefined && item.humi !== null && !isNaN(Number(item.humi));
              const hasLight = item.light !== undefined && item.light !== null && !isNaN(Number(item.light));
              const hasPress = item.press !== undefined && item.press !== null && !isNaN(Number(item.press));
              const hasCo2 = item.co2 !== undefined && item.co2 !== null && !isNaN(Number(item.co2));
              const hasNoise = item.noise !== undefined && item.noise !== null && !isNaN(Number(item.noise));
              const hasTimestamp = item.timestamp !== undefined && item.timestamp !== null && !isNaN(Number(item.timestamp));

              const record = {
                pushId: key,
                deviceId: deviceId,
                temp: hasTemp ? Number(item.temp) : null,
                humi: hasHumi ? Number(item.humi) : null,
                light: hasLight ? Number(item.light) : null,
                press: hasPress ? Number(item.press) : null,
                co2: hasCo2 ? Number(item.co2) : null,
                noise: hasNoise ? Number(item.noise) : null,
                timestamp: hasTimestamp ? Number(item.timestamp) : null,
                raw: item
              };

              if (hasTemp && hasHumi && hasLight && hasTimestamp) {
                validCount++;
              } else {
                incompleteCount++;
              }

              historyList.push(record);
            }
          });

          // Chronological sort: timestamp ascending with pushId secondary sort
          historyList.sort((a, b) => {
            const tsA = a.timestamp !== null ? a.timestamp : 0;
            const tsB = b.timestamp !== null ? b.timestamp : 0;
            if (tsA !== tsB) return tsA - tsB;
            return (a.pushId || "").localeCompare(b.pushId || "");
          });
        }

        // Update diagnostics
        this.diagnostics.totalHistoryReceived = historyList.length;
        this.diagnostics.validRecordsCount = validCount;
        this.diagnostics.incompleteRecordsCount = incompleteCount;
        this.diagnostics.lastSyncTime = new Date();

        // Print Diagnostic Log to Console
        console.info(
          `%c[FIREBASE DIAGNOSTICS]%c Device: ${deviceId} | Received: ${historyList.length} | Valid: ${validCount} | Incomplete: ${incompleteCount} | Display Limit: ${this.queryLimit || 'Unlimited'}`,
          "background: #00f2fe; color: #041221; font-weight: bold; padding: 2px 6px; border-radius: 4px;",
          "color: #38bdf8; font-weight: 500;"
        );

        if (this.onDiagnosticsCallback) {
          this.onDiagnosticsCallback({ ...this.diagnostics });
        }

        if (this.onHistoryCallback) {
          this.onHistoryCallback(historyList, deviceId);
        }
      },
      (error) => {
        console.error(`Error reading ${historyPath}:`, error);
        this.notifyError(`Failed to listen to ${historyPath}: ` + error.message);
      }
    );
  }

  /**
   * Switch active device dynamically
   */
  selectDevice(deviceId) {
    if (!deviceId || deviceId === this.activeDeviceId) return;
    this.attachDeviceListeners(deviceId);
  }

  /**
   * Set history query limit (e.g. 50, 100, 200, 0 = all)
   */
  setQueryLimit(limit) {
    this.queryLimit = limit;
    IOT_CONFIG.queryLimit = limit;
    this.attachDeviceListeners(this.activeDeviceId);
  }

  /**
   * Stop all active listeners
   */
  detach() {
    if (this.labRef) this.labRef.off();
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
   * Exactly mimicking ESPHome's L5 6-sensor dual-operation!
   */
  async simulateEsp32Upload(temp, humi, light, press = 1013.2, co2 = 520, noise = 45.5, customTimestamp = null) {
    const config = getFirebaseConfig();
    let dbUrl = config.databaseURL.replace(/\/$/, "");

    const timestamp = customTimestamp !== undefined && customTimestamp !== null 
      ? customTimestamp 
      : Math.floor(Date.now() / 1000);

    const payload = {};
    if (temp !== undefined && temp !== null && !isNaN(temp)) {
      payload.temp = parseFloat(Number(temp).toFixed(1));
    }
    if (humi !== undefined && humi !== null && !isNaN(humi)) {
      payload.humi = parseFloat(Number(humi).toFixed(1));
    }
    if (light !== undefined && light !== null && !isNaN(light)) {
      payload.light = Math.round(Number(light));
    }
    if (press !== undefined && press !== null && !isNaN(press)) {
      payload.press = parseFloat(Number(press).toFixed(1));
    }
    if (co2 !== undefined && co2 !== null && !isNaN(co2)) {
      payload.co2 = Math.round(Number(co2));
    }
    if (noise !== undefined && noise !== null && !isNaN(noise)) {
      payload.noise = parseFloat(Number(noise).toFixed(1));
    }
    if (timestamp !== null) {
      payload.timestamp = timestamp;
    }

    const latestPath = `${IOT_CONFIG.baseLabPath}/${this.activeDeviceId}/latest.json`;
    const historyPath = `${IOT_CONFIG.baseLabPath}/${this.activeDeviceId}/history.json`;

    const results = {
      latestStatus: 0,
      historyStatus: 0,
      payload: payload
    };

    try {
      // 1. PUT to latest.json
      const latestResp = await fetch(`${dbUrl}${latestPath}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      results.latestStatus = latestResp.status;

      // 2. POST to history.json
      const historyResp = await fetch(`${dbUrl}${historyPath}`, {
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

