# WebGL Pixel Snow Background Shader Design Spec

## 1. Overview & Goal
Integrate the raymarched 3D volumetric **Pixel Snow** shader effect from `Plan/EffectBackground.md` into the ESP32 Realtime Telemetry Dashboard as a high-performance, responsive background layer.

The effect will run natively in Vanilla JavaScript using **Three.js (r128)** and provide tailored atmospheric color palettes and brightness levels for both **Midnight Obsidian (Dark Mode)** and **Daylight Quartz (Light Mode)** without compromising dashboard performance or text legibility.

---

## 2. Architecture & File Structure

```
.
├── index.html                  <-- Add Three.js CDN, #pixelSnowBg container & js/pixel-snow-bg.js
├── css/style.css               <-- Styling for .pixel-snow-bg & layer stacking contexts
└── js/
    ├── pixel-snow-bg.js        <-- New Three.js GLSL Raymarching Shader Controller
    └── dashboard.js            <-- Connect theme toggle listener to pixelSnowBg.updateTheme()
```

---

## 3. Theme Configuration Matrix

| Parameter | Midnight Obsidian (Dark Mode) | Daylight Quartz (Light Mode) | Description |
|---|---|---|---|
| **Snowflake Color** | `#38bdf8` (Cyber Cyan Neon) | `#0284c7` (Deep Azure Slate) | Particle tint matching theme accents |
| **Particle Variant** | `2.0` (`snowflake`) | `2.0` (`snowflake`) | 6-arm fractal snowflake geometry |
| **Brightness** | `1.10` | `0.85` | Balanced luminescence for readability |
| **Density** | `0.28` | `0.22` | Volumetric snowflake cluster frequency |
| **Speed** | `1.15` | `1.00` | Wind drift velocity |
| **Direction** | `125.0°` | `125.0°` | Diagonal downward cyber wind angle |
| **Depth Fade** | `8.0` | `9.0` | Atmospheric fog distance attenuation |
| **Pixel Resolution** | `220.0` | `220.0` | Cyber-pixel quantization grid factor |
| **Gamma** | `0.4545` | `0.5500` | Contrast curve for crystal sharpness |

---

## 4. Technical Implementation Details

### 4.1. DOM Integration (`index.html`)
- CDN Inclusion: `<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>`
- Container element placed at top of `<body>`:
  ```html
  <div id="pixelSnowBg" class="pixel-snow-bg" aria-hidden="true"></div>
  ```

### 4.2. CSS Stacking Context (`css/style.css`)
```css
.pixel-snow-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
  opacity: 0.85;
  transition: opacity 0.4s ease;
}

.dashboard-container {
  position: relative;
  z-index: 1;
}
```

### 4.3. GLSL Shader Controller (`js/pixel-snow-bg.js`)
- **Singleton Module:** `window.pixelSnowBg`
- **IntersectionObserver:** Pauses `requestAnimationFrame` render loop if container is hidden/scrolled off-screen.
- **Debounced Resize Handler:** Automatically syncs Three.js renderer viewport and uniforms upon window resize.
- **Dynamic Uniform Morphing:** `pixelSnowBg.setTheme(theme)` smoothly updates shader uniforms (`uColor`, `uBrightness`, `uDensity`, `uSpeed`, `uGamma`) when user clicks the Day/Night toggle.

### 4.4. Dashboard Integration (`js/dashboard.js`)
- Inside `applyTheme(theme)`:
  ```javascript
  if (window.pixelSnowBg && typeof window.pixelSnowBg.setTheme === 'function') {
    window.pixelSnowBg.setTheme(theme);
  }
  ```

---

## 5. Non-Functional & Performance Requirements
1. **High FPS (60fps Target):** WebGLRenderer initialized with `powerPreference: 'high-performance'`, `antialias: false`, `stencil: false`, and `depth: false`.
2. **Zero Memory Leaks:** Automatic context disposal on unload or reconfiguration.
3. **No Build Step:** Zero build tool requirement, works directly in browser and GitHub Pages.
