/**
 * Dashboard UI Controller for ESP32 IoT Firebase Platform - Modern Cyber-Pixel 6-Sensor Suite
 * 
 * Coordinates 6-sensor environmental KPI cards, 5-segment pixel meters, System Health HUD,
 * Light/Dark theme toggle, 9-column history table, 8-bit web audio feedback, settings modal,
 * 6-sensor simulator drawer, and CSV export.
 */

// -------------------------------------------------------------
// 8-Bit Web Audio Synthesizer
// -------------------------------------------------------------
let audioCtx = null;

function playPixelSound(type = "click") {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === "click") {
      // Crisp subtle cyber click
      osc.type = "square";
      osc.frequency.setValueAtTime(1000, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.03);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.005, audioCtx.currentTime + 0.03);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.03);
    } else if (type === "success") {
      // Achievement level-up chime
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.06); // E5
      osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.12); // G5
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.005, audioCtx.currentTime + 0.25);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.25);
    } else if (type === "pop") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(450, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(950, audioCtx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.005, audioCtx.currentTime + 0.05);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.05);
    }
  } catch (e) {
    // Graceful fallback if audio is not permitted
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // State variables
  let latestData = null;
  let historyData = [];
  let connectionStatus = "connecting";
  let activeDeviceId = IOT_CONFIG.activeDeviceId || "esp32-01";
  let currentTableLimit = 50; // Default: 50 records (0 = All)
  let sessionStats = {
    tempMin: Infinity,
    tempMax: -Infinity,
    humiMin: Infinity,
    humiMax: -Infinity,
    lightMin: Infinity,
    lightMax: -Infinity,
    pressMin: Infinity,
    pressMax: -Infinity,
    co2Min: Infinity,
    co2Max: -Infinity,
    noiseMin: Infinity,
    noiseMax: -Infinity
  };
  let staleTimer = null;

  // DOM Elements - Header & HUD Bar
  const elStatusDot = document.getElementById("statusDot");
  const elStatusText = document.getElementById("statusText");
  const elDeviceStatusBadge = document.getElementById("deviceStatusBadge");
  const elHealthDeviceId = document.getElementById("healthDeviceId");
  const elLastSeen = document.getElementById("lastSeenTime");
  const elRelativeTime = document.getElementById("relativeTime");
  const elMeterSystem = document.getElementById("meterSystem");

  // KPI Value Elements (6 Sensors)
  const elValTemp = document.getElementById("valTemp");
  const elValHumi = document.getElementById("valHumi");
  const elValLight = document.getElementById("valLight");
  const elValPress = document.getElementById("valPress");
  const elValCo2 = document.getElementById("valCo2");
  const elValNoise = document.getElementById("valNoise");

  // KPI Min/Max Footers (6 Sensors)
  const elMinMaxTemp = document.getElementById("minMaxTemp");
  const elMinMaxHumi = document.getElementById("minMaxHumi");
  const elMinMaxLight = document.getElementById("minMaxLight");
  const elMinMaxPress = document.getElementById("minMaxPress");
  const elMinMaxCo2 = document.getElementById("minMaxCo2");
  const elMinMaxNoise = document.getElementById("minMaxNoise");

  // KPI Status Badges (6 Sensors)
  const elBadgeTemp = document.getElementById("badgeTemp");
  const elBadgeHumi = document.getElementById("badgeHumi");
  const elBadgeLight = document.getElementById("badgeLight");
  const elBadgePress = document.getElementById("badgePress");
  const elBadgeCo2 = document.getElementById("badgeCo2");
  const elBadgeNoise = document.getElementById("badgeNoise");

  // 5-Segment Meters (6 Sensors)
  const elMeterTemp = document.getElementById("meterTemp");
  const elMeterHumi = document.getElementById("meterHumi");
  const elMeterLight = document.getElementById("meterLight");
  const elMeterPress = document.getElementById("meterPress");
  const elMeterCo2 = document.getElementById("meterCo2");
  const elMeterNoise = document.getElementById("meterNoise");

  // Table & Stats
  const elHistoryTableBody = document.getElementById("historyTableBody");
  const elRecordCount = document.getElementById("recordCount");
  const elEmptyState = document.getElementById("emptyState");
  const elLoadingOverlay = document.getElementById("loadingOverlay");
  const elTableLimitSelect = document.getElementById("tableLimitSelect");
  const elTableDeviceSelect = document.getElementById("tableDeviceSelect");

  // Diagnostics DOM Elements
  const elDiagModal = document.getElementById("diagnosticsModal");
  const elBtnOpenDiag = document.getElementById("btnOpenDiag");
  const elBtnCloseDiag = document.getElementById("btnCloseDiag");
  const elBtnCloseDiagFooter = document.getElementById("btnCloseDiagFooter");
  const elDiagDevicesCount = document.getElementById("diagDevicesCount");
  const elDiagHistoryReceived = document.getElementById("diagHistoryReceived");
  const elDiagValidCount = document.getElementById("diagValidCount");
  const elDiagIncompleteCount = document.getElementById("diagIncompleteCount");
  const elDiagDisplayedCount = document.getElementById("diagDisplayedCount");
  const elDiagFilteredCount = document.getElementById("diagFilteredCount");
  const elDiagActivePath = document.getElementById("diagActivePath");
  const elDiagLatestPath = document.getElementById("diagLatestPath");
  const elDiagHistoryPath = document.getElementById("diagHistoryPath");
  const elDiagLastSync = document.getElementById("diagLastSync");

  // -------------------------------------------------------------
  // Theme Switching (Light Mode vs Dark Mode)
  // -------------------------------------------------------------
  const btnToggleTheme = document.getElementById("btnToggleTheme");
  const themeIcon = document.getElementById("themeIcon");
  const themeText = document.getElementById("themeText");

  let currentTheme = localStorage.getItem("esp32_iot_theme") || "dark";
  applyTheme(currentTheme, false);

  // Initialize WebGL Pixel Snow Background
  if (window.pixelSnowBg && typeof window.pixelSnowBg.init === "function") {
    window.pixelSnowBg.init("pixelSnowBg", { initialTheme: currentTheme });
  }

  if (btnToggleTheme) {
    btnToggleTheme.addEventListener("click", () => {
      const newTheme = currentTheme === "dark" ? "light" : "dark";
      applyTheme(newTheme, true);
      playPixelSound("pop");
    });
  }

  function applyTheme(theme, notify = false) {
    currentTheme = theme;
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("esp32_iot_theme", theme);

    if (theme === "light") {
      if (themeIcon) themeIcon.className = "fas fa-moon text-cyan";
      if (themeText) themeText.textContent = "NIGHT";
      if (notify) showToast("Switched to Daylight Quartz Mode ☀️", "info");
    } else {
      if (themeIcon) themeIcon.className = "fas fa-sun text-amber";
      if (themeText) themeText.textContent = "DAY";
      if (notify) showToast("Switched to Midnight Obsidian Mode 🌙", "info");
    }

    telemetryCharts.setTheme(theme);
    if (window.pixelSnowBg && typeof window.pixelSnowBg.setTheme === "function") {
      window.pixelSnowBg.setTheme(theme);
    }
  }

  // Automatically dismiss loading overlay after brief initial load time
  setTimeout(() => {
    hideLoadingOverlay();
  }, 1000);

  // Initialize Chart
  telemetryCharts.init();
  telemetryCharts.setTheme(currentTheme);

  // Attach button click sounds globally
  document.querySelectorAll("button, .chart-filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => playPixelSound("click"));
  });

  // Table limit change handler
  if (elTableLimitSelect) {
    elTableLimitSelect.addEventListener("change", (e) => {
      currentTableLimit = parseInt(e.target.value, 10);
      playPixelSound("click");
      renderHistoryTable(historyData);
    });
  }

  // Device selection change handler
  if (elTableDeviceSelect) {
    elTableDeviceSelect.addEventListener("change", (e) => {
      const selected = e.target.value;
      if (selected) {
        activeDeviceId = selected;
        if (elHealthDeviceId) elHealthDeviceId.textContent = selected;
        firebaseService.selectDevice(selected);
        playPixelSound("click");
        showToast(`Switched telemetry view to ${selected}`, "info");
      }
    });
  }

  // Initialize Firebase Service
  const config = getFirebaseConfig();
  populateSettingsForm(config);

  function startFirebase() {
    const currentConfig = getFirebaseConfig();
    
    // Check if default placeholder is still present
    if (currentConfig.databaseURL.includes("your-project-id")) {
      handleStatusChange("connecting", "CONFIG REQUIRED (SETTINGS)");
      showToast("Please configure your Firebase Database URL in Settings ⚙️", "info");
    }

    firebaseService.init(currentConfig, {
      onLatest: handleLatestUpdate,
      onHistory: handleHistoryUpdate,
      onDevices: handleDevicesDiscovered,
      onStatus: handleStatusChange,
      onError: handleError,
      onDiagnostics: handleDiagnosticsUpdate
    });
  }

  startFirebase();

  // -------------------------------------------------------------
  // Data Handlers
  // -------------------------------------------------------------

  function handleDevicesDiscovered(devices, currentActive) {
    if (!elTableDeviceSelect || !devices) return;
    elTableDeviceSelect.innerHTML = devices.map(d => 
      `<option value="${d}" ${d === currentActive ? 'selected' : ''}>${d}</option>`
    ).join("");
    if (elDiagDevicesCount) elDiagDevicesCount.textContent = devices.length;
  }

  function handleDiagnosticsUpdate(diag) {
    if (elDiagDevicesCount) elDiagDevicesCount.textContent = diag.devicesCount;
    if (elDiagHistoryReceived) elDiagHistoryReceived.textContent = diag.totalHistoryReceived;
    if (elDiagValidCount) elDiagValidCount.textContent = diag.validRecordsCount;
    if (elDiagIncompleteCount) elDiagIncompleteCount.textContent = diag.incompleteRecordsCount;
    if (elDiagFilteredCount) elDiagFilteredCount.textContent = diag.filteredCount || 0;
    if (elDiagActivePath) elDiagActivePath.textContent = `/lab/${activeDeviceId}`;
    if (elDiagLatestPath) elDiagLatestPath.textContent = `/lab/${activeDeviceId}/latest`;
    if (elDiagHistoryPath) elDiagHistoryPath.textContent = `/lab/${activeDeviceId}/history`;
    if (elDiagLastSync && diag.lastSyncTime) {
      elDiagLastSync.textContent = diag.lastSyncTime.toLocaleTimeString("en-US", {
        timeZone: IOT_CONFIG.timeZone || "Asia/Bangkok",
        hour12: false
      });
    }
  }

  function handleLatestUpdate(data, deviceId) {
    if (deviceId && deviceId !== activeDeviceId) return;

    if (elHealthDeviceId) {
      elHealthDeviceId.textContent = deviceId || activeDeviceId;
    }

    if (!data) {
      if (historyData.length === 0) {
        showEmptyState(true);
      }
      return;
    }

    showEmptyState(false);
    latestData = data;

    const hasTemp = data.temp !== undefined && data.temp !== null && !isNaN(Number(data.temp));
    const hasHumi = data.humi !== undefined && data.humi !== null && !isNaN(Number(data.humi));
    const hasLight = data.light !== undefined && data.light !== null && !isNaN(Number(data.light));
    const hasPress = data.press !== undefined && data.press !== null && !isNaN(Number(data.press));
    const hasCo2 = data.co2 !== undefined && data.co2 !== null && !isNaN(Number(data.co2));
    const hasNoise = data.noise !== undefined && data.noise !== null && !isNaN(Number(data.noise));
    const hasTs = data.timestamp !== undefined && data.timestamp !== null && !isNaN(Number(data.timestamp));

    const temp = hasTemp ? parseFloat(data.temp) : null;
    const humi = hasHumi ? parseFloat(data.humi) : null;
    const light = hasLight ? parseInt(data.light, 10) : null;
    const press = hasPress ? parseFloat(data.press) : null;
    const co2 = hasCo2 ? parseInt(data.co2, 10) : null;
    const noise = hasNoise ? parseFloat(data.noise) : null;
    const ts = hasTs ? parseInt(data.timestamp, 10) : null;

    let activeCount = 0;

    // 01: Temperature (25 - 35°C)
    if (temp !== null) {
      activeCount++;
      sessionStats.tempMin = Math.min(sessionStats.tempMin, temp);
      sessionStats.tempMax = Math.max(sessionStats.tempMax, temp);
      if (elValTemp) elValTemp.textContent = temp.toFixed(1);
      if (elMinMaxTemp) elMinMaxTemp.textContent = `MIN: ${sessionStats.tempMin.toFixed(1)}°C | MAX: ${sessionStats.tempMax.toFixed(1)}°C`;
      
      const tempSegments = Math.min(5, Math.max(1, Math.round(((temp - 25) / 10) * 5)));
      updateMeter(elMeterTemp, tempSegments);

      if (elBadgeTemp) {
        if (temp > 33.0) {
          elBadgeTemp.textContent = "HIGH TEMP";
          elBadgeTemp.className = "pixel-tag badge-danger";
        } else {
          elBadgeTemp.textContent = "OPTIMAL";
          elBadgeTemp.className = "pixel-tag badge-success";
        }
      }
    } else {
      if (elValTemp) elValTemp.textContent = "N/A";
      if (elBadgeTemp) {
        elBadgeTemp.textContent = "NO DATA";
        elBadgeTemp.className = "pixel-tag badge-neutral";
      }
      updateMeter(elMeterTemp, 0);
    }

    // 02: Humidity (50 - 80%)
    if (humi !== null) {
      activeCount++;
      sessionStats.humiMin = Math.min(sessionStats.humiMin, humi);
      sessionStats.humiMax = Math.max(sessionStats.humiMax, humi);
      if (elValHumi) elValHumi.textContent = humi.toFixed(1);
      if (elMinMaxHumi) elMinMaxHumi.textContent = `MIN: ${sessionStats.humiMin.toFixed(1)}% | MAX: ${sessionStats.humiMax.toFixed(1)}%`;

      const humiSegments = Math.min(5, Math.max(1, Math.round(((humi - 50) / 30) * 5)));
      updateMeter(elMeterHumi, humiSegments);

      if (elBadgeHumi) {
        if (humi > 75.0) {
          elBadgeHumi.textContent = "HIGH HUMI";
          elBadgeHumi.className = "pixel-tag badge-cyan";
        } else if (humi < 55.0) {
          elBadgeHumi.textContent = "LOW HUMI";
          elBadgeHumi.className = "pixel-tag badge-warning";
        } else {
          elBadgeHumi.textContent = "BALANCED";
          elBadgeHumi.className = "pixel-tag badge-success";
        }
      }
    } else {
      if (elValHumi) elValHumi.textContent = "N/A";
      if (elBadgeHumi) {
        elBadgeHumi.textContent = "NO DATA";
        elBadgeHumi.className = "pixel-tag badge-neutral";
      }
      updateMeter(elMeterHumi, 0);
    }

    // 03: Ambient Light (100 - 1000 lx)
    if (light !== null) {
      activeCount++;
      sessionStats.lightMin = Math.min(sessionStats.lightMin, light);
      sessionStats.lightMax = Math.max(sessionStats.lightMax, light);
      if (elValLight) elValLight.textContent = light;
      if (elMinMaxLight) elMinMaxLight.textContent = `MIN: ${sessionStats.lightMin} lx | MAX: ${sessionStats.lightMax} lx`;

      const lightSegments = Math.min(5, Math.max(1, Math.round(((light - 100) / 900) * 5)));
      updateMeter(elMeterLight, lightSegments);

      if (elBadgeLight) {
        if (light < 250) {
          elBadgeLight.textContent = "DIM LIGHT";
          elBadgeLight.className = "pixel-tag badge-neutral";
        } else if (light > 800) {
          elBadgeLight.textContent = "BRIGHT SUN";
          elBadgeLight.className = "pixel-tag badge-warning";
        } else {
          elBadgeLight.textContent = "WELL-LIT";
          elBadgeLight.className = "pixel-tag badge-success";
        }
      }
    } else {
      if (elValLight) elValLight.textContent = "N/A";
      if (elBadgeLight) {
        elBadgeLight.textContent = "NO DATA";
        elBadgeLight.className = "pixel-tag badge-neutral";
      }
      updateMeter(elMeterLight, 0);
    }

    // 04: Air Pressure (950 - 1050 hPa)
    if (press !== null) {
      activeCount++;
      sessionStats.pressMin = Math.min(sessionStats.pressMin, press);
      sessionStats.pressMax = Math.max(sessionStats.pressMax, press);
      if (elValPress) elValPress.textContent = press.toFixed(1);
      if (elMinMaxPress) elMinMaxPress.textContent = `MIN: ${sessionStats.pressMin.toFixed(1)} hPa | MAX: ${sessionStats.pressMax.toFixed(1)} hPa`;

      const pressSegments = Math.min(5, Math.max(1, Math.round(((press - 950) / 100) * 5)));
      updateMeter(elMeterPress, pressSegments);

      if (elBadgePress) {
        if (press > 1025.0) {
          elBadgePress.textContent = "HIGH PRES";
          elBadgePress.className = "pixel-tag badge-purple";
        } else if (press < 980.0) {
          elBadgePress.textContent = "LOW PRES";
          elBadgePress.className = "pixel-tag badge-warning";
        } else {
          elBadgePress.textContent = "STABLE";
          elBadgePress.className = "pixel-tag badge-success";
        }
      }
    } else {
      if (elValPress) elValPress.textContent = "N/A";
      if (elBadgePress) {
        elBadgePress.textContent = "NO DATA";
        elBadgePress.className = "pixel-tag badge-neutral";
      }
      updateMeter(elMeterPress, 0);
    }

    // 05: Carbon Dioxide (400 - 1200 ppm)
    if (co2 !== null) {
      activeCount++;
      sessionStats.co2Min = Math.min(sessionStats.co2Min, co2);
      sessionStats.co2Max = Math.max(sessionStats.co2Max, co2);
      if (elValCo2) elValCo2.textContent = co2;
      if (elMinMaxCo2) elMinMaxCo2.textContent = `MIN: ${sessionStats.co2Min} ppm | MAX: ${sessionStats.co2Max} ppm`;

      const co2Segments = Math.min(5, Math.max(1, Math.round(((co2 - 400) / 800) * 5)));
      updateMeter(elMeterCo2, co2Segments);

      if (elBadgeCo2) {
        if (co2 > 1000) {
          elBadgeCo2.textContent = "POOR (VENT)";
          elBadgeCo2.className = "pixel-tag badge-danger";
        } else if (co2 > 800) {
          elBadgeCo2.textContent = "MODERATE";
          elBadgeCo2.className = "pixel-tag badge-warning";
        } else {
          elBadgeCo2.textContent = "FRESH AIR";
          elBadgeCo2.className = "pixel-tag badge-success";
        }
      }
    } else {
      if (elValCo2) elValCo2.textContent = "N/A";
      if (elBadgeCo2) {
        elBadgeCo2.textContent = "NO DATA";
        elBadgeCo2.className = "pixel-tag badge-neutral";
      }
      updateMeter(elMeterCo2, 0);
    }

    // 06: Sound Noise Level (30 - 90 dB)
    if (noise !== null) {
      activeCount++;
      sessionStats.noiseMin = Math.min(sessionStats.noiseMin, noise);
      sessionStats.noiseMax = Math.max(sessionStats.noiseMax, noise);
      if (elValNoise) elValNoise.textContent = noise.toFixed(1);
      if (elMinMaxNoise) elMinMaxNoise.textContent = `MIN: ${sessionStats.noiseMin.toFixed(1)} dB | MAX: ${sessionStats.noiseMax.toFixed(1)} dB`;

      const noiseSegments = Math.min(5, Math.max(1, Math.round(((noise - 30) / 60) * 5)));
      updateMeter(elMeterNoise, noiseSegments);

      if (elBadgeNoise) {
        if (noise > 75.0) {
          elBadgeNoise.textContent = "LOUD NOISE";
          elBadgeNoise.className = "pixel-tag badge-danger";
        } else if (noise > 55.0) {
          elBadgeNoise.textContent = "MODERATE";
          elBadgeNoise.className = "pixel-tag badge-blue";
        } else {
          elBadgeNoise.textContent = "QUIET";
          elBadgeNoise.className = "pixel-tag badge-success";
        }
      }
    } else {
      if (elValNoise) elValNoise.textContent = "N/A";
      if (elBadgeNoise) {
        elBadgeNoise.textContent = "NO DATA";
        elBadgeNoise.className = "pixel-tag badge-neutral";
      }
      updateMeter(elMeterNoise, 0);
    }

    // Update System HUD Heartbeat Meter (proportional to 6 active sensors)
    const systemSegments = Math.min(5, Math.max(1, Math.round((activeCount / 6) * 5)));
    updateMeter(elMeterSystem, systemSegments);

    // Timestamp formatting in Asia/Bangkok timezone
    if (ts !== null) {
      const date = new Date(ts * 1000);
      try {
        if (elLastSeen) {
          elLastSeen.textContent = date.toLocaleTimeString("en-US", { 
            timeZone: IOT_CONFIG.timeZone || "Asia/Bangkok", 
            hour12: false 
          });
        }
      } catch (e) {
        if (elLastSeen) elLastSeen.textContent = date.toLocaleTimeString([], { hour12: false });
      }
      evaluateDeviceStatus(ts);
    } else {
      if (elLastSeen) elLastSeen.textContent = "N/A";
      if (elRelativeTime) elRelativeTime.textContent = "No Timestamp";
      if (elDeviceStatusBadge) {
        elDeviceStatusBadge.textContent = "STANDBY";
        elDeviceStatusBadge.className = "pixel-tag badge-neutral";
      }
    }

    triggerCardFlash();
  }

  function updateMeter(meterElement, activeCount) {
    if (!meterElement) return;
    const segments = meterElement.querySelectorAll(".meter-segment");
    segments.forEach((seg, idx) => {
      if (idx < activeCount) {
        seg.classList.add("active");
      } else {
        seg.classList.remove("active");
      }
    });
  }

  function handleHistoryUpdate(historyArray, deviceId) {
    if (deviceId && deviceId !== activeDeviceId) return;

    historyData = historyArray || [];

    if (historyData.length > 0) {
      showEmptyState(false);
    }

    // Update Charts (from same real Firebase history source)
    telemetryCharts.updateData(historyData);

    // Render 9-Column History Table
    renderHistoryTable(historyData);
  }

  function handleStatusChange(status, message) {
    connectionStatus = status;
    if (status === "connected") {
      elStatusDot.className = "status-dot dot-online";
      elStatusText.textContent = "LIVE STREAM";
      hideLoadingOverlay();
    } else if (status === "connecting") {
      elStatusDot.className = "status-dot dot-connecting";
      elStatusText.textContent = message || "CONNECTING...";
    }
  }

  function handleError(message) {
    elStatusDot.className = "status-dot dot-error";
    elStatusText.textContent = "ERROR";
    showToast("Error: " + message, "error");
  }

  // -------------------------------------------------------------
  // Device Status & Freshness Evaluation
  // -------------------------------------------------------------

  function evaluateDeviceStatus(timestampSeconds) {
    if (!timestampSeconds) return;
    const nowSeconds = Math.floor(Date.now() / 1000);
    const diff = nowSeconds - timestampSeconds;

    if (diff <= IOT_CONFIG.offlineThresholdSeconds) {
      if (elDeviceStatusBadge) {
        elDeviceStatusBadge.textContent = "ONLINE";
        elDeviceStatusBadge.className = "pixel-tag badge-success";
      }
      if (elRelativeTime) {
        elRelativeTime.textContent = diff <= 1 ? "Just now" : `${diff}s ago`;
        elRelativeTime.className = "text-emerald";
      }
    } else {
      if (elDeviceStatusBadge) {
        elDeviceStatusBadge.textContent = "STALE / OFFLINE";
        elDeviceStatusBadge.className = "pixel-tag badge-danger";
      }
      if (elRelativeTime) {
        elRelativeTime.textContent = formatDuration(diff) + " ago";
        elRelativeTime.className = "text-amber";
      }
    }
  }

  // Periodic heartbeat
  if (staleTimer) clearInterval(staleTimer);
  staleTimer = setInterval(() => {
    if (latestData && latestData.timestamp) {
      evaluateDeviceStatus(latestData.timestamp);
    }
  }, 3000);

  function formatDuration(sec) {
    if (sec < 60) return `${sec}s`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m`;
    const hrs = Math.floor(min / 60);
    return `${hrs}h`;
  }

  // -------------------------------------------------------------
  // 9-Column History Table Renderer
  // -------------------------------------------------------------

  function renderHistoryTable(data) {
    if (!elHistoryTableBody) return;

    if (!data || data.length === 0) {
      elRecordCount.textContent = "0 RECS";
      if (elDiagDisplayedCount) elDiagDisplayedCount.textContent = 0;
      elHistoryTableBody.innerHTML = `
        <tr>
          <td colspan="9" class="text-center py-6 text-muted" style="text-align:center; padding: 28px;">
            <i class="fas fa-inbox me-2"></i>No historical telemetry records found in Firebase RTDB
          </td>
        </tr>`;
      return;
    }

    // Apply configurable limit (0 = Unlimited)
    const reversed = [...data].reverse();
    const displayed = (currentTableLimit > 0) ? reversed.slice(0, currentTableLimit) : reversed;

    // Explicit record badge
    if (currentTableLimit > 0 && data.length > currentTableLimit) {
      elRecordCount.textContent = `Showing latest ${displayed.length} of ${data.length} RECS`;
    } else {
      elRecordCount.textContent = `${data.length} of ${data.length} RECS`;
    }

    if (elDiagDisplayedCount) elDiagDisplayedCount.textContent = displayed.length;

    elHistoryTableBody.innerHTML = displayed.map((row) => {
      const ts = (row.timestamp !== null && row.timestamp !== undefined && !isNaN(row.timestamp)) 
        ? Number(row.timestamp) 
        : null;

      let formattedDate = "N/A (No SNTP)";
      if (ts !== null) {
        const d = new Date(ts * 1000);
        try {
          formattedDate = d.toLocaleString("en-US", {
            timeZone: IOT_CONFIG.timeZone || "Asia/Bangkok",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
          });
        } catch (e) {
          formattedDate = d.toLocaleString();
        }
      }

      const temp = (row.temp !== null && row.temp !== undefined && !isNaN(row.temp)) 
        ? `${parseFloat(row.temp).toFixed(1)} °C` 
        : `<span class="text-muted">N/A</span>`;

      const humi = (row.humi !== null && row.humi !== undefined && !isNaN(row.humi)) 
        ? `${parseFloat(row.humi).toFixed(1)} %` 
        : `<span class="text-muted">N/A</span>`;

      const light = (row.light !== null && row.light !== undefined && !isNaN(row.light)) 
        ? `${parseInt(row.light, 10)} lx` 
        : `<span class="text-muted">N/A</span>`;

      const press = (row.press !== null && row.press !== undefined && !isNaN(row.press)) 
        ? `${parseFloat(row.press).toFixed(1)} hPa` 
        : `<span class="text-muted">N/A</span>`;

      const co2 = (row.co2 !== null && row.co2 !== undefined && !isNaN(row.co2)) 
        ? `${parseInt(row.co2, 10)} ppm` 
        : `<span class="text-muted">N/A</span>`;

      const noise = (row.noise !== null && row.noise !== undefined && !isNaN(row.noise)) 
        ? `${parseFloat(row.noise).toFixed(1)} dB` 
        : `<span class="text-muted">N/A</span>`;

      // Derived presentation status for row
      let statusBadge = `<span class="pixel-tag badge-success">HEALTHY</span>`;
      if (row.co2 !== null && row.co2 > 1000) {
        statusBadge = `<span class="pixel-tag badge-danger">HIGH CO2</span>`;
      } else if (row.temp !== null && row.temp > 33.0) {
        statusBadge = `<span class="pixel-tag badge-danger">HIGH TEMP</span>`;
      } else if (row.noise !== null && row.noise > 75.0) {
        statusBadge = `<span class="pixel-tag badge-danger">LOUD NOISE</span>`;
      } else if (row.humi !== null && row.humi > 75.0) {
        statusBadge = `<span class="pixel-tag badge-cyan">HIGH HUMI</span>`;
      } else if (row.press !== null && row.press < 980.0) {
        statusBadge = `<span class="pixel-tag badge-purple">LOW PRES</span>`;
      } else if (row.temp === null || row.humi === null || row.light === null || row.press === null || row.co2 === null || row.noise === null || ts === null) {
        statusBadge = `<span class="pixel-tag badge-neutral">PARTIAL</span>`;
      }

      return `
        <tr>
          <td><span class="pixel-tag badge-cyan"><i class="fas fa-microchip me-1"></i>${row.deviceId || activeDeviceId}</span></td>
          <td class="mono-text">${formattedDate}</td>
          <td class="mono-text text-redstone" style="font-weight:700;">${temp}</td>
          <td class="mono-text text-cyan" style="font-weight:700;">${humi}</td>
          <td class="mono-text text-amber" style="font-weight:700;">${light}</td>
          <td class="mono-text text-purple" style="font-weight:700;">${press}</td>
          <td class="mono-text text-emerald" style="font-weight:700;">${co2}</td>
          <td class="mono-text text-blue" style="font-weight:700;">${noise}</td>
          <td>${statusBadge}</td>
        </tr>
      `;
    }).join("");
  }

  // -------------------------------------------------------------
  // Helper UI Features
  // -------------------------------------------------------------

  function triggerCardFlash() {
    const cards = document.querySelectorAll(".kpi-card");
    cards.forEach(c => {
      c.classList.add("flash-update");
      setTimeout(() => c.classList.remove("flash-update"), 500);
    });
  }

  function showEmptyState(show) {
    if (elEmptyState) {
      elEmptyState.style.display = show ? "block" : "none";
    }
  }

  function hideLoadingOverlay() {
    if (elLoadingOverlay) {
      elLoadingOverlay.classList.add("hidden");
    }
  }

  // -------------------------------------------------------------
  // Chart Tabs
  // -------------------------------------------------------------
  const chartButtons = document.querySelectorAll(".chart-filter-btn");
  chartButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      chartButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      telemetryCharts.setMode(btn.getAttribute("data-mode"));
    });
  });

  // -------------------------------------------------------------
  // Diagnostics Modal Handlers
  // -------------------------------------------------------------
  if (elBtnOpenDiag) {
    elBtnOpenDiag.addEventListener("click", () => {
      if (elDiagModal) elDiagModal.classList.add("modal-show");
      playPixelSound("pop");
    });
  }

  if (elBtnCloseDiag) {
    elBtnCloseDiag.addEventListener("click", () => {
      if (elDiagModal) elDiagModal.classList.remove("modal-show");
    });
  }

  if (elBtnCloseDiagFooter) {
    elBtnCloseDiagFooter.addEventListener("click", () => {
      if (elDiagModal) elDiagModal.classList.remove("modal-show");
    });
  }

  // -------------------------------------------------------------
  // 6-Sensor CSV Export
  // -------------------------------------------------------------
  const btnExportCsv = document.getElementById("btnExportCsv");
  if (btnExportCsv) {
    btnExportCsv.addEventListener("click", () => {
      if (historyData.length === 0) {
        showToast("No data available to export", "warning");
        return;
      }

      let csv = "Device ID,Timestamp (Unix),Datetime (Asia/Bangkok),Temperature (C),Humidity (%),Light (lx),Pressure (hPa),CO2 (ppm),Noise (dB),Status\n";
      historyData.forEach((row) => {
        const ts = row.timestamp || "";
        let dateBangkok = "N/A";
        if (ts) {
          try {
            dateBangkok = new Date(ts * 1000).toLocaleString("en-US", {
              timeZone: IOT_CONFIG.timeZone || "Asia/Bangkok",
              hour12: false
            });
          } catch (e) {
            dateBangkok = new Date(ts * 1000).toISOString();
          }
        }
        const temp = (row.temp !== null && row.temp !== undefined) ? row.temp : "N/A";
        const humi = (row.humi !== null && row.humi !== undefined) ? row.humi : "N/A";
        const light = (row.light !== null && row.light !== undefined) ? row.light : "N/A";
        const press = (row.press !== null && row.press !== undefined) ? row.press : "N/A";
        const co2 = (row.co2 !== null && row.co2 !== undefined) ? row.co2 : "N/A";
        const noise = (row.noise !== null && row.noise !== undefined) ? row.noise : "N/A";

        let status = "HEALTHY";
        if (row.co2 !== null && row.co2 > 1000) status = "HIGH CO2";
        else if (row.temp !== null && row.temp > 33.0) status = "HIGH TEMP";
        else if (row.noise !== null && row.noise > 75.0) status = "LOUD NOISE";
        else if (row.humi !== null && row.humi > 75.0) status = "HIGH HUMI";
        else if (row.press !== null && row.press < 980.0) status = "LOW PRES";

        csv += `"${row.deviceId || activeDeviceId}","${ts}","${dateBangkok}","${temp}","${humi}","${light}","${press}","${co2}","${noise}","${status}"\n`;
      });

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `esp32_6sensor_telemetry_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      playPixelSound("success");
      showToast("6-Sensor CSV export completed successfully!", "success");
    });
  }

  // -------------------------------------------------------------
  // Settings Modal Handlers
  // -------------------------------------------------------------
  const settingsModal = document.getElementById("settingsModal");
  const btnOpenSettings = document.getElementById("btnOpenSettings");
  const btnCloseSettings = document.getElementById("btnCloseSettings");
  const formSettings = document.getElementById("formFirebaseSettings");
  const btnResetSettings = document.getElementById("btnResetSettings");

  if (btnOpenSettings) {
    btnOpenSettings.addEventListener("click", () => {
      populateSettingsForm(getFirebaseConfig());
      settingsModal.classList.add("modal-show");
    });
  }

  if (btnCloseSettings) {
    btnCloseSettings.addEventListener("click", () => {
      settingsModal.classList.remove("modal-show");
    });
  }

  if (formSettings) {
    formSettings.addEventListener("submit", (e) => {
      e.preventDefault();
      const newConfig = {
        databaseURL: document.getElementById("inputDbUrl").value.trim(),
        apiKey: document.getElementById("inputApiKey").value.trim() || "DUMMY_KEY",
        projectId: document.getElementById("inputProjectId").value.trim() || "iot-project",
        authDomain: document.getElementById("inputAuthDomain").value.trim() || ""
      };

      saveFirebaseConfig(newConfig);
      settingsModal.classList.remove("modal-show");
      playPixelSound("success");
      showToast("Firebase settings saved! Reconnecting...", "success");
      firebaseService.detach();
      startFirebase();
    });
  }

  if (btnResetSettings) {
    btnResetSettings.addEventListener("click", () => {
      resetFirebaseConfig();
      populateSettingsForm(DEFAULT_FIREBASE_CONFIG);
      showToast("Config reset to defaults", "info");
    });
  }

  function populateSettingsForm(cfg) {
    const inputDbUrl = document.getElementById("inputDbUrl");
    const inputApiKey = document.getElementById("inputApiKey");
    const inputProjectId = document.getElementById("inputProjectId");
    const inputAuthDomain = document.getElementById("inputAuthDomain");

    if (inputDbUrl) inputDbUrl.value = cfg.databaseURL || "";
    if (inputApiKey) inputApiKey.value = cfg.apiKey || "";
    if (inputProjectId) inputProjectId.value = cfg.projectId || "";
    if (inputAuthDomain) inputAuthDomain.value = cfg.authDomain || "";
  }

  // -------------------------------------------------------------
  // ESP32 6-Sensor Simulator Drawer Handlers
  // -------------------------------------------------------------
  const simDrawer = document.getElementById("simulatorDrawer");
  const btnOpenSim = document.getElementById("btnOpenSim");
  const btnCloseSim = document.getElementById("btnCloseSim");
  const btnSendMock = document.getElementById("btnSendMock");
  const btnRandomMock = document.getElementById("btnRandomMock");
  const simLog = document.getElementById("simLog");

  if (btnOpenSim) {
    btnOpenSim.addEventListener("click", () => {
      simDrawer.classList.add("drawer-show");
    });
  }

  if (btnCloseSim) {
    btnCloseSim.addEventListener("click", () => {
      simDrawer.classList.remove("drawer-show");
    });
  }

  if (btnRandomMock) {
    btnRandomMock.addEventListener("click", () => {
      playPixelSound("pop");
      document.getElementById("simTemp").value = (25.0 + Math.random() * 10.0).toFixed(1);
      document.getElementById("simHumi").value = (50.0 + Math.random() * 30.0).toFixed(1);
      document.getElementById("simLight").value = Math.round(100 + Math.random() * 900);
      document.getElementById("simPress").value = (950.0 + Math.random() * 100.0).toFixed(1);
      document.getElementById("simCo2").value = Math.round(400 + Math.random() * 800);
      document.getElementById("simNoise").value = (30.0 + Math.random() * 60.0).toFixed(1);
    });
  }

  if (btnSendMock) {
    btnSendMock.addEventListener("click", async () => {
      const temp = parseFloat(document.getElementById("simTemp").value);
      const humi = parseFloat(document.getElementById("simHumi").value);
      const light = parseInt(document.getElementById("simLight").value, 10);
      const press = parseFloat(document.getElementById("simPress").value);
      const co2 = parseInt(document.getElementById("simCo2").value, 10);
      const noise = parseFloat(document.getElementById("simNoise").value);

      btnSendMock.disabled = true;
      btnSendMock.innerHTML = `<i class="fas fa-spinner fa-spin me-1"></i>SENDING...`;
      appendSimLog(`[L5] Dual REST: Temp=${temp}°C, Humi=${humi}%, Light=${light}lx, Press=${press}hPa, CO2=${co2}ppm, Noise=${noise}dB`);

      try {
        const res = await firebaseService.simulateEsp32Upload(temp, humi, light, press, co2, noise);
        appendSimLog(`[L5] Latest PUT status = ${res.latestStatus}`);
        appendSimLog(`[L5] History POST status = ${res.historyStatus}`);
        playPixelSound("success");
        showToast("Simulated 6-sensor ESP32 payload uploaded successfully!", "success");
      } catch (err) {
        appendSimLog(`[ERROR] Request failed: ${err.message}`);
        showToast("Simulation error: Check database URL and rules", "error");
      } finally {
        btnSendMock.disabled = false;
        btnSendMock.innerHTML = `<i class="fas fa-paper-plane me-1"></i>SEND L5 PAYLOAD`;
      }
    });
  }

  function appendSimLog(msg) {
    if (!simLog) return;
    const time = new Date().toLocaleTimeString([], { hour12: false });
    simLog.innerHTML += `<div><span class="text-muted">[${time}]</span> ${msg}</div>`;
    simLog.scrollTop = simLog.scrollHeight;
  }
});

// Toast notification helper
function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-info'} me-2"></i>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("toast-fade");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
