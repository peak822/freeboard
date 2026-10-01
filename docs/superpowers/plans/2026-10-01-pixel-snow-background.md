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

- [ ] **Step 1: Write `js/pixel-snow-bg.js` with GLSL vertex/fragment shaders and controller**

```javascript
/**
 * WebGL Pixel Snow Background Controller
 * Powered by Three.js and Custom GLSL Raymarching Shader
 */

(function () {
  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    precision mediump float;

    uniform float uTime;
    uniform vec2 uResolution;
    uniform float uFlakeSize;
    uniform float uMinFlakeSize;
    uniform float uPixelResolution;
    uniform float uSpeed;
    uniform float uDepthFade;
    uniform float uFarPlane;
    uniform vec3 uColor;
    uniform float uBrightness;
    uniform float uGamma;
    uniform float uDensity;
    uniform float uVariant;
    uniform float uDirection;

    #define PI 3.14159265
    #define PI_OVER_6 0.5235988
    #define PI_OVER_3 1.0471976
    #define M1 1597334677U
    #define M2 3812015801U
    #define M3 3299493293U
    #define F0 2.3283064e-10

    #define hash(n) (n * (n ^ (n >> 15)))
    #define coord3(p) (uvec3(p).x * M1 ^ uvec3(p).y * M2 ^ uvec3(p).z * M3)

    const vec3 camK = vec3(0.57735027, 0.57735027, 0.57735027);
    const vec3 camI = vec3(0.70710678, 0.0, -0.70710678);
    const vec3 camJ = vec3(-0.40824829, 0.81649658, -0.40824829);
    const vec2 b1d = vec2(0.574, 0.819);

    vec3 hash3(uint n) {
      uvec3 hashed = hash(n) * uvec3(1U, 511U, 262143U);
      return vec3(hashed) * F0;
    }

    float snowflakeDist(vec2 p) {
      float r = length(p);
      float a = atan(p.y, p.x);
      a = abs(mod(a + PI_OVER_6, PI_OVER_3) - PI_OVER_6);
      vec2 q = r * vec2(cos(a), sin(a));
      float dMain = max(abs(q.y), max(-q.x, q.x - 1.0));
      float b1t = clamp(dot(q - vec2(0.4, 0.0), b1d), 0.0, 0.4);
      float dB1 = length(q - vec2(0.4, 0.0) - b1t * b1d);
      float b2t = clamp(dot(q - vec2(0.7, 0.0), b1d), 0.0, 0.25);
      float dB2 = length(q - vec2(0.7, 0.0) - b2t * b1d);
      return min(dMain, min(dB1, dB2)) * 10.0;
    }

    void main() {
      float invPixelRes = 1.0 / uPixelResolution;
      float pixelSize = max(1.0, floor(0.5 + uResolution.x * invPixelRes));
      float invPixelSize = 1.0 / pixelSize;
      
      vec2 fragCoord = floor(gl_FragCoord.xy * invPixelSize);
      vec2 res = uResolution * invPixelSize;
      float invResX = 1.0 / res.x;

      vec3 ray = normalize(vec3((fragCoord - res * 0.5) * invResX, 1.0));
      ray = ray.x * camI + ray.y * camJ + ray.z * camK;

      float timeSpeed = uTime * uSpeed;
      float windX = cos(uDirection) * 0.4;
      float windY = sin(uDirection) * 0.4;
      vec3 camPos = (windX * camI + windY * camJ + 0.1 * camK) * timeSpeed;
      vec3 pos = camPos;

      vec3 absRay = max(abs(ray), vec3(0.001));
      vec3 strides = 1.0 / absRay;
      vec3 raySign = step(ray, vec3(0.0));
      vec3 phase = fract(pos) * strides;
      phase = mix(strides - phase, phase, raySign);

      float rayDotCamK = dot(ray, camK);
      float invRayDotCamK = 1.0 / rayDotCamK;
      float invDepthFade = 1.0 / uDepthFade;
      float halfInvResX = 0.5 * invResX;
      vec3 timeAnim = timeSpeed * 0.1 * vec3(7.0, 8.0, 5.0);

      float t = 0.0;
      for (int i = 0; i < 128; i++) {
        if (t >= uFarPlane) break;
        
        vec3 fpos = floor(pos);
        uint cellCoord = coord3(fpos);
        float cellHash = hash3(cellCoord).x;

        if (cellHash < uDensity) {
          vec3 h = hash3(cellCoord);
          vec3 sinArg1 = fpos.yzx * 0.073;
          vec3 sinArg2 = fpos.zxy * 0.27;
          vec3 flakePos = 0.5 - 0.5 * cos(4.0 * sin(sinArg1) + 4.0 * sin(sinArg2) + 2.0 * h + timeAnim);
          flakePos = flakePos * 0.8 + 0.1 + fpos;

          float toIntersection = dot(flakePos - pos, camK) * invRayDotCamK;
          
          if (toIntersection > 0.0) {
            vec3 testPos = pos + ray * toIntersection - flakePos;
            float testX = dot(testPos, camI);
            float testY = dot(testPos, camJ);
            vec2 testUV = abs(vec2(testX, testY));
            
            float depth = dot(flakePos - camPos, camK);
            float flakeSize = max(uFlakeSize, uMinFlakeSize * depth * halfInvResX);
            
            float dist;
            if (uVariant < 0.5) {
              dist = max(testUV.x, testUV.y);
            } else if (uVariant < 1.5) {
              dist = length(testUV);
            } else {
              float invFlakeSize = 1.0 / flakeSize;
              dist = snowflakeDist(vec2(testX, testY) * invFlakeSize) * flakeSize;
            }

            if (dist < flakeSize) {
              float flakeSizeRatio = uFlakeSize / flakeSize;
              float intensity = exp2(-(t + toIntersection) * invDepthFade) *
                               min(1.0, flakeSizeRatio * flakeSizeRatio) * uBrightness;
              gl_FragColor = vec4(uColor * pow(vec3(intensity), vec3(uGamma)), 1.0);
              return;
            }
          }
        }

        float nextStep = min(min(phase.x, phase.y), phase.z);
        vec3 sel = step(phase, vec3(nextStep));
        phase = phase - nextStep + strides * sel;
        t += nextStep;
        pos = mix(pos + ray * nextStep, floor(pos + ray * nextStep + 0.5), sel);
      }

      gl_FragColor = vec4(0.0);
    }
  `;

  class PixelSnowController {
    constructor() {
      this.renderer = null;
      this.scene = null;
      this.camera = null;
      this.material = null;
      this.mesh = null;
      this.animationId = null;
      this.container = null;
      this.isVisible = true;
      this.startTime = performance.now();
      this.resizeTimeout = null;

      this.themeConfigs = {
        dark: {
          color: '#38bdf8',
          brightness: 1.1,
          density: 0.28,
          speed: 1.15,
          depthFade: 8.0,
          gamma: 0.4545,
          variant: 2.0,
          direction: 125,
          pixelResolution: 220
        },
        light: {
          color: '#0284c7',
          brightness: 0.85,
          density: 0.22,
          speed: 1.0,
          depthFade: 9.0,
          gamma: 0.55,
          variant: 2.0,
          direction: 125,
          pixelResolution: 220
        }
      };
    }

    init(containerId = "pixelSnowBg", options = {}) {
      if (typeof THREE === "undefined") {
        console.warn("[PixelSnow] Three.js is not loaded. Background shader skipped.");
        return;
      }

      this.container = document.getElementById(containerId);
      if (!this.container) {
        console.warn(`[PixelSnow] Container #${containerId} not found.`);
        return;
      }

      const initialTheme = options.initialTheme || "dark";
      const config = this.themeConfigs[initialTheme] || this.themeConfigs.dark;

      const w = window.innerWidth;
      const h = window.innerHeight;

      this.scene = new THREE.Scene();
      this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

      this.renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: true,
        premultipliedAlpha: false,
        powerPreference: "high-performance",
        stencil: false,
        depth: false
      });

      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.setSize(w, h);
      this.renderer.setClearColor(0x000000, 0);

      this.container.innerHTML = "";
      this.container.appendChild(this.renderer.domElement);

      const colorVec = new THREE.Color(config.color);

      this.material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uResolution: { value: new THREE.Vector2(w, h) },
          uFlakeSize: { value: 0.01 },
          uMinFlakeSize: { value: 1.25 },
          uPixelResolution: { value: config.pixelResolution },
          uSpeed: { value: config.speed },
          uDepthFade: { value: config.depthFade },
          uFarPlane: { value: 20.0 },
          uColor: { value: new THREE.Vector3(colorVec.r, colorVec.g, colorVec.b) },
          uBrightness: { value: config.brightness },
          uGamma: { value: config.gamma },
          uDensity: { value: config.density },
          uVariant: { value: config.variant },
          uDirection: { value: (config.direction * Math.PI) / 180 }
        },
        transparent: true
      });

      const geometry = new THREE.PlaneGeometry(2, 2);
      this.mesh = new THREE.Mesh(geometry, this.material);
      this.scene.add(this.mesh);

      // Handle Resize
      this.handleResize = () => {
        if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
          if (!this.renderer || !this.material) return;
          const nw = window.innerWidth;
          const nh = window.innerHeight;
          this.renderer.setSize(nw, nh);
          this.material.uniforms.uResolution.value.set(nw, nh);
        }, 100);
      };
      window.addEventListener("resize", this.handleResize);

      // Intersection Observer
      if ("IntersectionObserver" in window) {
        this.observer = new IntersectionObserver(([entry]) => {
          this.isVisible = entry.isIntersecting;
        }, { threshold: 0 });
        this.observer.observe(this.container);
      }

      // Animation Loop
      this.animate = () => {
        this.animationId = requestAnimationFrame(this.animate);
        if (this.isVisible && this.material && this.renderer) {
          this.material.uniforms.uTime.value = (performance.now() - this.startTime) * 0.001;
          this.renderer.render(this.scene, this.camera);
        }
      };
      this.animate();
    }

    setTheme(theme) {
      if (!this.material) return;
      const config = this.themeConfigs[theme] || this.themeConfigs.dark;
      const colorVec = new THREE.Color(config.color);

      this.material.uniforms.uColor.value.set(colorVec.r, colorVec.g, colorVec.b);
      this.material.uniforms.uBrightness.value = config.brightness;
      this.material.uniforms.uDensity.value = config.density;
      this.material.uniforms.uSpeed.value = config.speed;
      this.material.uniforms.uDepthFade.value = config.depthFade;
      this.material.uniforms.uGamma.value = config.gamma;
      this.material.uniforms.uVariant.value = config.variant;
      this.material.uniforms.uDirection.value = (config.direction * Math.PI) / 180;
    }

    dispose() {
      if (this.animationId) cancelAnimationFrame(this.animationId);
      if (this.handleResize) window.removeEventListener("resize", this.handleResize);
      if (this.observer) this.observer.disconnect();
      if (this.renderer) {
        this.renderer.dispose();
        this.renderer.forceContextLoss();
      }
      if (this.material) this.material.dispose();
      if (this.mesh && this.mesh.geometry) this.mesh.geometry.dispose();
    }
  }

  window.pixelSnowBg = new PixelSnowController();
})();
```

- [ ] **Step 2: Commit `js/pixel-snow-bg.js`**

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

- [ ] **Step 1: Add `.pixel-snow-bg` styles and ensure stacking context**

```css
/* WebGL Pixel Snow Background Canvas Container */
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

