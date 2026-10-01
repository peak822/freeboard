# Design Specification: 6-Sensor Telemetry Suite & 3x2 Cyber-Pixel HUD

## 1. Overview & Objective
Expand the IoT Telemetry system from 3 to **6 physical/environmental sensor measurements** across the entire pipeline (ESP32 $\rightarrow$ ESPHome $\rightarrow$ Firebase Realtime Database $\rightarrow$ Web Dashboard), presenting them in a responsive **3x2 Cyber-Pixel HUD Card Matrix** with an integrated System Health HUD bar, extended 9-column history table, multi-series timeline chart, and a 6-sensor REST simulator.

---

## 2. 6-Sensor Environmental Data Model

| # | Sensor Name | Field Key | Unit | Typical Range | 5-Segment Level Range | Neon Accent Theme |
|---|-------------|-----------|------|---------------|-----------------------|-------------------|
| 1 | **Temperature** | `temp` | `°C` | 25.0 – 35.0 °C | 25 – 35 °C | Redstone Neon (`#ff3355` / `#dc2626`) |
| 2 | **Relative Humidity** | `humi` | `%` | 50.0 – 80.0 % | 50 – 80 % | Cyan Neon (`#00f2fe` / `#0284c7`) |
| 3 | **Ambient Light** | `light` | `lx` | 100 – 1000 lx | 100 – 1000 lx | Amber Gold (`#fbbf24` / `#d97706`) |
| 4 | **Air Pressure** | `press` | `hPa` | 950.0 – 1050.0 hPa | 950 – 1050 hPa | Amethyst Purple (`#c084fc` / `#9333ea`) |
| 5 | **Carbon Dioxide (CO2)** | `co2` | `ppm` | 400 – 1200 ppm | 400 – 1200 ppm | Emerald Green (`#34d399` / `#16a34a`) |
| 6 | **Sound Noise Level** | `noise` | `dB` | 30.0 – 90.0 dB | 30 – 90 dB | Cyber Blue (`#38bdf8` / `#0284c7`) |

### Complete Telemetry Packet Payload
```json
{
  "temp": 28.4,
  "humi": 64.2,
  "light": 530,
  "press": 1013.2,
  "co2": 520,
  "noise": 45.5,
  "timestamp": 1790852000
}
```

---

## 3. UI Component & Layout Architecture

```
+-----------------------------------------------------------------------------------------+
|                                    HEADER & CONTROLS                                    |
| [Logo] ESP32 TELEMETRY HUB  [Live] [Day/Night] [Diagnostics] [Settings] [Simulator]    |
+-----------------------------------------------------------------------------------------+
|                                  SYSTEM HEALTH HUD BAR                                  |
| [Device: esp32-01]  [Status: ONLINE]  [Last Sync: 10:25:00]  [Packet Interval: 10s]     |
+-----------------------------------------------------------------------------------------+
|                                3x2 SENSOR MATRIX GRID                                   |
| +-----------------------+ +-----------------------+ +---------------------------------+ |
| | SENSOR // 01: TEMP    | | SENSOR // 02: HUMI    | | SENSOR // 03: LIGHT             | |
| | 30.1 °C  [=====]      | | 60.5 %   [=====]      | | 560 lx   [=====]                | |
| +-----------------------+ +-----------------------+ +---------------------------------+ |
| +-----------------------+ +-----------------------+ +---------------------------------+ |
| | SENSOR // 04: PRESSURE| | SENSOR // 05: CO2     | | SENSOR // 06: NOISE             | |
| | 1013.2 hPa [=====]    | | 520 ppm  [=====]      | | 45.5 dB  [=====]                | |
| +-----------------------+ +-----------------------+ +---------------------------------+ |
+-----------------------------------------------------------------------------------------+
|                        REALTIME TELEMETRY TIMELINE CHART                                |
| [ALL] [TEMP] [HUMI] [LIGHT] [PRESS] [CO2] [NOISE]                                       |
| <Canvas with multi-axis glowing gradients and toggleable datasets>                      |
+-----------------------------------------------------------------------------------------+
|                       HISTORICAL SENSOR STREAM (9 COLUMNS)                              |
| [Node Selector] [Limit Selector: 10/25/50/100/All] [Export CSV]                         |
| Device | Timestamp (Asia/Bangkok) | Temp | Humi | Light | Press | CO2 | Noise | Status  |
+-----------------------------------------------------------------------------------------+
```

---

## 4. Subsystem Specifications

### 4.1 ESPHome Firmware Updates
- In `esphome/firebase-l2.yaml` through `firebase-final.yaml`:
  - Add template sensors for `press`, `co2`, `noise`.
  - Update `http_request.put` (`/latest.json`) and `http_request.post` (`/history.json`) to include all 6 sensors.

### 4.2 Firebase Ingestion & Backward Compatibility
- Service parser in `js/firebase-service.js` dynamically extracts all 6 sensor keys.
- If a legacy record (from previous 3-sensor tests) arrives lacking `press`, `co2`, or `noise`, missing fields safely evaluate to `null` and render as `<span class="text-muted">N/A</span>` in table and KPI cards without runtime errors.

### 4.3 Multi-Series Timeline Chart (`js/charts.js`)
- Support 6 colored series with independent Y-axes:
  - Left Primary: Temperature (°C), Humidity (%), Noise (dB)
  - Right Secondary: Light (lx), Pressure (hPa), CO2 (ppm)
- Dedicated filter tabs: `ALL`, `TEMP`, `HUMI`, `LIGHT`, `PRESS`, `CO2`, `NOISE`.

### 4.4 History Table (9 Columns)
1. `DEVICE ID`
2. `TIMESTAMP` (Formatted in `Asia/Bangkok` GMT+7)
3. `TEMPERATURE` (°C)
4. `HUMIDITY` (%)
5. `LIGHT` (lx)
6. `PRESSURE` (hPa)
7. `CO2` (ppm)
8. `NOISE` (dB)
9. `STATUS` (Computed health assessment)

### 4.5 REST Simulator Drawer
- Expand simulator form to provide inputs for all 6 sensors with quick random generator and direct dual L5 REST upload.

### 4.6 CSV Exporter
- Export CSV with 9 full columns: `Device ID,Timestamp (Unix),Datetime (Asia/Bangkok),Temperature (C),Humidity (%),Light (lx),Pressure (hPa),CO2 (ppm),Noise (dB),Status`.

---

## 5. Verification & Acceptance Criteria
1. ESPHome YAML passes validation with 6 template sensors.
2. REST Simulator dispatches all 6 fields to Firebase `/latest` and `/history`.
3. 3x2 Sensor Matrix renders all 6 cards with 5-segment pixel meters and distinct color themes.
4. Legacy records with 3 sensors render `N/A` for missing fields without NaN or errors.
5. Chart and Table seamlessly display all 6 sensor measurements in realtime.
6. Responsive design maintains crisp pixel layout across desktop and mobile screens in both Daylight Quartz and Midnight Obsidian themes.
