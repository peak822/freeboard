# Minecraft Pixel GUI Theme Design Specification

## 1. Overview & Objective
Transform the ESP32 + Firebase Realtime IoT Web Dashboard from the modern dark cyber aesthetic into an authentic **Classic Minecraft GUI / 8-Bit Pixel Art** design, while maintaining 100% of the underlying real-time functionality, 6-column presentation table, Chart.js telemetry visualization, and ESP32 REST simulation features.

---

## 2. Visual Design System

### 2.1 Typography
- **Primary Pixel Heading & Badges:** `'Press Start 2P'` (Google Fonts)
- **Telemetry Readouts & Dense Table Data:** `'Silkscreen'` / `'VT323'` for maximum legibility of numeric telemetry.
- **Text Shadows:** Crisp 2px pixel drop-shadow (`2px 2px 0px #1a1a1a`) mimicking Minecraft text rendering.

### 2.2 Color Palette (Minecraft Palette)
- **Backgrounds:** 
  - Bedrock/Deepslate canvas: `#181818` with subtle CSS pixel grid texture.
  - Inventory GUI Panel: `#c6c6c6` (Classic Gray) with dark mode variation `#2b2b2b` / `#3c3c3c`.
  - Inset Slots: `#8b8b8b` inner background with `#373737` top-left inset border and `#ffffff` bottom-right highlight.
- **Accents:**
  - Redstone Red: `#ff2b2b` (Temperature & Hot thresholds)
  - Water / Lapis Blue: `#38bdf8` (Humidity)
  - Glowstone Gold: `#ffaa00` (Light intensity)
  - Emerald Green: `#55ff55` (Online / Live Status)
  - Diamond Cyan: `#55ffff` (Device ID / Primary interactive highlights)

### 2.3 3D Beveled Pixel Borders (CSS)
Authentic Minecraft 3D Bevels using layered borders and box-shadows:
- **Button Normal:**
  - Border: 3px solid; Top/Left: `#ffffff`, Bottom/Right: `#373737`, Background: `#707070`.
- **Button Hover:**
  - Background: `#8b8b8b`, text color: `#ffff55` (Minecraft yellow hover text).
- **Button Active (Pressed):**
  - Top/Left: `#373737`, Bottom/Right: `#ffffff`, Background: `#555555`.

---

## 3. Component Architecture

### 3.1 Header / Status Bar
- **Logo Banner:** Pixelated Pickaxe / Redstone Torch icon with retro glowing Minecraft title `ESP32 TELEMETRY HUB`.
- **Live Indicator:** Styled as an animated **Redstone Lamp / Pulse** (`● LIVE STREAM` with pixel glow).
- **Action Buttons:** Minecraft GUI buttons for `⚙ Settings` and `🧪 ESP32 Simulator`.

### 3.2 KPI Cards (Minecraft Item Frame / Slot Layout)
1. **Temperature Card (🔥 Fire / Campfire Slot):**
   - Icon: Pixel Campfire / Flame.
   - Main Metric: Large pixel font with `°C`.
   - Level indicator: Minecraft health hearts / fire bar.
2. **Humidity Card (💧 Water Bucket Slot):**
   - Icon: Pixel Water Droplet / Potion.
   - Main Metric: `%` relative humidity.
   - Level indicator: Water bubble bar.
3. **Ambient Light Card (💡 Glowstone / Torch Slot):**
   - Icon: Pixel Torch / Sun.
   - Main Metric: `lx` illumination.
   - Level indicator: Daylight sensor level.
4. **Device State Card (🧭 Clock / Redstone Repeater):**
   - Icon: Pixel Clock / Repeater.
   - Status: `ONLINE` (Emerald green badge) / `STALE` (Redstone dust red badge).

### 3.3 Chart.js Visual Transformation
- Chart container styled as a Minecraft Map / Chalkboard frame with dark stone border.
- Lines rendered with stepped interpolation or crisp retro style.
- Retro pixelated point dots (square shapes).

### 3.4 6-Column History Table
- Styled like Minecraft Chest / Inventory slots:
  - Alternating rows with subtle stone/slate texture.
  - Column 1: `Device ID` (`esp32-01` with Diamond Cyan color).
  - Column 2: `Timestamp` (Formatted time in pixel font).
  - Column 3: `Temperature` (Flame Red).
  - Column 4: `Humidity` (Lapis Blue).
  - Column 5: `Light` (Glowstone Gold).
  - Column 6: `Derived Status` (Minecraft Item Tag badges).

### 3.5 Modals & Drawers
- Settings Modal & Simulator Drawer restyled to resemble Minecraft Crafting GUI / Anvil interface with pixel inputs, slot containers, and sound effects synthesized with Web Audio API.

---

## 4. Acceptance Criteria
- [x] Full Minecraft / Pixel aesthetic applied across all components.
- [x] All 6 presentation table columns intact and fully functional.
- [x] Real-time Firebase listeners (`/latest` and `/history`) remain 100% functional.
- [x] Chart filter tabs switch smoothly.
- [x] Settings modal and ESP32 Simulator drawer work seamlessly with pixel styling.
