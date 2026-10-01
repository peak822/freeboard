# Testing & Verification Guide

This document defines the step-by-step test suites to verify each level (L1–L5), database integrity, and the real-time web dashboard.

---

## 1. ESPHome Incremental Verification (L1 → L5)

### Test L1: Constant Data Path
- **Config:** `esphome/firebase-l1.yaml`
- **Action:** Flash ESP32 and monitor serial/network logger.
- **Expected Log:** `Firebase HTTP status = 200`
- **Firebase Check:** Node `/lab/esp32-01/latest` exists with:
  ```json
  {
    "temp": 25.5,
    "humi": 60.0,
    "light": 300.0
  }
  ```

### Test L2: Dynamic Sensor Range
- **Config:** `esphome/firebase-l2.yaml`
- **Action:** Observe updates over 30 seconds.
- **Expected Log:** `Firebase HTTP status = 200` logged every 10s.
- **Firebase Check:** Node `/lab/esp32-01/latest` updates continuously. Values fluctuate within:
  - `temp`: 25.0 – 35.0 °C
  - `humi`: 50.0 – 80.0 %
  - `light`: 100 – 1000 lx

### Test L3: Historical Push IDs
- **Config:** `esphome/firebase-l3.yaml`
- **Action:** Allow 3-5 upload cycles.
- **Firebase Check:** Node `/lab/esp32-01/history` contains multiple push ID children (`-Oxxxxxx`). Previous records are preserved and not overwritten.

### Test L4: SNTP Synchronization & Unix Timestamp
- **Config:** `esphome/firebase-l4.yaml`
- **Action:** Boot ESP32 and check logs.
- **Expected Log:** `Time synchronized` appears before the first Firebase POST.
- **Firebase Check:** History entries now include integer `timestamp` (e.g., `1789237000` in seconds).

### Test L5: Dual Pipeline (Latest + History)
- **Config:** `esphome/firebase-l5.yaml` or `esphome/firebase-final.yaml`
- **Expected Log:**
  ```text
  Time synchronized
  Send temp=28.7 humi=64.2 light=532
  Latest HTTP status = 200
  History HTTP status = 200
  ```
- **Firebase Check:** Both `/lab/esp32-01/latest` is overwritten AND `/lab/esp32-01/history` appends a new record simultaneously.

---

## 2. Real-Time Dashboard Verification

| Test Case | Procedure | Expected Result | Pass/Fail |
|---|---|---|---|
| **TC-01: Live Stream** | Open Dashboard with active ESP32 | Top status dot turns green (`Live Stream Connected`). KPI cards display real-time numbers. | [ ] |
| **TC-02: Zero-Refresh Update** | Keep Dashboard open for 20 seconds | Card values and chart refresh automatically without pressing F5 / reload. | [ ] |
| **TC-03: Six-Column Table** | Inspect Telemetry table | Displays 6 distinct columns: Device ID, Timestamp, Temperature, Humidity, Light, Status. | [ ] |
| **TC-04: Chart Rendering** | Switch between All/Temp/Humi/Light filters | Chart updates dynamically with smooth transitions and correct Y-axis scales. | [ ] |
| **TC-05: Stale Threshold** | Disconnect ESP32 power for >30 seconds | System status badge transitions from `ONLINE` to `STALE / OFFLINE`. | [ ] |
| **TC-06: CSV Export** | Click **Export CSV** | Browser downloads `.csv` file containing timestamped sensor data. | [ ] |
| **TC-07: Built-in Simulator** | Open ESP32 Simulator drawer and click **Send L5 Payload** | Realtime PUT & POST execute, logs show HTTP 200, and Dashboard updates immediately. | [ ] |
