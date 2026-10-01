# Modern Cyber-Pixel UI Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate the ESP32 + Firebase Realtime Web Dashboard into an ultra-sharp **Modern Cyber-Pixel / Neo-Minecraft HUD** aesthetic with frosted dark glassmorphism, glowing neon accents, and crisp typography.

**Architecture:** Update `index.html`, `css/style.css`, `js/charts.js`, and `js/dashboard.js` to blend modern UI clarity with pixel-art Minecraft elements.

**Tech Stack:** HTML5, Modern Vanilla CSS (Glassmorphism, CSS Gradients, Neon Glows), JavaScript (ES6), Chart.js 4, Web Audio API, Firebase RTDB Web SDK.

## Global Constraints
- Preserve real-time Firebase listeners (`/lab/esp32-01/latest` and `/lab/esp32-01/history`).
- Preserve all 6 presentation table columns: `Device ID`, `Timestamp`, `Temperature`, `Humidity`, `Light`, `Status`.
- Preserve settings modal, in-browser ESP32 simulator drawer, and CSV export.
- GitHub Pages zero-build compatibility.

---

### Task 1: Update Fonts & Markup in `index.html`

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Link combined modern & pixel Google Fonts**
Include `'Plus Jakarta Sans'`, `'JetBrains Mono'`, `'Silkscreen'`, and `'Press Start 2P'`.

- [ ] **Step 2: Update HTML elements with modern cyber-pixel class names**
Update brand title, cards, and action buttons.

- [ ] **Step 3: Commit `index.html`**
```bash
git add index.html
git commit -m "feat(ui): update index.html with modern cyber-pixel fonts and markup"
```

---

### Task 2: Implement Modern Cyber-Pixel CSS Design System in `css/style.css`

**Files:**
- Modify: `css/style.css`

- [ ] **Step 1: Define frosted glassmorphism & neon glow variables**
Configure deep slate surfaces, subtle pixel grid backgrounds, and neon Redstone/Diamond/Emerald glow effects.

- [ ] **Step 2: Style sharp KPI metric cards with neon top borders**
Style large legible numbers, glowing unit badges, and min/max trackers.

- [ ] **Step 3: Style modern 3D buttons & live pulse indicator**
Implement sleek gradient buttons with crisp borders and glowing hover states.

- [ ] **Step 4: Style 6-column presentation table & modals**
Create ultra-clean sticky table rows and sleek crafting modal interface.

- [ ] **Step 5: Commit `css/style.css`**
```bash
git add css/style.css
git commit -m "feat(ui): implement modern cyber-pixel glassmorphic stylesheet"
```

---

### Task 3: Refine Chart.js Telemetry Graph in `js/charts.js`

**Files:**
- Modify: `js/charts.js`

- [ ] **Step 1: Update Chart.js styling with glowing neon gradients & smooth curves**
Configure multi-axis lines with neon Redstone (`#ff3355`), Lapis Cyan (`#00f2fe`), and Glowstone Gold (`#fbbf24`).

- [ ] **Step 2: Set monospaced typography for axes & retro tooltips**
Apply `'JetBrains Mono'` and `'Silkscreen'`.

- [ ] **Step 3: Commit `js/charts.js`**
```bash
git add js/charts.js
git commit -m "feat(charts): update Chart.js with glowing neon curves and crisp typography"
```

---

### Task 4: Refine Dashboard Controller in `js/dashboard.js`

**Files:**
- Modify: `js/dashboard.js`

- [ ] **Step 1: Ensure crisp number formatting and responsive badge rendering**
Format values with high precision and apply Minecraft pixel badges.

- [ ] **Step 2: Tune 8-bit sound effects for subtle, pleasant interactions**
Refine frequency and gain envelopes.

- [ ] **Step 3: Commit `js/dashboard.js`**
```bash
git add js/dashboard.js
git commit -m "feat(dashboard): refine UI state controller and audio feedback"
```

---

### Task 5: End-to-End Verification

- [ ] **Step 1: Test all dashboard features and responsiveness**
- [ ] **Step 2: Final clean commit**
