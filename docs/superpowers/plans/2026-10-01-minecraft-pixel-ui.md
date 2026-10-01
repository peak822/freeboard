# Minecraft Pixel UI Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the ESP32 + Firebase Realtime IoT Web Dashboard into a complete Classic Minecraft / 8-Bit Pixel GUI aesthetic without affecting core data flow or telemetry functionality.

**Architecture:** Update `index.html`, `css/style.css`, `js/charts.js`, and `js/dashboard.js` to introduce Minecraft 3D beveled borders, pixel typography (`Press Start 2P`, `Silkscreen`), inventory slot KPI cards, 8-bit web audio clicks, pixel Chart.js markers, and retro chest-styled 6-column table.

**Tech Stack:** HTML5, Vanilla CSS3 (3D bevels, pixel-art textures), JavaScript (ES6), Chart.js 4, Web Audio API, Firebase RTDB Web SDK.

## Global Constraints
- Preserve real-time Firebase listeners (`/lab/esp32-01/latest` and `/lab/esp32-01/history`).
- Preserve all 6 presentation table columns: `Device ID`, `Timestamp`, `Temperature`, `Humidity`, `Light`, `Status`.
- Preserve settings modal and in-browser ESP32 simulator drawer functionality.
- Zero-build compatibility for GitHub Pages deployment.

---

### Task 1: Update Typography & HTML Structure

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Update Google Fonts in `index.html`**
Include `'Press Start 2P'`, `'Silkscreen'`, and `'VT323'`.

- [ ] **Step 2: Update HTML markup with Minecraft Item Frame & Slot containers**
Add pixel icon containers, Minecraft banner header, and retro badge containers.

- [ ] **Step 3: Verify HTML structure & commit**
```bash
git add index.html
git commit -m "feat(ui): update index.html with Minecraft pixel typography and item frame markup"
```

---

### Task 2: Implement Minecraft Pixel CSS Design System

**Files:**
- Modify: `css/style.css`

- [ ] **Step 1: Define Minecraft color tokens & 3D bevel CSS utilities**
Add authentic 3D beveled borders (`border-top/left: #fff`, `border-bottom/right: #373737`), dirt/stone textures, and pixel fonts.

- [ ] **Step 2: Style Minecraft Menu Buttons & Status Badges**
Style normal, hover (`#8b8b8b`, yellow text), and pressed (`#555555`) button states.

- [ ] **Step 3: Style Inventory Slot KPI Cards & Health/Flame Meters**
Implement item frame slots with dark inset backgrounds and pixel level indicators.

- [ ] **Step 4: Style 6-Column History Table & Modal/Drawer**
Style table as Minecraft chest slots and modals as crafting GUI.

- [ ] **Step 5: Verify CSS rendering & commit**
```bash
git add css/style.css
git commit -m "feat(ui): implement Minecraft pixel design system and 3D bevels in style.css"
```

---

### Task 3: Restyle Chart.js for 8-Bit Pixel Telemetry

**Files:**
- Modify: `js/charts.js`

- [ ] **Step 1: Update Chart.js point markers to square/pixel shapes**
Set `pointStyle: 'rect'` or `rectRot` with stepped/crisp lines and Minecraft color palette (Redstone Red, Lapis Blue, Glowstone Gold).

- [ ] **Step 2: Update scales, gridlines, and tooltip fonts to pixel typography**
Set tooltip and scale fonts to `'Press Start 2P'` and `'Silkscreen'`.

- [ ] **Step 3: Verify chart rendering & commit**
```bash
git add js/charts.js
git commit -m "feat(charts): update Chart.js with retro pixel markers and Minecraft palette"
```

---

### Task 4: Enhance Dashboard Controller with 8-Bit Audio & Minecraft Badges

**Files:**
- Modify: `js/dashboard.js`

- [ ] **Step 1: Add Web Audio API 8-bit sound generator for button clicks**
Synthesize authentic click audio on button interactions.

- [ ] **Step 2: Update table row badges with Minecraft item names**
Map status to Minecraft badges (e.g. `[❤ HEALTHY]`, `[🔥 HIGH TEMP]`, `[⚡ ONLINE]`, `[💀 OFFLINE]`).

- [ ] **Step 3: Verify dashboard interaction & commit**
```bash
git add js/dashboard.js
git commit -m "feat(dashboard): add 8-bit sound synth and Minecraft badge formatting"
```

---

### Task 5: End-to-End Verification

- [ ] **Step 1: Test all UI components and interactions in browser**
Verify live stream listener, 6-column table, chart filter tabs, settings modal, and simulator drawer.

- [ ] **Step 2: Final commit and summary report**
```bash
git add .
git commit -m "chore: complete Minecraft Pixel UI theme transformation"
```
