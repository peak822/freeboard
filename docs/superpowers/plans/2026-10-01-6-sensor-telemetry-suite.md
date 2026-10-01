# 6-Sensor Telemetry Suite & 3x2 Cyber-Pixel HUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the IoT telemetry pipeline to 6 physical/environmental sensors (Temp, Humi, Light, Pressure, CO2, Noise) and implement a 3x2 Cyber-Pixel HUD Matrix with an integrated System Health bar, 6-series timeline chart, 9-column history table, and 6-sensor REST simulator.

**Architecture:** ESPHome simulates 6 environmental sensors and sends JSON via HTTP PUT (`/latest.json`) and POST (`/history.json`) to Firebase Realtime Database. The Firebase Web SDK listens to changes in realtime and updates the 3x2 Matrix HUD, Chart.js multi-axis timeline, and 9-column table with full backward compatibility for legacy 3-sensor records.

**Tech Stack:** ESPHome / ESP32, Firebase Realtime Database (REST & Web SDK v10 Compat), Vanilla JavaScript (ES6+), Chart.js 4.4, CSS3 Custom Properties (Daylight / Midnight themes), HTML5.

## Global Constraints
- Sensor Keys: `temp` (°C), `humi` (%), `light` (lx), `press` (hPa), `co2` (ppm), `noise` (dB), `timestamp` (Unix seconds).
- Timezone: `Asia/Bangkok` (GMT+7) forced formatting.
- Backward Compatibility: Legacy records with missing sensor fields must display `N/A` (never fake numbers or zeros).
- Table Columns (9): Device ID, Timestamp, Temperature, Humidity, Light, Pressure, CO2, Noise, Status.
- Zero-build GitHub Pages deployment (Pure HTML/CSS/JS without Node compilation).

---

### Task 1: ESPHome Firmware Configurations Update

**Files:**
- Modify: `esphome/firebase-final.yaml`
- Modify: `esphome/firebase-l5.yaml`
- Modify: `esphome/firebase-l2.yaml`

**Interfaces:**
- Produces: JSON payloads containing `temp`, `humi`, `light`, `press`, `co2`, `noise`, `timestamp`.

- [x] **Step 1: Update `esphome/firebase-final.yaml` with 6 sensors**

```yaml
# Add 3 new template sensors:
  - platform: template
    name: "Air Pressure"
    id: press
    unit_of_measurement: "hPa"
    accuracy_decimals: 1
    update_interval: 5s
    lambda: |-
      return 950.0 + random_float() * 100.0;

  - platform: template
    name: "Carbon Dioxide"
    id: co2
    unit_of_measurement: "ppm"
    accuracy_decimals: 0
    update_interval: 5s
    lambda: |-
      return 400.0 + random_float() * 800.0;

  - platform: template
    name: "Sound Noise"
    id: noise
    unit_of_measurement: "dB"
    accuracy_decimals: 1
    update_interval: 5s
    lambda: |-
      return 30.0 + random_float() * 60.0;
```

Update dual REST JSON builder:
```yaml
root["temp"] = id(temp).state;
root["humi"] = id(humi).state;
root["light"] = id(light).state;
root["press"] = id(press).state;
root["co2"] = id(co2).state;
root["noise"] = id(noise).state;
root["timestamp"] = id(sntp_time).now().timestamp;
```

- [x] **Step 2: Update `esphome/firebase-l5.yaml` and `firebase-l2.yaml`**
Repeat the 6-sensor definitions across L2 and L5 configurations for consistency.

- [x] **Step 3: Commit firmware updates**

```bash
git add esphome/
git commit -m "feat(esphome): add 6-sensor environmental suite (temp, humi, light, press, co2, noise)"
```

---

### Task 2: CSS Styles for 3x2 Matrix & New Sensor Themes

**Files:**
- Modify: `css/style.css`

**Interfaces:**
- Produces: CSS classes `.card-press`, `.card-co2`, `.card-noise`, `.meter-press`, `.meter-co2`, `.meter-noise`, `.kpi-grid`, `.system-health-bar`.

