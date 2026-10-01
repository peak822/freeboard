# ESP32 + ESPHome + Firebase RTDB + GitHub Pages Dashboard
## Project Implementation Plan for AI Coding Assistant

> **Purpose:** Use this document as the master implementation plan for an AI coding assistant to build the project from the beginning.
>
> **Primary source:** Instructor-provided `ESP32-Firebase-GitHub.docx`, especially the L1–L5 laboratory sequence.
>
> **Important:** Do not skip or silently replace the instructor's L1–L5 architecture. Build incrementally and verify each level before moving to the next one.

---

# 1. Project Goal

Build an IoT demonstration system with this final data flow:

```text
ESP32
  │
  │ ESPHome
  │
  │ Wi-Fi / Internet
  ▼
Firebase Realtime Database
  │
  ├── /lab/esp32-01/latest
  │
  └── /lab/esp32-01/history
  │
  │ Firebase Web SDK
  ▼
GitHub Pages
  │
  ▼
Realtime Web Dashboard
```

The ESP32 does **not** use the Firebase SDK. It sends data through HTTPS REST API using ESPHome `http_request`.

The web dashboard uses the Firebase Web SDK to listen for database changes in real time.

---

# 2. Assignment Requirements

The final project must satisfy the following:

1. Use ESP32 + ESPHome.
2. Use Firebase Realtime Database.
3. Use GitHub / GitHub Pages.
4. Provide a web Dashboard.
5. Dashboard must display Firebase data in real time.
6. The initial sensor data may be simulated/randomized; real sensors are not required for L1–L5.
7. The database/device structure must follow the instructor's L1–L5 design:
   - `/lab/esp32-01/latest`
   - `/lab/esp32-01/history`
8. The final submission must be accessible through one GitHub Pages URL.
9. The project must be understandable, testable, and suitable for demonstrating the complete data flow.

### Dashboard display requirement

The instructor's L1–L5 data model contains three simulated sensor values:

- `temp`
- `humi`
- `light`

For the assignment requirement of at least six displayed columns, use a presentation-level table with:

1. Device ID
2. Timestamp
3. Temperature
4. Humidity
5. Light
6. Status

Do **not** invent additional physical sensors merely to satisfy the six-column display requirement.

`Device ID`, `Timestamp`, and `Status` are system/metadata fields.

---

# 3. Core Architecture

```text
┌──────────────────────────────┐
│            ESP32             │
│          ESPHome             │
│                              │
│  Random Temperature          │
│  Random Humidity             │
│  Random Light                │
│  SNTP Timestamp              │
└──────────────┬───────────────┘
               │
               │ HTTPS / REST API
               │
       ┌───────┴────────┐
       │                │
      PUT              POST
       │                │
       ▼                ▼
┌────────────┐    ┌──────────────┐
│   latest   │    │   history    │
│ current    │    │ time series  │
└─────┬──────┘    └──────┬───────┘
      │                   │
      └─────────┬─────────┘
                ▼
┌────────────────────────────────┐
│ Firebase Realtime Database     │
│                                │
│ /lab/esp32-01/                 │
│   latest                       │
│   history                      │
└───────────────┬────────────────┘
                │
                │ Firebase Web SDK
                │ Realtime listeners
                ▼
┌────────────────────────────────┐
│ GitHub Pages Dashboard         │
│                                │
│ Current Status                 │
│ Sensor Cards                   │
│ Realtime Table                 │
│ Historical Data / Graph        │
└────────────────────────────────┘
```

---

# 4. Database Design

## 4.1 Required Firebase tree

```text
lab
└── esp32-01
    ├── latest
    │   ├── temp
    │   ├── humi
    │   ├── light
    │   └── timestamp
    │
    └── history
        ├── -Oxxxxxxxx
        │   ├── temp
        │   ├── humi
        │   ├── light
        │   └── timestamp
        │
        ├── -Oyyyyyyyy
        │   ├── temp
        │   ├── humi
        │   ├── light
        │   └── timestamp
        │
        └── ...
```

## 4.2 Meaning

### `latest`

Contains exactly the current/latest state.

Use:

```text
PUT /lab/esp32-01/latest.json
```

A new PUT replaces the previous values at that location.

