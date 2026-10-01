/**
 * Chart.js Integration for ESP32 IoT Dashboard - 6-Sensor Environmental Suite
 * 
 * Renders high-frequency telemetry history with glowing curves,
 * multi-axis scales, and dynamic Light/Dark theme color palette recalculation.
 */

class TelemetryCharts {
  constructor() {
    this.chart = null;
    this.currentMode = "combined"; // 'combined', 'temp', 'humi', 'light', 'press', 'co2', 'noise'
    this.currentTheme = "dark";
    this.historyData = [];
  }

  init() {
    const ctx = document.getElementById("telemetryChart");
    if (!ctx) return;

    const chartCtx = ctx.getContext("2d");

    // Glowing gradient fills for 6 sensors
    const tempGrad = chartCtx.createLinearGradient(0, 0, 0, 300);
    tempGrad.addColorStop(0, "rgba(255, 51, 85, 0.35)");
    tempGrad.addColorStop(1, "rgba(255, 51, 85, 0.0)");

    const humiGrad = chartCtx.createLinearGradient(0, 0, 0, 300);
    humiGrad.addColorStop(0, "rgba(0, 242, 254, 0.35)");
    humiGrad.addColorStop(1, "rgba(0, 242, 254, 0.0)");

    const lightGrad = chartCtx.createLinearGradient(0, 0, 0, 300);
    lightGrad.addColorStop(0, "rgba(251, 191, 36, 0.35)");
    lightGrad.addColorStop(1, "rgba(251, 191, 36, 0.0)");

    const pressGrad = chartCtx.createLinearGradient(0, 0, 0, 300);
    pressGrad.addColorStop(0, "rgba(192, 132, 252, 0.35)");
    pressGrad.addColorStop(1, "rgba(192, 132, 252, 0.0)");

    const co2Grad = chartCtx.createLinearGradient(0, 0, 0, 300);
    co2Grad.addColorStop(0, "rgba(52, 211, 153, 0.35)");
    co2Grad.addColorStop(1, "rgba(52, 211, 153, 0.0)");

    const noiseGrad = chartCtx.createLinearGradient(0, 0, 0, 300);
    noiseGrad.addColorStop(0, "rgba(56, 189, 248, 0.35)");
    noiseGrad.addColorStop(1, "rgba(56, 189, 248, 0.0)");

    this.gradients = {
      temp: tempGrad,
      humi: humiGrad,
      light: lightGrad,
      press: pressGrad,
      co2: co2Grad,
      noise: noiseGrad
    };

    const config = {
      type: "line",
      data: {
        labels: [],
        datasets: []
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 350,
          easing: "easeOutQuart"
        },
        interaction: {
          mode: "index",
          intersect: false
        },
        plugins: {
          legend: {
            display: true,
            position: "top",
            labels: {
              color: "#cbd5e1",
              font: {
                family: "'Silkscreen', monospace",
                size: 9,
                weight: "700"
              },
              usePointStyle: true,
              pointStyle: "circle",
              padding: 12
            }
          },
          tooltip: {
            backgroundColor: "rgba(13, 20, 36, 0.95)",
            titleColor: "#00f2fe",
            bodyColor: "#f8fafc",
            borderColor: "rgba(255, 255, 255, 0.15)",
            borderWidth: 1,
            padding: 12,
            boxPadding: 6,
            cornerRadius: 8,
            titleFont: { family: "'JetBrains Mono', monospace", size: 12, weight: "600" },
            bodyFont: { family: "'Plus Jakarta Sans', sans-serif", size: 12 }
          }
        },
        scales: {
          x: {
            grid: {
              color: "rgba(255, 255, 255, 0.04)",
              drawBorder: false
            },
            ticks: {
              color: "#64748b",
              font: { family: "'JetBrains Mono', monospace", size: 11 },
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 8
            }
          },
          yLeft: {
            type: "linear",
            position: "left",
            title: {
              display: true,
              text: "TEMP / HUMI / NOISE",
              color: "#94a3b8",
              font: { size: 9, family: "'Silkscreen', monospace" }
            },
            grid: {
              color: "rgba(255, 255, 255, 0.05)",
              drawBorder: false
            },
            ticks: {
              color: "#cbd5e1",
              font: { family: "'JetBrains Mono', monospace", size: 11 }
            },
            suggestedMin: 15,
            suggestedMax: 90
          },
          yRight: {
            type: "linear",
            position: "right",
            title: {
              display: true,
              text: "LIGHT / PRESS / CO2",
              color: "#fbbf24",
              font: { size: 9, family: "'Silkscreen', monospace" }
            },
            grid: {
              drawOnChartArea: false,
              drawBorder: false
            },
            ticks: {
              color: "#fbbf24",
              font: { family: "'JetBrains Mono', monospace", size: 11 }
            },
            suggestedMin: 0,
            suggestedMax: 1200
          }
        }
      }
    };

