# ESP32 + ESPHome + Firebase RTDB + GitHub Pages Dashboard

[![GitHub Pages](https://img.shields.io/badge/Deployment-GitHub%20Pages-blue?style=for-the-badge&logo=github)](https://github.com/)
[![Firebase RTDB](https://img.shields.io/badge/Database-Firebase%20RTDB-orange?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![ESPHome](https://img.shields.io/badge/Firmware-ESPHome%20(ESP--IDF)-green?style=for-the-badge&logo=esphome)](https://esphome.io/)
[![Chart.js](https://img.shields.io/badge/Analytics-Chart.js-ff6384?style=for-the-badge&logo=chartdotjs)](https://www.chartjs.org/)

A complete end-to-end IoT Telemetry and Realtime Dashboard solution implementing the instructor-defined L1–L5 architectural sequence.

---

## 1. Project Goal & Overview

The goal of this project is to build a reliable, scalable IoT monitoring system with zero polling latency on the frontend:
1. **ESP32** collects sensor readings (Temperature, Humidity, Light) and synchronizes with **SNTP** network time.
2. **ESPHome** transmits telemetry over **HTTPS REST API** directly to **Firebase Realtime Database** without heavy vendor SDKs on the microcontroller.
3. **Firebase Realtime Database** stores current snapshot (`/latest`) via HTTP `PUT` and historical time-series records (`/history`) via HTTP `POST`.
4. **GitHub Pages Web Dashboard** utilizes the **Firebase Web SDK** to listen for live data mutations via WebSockets, rendering instant telemetry updates without requiring manual browser refreshes.

---

## 2. System Architecture

```text
┌────────────────────────────────────────────────────────┐
│                      ESP32 MCU                         │
│                  (ESPHome ESP-IDF)                     │
│                                                        │
│  • Simulated Sensors: Temp (25-35°C), Humi (50-80%),   │
│                       Light (100-1000 lx)              │
│  • SNTP Clock: Asia/Bangkok Unix Timestamp             │
└──────────────────────────┬─────────────────────────────┘
                           │
                           │ HTTPS / REST API (Dual Pipeline)
                           ▼
┌────────────────────────────────────────────────────────┐
│             Firebase Realtime Database                 │
│                                                        │
│  /lab/esp32-01/                                        │
│     ├── latest    ◄── (PUT) Overwritten current state  │
│     └── history   ◄── (POST) Time series push IDs      │
└──────────────────────────┬─────────────────────────────┘
                           │
                           │ Firebase Web SDK (Realtime Listeners)
                           ▼
┌────────────────────────────────────────────────────────┐
│            GitHub Pages Web Dashboard                  │
│                                                        │
│  • Live Status & Connectivity Heartbeat                │
│  • KPI Telemetry Cards (Min/Max, Threshold Badges)     │
│  • Interactive Chart.js Timeline Multi-Sensor Graph    │
│  • 6-Column Presentation Telemetry History Table       │
│  • Built-in ESP32 REST Payload Simulator & CSV Export  │
└────────────────────────────────────────────────────────┘
```

---

## 3. Database Schema

The database strictly conforms to the laboratory design:

```text
lab/
└── esp32-01/
    ├── latest/
    │   ├── temp: 28.4
    │   ├── humi: 67.2
    │   ├── light: 536
    │   └── timestamp: 1789237000
    │
    └── history/
        ├── -Oabc001/
        │   ├── temp: 28.4
        │   ├── humi: 67.2
        │   ├── light: 536
        │   └── timestamp: 1789237000
        ├── -Oabc002/
        │   ├── temp: 29.1
        │   ├── humi: 65.0
        │   ├── light: 540
        │   └── timestamp: 1789237010
        └── ...
```

---

## 4. Hardware & Software Requirements

### Hardware
- **ESP32 Development Board** (ESP32-WROOM-32 / NodeMCU ESP32)
- Micro-USB or USB-C data cable
- 2.4 GHz Wi-Fi Access Point with Internet connectivity

### Software & Cloud
- **ESPHome** (`v2023.x+` with ESP-IDF framework)
- **Firebase Realtime Database** project instance
- **Modern Web Browser** (Chrome, Firefox, Edge, Safari)
- **GitHub Account** (for GitHub Pages hosting)

---

## 5. ESPHome Progressive Implementation Sequence (L1 → L5)

This repository includes standalone configurations for each level to demonstrate incremental verification:

| File | Level | Primary Objective | Upload Method |
|---|---|---|---|
| [`esphome/firebase-l1.yaml`](esphome/firebase-l1.yaml) | **L1** | Send constant data (`temp=25.5`, `humi=60.0`, `light=300.0`) | `PUT` to `latest.json` |
| [`esphome/firebase-l2.yaml`](esphome/firebase-l2.yaml) | **L2** | Dynamic template sensors with `random_float()` ranges | `PUT` to `latest.json` |
| [`esphome/firebase-l3.yaml`](esphome/firebase-l3.yaml) | **L3** | Append time series historical records | `POST` to `history.json` |
| [`esphome/firebase-l4.yaml`](esphome/firebase-l4.yaml) | **L4** | SNTP Time Synchronization + Unix timestamp in seconds | `POST` to `history.json` |
| [`esphome/firebase-l5.yaml`](esphome/firebase-l5.yaml) | **L5** | Full dual pipeline: updates `/latest` AND appends `/history` | `PUT` + `POST` |
| [`esphome/firebase-final.yaml`](esphome/firebase-final.yaml) | **Production** | Optimized, clean production build | `PUT` + `POST` |

---

## 6. Web Dashboard Features

- **Cyber Dark Glassmorphic UI**: High-contrast, responsive interface styled with vanilla CSS.
- **Zero Refresh Realtime**: Powered by Firebase `on('value')` listeners.
- **6-Column Presentation Table**:
  1. `Device ID`: `esp32-01`
  2. `Timestamp`: Local formatted date and time (`YYYY-MM-DD HH:mm:ss`)
  3. `Temperature`: `XX.X °C`
  4. `Humidity`: `XX.X %`
  5. `Light`: `XXX lx`
  6. `Derived Status`: `ONLINE` / `NORMAL` / `HIGH TEMP` / `HIGH HUMI`
- **Dynamic Chart.js Analytics**: Multi-axis timelines with filter tabs for individual or combined sensor metrics.
- **In-Browser ESP32 Simulator**: Send test payloads via REST `PUT` and `POST` directly from the dashboard UI to test end-to-end functionality without physical hardware.
- **CSV Data Export**: Export collected historical telemetry with a single click.

---

## 7. Quick Setup & Deployment

### Step 1: Clone Repository & Configure Secrets
```bash
# Clone repository
git clone https://github.com/<your-username>/<your-repo-name>.git
cd <your-repo-name>

# Copy secrets template
cp esphome/secrets.example.yaml esphome/secrets.yaml
```
Edit `esphome/secrets.yaml` with your Wi-Fi credentials and Firebase RTDB URL.

### Step 2: Set Firebase Rules
In Firebase Console → Realtime Database → **Rules**, publish:
```json
{
  "rules": {
    ".read": false,
    ".write": false,
    "lab": {
      ".read": true,
      ".write": true
    }
  }
}
```

### Step 3: Flash ESP32
```bash
esphome run esphome/firebase-final.yaml
```

### Step 4: Host on GitHub Pages
1. Push repository to GitHub.
2. Go to **Settings** → **Pages** → Source: **Deploy from a branch** (`main` / `/ root`).
3. Access your live dashboard: `https://<your-username>.github.io/<your-repo-name>/`
4. Use the in-dashboard **Settings** modal to link your Firebase Realtime Database URL.

---

## 8. Live Demonstration URL

- **Production Dashboard URL:** `https://<YOUR-GITHUB-USERNAME>.github.io/<YOUR-REPO-NAME>/`
- **Local Preview:** Open `index.html` directly in any web browser.

---

## 9. Documentation Directory

- 📖 [Complete Setup Guide](docs/setup.md)
- 🧪 [Verification & Testing Guide](docs/testing.md)
- 🛠️ [Troubleshooting Matrix](docs/troubleshooting.md)