Primary use:

- Dashboard current values
- Current device status
- Current sensor cards

### `history`

Contains multiple records.

Use:

```text
POST /lab/esp32-01/history.json
```

Firebase creates a unique Push ID for every new record.

Primary use:

- Historical table
- Graph
- Trend analysis
- Statistics

---

# 5. Firebase Rules

For the laboratory development stage, configure the database so that only `/lab` is accessible according to the instructor's rule structure:

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

Publish the rules.

### Security note

This rule is appropriate only for the laboratory/demo requirement and is not a production security design.

Do not claim that the final project is production-secure.

---

# 6. Firebase Setup

The AI must NOT hard-code a fake Firebase URL.

The developer must obtain the real Firebase Realtime Database URL from Firebase Console.

Expected pattern:

```text
https://<PROJECT-ID>-default-rtdb.<REGION>.firebasedatabase.app
```

The project should use the actual database URL supplied by the user.

For the instructor's example, `asia-southeast1` is relevant when that region is selected.

### Required setup checklist

- Create Firebase Project.
- Google Analytics is not required for this laboratory.
- Create Realtime Database.
- Select the required database region.
- Record the actual Database URL.
- Configure Rules.
- Verify `/lab.json` can be reached according to the configured rules.

Do not guess the Firebase URL.

---

# 7. ESPHome Requirements

Use ESPHome with the ESP-IDF framework as used in the instructor material.

Basic requirements:

```yaml
esp32:
  board: esp32dev
  framework:
    type: esp-idf
```

Use:

```yaml
logger:
```

Wi-Fi credentials must be stored using ESPHome secrets.

Example:

```yaml
wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  power_save_mode: none
```

Do not place real Wi-Fi passwords directly into source-controlled YAML files.

---

# 8. Development Strategy: L1 → L5

The project MUST be implemented in the following order.

Do not jump directly to the final YAML.

---

# L1 — Send Constant Data to Firebase

## Objective

Prove this path:

```text
ESP32
 → Wi-Fi
 → Internet
 → HTTPS
 → Firebase RTDB
```

No random sensor values yet.

No real sensors.

## Data

```text
temp  = 25.5
humi  = 60.0
light = 300.0
```

## Method

```text
PUT
```

## Path

```text
/lab/esp32-01/latest.json
```

## ESPHome requirements

Use:

```yaml
http_request:
  timeout: 10s
```

Send JSON using ESPHome's JSON request support.

Expected body:

```json
{
  "temp": 25.5,
  "humi": 60.0,
  "light": 300.0
}
```

Run the request approximately every 10 seconds.

Check Wi-Fi before sending.

## Expected Log

```text
Firebase HTTP status = 200
```

## Expected Firebase

```text
lab
└── esp32-01
    └── latest
        ├── temp: 25.5
        ├── humi: 60
        └── light: 300
```

## L1 Acceptance Criteria

- [ ] ESP32 connects to Wi-Fi.
- [ ] ESP32 receives an IP address.
- [ ] HTTPS request is sent.
- [ ] Firebase returns HTTP 200.
- [ ] `/lab/esp32-01/latest` exists.
- [ ] Values are correct.
- [ ] `.json` is present in the REST endpoint.
- [ ] No random sensor code is used yet.

---

# L2 — Replace Constant Data with Random Sensors

## Objective

Prove that changing values from ESPHome can be sent to Firebase.

Create three Template Sensors:

```text
temp
humi
light
```

## Required ranges

Temperature:

```text
25.0 + random_float() * 10.0
```

Range:

```text
25–35 °C
```

Humidity:

```text
50.0 + random_float() * 30.0
```

Range:

```text
50–80 %
```

Light:

```text
100.0 + random_float() * 900.0
```

Range:

```text
100–1000 lx
```

## Timing

Sensor update:

```text
5 seconds
```

Firebase upload:

```text
10 seconds
```

These intervals are intentionally different.

The Firebase request should use the current values:

```text
id(temp).state
id(humi).state
id(light).state
```

## Method

Still:

```text
PUT
```

## Path

```text
/lab/esp32-01/latest.json
```

## Important concept

`id(temp).state` means the current state stored by that ESPHome sensor.