- [x] **Step 1: Add 3x2 Grid and System Health Bar styles**

```css
/* 3x2 Matrix Grid */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  margin-bottom: 24px;
}

@media (max-width: 1024px) {
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }
}

/* System Health HUD Bar */
.system-health-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  margin-bottom: 20px;
  background: var(--bg-card);
  border: var(--border-card);
  border-radius: 8px;
  box-shadow: var(--shadow-card-depth);
  flex-wrap: wrap;
  gap: 14px;
}
```

- [x] **Step 2: Add color accents & 5-segment meters for Pressure, CO2, and Noise**

```css
/* Amethyst Pressure */
.card-press::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, #c084fc, #a855f7);
  box-shadow: 0 0 12px #c084fc;
}
.icon-press { color: #c084fc; }
.meter-press .meter-segment.active {
  background: #c084fc;
  box-shadow: 0 0 8px #c084fc;
}

/* Emerald CO2 */
.card-co2::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, #34d399, #10b981);
  box-shadow: 0 0 12px #34d399;
}
.icon-co2 { color: #34d399; }
.meter-co2 .meter-segment.active {
  background: #34d399;
  box-shadow: 0 0 8px #34d399;
}

/* Cyber Blue Noise */
.card-noise::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, #38bdf8, #0284c7);
  box-shadow: 0 0 12px #38bdf8;
}
.icon-noise { color: #38bdf8; }
.meter-noise .meter-segment.active {
  background: #38bdf8;
  box-shadow: 0 0 8px #38bdf8;
}
```

- [x] **Step 3: Commit CSS styles**

```bash
git add css/style.css
git commit -m "style(hud): add 3x2 matrix grid, system health bar, and 3 new sensor themes"
```

---

### Task 3: HTML DOM Structure Update (`index.html`)

**Files:**
- Modify: `index.html`

**Interfaces:**
- Produces: 6 KPI card elements (`valTemp`, `valHumi`, `valLight`, `valPress`, `valCo2`, `valNoise`), System Health bar, 7 chart filter buttons, 9-column table headers, and 6-input simulator drawer.

- [x] **Step 1: Replace KPI grid with System Health Bar + 3x2 Sensor Matrix in `index.html`**
Include:
- System Health HUD Bar (Device ID, Online status, Heartbeat meter, Relative time, Last Sync).
- 6 Sensor Cards:
  1. Temperature (`valTemp`, `meterTemp`, `minMaxTemp`, `badgeTemp`)
  2. Relative Humidity (`valHumi`, `meterHumi`, `minMaxHumi`, `badgeHumi`)
  3. Ambient Light (`valLight`, `meterLight`, `minMaxLight`, `badgeLight`)
  4. Air Pressure (`valPress`, `meterPress`, `minMaxPress`, `badgePress`)
  5. Carbon Dioxide (`valCo2`, `meterCo2`, `minMaxCo2`, `badgeCo2`)
  6. Sound Noise Level (`valNoise`, `meterNoise`, `minMaxNoise`, `badgeNoise`)

- [x] **Step 2: Update Chart controls and Table headers**
- Add chart filter buttons: `ALL SENSORS`, `TEMP`, `HUMI`, `LIGHT`, `PRESS`, `CO2`, `NOISE`.
- Update table headers to 9 columns: `DEVICE ID`, `TIMESTAMP (SNTP - ASIA/BANGKOK)`, `TEMPERATURE`, `HUMIDITY`, `LIGHT`, `PRESSURE`, `CO2`, `NOISE`, `STATUS`.

- [x] **Step 3: Update Simulator drawer with 6 inputs**
- Add inputs: `simTemp`, `simHumi`, `simLight`, `simPress`, `simCo2`, `simNoise`.

- [x] **Step 4: Commit HTML updates**

```bash
git add index.html
git commit -m "feat(ui): implement 3x2 sensor matrix, health bar, and 9-column table in index.html"
```

---

### Task 4: Firebase Service Layer & Data Parser (`js/firebase-service.js`)

**Files:**
- Modify: `js/firebase-service.js`