- [ ] **Step 2: Commit CSS changes**

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

- [ ] **Step 1: Add Three.js CDN to `<head>` and `#pixelSnowBg` to `<body>`**

In `<head>`:
```html
<!-- Three.js Library for WebGL Pixel Snow Background -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
```

At top of `<body>`:
```html
<!-- WebGL Cyber Pixel Snow Background Layer -->
<div id="pixelSnowBg" class="pixel-snow-bg" aria-hidden="true"></div>
```

At bottom of `<body>`:
```html
<script src="js/pixel-snow-bg.js"></script>
```

- [ ] **Step 2: Commit `index.html`**

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

- [ ] **Step 1: Initialize and bind theme changes in `js/dashboard.js`**

Inside `DOMContentLoaded`:
```javascript
// Initialize WebGL Pixel Snow Background
if (window.pixelSnowBg && typeof window.pixelSnowBg.init === 'function') {
  window.pixelSnowBg.init("pixelSnowBg", { initialTheme: currentTheme });
}
```

Inside `applyTheme(theme, notify)`:
```javascript
if (window.pixelSnowBg && typeof window.pixelSnowBg.setTheme === 'function') {
  window.pixelSnowBg.setTheme(theme);
}
```

- [ ] **Step 2: Commit `js/dashboard.js`**

```bash
git add js/dashboard.js
git commit -m "feat(dashboard): integrate pixel snow background shader with theme switcher"
```

- [ ] **Step 3: Verification & Acceptance Testing**
- Verify WebGL canvas initializes without JavaScript errors.
- Toggle between Daylight Quartz (Light Mode) and Midnight Obsidian (Dark Mode) and observe smooth particle color & brightness shifts.
- Confirm dashboard telemetry readability and 60fps rendering.

- [ ] **Step 4: Final Git Commit**

```bash
git add .
git commit -m "feat: complete WebGL Pixel Snow background effect integration"
```