The cloud upload does not force a new sensor measurement; it reads the latest available sensor state.

## L2 Acceptance Criteria

- [ ] Three Template Sensors exist.
- [ ] Values are generated using `random_float()`.
- [ ] Sensor updates occur every 5 seconds.
- [ ] Firebase upload occurs every 10 seconds.
- [ ] `latest` changes over time.
- [ ] Previous `latest` values are replaced.
- [ ] No historical records are created yet.
- [ ] Firebase HTTP status is 200.

---

# L3 — Add History

## Objective

Solve the limitation of L2:

> `latest` can tell us the current value, but cannot provide historical records.

Add:

```text
history
```

## Method

```text
POST
```

## Path

```text
/lab/esp32-01/history.json
```

## Expected behavior

Each POST creates a new Firebase Push ID.

Example:

```text
history
├── -Oabc001
├── -Oabc002
├── -Oabc003
└── ...
```

Each record contains:

```json
{
  "temp": 28.4,
  "humi": 67.2,
  "light": 536
}
```

## Important distinction

```text
PUT
→ replaces data at the target location

POST
→ creates a new child record
```

## L3 Acceptance Criteria

- [ ] History node exists.
- [ ] POST is used.
- [ ] A new Push ID is created each upload.
- [ ] Previous history records remain.
- [ ] At least 3–5 history records can be demonstrated.
- [ ] HTTP response is checked in Log.

---

# L4 — Add SNTP and Timestamp

## Objective

Make every historical record identify when the measurement occurred.

Add SNTP:

```yaml
time:
  - platform: sntp
    id: sntp_time
    timezone: Asia/Bangkok
```

Log:

```text
Time synchronized
```

before sending data.

## Timestamp

Use Unix timestamp from ESP32.

Example:

```text
1789237000
```

## Required condition

Only send when:

```text
Wi-Fi connected
AND
SNTP time is valid
```

Do not send invalid startup timestamps.

## Important timestamp rule

ESP32 Unix timestamp:

```text
seconds
```

JavaScript `Date`:

```text
milliseconds
```

Therefore the web dashboard must convert:

```javascript
timestamp * 1000
```

when creating a JavaScript Date.

## L4 Expected History

```json
{
  "temp": 28.4,
  "humi": 67.2,
  "light": 536,
  "timestamp": 1789237000
}
```

## L4 Acceptance Criteria

- [ ] SNTP is configured.
- [ ] Timezone is Asia/Bangkok.
- [ ] `Time synchronized` appears.
- [ ] Invalid time is not uploaded.
- [ ] Timestamp is included.
- [ ] Timestamp is Unix seconds.
- [ ] History contains timestamp.
- [ ] Dashboard conversion plan uses milliseconds.

---

# L5 — Store Latest + History Together

## Objective

Create the final instructor-defined IoT architecture.

Every upload cycle performs two operations:

```text
PUT  → latest
POST → history
```

## Data

```text
temp
humi
light
timestamp
```

## Final structure

```text
lab
└── esp32-01
    ├── latest
    │   ├── temp
    │   ├── humi
    │   ├── light
    │   └── timestamp
    │
    └── history
        ├── record 1
        ├── record 2
        ├── record 3
        └── ...
```

## Expected Log

```text
Time synchronized

Send temp=28.7 humi=64.2 light=532

Latest HTTP status = 200
History HTTP status = 200
```

## Important failure behavior

Do not assume that because one request succeeds, the second request also succeeded.

The Log must identify the result of both requests independently.

Example:

```text
Latest HTTP status = 200
History HTTP status = 200
```

If one fails:

```text
Latest HTTP status = 200
History HTTP status = 403
```

the system must report that accurately.

## L5 Acceptance Criteria

- [ ] PUT to latest works.
- [ ] POST to history works.
- [ ] Both requests occur in one upload cycle.
- [ ] Both HTTP statuses are logged.
- [ ] latest always contains the current value.
- [ ] history continues accumulating records.
- [ ] timestamp exists in both latest and history.
- [ ] Data structure matches the instructor's architecture.

---

# 9. Final ESP32 Data Model

The final ESP32-generated data should remain:

```json
{
  "temp": 30.1,
  "humi": 67.8,
  "light": 614,
  "timestamp": 1789237010
}
```

Do not add unnecessary sensor fields.

The assignment's six-column Dashboard requirement should be satisfied at the presentation layer using metadata/status, not by inventing extra physical sensors.

---

# 10. Dashboard Development

Only start Dashboard development after L5 is working.

## Dashboard data sources

### Current state

Read:

```text
/lab/esp32-01/latest
```

Use this for:

- Current temperature
- Current humidity
- Current light
- Current timestamp
- Current device status

### Historical data

Read:

```text
/lab/esp32-01/history
```

Use this for:

- Historical table
- Graph
- Trend
- Recent records

---

# 11. Real-Time Dashboard

The dashboard must use Firebase Web SDK listeners.

Preferred behavior:

```text
Firebase data changes
        ↓
Realtime listener receives update
        ↓
Dashboard state updates
        ↓
UI updates
```

Do NOT implement the main real-time feature as repeated page refreshes.

Do NOT require the user to click Refresh.

Do NOT hard-code sensor values into the Dashboard.

The displayed values must come from Firebase.

---

# 12. Recommended Dashboard Layout

```text
┌─────────────────────────────────────────────────┐
│              IoT REALTIME DASHBOARD              │
├─────────────────────────────────────────────────┤
│ Device: ESP32-01        Status: ONLINE           │
│ Last Update: 08:41:22                            │
├───────────────┬───────────────┬─────────────────┤
│ Temperature   │ Humidity      │ Light           │
│ 28.5 °C       │ 64.2 %        │ 720 lx          │
├───────────────┴───────────────┴─────────────────┤
│                 History Graph                    │
│                                                 │
│                    📈                           │
├─────────────────────────────────────────────────┤
│ Recent Data                                     │
│                                                 │
│ Time | Device | Temp | Humidity | Light | Status│
│ ...                                             │
└─────────────────────────────────────────────────┘
```

---

# 13. Dashboard Table

Minimum six displayed columns:

| Column | Source |
|---|---|
| Device ID | Application metadata |
| Timestamp | Firebase `timestamp` |
| Temperature | Firebase `temp` |
| Humidity | Firebase `humi` |
| Light | Firebase `light` |
| Status | Derived from recent data / connection state |

Do not fake these values.

The Dashboard must clearly distinguish:

- sensor values
- device metadata
- derived status

---

# 14. Device Status Logic

Do not claim that Firebase connection alone proves the physical ESP32 is online.

For this project, a practical demo status can be derived from the latest timestamp.

Example:

```text
if current_time - latest.timestamp <= threshold
    ONLINE
else
    OFFLINE / STALE
```

Choose and document a reasonable threshold.

Do not silently present an inferred status as a direct hardware signal.

---

# 15. Historical Graph

Use `/history` to create a graph.

At minimum support:

```text
Temperature over time
```

Optionally allow:

```text
Humidity over time
Light over time
```

The graph must use the actual Firebase history records.

Convert Unix seconds to JavaScript milliseconds:

```javascript
new Date(timestamp * 1000)
```

Sort historical records by timestamp before rendering if necessary.

---

# 16. GitHub Pages Project Structure

Create a clean project structure.

Recommended:

```text
project/
│
├── README.md
├── index.html
│
├── css/
│   └── style.css
│
├── js/
│   ├── firebase-config.js
│   ├── firebase-service.js
│   ├── dashboard.js
│   └── charts.js
│
├── assets/
│   └── ...
│
└── docs/
    └── ...
```

If the project is small, the AI may simplify the structure, but must keep responsibilities separated.

---

# 17. JavaScript Responsibilities

## `firebase-config.js`

Contains the Firebase Web configuration.

Do not store:

- Wi-Fi passwords
- ESP32 secrets
- private API keys that must remain secret

Firebase Web configuration values are not equivalent to a server-side secret. Security must be enforced by Firebase Rules.

---

## `firebase-service.js`

Responsible for:

- Firebase initialization
- Realtime Database connection
- `latest` listener
- `history` listener
- error handling

The Dashboard UI should not contain raw Firebase connection logic everywhere.

---

## `dashboard.js`

Responsible for:

- updating cards
- updating status
- updating timestamp
- updating the table
- rendering empty/error states

---

## `charts.js`

Responsible for:

- transforming history records
- sorting data
- preparing chart datasets
- rendering/updating charts

---

# 18. UI Requirements

The Dashboard should be:

- clean
- readable
- responsive
- suitable for desktop demonstration
- understandable without opening developer tools

Must include visible states:

### Loading

```text
Connecting to Firebase...
```

### Connected

```text
● Live
```

### Error

```text
Unable to load Firebase data
```

### No data

```text
No sensor data available
```

Do not display misleading zero values when data is missing.

---

# 19. Realtime Test

The final test must prove:

```text
ESP32
 ↓
new random value
 ↓
Firebase latest changes
 ↓
Dashboard changes
```

without:

```text
page refresh
```

Test procedure:

1. Open ESPHome logs.
2. Open Firebase Realtime Database.
3. Open the GitHub Pages Dashboard.
4. Wait for a new ESP32 upload.
5. Confirm `latest` changes.
6. Confirm Dashboard changes automatically.
7. Confirm a new `history` record is created.
8. Confirm graph/table receives the new historical record.

---

# 20. GitHub Pages Deployment

Configure GitHub Pages from the project repository.

Expected final URL pattern:

```text
https://<username>.github.io/<repository>/
```

The final URL must:

- open without localhost
- load the Dashboard
- connect to Firebase
- show live data
- work from a different browser/device when network access is available

Do not submit a localhost URL.

---

# 21. Testing Strategy

## Test 1 — Wi-Fi

Expected:

```text
Connected
IP Address received
```

## Test 2 — Firebase REST

Expected:

```text
HTTP 200
```

## Test 3 — L1

Expected:

```text
latest contains constant values
```

## Test 4 — L2

Expected:

```text
latest changes over time
```

## Test 5 — L3

Expected:

```text
history receives new Push IDs
```

## Test 6 — L4

Expected:

```text
timestamp exists and is valid
```

## Test 7 — L5

Expected:

```text
latest updated
history appended
```

## Test 8 — Dashboard

Expected:

```text
Firebase → Dashboard
```

## Test 9 — Real-time

Expected:

```text
ESP32 value changes
→ Firebase changes
→ Dashboard changes
```

without refresh.

---

# 22. Troubleshooting Matrix

| Symptom | Meaning | Check |
|---|---|---|
| ESP32 has no IP | Wi-Fi problem | SSID/password/Wi-Fi |
| HTTP Request failed; Not connected to network | No network | Wi-Fi first |
| HTTP 200 | Request succeeded | Check Firebase data |
| HTTP 401/403 | Permission problem | Firebase Rules |
| Firebase has no data | URL/path problem | Database URL + path + `.json` |
| `Skip Firebase: WiFi not connected` | Wi-Fi unavailable | Check Wi-Fi |
| `Skip Firebase: WiFi or time not ready` | Wi-Fi or SNTP unavailable | Check Wi-Fi and time |
| Wrong timestamp | Time not synchronized | Check SNTP `is_valid()` |
| Dashboard does not update | Listener/UI issue | Check Firebase listener |
| Dashboard shows stale data | Wrong node or listener | Verify `/latest` |
| History does not grow | POST problem | Check history endpoint |
| Latest disappears/changes unexpectedly | PUT behavior | Verify intended path |
| Graph time is wrong | seconds vs milliseconds | Multiply timestamp by 1000 |

---

# 23. Important Technical Rules

The AI coding assistant MUST follow these rules.

### Rule 1 — Do not skip L1–L5

Do not replace the learning sequence with one large final implementation.

### Rule 2 — Do not invent architecture

Keep:

```text
/lab/esp32-01/latest
/lab/esp32-01/history
```

unless the user explicitly requests a change.

### Rule 3 — Do not replace REST with Firebase SDK on ESP32

The instructor design uses:

```text
ESP32 → HTTPS REST API → Firebase
```

The Firebase Web SDK belongs to the web Dashboard side.

### Rule 4 — Do not use real sensors yet

L1–L5 use simulated values.

### Rule 5 — Do not add unnecessary dependencies

