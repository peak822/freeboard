/**
 * Firebase Realtime Database Configuration
 * 
 * Default configuration for ESP32 + Firebase IoT Dashboard.
 * Supports localStorage override so users can dynamically configure their Firebase project
 * directly from the Web UI without editing source code.
 */

const DEFAULT_FIREBASE_CONFIG = {
  // Replace with your actual Firebase project settings or configure via UI Settings modal
  databaseURL: "https://your-project-id-default-rtdb.asia-southeast1.firebasedatabase.app",
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

// Device & Target Path Configuration
const IOT_CONFIG = {
  deviceId: "esp32-01",
  basePath: "/lab/esp32-01",
  latestPath: "/lab/esp32-01/latest",
  historyPath: "/lab/esp32-01/history",
  // Offline threshold in seconds (e.g. if no packet within 30s, mark as STALE / OFFLINE)
  offlineThresholdSeconds: 30
};

// Retrieve configuration with localStorage fallback
function getFirebaseConfig() {
  try {
    const saved = localStorage.getItem("esp32_iot_firebase_config");
    if (saved) {
      return { ...DEFAULT_FIREBASE_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn("Failed to load config from localStorage, using default config", e);
  }
  return { ...DEFAULT_FIREBASE_CONFIG };
}

// Save configuration to localStorage
function saveFirebaseConfig(newConfig) {
  try {
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
