/**
 * WebGL Pixel Snow Background Controller
 * Powered by Three.js and Custom GLSL Raymarching Shader - Ultra High Performance Edition
 * 
 * Performance Optimizations:
 * - Low-fillrate internal buffer (setPixelRatio: 0.5) with CSS scaling (saves 75% GPU)
 * - Optimized raymarching bound (40 max iterations) with fast-exit early return
 * - Delta-timed frame throttling (~35 FPS) for smooth zero-lag background animation
 * - Page Visibility & IntersectionObserver auto-pause
 * - True alpha blending for clean, translucent snowflakes in both Dark and Light modes
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

    // Mathematical constants
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
      float windX = cos(uDirection) * 0.35;
      float windY = sin(uDirection) * 0.35;
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
      // Fast lightweight raymarch (40 iterations max)
      for (int i = 0; i < 40; i++) {
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
              
              float alpha = clamp(pow(intensity, uGamma), 0.0, 0.80);
              gl_FragColor = vec4(uColor, alpha);
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

      gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
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
      this.isTabActive = true;
      this.startTime = performance.now();
      this.lastFrameTime = performance.now();
      this.resizeTimeout = null;

      // Theme-specific visual calibrations (Lightweight, subtle, delicate)
      this.themeConfigs = {
        dark: {
          color: '#38bdf8',       // Cyber Cyan Neon
          flakeSize: 0.005,       // Small elegant snowflake
          minFlakeSize: 0.75,
          pixelResolution: 380,   // Fine retro pixel resolution
          brightness: 1.00,
          density: 0.18,          // Clean airy distribution
          speed: 0.85,            // Relaxed drift
          depthFade: 9.0,
          gamma: 0.65,
          variant: 2.0,           // 6-arm fractal snowflake
          direction: 125
        },
        light: {
          color: '#0284c7',       // Translucent Soft Cyan Azure
          flakeSize: 0.004,       // Small crystal snowflake
          minFlakeSize: 0.70,
          pixelResolution: 380,
          brightness: 0.70,
          density: 0.15,          // Minimal clean distribution
          speed: 0.75,
          depthFade: 10.0,
          gamma: 0.75,
          variant: 2.0,
          direction: 125
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

      const initialTheme = options.initialTheme || document.documentElement.getAttribute("data-theme") || "dark";
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
        depth: false,
        precision: "mediump"
      });

      // Crucial Performance: 0.5x internal pixel ratio cuts fillrate workload by 75%
      this.renderer.setPixelRatio(0.5);
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
          uFlakeSize: { value: config.flakeSize },
          uMinFlakeSize: { value: config.minFlakeSize },
          uPixelResolution: { value: config.pixelResolution },
          uSpeed: { value: config.speed },
          uDepthFade: { value: config.depthFade },
          uFarPlane: { value: 16.0 }, // Capped depth bound
          uColor: { value: new THREE.Vector3(colorVec.r, colorVec.g, colorVec.b) },
          uBrightness: { value: config.brightness },
          uGamma: { value: config.gamma },
          uDensity: { value: config.density },
          uVariant: { value: config.variant },
          uDirection: { value: (config.direction * Math.PI) / 180 }
        },
        transparent: true,
        blending: THREE.NormalBlending
      });

      const geometry = new THREE.PlaneGeometry(2, 2);
      this.mesh = new THREE.Mesh(geometry, this.material);
      this.scene.add(this.mesh);

      // Debounced Resize
      this.handleResize = () => {
        if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
          if (!this.renderer || !this.material) return;
          const nw = window.innerWidth;
          const nh = window.innerHeight;
          this.renderer.setSize(nw, nh);
          this.material.uniforms.uResolution.value.set(nw, nh);
        }, 150);
      };
      window.addEventListener("resize", this.handleResize);

      // Visibility API & Intersection Observer
      document.addEventListener("visibilitychange", () => {
        this.isTabActive = !document.hidden;
      });

      if ("IntersectionObserver" in window) {
        this.observer = new IntersectionObserver(([entry]) => {
          this.isVisible = entry.isIntersecting;
        }, { threshold: 0 });
        this.observer.observe(this.container);
      }

      // Delta-timed ~35 FPS Animation Loop (Silky smooth with minimal GPU draw)
      const targetInterval = 28.0; // ~35 FPS
      this.animate = (currentTime) => {
        this.animationId = requestAnimationFrame(this.animate);
        if (!this.isVisible || !this.isTabActive || !this.material || !this.renderer) return;

        const delta = currentTime - this.lastFrameTime;
        if (delta >= targetInterval) {
          this.lastFrameTime = currentTime - (delta % targetInterval);
          this.material.uniforms.uTime.value = (currentTime - this.startTime) * 0.001;
          this.renderer.render(this.scene, this.camera);
        }
      };
      this.animate(performance.now());
    }

    setTheme(theme) {
      if (!this.material) return;
      const config = this.themeConfigs[theme] || this.themeConfigs.dark;
      const colorVec = new THREE.Color(config.color);

      this.material.uniforms.uColor.value.set(colorVec.r, colorVec.g, colorVec.b);
      this.material.uniforms.uFlakeSize.value = config.flakeSize;
      this.material.uniforms.uMinFlakeSize.value = config.minFlakeSize;
      this.material.uniforms.uPixelResolution.value = config.pixelResolution;
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