Prefer simple browser-compatible JavaScript and Firebase Web SDK.

### Rule 6 — Do not hard-code credentials

Use:

```text
ESPHome secrets
```

for Wi-Fi credentials.

### Rule 7 — Do not hard-code fake Firebase URLs

Require the user to supply the actual Firebase Database URL.

### Rule 8 — Check errors

Every network operation must have visible error handling.

### Rule 9 — Preserve working modules

When modifying the project, do not rewrite working L1–L5 code unless necessary.

### Rule 10 — Do not silently change the database schema

If a schema change is required, explain it before implementing it.

---

# 24. AI Implementation Workflow

When this project is given to an AI coding assistant, follow this sequence:

## Phase A — Inspect

Before creating files:

1. Inspect the current project directory.
2. Identify whether files already exist.
3. Do not delete existing user files without permission.
4. Identify the ESPHome project location.
5. Identify the GitHub Pages/web project location.
6. Check whether a Firebase configuration already exists.
7. Check for existing secrets.
8. Report conflicts before overwriting files.

## Phase B — Create Base Structure

Create the minimum project structure.

## Phase C — Implement L1

Create:

```text
firebase-l1.yaml
```

Test it.

Do not proceed if L1 fails.

## Phase D — Implement L2

Create:

```text
firebase-l2.yaml
```

Test random values.

## Phase E — Implement L3

Create:

```text
firebase-l3.yaml
```

Test history.

## Phase F — Implement L4

Create:

```text
firebase-l4.yaml
```

Test timestamp.

## Phase G — Implement L5

Create:

```text
firebase-l5.yaml
```

Test both latest and history.

## Phase H — Build Dashboard

Create the web application.

## Phase I — Connect Firebase

Implement realtime listeners.

## Phase J — GitHub Pages

Prepare the site for deployment.

## Phase K — Final Verification

Perform the complete end-to-end test.

---

# 25. Suggested ESPHome Files

Keep level-specific configurations during development:

```text
esphome/
├── secrets.yaml
├── firebase-l1.yaml
├── firebase-l2.yaml
├── firebase-l3.yaml
├── firebase-l4.yaml
└── firebase-l5.yaml
```

This makes it possible to demonstrate each learning level independently.

After L5 is verified, optionally create:

```text
firebase-final.yaml
```

as the final clean configuration.

Do not delete the L1–L5 versions unless the user explicitly asks.

---

# 26. Suggested Final Repository

```text
iot-firebase-dashboard/
│
├── README.md
│
├── esphome/
│   ├── secrets.example.yaml
│   ├── firebase-l1.yaml
│   ├── firebase-l2.yaml
│   ├── firebase-l3.yaml
│   ├── firebase-l4.yaml
│   ├── firebase-l5.yaml
│   └── firebase-final.yaml
│
├── web/
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── firebase-config.js
│   │   ├── firebase-service.js
│   │   ├── dashboard.js
│   │   └── charts.js
│   └── assets/
│
└── docs/
    ├── setup.md
    ├── testing.md
    └── troubleshooting.md
```

If GitHub Pages requires `index.html` at repository root, adapt the deployment structure accordingly rather than creating a configuration that GitHub Pages cannot serve.

---

# 27. README Requirements

The README must explain:

1. Project purpose.
2. Architecture.
3. Required hardware.
4. Required software.
5. Firebase setup.
6. Firebase Rules.
7. Database structure.
8. ESPHome L1–L5.
9. Dashboard setup.
10. GitHub Pages deployment.
11. Testing procedure.
12. Troubleshooting.
13. Final URL placeholder.

Do not expose real Wi-Fi passwords or private credentials.

---

# 28. Final Acceptance Checklist

## Firebase

- [ ] Project created.
- [ ] Realtime Database created.
- [ ] Correct region selected.
- [ ] Actual Database URL configured.
- [ ] Rules published.
- [ ] `/lab` structure works.

## ESPHome

- [ ] ESP32 connects to Wi-Fi.
- [ ] L1 works.
- [ ] L2 works.
- [ ] L3 works.
- [ ] L4 works.
- [ ] L5 works.
- [ ] HTTP statuses are logged.
- [ ] Timestamp is valid.
- [ ] No real sensors are required.