**Interfaces:**
- Consumes: Firebase RTDB `/lab/<device>/latest` and `/history`.
- Produces: Ingests 6 sensor fields (`temp`, `humi`, `light`, `press`, `co2`, `noise`) + `timestamp`.

- [x] **Step 1: Update history record parser in `FirebaseService.attachDeviceListeners`**

```javascript
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
```

- [x] **Step 2: Update `simulateEsp32Upload()` to handle 6 sensor fields**

```javascript
async simulateEsp32Upload(temp, humi, light, press, co2, noise, customTimestamp = null)
```

- [x] **Step 3: Commit service layer changes**

```bash
git add js/firebase-service.js
git commit -m "feat(service): expand Firebase service parser and simulator for 6 sensors"
```

---

### Task 5: Chart Multi-Axis Series & Filter Modes (`js/charts.js`)

**Files:**
- Modify: `js/charts.js`

**Interfaces:**
- Produces: 6 Chart.js line datasets with multi-axis scales (`yLeft` and `yRight`) and mode filtering (`temp`, `humi`, `light`, `press`, `co2`, `noise`, `combined`).

- [x] **Step 1: Add gradients & datasets for Pressure, CO2, and Noise in `TelemetryCharts`**
- Purple gradient for `press` (Y-axis: `yRight`).
- Emerald gradient for `co2` (Y-axis: `yRight`).
- Cyber Blue gradient for `noise` (Y-axis: `yLeft`).

- [x] **Step 2: Implement dynamic scale toggle for all 6 filter modes**

- [x] **Step 3: Commit chart updates**

```bash
git add js/charts.js
git commit -m "feat(charts): add 6-sensor multi-axis dataset visualization and filter modes"
```

---

### Task 6: Dashboard Controller, Table Rendering, and CSV Export (`js/dashboard.js`)

**Files:**
- Modify: `js/dashboard.js`

**Interfaces:**
- Produces: 6 KPI card updates, 5-segment meters, 9-column table rendering, 6-sensor CSV export, and simulator controls.

- [x] **Step 1: Update `handleLatestUpdate` to bind all 6 sensor cards and 5-segment meters**
- Bind `press` (950–1050 hPa range) $\rightarrow$ `meterPress`
- Bind `co2` (400–1200 ppm range) $\rightarrow$ `meterCo2`
- Bind `noise` (30–90 dB range) $\rightarrow$ `meterNoise`

- [x] **Step 2: Update `renderHistoryTable` to render 9 columns**
Render `temp`, `humi`, `light`, `press`, `co2`, `noise` with `N/A` fallback for legacy records.

- [x] **Step 3: Update CSV Export and Simulator Drawer to support 6 sensors**

- [x] **Step 4: Commit dashboard controller changes**

```bash
git add js/dashboard.js
git commit -m "feat(dashboard): wire 6-sensor cards, 9-column table, simulator, and CSV export"
```

---

### Task 7: Verification & Acceptance Testing

**Files:**
- Verify: `http://localhost:8080/`

- [x] **Step 1: Test Simulator L5 upload with 6 sensor parameters**
Open Simulator drawer, generate random values for all 6 sensors, click "SEND L5 PAYLOAD".
Verify both PUT to `/latest.json` and POST to `/history.json` succeed with HTTP 200.

- [x] **Step 2: Verify Realtime 3x2 Matrix HUD updates**
Confirm all 6 cards update immediately with animated numbers and 5-segment pixel meters.

- [x] **Step 3: Verify 9-Column History Table**
Confirm newly created records show all 6 sensor measurements, while legacy records show `N/A` without error.

- [x] **Step 4: Verify Multi-Axis Chart**
Confirm all 6 curves render cleanly with glow effects and filter tabs work for every sensor.

- [x] **Step 5: Verify Theme Switching and Mobile Responsiveness**
Test Daylight Quartz and Midnight Obsidian themes; test viewport down to 375px mobile screen.

- [x] **Step 6: Final Git Commit**

```bash
git add .
git commit -m "feat: complete 6-sensor telemetry suite and 3x2 Cyber-Pixel HUD"
```
