# WebGL Pixel Snow Background Shader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a responsive WebGL 3D volumetric Pixel Snow background effect with 6-arm fractal snowflake geometry using Three.js and custom GLSL raymarching shaders, perfectly adapted for both Midnight Obsidian (Dark) and Daylight Quartz (Light) themes.

**Architecture:** A standalone Vanilla JS module `js/pixel-snow-bg.js` manages a Three.js scene, full-screen quad geometry, and raymarched GLSL shader material rendered to a fixed background container. When the dashboard theme changes, the shader uniforms smoothly morph their color, density, brightness, and contrast.

**Tech Stack:** Three.js r128 (CDN), Vanilla JavaScript (ES6+), GLSL Shader (WebGL1/WebGL2), CSS3 Custom Properties, HTML5.

## Global Constraints
- Variant: `2.0` (`snowflake` mode with 6-arm fractal snowflake distance estimator).
- Responsive: Dynamic resize debounce without stretching or distorted aspect ratio.
- Zero Build Requirement: Pure static client-side JavaScript suitable for GitHub Pages.
- Performance: 60fps target with automatic `IntersectionObserver` pause when out of view.

---

### Task 1: Three.js GLSL Pixel Snow Controller (`js/pixel-snow-bg.js`)

**Files:**
- Create: `js/pixel-snow-bg.js`

**Interfaces:**
- Produces: `window.pixelSnowBg = { init(containerId, opts), setTheme(theme), updateUniforms(props), dispose() }`

- [x] **Step 1: Write `js/pixel-snow-bg.js` with GLSL vertex/fragment shaders and controller**
- [x] **Step 2: Commit `js/pixel-snow-bg.js`**

```bash
git add js/pixel-snow-bg.js
git commit -m "feat(bg): implement WebGL Pixel Snow GLSL raymarching shader module"
```

---

### Task 2: CSS Styles & Layering Contexts (`css/style.css`)

**Files:**
- Modify: `css/style.css`

**Interfaces:**
- Produces: Fixed viewport styling for `.pixel-snow-bg` and adjusted background transparency for seamless light/dark blending.

- [x] **Step 1: Add `.pixel-snow-bg` styles and ensure stacking context**
- [x] **Step 2: Commit CSS changes**

```bash
git add css/style.css
git commit -m "style(bg): add fixed canvas layer for pixel snow shader background"
```

---

### Task 3: DOM Container & Script Loading (`index.html`)

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes: Three.js CDN, `js/pixel-snow-bg.js`
- Produces: `<div id="pixelSnowBg" class="pixel-snow-bg"></div>` in DOM.

- [x] **Step 1: Add Three.js CDN to `<head>` and `#pixelSnowBg` to `<body>`**
- [x] **Step 2: Commit `index.html`**

```bash
git add index.html
git commit -m "feat(html): embed Three.js CDN, pixel snow container, and script loader"
```

---

### Task 4: Dashboard Integration & Verification (`js/dashboard.js`)

**Files:**
- Modify: `js/dashboard.js`

**Interfaces:**
- Calls: `pixelSnowBg.init("pixelSnowBg", { initialTheme: currentTheme })` on load, and `pixelSnowBg.setTheme(newTheme)` when theme toggle is clicked.

- [x] **Step 1: Initialize and bind theme changes in `js/dashboard.js`**
- [x] **Step 2: Commit `js/dashboard.js`**
- [x] **Step 3: Verification & Acceptance Testing**
- [x] **Step 4: Final Git Commit**

```bash
git add .
git commit -m "feat: complete WebGL Pixel Snow background effect integration"
```