## Firebase Data

- [ ] `latest` contains current data.
- [ ] `history` contains multiple records.
- [ ] `latest` is overwritten by PUT.
- [ ] `history` grows using POST.
- [ ] Timestamp exists.
- [ ] Data structure matches the required schema.

## Dashboard

- [ ] Firebase Web SDK works.
- [ ] Current data is displayed.
- [ ] History is displayed.
- [ ] At least six required presentation columns are shown.
- [ ] Status is clearly identified as derived/system status.
- [ ] Dashboard updates without refresh.
- [ ] Loading state exists.
- [ ] Error state exists.
- [ ] Empty state exists.

## GitHub Pages

- [ ] Repository is ready.
- [ ] GitHub Pages is enabled.
- [ ] Final URL works.
- [ ] Dashboard loads from the public URL.
- [ ] Firebase connection works from the public URL.

---

# 29. Final End-to-End Proof

The final demonstration must prove this exact chain:

```text
ESP32
  │
  │ Random temp/humi/light
  │ + timestamp
  ▼
ESPHome
  │
  │ HTTPS REST
  ├────────────── PUT ──────────────► /latest
  │
  └───────────── POST ─────────────► /history
                                      │
                                      ▼
                              Firebase RTDB
                                      │
                                      │ Realtime listener
                                      ▼
                              GitHub Pages
                                      │
                                      ▼
                                  Dashboard
```

A successful project is not merely a visually complete Dashboard.

The Dashboard must display data that actually originates from the ESP32 and passes through Firebase.

---

# 30. AI Coding Assistant Instruction

Use this section as the direct instruction when asking an AI to build the project:

> **You are the lead developer for this ESP32 + ESPHome + Firebase Realtime Database + GitHub Pages IoT project.**
>
> Build the project from the beginning according to this document and the instructor's L1–L5 learning sequence.
>
> **Do not jump directly to the final implementation.**
>
> First inspect the existing project and identify existing files, configurations, secrets, and conflicts.
>
> Then implement and verify:
>
> `Preparation → L1 → L2 → L3 → L4 → L5 → Dashboard → GitHub Pages → Final Test`
>
> Preserve the instructor-defined database structure:
>
> `/lab/esp32-01/latest`
>
> `/lab/esp32-01/history`
>
> Use ESPHome `http_request` + HTTPS REST API for ESP32 → Firebase.
>
> Use Firebase Web SDK realtime listeners for Firebase → Dashboard.
>
> Use simulated `temp`, `humi`, and `light` values for L1–L5.
>
> Use SNTP and Unix timestamp starting at L4.
>
> Use PUT for `latest` and POST for `history`.
>
> Do not invent extra physical sensors.
>
> Do not hard-code Wi-Fi credentials.
>
> Do not invent a Firebase URL.
>
> Do not silently change Firebase Rules or database schema.
>
> After each level, run the relevant validation and report:
>
> 1. What was created.
> 2. What was changed.
> 3. How it works.
> 4. What was tested.
> 5. Expected result.
> 6. Actual result.
> 7. Any remaining problem.
>
> Do not proceed to the next level if the current level has a blocking error.
>
> When the ESP32 + Firebase L5 system is verified, build the Dashboard.
>
> The Dashboard must use real Firebase data, support realtime updates without page refresh, show current state and historical data, and provide at least six required presentation columns:
>
> `Device ID | Timestamp | Temperature | Humidity | Light | Status`
>
> Clearly distinguish actual Firebase fields from derived UI metadata.
>
> Finally prepare the project for GitHub Pages and verify the complete end-to-end flow:
>
> `ESP32 → Firebase → Dashboard`
>
> Do not declare the project complete until the final public GitHub Pages URL has been tested.

---

# 31. Definition of Done

The project is complete only when:

```text
ESP32
  ↓
Wi-Fi
  ↓
HTTPS REST
  ↓
Firebase RTDB
  ├── latest
  └── history
  ↓
Firebase Web SDK
  ↓
Realtime Dashboard
  ↓
GitHub Pages
```

works as one connected system.

The final test must show that changing ESP32 data eventually changes Firebase and the Dashboard **without manually refreshing the Dashboard page**.
