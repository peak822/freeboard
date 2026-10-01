/**
 * Chart.js Integration for ESP32 IoT Dashboard - Theme Synchronized
 * 
 * Renders high-frequency telemetry history with glowing curves,
 * multi-axis scales, and dynamic Light/Dark theme color palette recalculation.
 */

class TelemetryCharts {
  constructor() {
    this.chart = null;
    this.currentMode = "combined"; // 'combined', 'temp', 'humi', 'light'
    this.currentTheme = "dark";
    this.historyData = [];
  }

  init() {
    const ctx = document.getElementById("telemetryChart");
    if (!ctx) return;

    const chartCtx = ctx.getContext("2d");

    // Glowing gradient fills
    const tempGrad = chartCtx.createLinearGradient(0, 0, 0, 300);
    tempGrad.addColorStop(0, "rgba(255, 51, 85, 0.35)");
    tempGrad.addColorStop(1, "rgba(255, 51, 85, 0.0)");

    const humiGrad = chartCtx.createLinearGradient(0, 0, 0, 300);
    humiGrad.addColorStop(0, "rgba(0, 242, 254, 0.35)");
    humiGrad.addColorStop(1, "rgba(0, 242, 254, 0.0)");

    const lightGrad = chartCtx.createLinearGradient(0, 0, 0, 300);
    lightGrad.addColorStop(0, "rgba(251, 191, 36, 0.35)");
    lightGrad.addColorStop(1, "rgba(251, 191, 36, 0.0)");

    this.gradients = {
      temp: tempGrad,
      humi: humiGrad,
      light: lightGrad
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
                size: 10,
                weight: "700"
              },
              usePointStyle: true,
              pointStyle: "circle",
              padding: 18
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
            bodyFont: { family: "'Plus Jakarta Sans', sans-serif", size: 13 }
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
          yTemp: {
            type: "linear",
            position: "left",
            title: {
              display: true,
              text: "TEMP (°C) / HUMI (%)",
              color: "#94a3b8",
              font: { size: 10, family: "'Silkscreen', monospace" }
            },
            grid: {
              color: "rgba(255, 255, 255, 0.05)",
              drawBorder: false
            },
            ticks: {
              color: "#cbd5e1",
              font: { family: "'JetBrains Mono', monospace", size: 11 }
            },
            suggestedMin: 20,
            suggestedMax: 85
          },
          yLight: {
            type: "linear",
            position: "right",
            title: {
              display: true,
              text: "LIGHT (LX)",
              color: "#fbbf24",
              font: { size: 10, family: "'Silkscreen', monospace" }
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
            suggestedMax: 1000
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

    options.scales.yTemp.grid.color = isLight ? "rgba(15, 23, 42, 0.06)" : "rgba(255, 255, 255, 0.05)";
    options.scales.yTemp.ticks.color = isLight ? "#0f172a" : "#cbd5e1";
    options.scales.yTemp.title.color = isLight ? "#475569" : "#94a3b8";

    options.scales.yLight.ticks.color = isLight ? "#d97706" : "#fbbf24";
    options.scales.yLight.title.color = isLight ? "#d97706" : "#fbbf24";

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
      if (!item.timestamp) return "--:--:--";
      const d = new Date(item.timestamp * 1000);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    });

    const tempData = records.map((item) => (item.temp !== undefined ? item.temp : null));
    const humiData = records.map((item) => (item.humi !== undefined ? item.humi : null));
    const lightData = records.map((item) => (item.light !== undefined ? item.light : null));

    const isLight = this.currentTheme === "light";
    const redstoneColor = isLight ? "#dc2626" : "#ff3355";
    const cyanColor = isLight ? "#0284c7" : "#00f2fe";
    const amberColor = isLight ? "#d97706" : "#fbbf24";

    const allDatasets = [
      {
        id: "temp",
        label: "TEMP (°C)",
        data: tempData,
        borderColor: redstoneColor,
        backgroundColor: this.gradients.temp,
        borderWidth: 2.5,
        tension: 0.35,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: redstoneColor,
        yAxisID: "yTemp"
      },
      {
        id: "humi",
        label: "HUMIDITY (%)",
        data: humiData,
        borderColor: cyanColor,
        backgroundColor: this.gradients.humi,
        borderWidth: 2.5,
        tension: 0.35,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: cyanColor,
        yAxisID: "yTemp"
      },
      {
        id: "light",
        label: "LIGHT (LX)",
        data: lightData,
        borderColor: amberColor,
        backgroundColor: this.gradients.light,
        borderWidth: 2.5,
        tension: 0.35,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: amberColor,
        yAxisID: "yLight"
      }
    ];

    let filtered = allDatasets;
    if (this.currentMode === "temp") {
      filtered = allDatasets.filter((d) => d.id === "temp");
      this.chart.options.scales.yLight.display = false;
      this.chart.options.scales.yTemp.display = true;
      this.chart.options.scales.yTemp.title.text = "TEMP (°C)";
    } else if (this.currentMode === "humi") {
      filtered = allDatasets.filter((d) => d.id === "humi");
      this.chart.options.scales.yLight.display = false;
      this.chart.options.scales.yTemp.display = true;
      this.chart.options.scales.yTemp.title.text = "HUMIDITY (%)";
    } else if (this.currentMode === "light") {
      filtered = allDatasets.filter((d) => d.id === "light");
      this.chart.options.scales.yTemp.display = false;
      this.chart.options.scales.yLight.display = true;
    } else {
      this.chart.options.scales.yTemp.display = true;
      this.chart.options.scales.yLight.display = true;
      this.chart.options.scales.yTemp.title.text = "TEMP (°C) / HUMI (%)";
    }

    this.chart.data.labels = labels;
    this.chart.data.datasets = filtered;
    this.chart.update();
  }
}

// Global instance
const telemetryCharts = new TelemetryCharts();