    this.chart = new Chart(chartCtx, config);
    this.updateDatasets();
  }

  setTheme(themeName) {
    this.currentTheme = themeName;
    if (!this.chart) return;

    const isLight = themeName === "light";
    const options = this.chart.options;

    // Legends
    options.plugins.legend.labels.color = isLight ? "#0f172a" : "#cbd5e1";

    // Tooltip
    options.plugins.tooltip.backgroundColor = isLight ? "rgba(255, 255, 255, 0.98)" : "rgba(13, 20, 36, 0.95)";
    options.plugins.tooltip.titleColor = isLight ? "#0284c7" : "#00f2fe";
    options.plugins.tooltip.bodyColor = isLight ? "#0f172a" : "#f8fafc";
    options.plugins.tooltip.borderColor = isLight ? "#cbd5e1" : "rgba(255, 255, 255, 0.15)";

    // Scales
    options.scales.x.grid.color = isLight ? "rgba(15, 23, 42, 0.06)" : "rgba(255, 255, 255, 0.04)";
    options.scales.x.ticks.color = isLight ? "#475569" : "#64748b";

    options.scales.yLeft.grid.color = isLight ? "rgba(15, 23, 42, 0.06)" : "rgba(255, 255, 255, 0.05)";
    options.scales.yLeft.ticks.color = isLight ? "#0f172a" : "#cbd5e1";
    options.scales.yLeft.title.color = isLight ? "#475569" : "#94a3b8";

    options.scales.yRight.ticks.color = isLight ? "#d97706" : "#fbbf24";
    options.scales.yRight.title.color = isLight ? "#d97706" : "#fbbf24";

    this.chart.update();
  }

  setMode(mode) {
    this.currentMode = mode;
    this.updateDatasets();
  }

  updateData(historyArray) {
    this.historyData = historyArray || [];
    this.updateDatasets();
  }

  updateDatasets() {
    if (!this.chart) return;

    // Take latest 30 records for chart visualization
    const records = this.historyData.slice(-30);

    const labels = records.map((item) => {
      if (!item.timestamp || isNaN(item.timestamp)) return "N/A";
      const d = new Date(item.timestamp * 1000);
      try {
        return d.toLocaleTimeString("en-US", { 
          timeZone: IOT_CONFIG.timeZone || "Asia/Bangkok", 
          hour: "2-digit", 
          minute: "2-digit", 
          second: "2-digit", 
          hour12: false 
        });
      } catch (e) {
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
      }
    });

    const tempData = records.map((item) => (item.temp !== undefined && item.temp !== null ? item.temp : null));
    const humiData = records.map((item) => (item.humi !== undefined && item.humi !== null ? item.humi : null));
    const lightData = records.map((item) => (item.light !== undefined && item.light !== null ? item.light : null));
    const pressData = records.map((item) => (item.press !== undefined && item.press !== null ? item.press : null));
    const co2Data = records.map((item) => (item.co2 !== undefined && item.co2 !== null ? item.co2 : null));
    const noiseData = records.map((item) => (item.noise !== undefined && item.noise !== null ? item.noise : null));

    const isLight = this.currentTheme === "light";
    const redstoneColor = isLight ? "#dc2626" : "#ff3355";
    const cyanColor = isLight ? "#0284c7" : "#00f2fe";
    const amberColor = isLight ? "#d97706" : "#fbbf24";
    const purpleColor = isLight ? "#9333ea" : "#c084fc";
    const emeraldColor = isLight ? "#16a34a" : "#34d399";
    const blueColor = isLight ? "#0284c7" : "#38bdf8";

    const allDatasets = [
      {
        id: "temp",
        label: "TEMP (°C)",
        data: tempData,
        borderColor: redstoneColor,
        backgroundColor: this.gradients.temp,
        borderWidth: 2.2,
        tension: 0.35,
        fill: true,
        pointRadius: 2.5,
        pointHoverRadius: 5,
        pointBackgroundColor: redstoneColor,
        yAxisID: "yLeft"
      },
      {
        id: "humi",
        label: "HUMI (%)",
        data: humiData,
        borderColor: cyanColor,
        backgroundColor: this.gradients.humi,
        borderWidth: 2.2,
        tension: 0.35,
        fill: true,
        pointRadius: 2.5,
        pointHoverRadius: 5,
        pointBackgroundColor: cyanColor,
        yAxisID: "yLeft"
      },
      {
        id: "light",
        label: "LIGHT (lx)",
        data: lightData,
        borderColor: amberColor,
        backgroundColor: this.gradients.light,
        borderWidth: 2.2,
        tension: 0.35,
        fill: true,
        pointRadius: 2.5,
        pointHoverRadius: 5,
        pointBackgroundColor: amberColor,
        yAxisID: "yRight"
      },
      {
        id: "press",
        label: "PRESS (hPa)",
        data: pressData,
        borderColor: purpleColor,
        backgroundColor: this.gradients.press,
        borderWidth: 2.2,
        tension: 0.35,
        fill: true,
        pointRadius: 2.5,
        pointHoverRadius: 5,
        pointBackgroundColor: purpleColor,
        yAxisID: "yRight"
      },
      {
        id: "co2",
        label: "CO2 (ppm)",
        data: co2Data,
        borderColor: emeraldColor,
        backgroundColor: this.gradients.co2,
        borderWidth: 2.2,
        tension: 0.35,
        fill: true,
        pointRadius: 2.5,
        pointHoverRadius: 5,
        pointBackgroundColor: emeraldColor,
        yAxisID: "yRight"
      },
      {
        id: "noise",
        label: "NOISE (dB)",
        data: noiseData,
        borderColor: blueColor,
        backgroundColor: this.gradients.noise,
        borderWidth: 2.2,
        tension: 0.35,
        fill: true,
        pointRadius: 2.5,
        pointHoverRadius: 5,
        pointBackgroundColor: blueColor,
        yAxisID: "yLeft"
      }
    ];

    let filtered = allDatasets;
    if (this.currentMode === "temp") {
      filtered = allDatasets.filter((d) => d.id === "temp");
      this.chart.options.scales.yRight.display = false;
      this.chart.options.scales.yLeft.display = true;
      this.chart.options.scales.yLeft.title.text = "TEMP (°C)";
    } else if (this.currentMode === "humi") {
      filtered = allDatasets.filter((d) => d.id === "humi");
      this.chart.options.scales.yRight.display = false;
      this.chart.options.scales.yLeft.display = true;
      this.chart.options.scales.yLeft.title.text = "HUMIDITY (%)";
    } else if (this.currentMode === "light") {
      filtered = allDatasets.filter((d) => d.id === "light");
      this.chart.options.scales.yLeft.display = false;
      this.chart.options.scales.yRight.display = true;
      this.chart.options.scales.yRight.title.text = "LIGHT (LX)";
    } else if (this.currentMode === "press") {
      filtered = allDatasets.filter((d) => d.id === "press");
      this.chart.options.scales.yLeft.display = false;
      this.chart.options.scales.yRight.display = true;
      this.chart.options.scales.yRight.title.text = "AIR PRESSURE (HPA)";
    } else if (this.currentMode === "co2") {
      filtered = allDatasets.filter((d) => d.id === "co2");
      this.chart.options.scales.yLeft.display = false;
      this.chart.options.scales.yRight.display = true;
      this.chart.options.scales.yRight.title.text = "CARBON DIOXIDE (PPM)";
    } else if (this.currentMode === "noise") {
      filtered = allDatasets.filter((d) => d.id === "noise");
      this.chart.options.scales.yRight.display = false;
      this.chart.options.scales.yLeft.display = true;
      this.chart.options.scales.yLeft.title.text = "SOUND NOISE (DB)";
    } else {
      this.chart.options.scales.yLeft.display = true;
      this.chart.options.scales.yRight.display = true;
      this.chart.options.scales.yLeft.title.text = "TEMP / HUMI / NOISE";
      this.chart.options.scales.yRight.title.text = "LIGHT / PRESS / CO2";
    }

    this.chart.data.labels = labels;
    this.chart.data.datasets = filtered;
    this.chart.update();
  }
}

// Global instance
const telemetryCharts = new TelemetryCharts();

