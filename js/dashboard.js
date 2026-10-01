/**
 * Dashboard UI Controller for ESP32 IoT Firebase Platform
 * 
 * Coordinates telemetry cards, live status evaluation, six-column history table,
 * settings modal, simulator drawer, and CSV export.
 */

document.addEventListener("DOMContentLoaded", () => {
  // State variables
  let latestData = null;
  let historyData = [];
  let connectionStatus = "connecting"; // 'connecting', 'connected', 'error'
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

  // Table & Stats
  const elHistoryTableBody = document.getElementById("historyTableBody");
  const elRecordCount = document.getElementById("recordCount");
  const elEmptyState = document.getElementById("emptyState");
  const elLoadingOverlay = document.getElementById("loadingOverlay");

  // Automatically dismiss loading overlay after brief initial load time
  setTimeout(() => {
    hideLoadingOverlay();
  }, 1000);

  // Initialize Chart
  telemetryCharts.init();

  // Initialize Firebase Service
  const config = getFirebaseConfig();
  populateSettingsForm(config);

  function startFirebase() {
    const currentConfig = getFirebaseConfig();
    
    // Check if default placeholder is still present
    if (currentConfig.databaseURL.includes("your-project-id")) {
      handleStatusChange("connecting", "Awaiting Firebase URL (Click Settings)");
      showToast("Please configure your Firebase Database URL in Settings ⚙️", "info");
    }

    firebaseService.init(currentConfig, {
      onLatest: handleLatestUpdate,
      onHistory: handleHistoryUpdate,
      onStatus: handleStatusChange,
      onError: handleError
    });
  }

  startFirebase();

  // -------------------------------------------------------------
  // Data Handlers
  // -------------------------------------------------------------

  function handleLatestUpdate(data) {
    if (!data) {
      if (historyData.length === 0) {
        showEmptyState(true);
      }
      return;
    }

    showEmptyState(false);
    latestData = data;

    // Update KPIs
    const temp = parseFloat(data.temp);
    const humi = parseFloat(data.humi);
    const light = parseInt(data.light, 10);
    const ts = data.timestamp ? parseInt(data.timestamp, 10) : Math.floor(Date.now() / 1000);

    // Update Session Stats
    if (!isNaN(temp)) {
      sessionStats.tempMin = Math.min(sessionStats.tempMin, temp);
      sessionStats.tempMax = Math.max(sessionStats.tempMax, temp);
      elValTemp.textContent = temp.toFixed(1);
      elMinMaxTemp.textContent = `Min: ${sessionStats.tempMin.toFixed(1)}°C | Max: ${sessionStats.tempMax.toFixed(1)}°C`;
      
      if (temp > 33.0) {
        elBadgeTemp.textContent = "High Temp";
        elBadgeTemp.className = "badge badge-warning";
      } else {
        elBadgeTemp.textContent = "Normal Range";
        elBadgeTemp.className = "badge badge-success";
      }
    }

    if (!isNaN(humi)) {
      sessionStats.humiMin = Math.min(sessionStats.humiMin, humi);
      sessionStats.humiMax = Math.max(sessionStats.humiMax, humi);
      elValHumi.textContent = humi.toFixed(1);
      elMinMaxHumi.textContent = `Min: ${sessionStats.humiMin.toFixed(1)}% | Max: ${sessionStats.humiMax.toFixed(1)}%`;

      if (humi > 75.0) {
        elBadgeHumi.textContent = "High Humidity";
        elBadgeHumi.className = "badge badge-info";
      } else if (humi < 55.0) {
        elBadgeHumi.textContent = "Low Humidity";
        elBadgeHumi.className = "badge badge-warning";
      } else {
        elBadgeHumi.textContent = "Optimal";
        elBadgeHumi.className = "badge badge-success";
      }
    }

    if (!isNaN(light)) {
      sessionStats.lightMin = Math.min(sessionStats.lightMin, light);
      sessionStats.lightMax = Math.max(sessionStats.lightMax, light);
      elValLight.textContent = light;
      elMinMaxLight.textContent = `Min: ${sessionStats.lightMin} lx | Max: ${sessionStats.lightMax} lx`;

      if (light < 250) {
        elBadgeLight.textContent = "Dim / Indoor";
        elBadgeLight.className = "badge badge-neutral";
      } else if (light > 800) {
        elBadgeLight.textContent = "Bright Sunlight";
        elBadgeLight.className = "badge badge-warning";
      } else {
        elBadgeLight.textContent = "Well-lit Ambient";
        elBadgeLight.className = "badge badge-success";
      }
    }

    // Timestamp formatting
    const date = new Date(ts * 1000);
    elLastSeen.textContent = date.toLocaleTimeString([], { hour12: false });
    
    evaluateDeviceStatus(ts);
    triggerCardFlash();
  }

  function handleHistoryUpdate(historyArray) {
    historyData = historyArray || [];
    elRecordCount.textContent = `${historyData.length} records`;

    if (historyData.length > 0) {
      showEmptyState(false);
    }

    // Update Charts
    telemetryCharts.updateData(historyData);

    // Render 6-Column History Table
    renderHistoryTable(historyData);
  }

  function handleStatusChange(status, message) {
    connectionStatus = status;
    if (status === "connected") {
      elStatusDot.className = "status-dot dot-online";
      elStatusText.textContent = "Live Stream Connected";
      hideLoadingOverlay();
    } else if (status === "connecting") {
      elStatusDot.className = "status-dot dot-connecting";
      elStatusText.textContent = message || "Connecting to Firebase...";
    }
  }

  function handleError(message) {
    elStatusDot.className = "status-dot dot-error";
    elStatusText.textContent = message;
    showToast("Error: " + message, "error");
  }

  // -------------------------------------------------------------
  // Device Status & Freshness Evaluation
  // -------------------------------------------------------------

  function evaluateDeviceStatus(timestampSeconds) {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const diff = nowSeconds - timestampSeconds;

    if (diff <= IOT_CONFIG.offlineThresholdSeconds) {
      elDeviceStatusBadge.textContent = "ONLINE";
      elDeviceStatusBadge.className = "badge badge-success";
      elRelativeTime.textContent = diff <= 1 ? "Just now" : `${diff}s ago`;
      elRelativeTime.className = "text-emerald";
    } else {
      elDeviceStatusBadge.textContent = "STALE / OFFLINE";
      elDeviceStatusBadge.className = "badge badge-danger";
      elRelativeTime.textContent = formatDuration(diff) + " ago";
      elRelativeTime.className = "text-amber";
    }
  }

  // Periodic heartbeat to refresh "X seconds ago" and stale status
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
      elHistoryTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-6 text-muted">
            <i class="fas fa-inbox me-2"></i>No historical telemetry records found in Firebase RTDB
          </td>
        </tr>`;
      return;
    }

    // Show latest records at top (reversed order)
    const reversed = [...data].reverse().slice(0, 50);

    elHistoryTableBody.innerHTML = reversed.map((row, idx) => {
      const ts = row.timestamp ? parseInt(row.timestamp, 10) : null;
      const formattedDate = ts ? new Date(ts * 1000).toLocaleString() : "Unknown";
      const temp = row.temp !== undefined ? `${parseFloat(row.temp).toFixed(1)} °C` : "--";
      const humi = row.humi !== undefined ? `${parseFloat(row.humi).toFixed(1)} %` : "--";
      const light = row.light !== undefined ? `${parseInt(row.light, 10)} lx` : "--";

      // Derived presentation status for row
      let statusBadge = `<span class="badge badge-success">NORMAL</span>`;
      if (row.temp > 33.0) {
        statusBadge = `<span class="badge badge-warning">HIGH TEMP</span>`;
      } else if (row.humi > 75.0) {
        statusBadge = `<span class="badge badge-info">HIGH HUMI</span>`;
      }

      return `
        <tr>
          <td><span class="mono fw-bold text-accent"><i class="fas fa-microchip me-1"></i>${IOT_CONFIG.deviceId}</span></td>
          <td class="mono">${formattedDate}</td>
          <td class="mono text-temp">${temp}</td>
          <td class="mono text-humi">${humi}</td>
          <td class="mono text-light">${light}</td>
          <td>${statusBadge}</td>
        </tr>
      `;
    }).join("");
  }

  // -------------------------------------------------------------
  // Helper UI Features (Pulse flash, Toast, Modals)
  // -------------------------------------------------------------

  function triggerCardFlash() {
    const cards = document.querySelectorAll(".kpi-card");
    cards.forEach(c => {
      c.classList.add("flash-update");
      setTimeout(() => c.classList.remove("flash-update"), 600);
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
  // CSV Export
  // -------------------------------------------------------------
  const btnExportCsv = document.getElementById("btnExportCsv");
  if (btnExportCsv) {
    btnExportCsv.addEventListener("click", () => {
      if (historyData.length === 0) {
        showToast("No data available to export", "warning");
        return;
      }

      let csv = "Device ID,Timestamp (Unix),Datetime (ISO),Temperature (C),Humidity (%),Light (lx)\n";
      historyData.forEach((row) => {
        const ts = row.timestamp || "";
        const dateIso = ts ? new Date(ts * 1000).toISOString() : "";
        csv += `"${IOT_CONFIG.deviceId}","${ts}","${dateIso}","${row.temp ?? ""}","${row.humi ?? ""}","${row.light ?? ""}"\n`;
      });

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `esp32_telemetry_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
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
      btnSendMock.innerHTML = `<i class="fas fa-spinner fa-spin me-2"></i>Sending...`;
      appendSimLog(`[INFO] Sending dual REST request: Temp=${temp}°C, Humi=${humi}%, Light=${light}lx`);

      try {
        const res = await firebaseService.simulateEsp32Upload(temp, humi, light);
        appendSimLog(`[L5] Latest HTTP status = ${res.latestStatus}`);
        appendSimLog(`[L5] History HTTP status = ${res.historyStatus}`);
        showToast("Simulated ESP32 payload uploaded successfully!", "success");
      } catch (err) {
        appendSimLog(`[ERROR] Request failed: ${err.message}`);
        showToast("Simulation error: Check database URL and rules", "error");
      } finally {
        btnSendMock.disabled = false;
        btnSendMock.innerHTML = `<i class="fas fa-paper-plane me-2"></i>Send L5 Payload (PUT + POST)`;
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
    <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'} me-2"></i>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("toast-fade");
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}
