# Pixel Depth & Light/Dark Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 3D Pixel Depth extrusion styling and a complete Light & Dark Mode system (Midnight Obsidian vs Daylight Quartz & Birch) with persistent storage and Chart.js theme synchronization.

**Architecture:** Update `index.html`, `css/style.css`, `js/charts.js`, and `js/dashboard.js` with CSS custom property theming, 3D block shadows, 5-segment pixel level meters, and theme switching logic.

**Tech Stack:** HTML5, CSS3 Custom Properties (Theming, 3D Box Extrusions), JavaScript (ES6), Chart.js 4, Web Audio API, Firebase RTDB.

## Global Constraints
- Preserve real-time Firebase listeners (`/lab/esp32-01/latest` and `/lab/esp32-01/history`).
- Preserve all 6 presentation table columns: `Device ID`, `Timestamp`, `Temperature`, `Humidity`, `Light`, `Status`.
- Preserve settings modal, in-browser ESP32 simulator drawer, and CSV export.
- GitHub Pages zero-build compatibility.

---

### Task 1: Update HTML Structure in `index.html`

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add Theme Toggle Switch button in header**
Add `#btnToggleTheme` with icon and text `[☀️ DAY / 🌙 NIGHT]`.

- [ ] **Step 2: Add 5-segment pixel level meters in KPI cards**
Add `.pixel-meter` containers with 5 segment blocks for Temp, Humi, and Light cards.

- [ ] **Step 3: Commit `index.html`**
```bash
git add index.html
git commit -m "feat(ui): add theme toggle button and pixel level meters in index.html"
```

---

### Task 2: Implement 3D Pixel Depth & Light/Dark Theming in `css/style.css`

**Files:**
- Modify: `css/style.css`

- [ ] **Step 1: Define CSS theme variables for `[data-theme="dark"]` and `[data-theme="light"]`**
Configure Daylight Quartz & Birch vs Midnight Obsidian tokens, surfaces, borders, and shadows.

- [ ] **Step 2: Style 3D block physical extrusions & pressed button states**
Add `box-shadow: 0 6px 0px ...` and smooth responsive active transitions.

- [ ] **Step 3: Style 5-segment pixel level meters**
Create filled and unfilled block segment styling for sensor cards.

- [ ] **Step 4: Style 6-column presentation table & modals for both themes**
Ensure high-contrast readability in both light and dark modes.

- [ ] **Step 5: Commit `css/style.css`**
```bash
git add css/style.css
git commit -m "feat(ui): implement 3D pixel depth and light/dark theme system in style.css"
```

---

### Task 3: Support Dynamic Theme Recalculation in `js/charts.js`

**Files:**
- Modify: `js/charts.js`

- [ ] **Step 1: Add `setTheme(themeName)` method in `TelemetryCharts`**
Dynamically switch scale gridline colors, tick text colors, and tooltip styling between light and dark themes.

- [ ] **Step 2: Commit `js/charts.js`**
```bash
git add js/charts.js
git commit -m "feat(charts): add dynamic theme synchronization in charts.js"
```

---

### Task 4: Implement Theme Switcher & Segment Updates in `js/dashboard.js`

**Files:**
- Modify: `js/dashboard.js`

- [ ] **Step 1: Add theme switching and `localStorage` persistence logic**
Toggle `data-theme` attribute on document element and update theme button label.

- [ ] **Step 2: Add 5-segment pixel meter calculation logic**
Update segment fill count (1 to 5) dynamically on incoming sensor data.

- [ ] **Step 3: Commit `js/dashboard.js`**
```bash
git add js/dashboard.js
git commit -m "feat(dashboard): add theme toggle controller and pixel meter logic"
```

---

### Task 5: End-to-End Verification & Final Review

- [ ] **Step 1: Verify Light Mode and Dark Mode toggling and persistence**
- [ ] **Step 2: Verify real-time updates and 6-column table in both modes**
- [ ] **Step 3: Final commit and summary report**
