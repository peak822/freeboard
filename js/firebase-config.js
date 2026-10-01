/**
 * Firebase Realtime Database Configuration
 * 
 * Default configuration for ESP32 + Firebase IoT Dashboard.
 * Supports localStorage override so users can dynamically configure their Firebase project
 * directly from the Web UI without editing source code.
 */

const DEFAULT_FIREBASE_CONFIG = {
  // Configured with user's Firebase RTDB instance
  databaseURL: "https://iot-104-a634e-default-rtdb.asia-southeast1.firebasedatabase.app",
  apiKey: "YOUR_API_KEY",
  authDomain: "iot-104-a634e.firebaseapp.com",
  projectId: "iot-104-a634e",
  storageBucket: "iot-104-a634e.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

// Device & Target Path Configuration
const IOT_CONFIG = {
  baseLabPath: "/lab",
  defaultDeviceId: "esp32-01",
  activeDeviceId: "esp32-01",
  latestPath: "/lab/esp32-01/latest",
  historyPath: "/lab/esp32-01/history",
  // Query limit from Firebase (0 = unlimited)
  queryLimit: 200,
  // Offline threshold in seconds (e.g. if no packet within 30s, mark as STALE / OFFLINE)
  offlineThresholdSeconds: 30,
  // Timezone display requirement
  timeZone: "Asia/Bangkok"
};

// Clean & sanitize Firebase URL if user accidentally pastes Firebase Console URL
function sanitizeFirebaseUrl(url) {
  if (!url) return "";
  let cleanUrl = url.trim();

  // Handle Firebase Console URL: https://console.firebase.google.com/.../database/<DB_NAME>/...
  if (cleanUrl.includes("console.firebase.google.com")) {
    const match = cleanUrl.match(/\/database\/([^\/]+)/);
    if (match && match[1]) {
      const dbName = match[1];
      cleanUrl = `https://${dbName}.asia-southeast1.firebasedatabase.app`;
    }
  }

  // Remove trailing slashes and path
  cleanUrl = cleanUrl.replace(/\/data\/.*$/, "").replace(/\/+$/, "");
  return cleanUrl;
}

// Retrieve configuration with localStorage fallback
function getFirebaseConfig() {
  try {
    const saved = localStorage.getItem("esp32_iot_firebase_config");
    if (saved) {
      const parsed = JSON.parse(saved);
      parsed.databaseURL = sanitizeFirebaseUrl(parsed.databaseURL);
      return { ...DEFAULT_FIREBASE_CONFIG, ...parsed };
    }
  } catch (e) {
    console.warn("Failed to load config from localStorage, using default config", e);
  }
  return { 
    ...DEFAULT_FIREBASE_CONFIG, 
    databaseURL: sanitizeFirebaseUrl(DEFAULT_FIREBASE_CONFIG.databaseURL) 
  };
}

// Save configuration to localStorage
function saveFirebaseConfig(newConfig) {
  try {
    if (newConfig.databaseURL) {
      newConfig.databaseURL = sanitizeFirebaseUrl(newConfig.databaseURL);
    }
    localStorage.setItem("esp32_iot_firebase_config", JSON.stringify(newConfig));
    return true;
  } catch (e) {
    console.error("Failed to save config to localStorage", e);
    return false;
  }
}

// Reset configuration
function resetFirebaseConfig() {
  localStorage.removeItem("esp32_iot_firebase_config");
  return { ...DEFAULT_FIREBASE_CONFIG };
}
