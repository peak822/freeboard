# Modern Cyber-Pixel / Neo-Minecraft HUD UI Design Specification

## 1. Overview & Objective
Refine and modernize the ESP32 + Firebase Realtime IoT Web Dashboard into a high-definition **Modern Cyber-Pixel / Neo-Minecraft HUD** aesthetic. This combines the ultra-sharp readability of modern dark-mode glassmorphism with pixel-art gaming accents, glowing Redstone/Diamond/Emerald neon highlights, and crisp typography.

---

## 2. Visual Design & Aesthetics

### 2.1 Typography Hierarchy
- **Primary Body & Telemetry Values:** `'Plus Jakarta Sans'` (Weights: 600, 700, 800) for sharp, modern, effortless reading.
- **Timestamp & Telemetry Data Columns:** `'JetBrains Mono'` for monospaced numeric precision.
- **Gaming Badges & Minecraft Accent Labels:** `'Silkscreen'` / `'Press Start 2P'` for authentic pixel gaming vibes.

### 2.2 Color & Material Palette
- **Canvas / Background:** Deep Obsidian Dark (`#0a0f1d`) with subtle geometric pixel grid texture and ambient radial glow.
- **Panels & Cards:** Frosted Deepslate Glass (`rgba(15, 23, 42, 0.8)`) with `backdrop-filter: blur(16px)` and ultra-sharp `1px solid rgba(255, 255, 255, 0.1)`.
- **Neon Accents:**
  - Redstone Crimson: `#ff3355` (Temperature)
  - Lapis / Diamond Cyan: `#00f2fe` / `#38bdf8` (Humidity / Device ID)
  - Glowstone Amber: `#fbbf24` (Light Intensity)
  - Emerald Green: `#10b981` (Online Live Status)
  - Amethyst Purple: `#a855f7` (Simulator Actions)

### 2.3 Interactive Controls & 3D Elements
- **Buttons:** Modern dual-layer buttons with crisp border highlights, subtle pixel shadow (`0 4px 0px rgba(0,0,0,0.5)`), glowing hover transitions, and responsive pressed states.
- **Status Indicator:** Glowing Redstone Pulse dot with animated radar ring (`● LIVE STREAM`).
- **Cards:** Metric cards with glowing neon top borders and micro-flash feedback on real-time update.

---

## 3. Component Details

### 3.1 Header
- Diamond Pickaxe / Cyber Cube branding with dual-tone gradient title.
- Live Redstone Lamp status pill.
- Modernized Settings & Simulator action triggers.

### 3.2 KPI Cards
- Large, ultra-crisp numeric telemetry display with glowing unit badges.
- Min/Max range tracking with subpixel alignment.
- Minecraft status badges (`NORMAL`, `OPTIMAL`, `DAYLIGHT`, `ONLINE`).

### 3.3 Analytics Chart
- High-resolution Chart.js canvas with smooth glowing gradient curves.
- Multi-sensor toggle tabs (All Sensors, Temperature, Humidity, Light).

### 3.4 6-Column History Table
- Clean, high-contrast rows:
  1. `Device ID` (`esp32-01` in Diamond Cyan badge)
  2. `Timestamp` (Monospaced formatted local time)
  3. `Temperature` (°C with flame indicator)
  4. `Humidity` (% with water indicator)
  5. `Light` (lx with sun indicator)
  6. `Status` (Pixel badge: `HEALTHY`, `HIGH TEMP`, etc.)

---

## 4. Acceptance Criteria
- [x] Sharp, high-contrast typography and layout.
- [x] Modern frosted glass panels with glowing neon accents.
- [x] All 6 presentation columns intact and real-time listeners fully operational.
- [x] 8-bit audio click feedback preserved with smooth volume levels.
