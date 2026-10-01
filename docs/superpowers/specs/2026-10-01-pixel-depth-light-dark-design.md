# Pixel Depth & Light/Dark Mode Design Specification

## 1. Overview & Objective
Elevate the ESP32 + Firebase Realtime IoT Web Dashboard with enhanced **3D Pixel Depth & Dimension** and a comprehensive **Light / Dark Theme Switching System** (featuring **Midnight Obsidian** for Dark Mode and **Daylight Quartz & Birch** for Light Mode).

---

## 2. Light & Dark Color Palette

### 2.1 Dark Mode (Midnight Obsidian // Default)
- **Base Background:** `#080c16` with subtle pixel grid texture and ambient neon cyan/purple radial glow.
- **Panels & Cards:** `rgba(13, 20, 36, 0.9)` with 3D drop-shadow `0 6px 0px #04060c` and top highlight `rgba(255, 255, 255, 0.12)`.
- **Text:** Primary `#f8fafc`, Secondary `#94a3b8`, Muted `#64748b`.
- **Accents:** Redstone `#ff3355`, Lapis/Diamond `#00f2fe`, Glowstone `#fbbf24`, Emerald `#10b981`.

### 2.2 Light Mode (Daylight Quartz & Birch)
- **Base Background:** `#f1f5f9` with subtle birch wood/quartz grain grid texture and warm ambient glow.
- **Panels & Cards:** `#ffffff` with 3D drop-shadow `0 6px 0px #cbd5e1`, 2px solid border `#e2e8f0`, and top-left bevel `#ffffff`.
- **Text:** Primary `#0f172a`, Secondary `#475569`, Muted `#64748b`.
- **Accents:** Redstone Crimson `#dc2626`, Lapis Blue `#0284c7`, Glowstone Amber `#d97706`, Emerald Green `#16a34a`.

---

## 3. 3D Pixel Depth & Dimensional Elements

1. **Beveled Physical Layering (3D Block Effect):**
   - Cards and panels feature physical bottom extrusion (`box-shadow: 0 6px 0px ...`) that gives elements realistic block depth.
   - Buttons press down on click (`transform: translateY(3px); box-shadow: 0 2px 0px ...`).
2. **Pixel Level Meters on KPI Cards:**
   - Miniature pixel level progress bars (5-segment pixelated blocks) under each sensor reading showing current load/threshold.
3. **Theme Switcher Component:**
   - Animated 3D toggle button in the header (`☀️ DAY` / `🌙 NIGHT`).
   - Persisted in `localStorage`.
   - Realtime Chart.js scale and grid color recalculation on theme switch.

---

## 4. 6-Column Presentation Table & Core Integrity
- 100% preservation of all 6 presentation columns: `Device ID`, `Timestamp`, `Temperature`, `Humidity`, `Light`, `Status`.
- 100% preservation of Firebase Realtime listeners (`/latest` and `/history`).
- In-browser simulator and settings modal adapted for both light and dark themes.

---

## 5. Acceptance Criteria
- [x] Theme toggle switch operational with persistent `localStorage` state.
- [x] Light Mode (Daylight Quartz & Birch) and Dark Mode (Midnight Obsidian) fully styled with high contrast.
- [x] 3D pixel bevels, physical bottom shadows, and segment meters render smoothly.
- [x] Chart.js dynamically syncs theme colors without reloading the page.
- [x] All 6 presentation columns and ESP32 REST simulator operational.
