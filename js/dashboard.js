/**
 * Dashboard UI Controller for ESP32 IoT Firebase Platform - Modern Cyber-Pixel Edition
 * 
 * Coordinates telemetry cards, 5-segment pixel meters, Light/Dark theme toggle,
 * 6-column history table, 8-bit web audio feedback, settings modal, simulator drawer, and CSV export.
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
    lightMax: -Infinity
  };
  let staleTimer = null;

  // DOM Elements
  const elStatusDot = document.getElementById("statusDot");
  const elStatusText = document.getElementById("statusText");
  const elDeviceStatusBadge = document.getElementById("deviceStatusBadge");
  const elLastSeen = document.getElementById("lastSeenTime");
  const elRelativeTime = document.getElementById("relativeTime");

  // KPI Elements
  const elValTemp = document.getElementById("valTemp");
  const elValHumi = document.getElementById("valHumi");
  const elValLight = document.getElementById("valLight");
  const elMinMaxTemp = document.getElementById("minMaxTemp");
  const elMinMaxHumi = document.getElementById("minMaxHumi");
  const elMinMaxLight = document.getElementById("minMaxLight");
  const elBadgeTemp = document.getElementById("badgeTemp");
  const elBadgeHumi = document.getElementById("badgeHumi");
  const elBadgeLight = document.getElementById("badgeLight");

  // 5-Segment Meters
  const elMeterTemp = document.getElementById("meterTemp");
  const elMeterHumi = document.getElementById("meterHumi");
  const elMeterLight = document.getElementById("meterLight");

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
    const hasTs = data.timestamp !== undefined && data.timestamp !== null && !isNaN(Number(data.timestamp));

    const temp = hasTemp ? parseFloat(data.temp) : null;
    const humi = hasHumi ? parseFloat(data.humi) : null;
    const light = hasLight ? parseInt(data.light, 10) : null;
    const ts = hasTs ? parseInt(data.timestamp, 10) : null;

    // Update Temperature Card
    if (temp !== null) {
      sessionStats.tempMin = Math.min(sessionStats.tempMin, temp);
      sessionStats.tempMax = Math.max(sessionStats.tempMax, temp);
      elValTemp.textContent = temp.toFixed(1);
      elMinMaxTemp.textContent = `MIN: ${sessionStats.tempMin.toFixed(1)}°C | MAX: ${sessionStats.tempMax.toFixed(1)}°C`;
      
      const tempSegments = Math.min(5, Math.max(1, Math.round(((temp - 25) / 10) * 5)));
      updateMeter(elMeterTemp, tempSegments);

      if (temp > 33.0) {
        elBadgeTemp.textContent = "HIGH TEMP";
        elBadgeTemp.className = "pixel-tag badge-danger";
      } else {
        elBadgeTemp.textContent = "OPTIMAL";
        elBadgeTemp.className = "pixel-tag badge-success";
      }
    } else {
      elValTemp.textContent = "N/A";
      elBadgeTemp.textContent = "NO DATA";
      elBadgeTemp.className = "pixel-tag badge-neutral";
    }

    // Update Humidity Card
    if (humi !== null) {
      sessionStats.humiMin = Math.min(sessionStats.humiMin, humi);
      sessionStats.humiMax = Math.max(sessionStats.humiMax, humi);
      elValHumi.textContent = humi.toFixed(1);
      elMinMaxHumi.textContent = `MIN: ${sessionStats.humiMin.toFixed(1)}% | MAX: ${sessionStats.humiMax.toFixed(1)}%`;

      const humiSegments = Math.min(5, Math.max(1, Math.round(((humi - 50) / 30) * 5)));
      updateMeter(elMeterHumi, humiSegments);

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
    } else {
      elValHumi.textContent = "N/A";
      elBadgeHumi.textContent = "NO DATA";
      elBadgeHumi.className = "pixel-tag badge-neutral";
    }

    // Update Light Card
    if (light !== null) {
      sessionStats.lightMin = Math.min(sessionStats.lightMin, light);
      sessionStats.lightMax = Math.max(sessionStats.lightMax, light);
      elValLight.textContent = light;
      elMinMaxLight.textContent = `MIN: ${sessionStats.lightMin} lx | MAX: ${sessionStats.lightMax} lx`;

      const lightSegments = Math.min(5, Math.max(1, Math.round(((light - 100) / 900) * 5)));
      updateMeter(elMeterLight, lightSegments);

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
    } else {
      elValLight.textContent = "N/A";
      elBadgeLight.textContent = "NO DATA";
      elBadgeLight.className = "pixel-tag badge-neutral";
    }

    // Timestamp formatting in Asia/Bangkok timezone
    if (ts !== null) {
      const date = new Date(ts * 1000);
      try {
        elLastSeen.textContent = date.toLocaleTimeString("en-US", { 
          timeZone: IOT_CONFIG.timeZone || "Asia/Bangkok", 
          hour12: false 
        });
      } catch (e) {
        elLastSeen.textContent = date.toLocaleTimeString([], { hour12: false });
      }
      evaluateDeviceStatus(ts);
    } else {
      elLastSeen.textContent = "N/A";
      elRelativeTime.textContent = "No Timestamp";
      elDeviceStatusBadge.textContent = "STANDBY";
      elDeviceStatusBadge.className = "pixel-tag badge-neutral";
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

    // Render 6-Column History Table
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
      elDeviceStatusBadge.textContent = "ONLINE";
      elDeviceStatusBadge.className = "pixel-tag badge-success";
      elRelativeTime.textContent = diff <= 1 ? "Just now" : `${diff}s ago`;
      elRelativeTime.className = "text-emerald";
    } else {
      elDeviceStatusBadge.textContent = "STALE / OFFLINE";
      elDeviceStatusBadge.className = "pixel-tag badge-danger";
      elRelativeTime.textContent = formatDuration(diff) + " ago";
      elRelativeTime.className = "text-amber";
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
  // 6-Column History Table Renderer
  // -------------------------------------------------------------

  function renderHistoryTable(data) {
    if (!elHistoryTableBody) return;

    if (!data || data.length === 0) {
      elRecordCount.textContent = "0 RECS";
      if (elDiagDisplayedCount) elDiagDisplayedCount.textContent = 0;
      elHistoryTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-6 text-muted" style="text-align:center; padding: 28px;">
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

      // Derived presentation status for row
      let statusBadge = `<span class="pixel-tag badge-success">HEALTHY</span>`;
      if (row.temp !== null && row.temp > 33.0) {
        statusBadge = `<span class="pixel-tag badge-danger">HIGH TEMP</span>`;
      } else if (row.humi !== null && row.humi > 75.0) {
        statusBadge = `<span class="pixel-tag badge-cyan">HIGH HUMI</span>`;
      } else if (row.temp === null || row.humi === null || row.light === null || ts === null) {
        statusBadge = `<span class="pixel-tag badge-neutral">PARTIAL (L3)</span>`;
      }

      return `
        <tr>
          <td><span class="pixel-tag badge-cyan"><i class="fas fa-microchip me-1"></i>${row.deviceId || activeDeviceId}</span></td>
          <td class="mono-text">${formattedDate}</td>
          <td class="mono-text text-redstone" style="font-weight:700;">${temp}</td>
          <td class="mono-text text-cyan" style="font-weight:700;">${humi}</td>
          <td class="mono-text text-amber" style="font-weight:700;">${light}</td>
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
  // CSV Export
  // -------------------------------------------------------------
  const btnExportCsv = document.getElementById("btnExportCsv");
  if (btnExportCsv) {
    btnExportCsv.addEventListener("click", () => {
      if (historyData.length === 0) {
        showToast("No data available to export", "warning");
        return;
      }

      let csv = "Device ID,Timestamp (Unix),Datetime (Asia/Bangkok),Temperature (C),Humidity (%),Light (lx),Status\n";
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
        const temp = row.temp !== null && row.temp !== undefined ? row.temp : "N/A";
        const humi = row.humi !== null && row.humi !== undefined ? row.humi : "N/A";
        const light = row.light !== null && row.light !== undefined ? row.light : "N/A";
        const status = (row.temp > 33.0) ? "HIGH TEMP" : (row.humi > 75.0) ? "HIGH HUMI" : "HEALTHY";

        csv += `"${row.deviceId || activeDeviceId}","${ts}","${dateBangkok}","${temp}","${humi}","${light}","${status}"\n`;
      });

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `esp32_telemetry_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      playPixelSound("success");
      showToast("CSV export completed successfully!", "success");
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
  // ESP32 Simulator Drawer Handlers
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
    });
  }

  if (btnSendMock) {
    btnSendMock.addEventListener("click", async () => {
      const temp = parseFloat(document.getElementById("simTemp").value);
      const humi = parseFloat(document.getElementById("simHumi").value);
      const light = parseInt(document.getElementById("simLight").value, 10);

      btnSendMock.disabled = true;
      btnSendMock.innerHTML = `<i class="fas fa-spinner fa-spin me-1"></i>SENDING...`;
      appendSimLog(`[L5] Dispatch Dual REST: Temp=${temp}°C, Humi=${humi}%, Light=${light}lx`);

      try {
        const res = await firebaseService.simulateEsp32Upload(temp, humi, light);
        appendSimLog(`[L5] Latest PUT status = ${res.latestStatus}`);
        appendSimLog(`[L5] History POST status = ${res.historyStatus}`);
        playPixelSound("success");
        showToast("Simulated ESP32 payload uploaded successfully!", "success");
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

