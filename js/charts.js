/**
 * Chart.js Integration for ESP32 IoT Dashboard
 * 
 * Renders high-frequency telemetry history with multi-axis support,
 * custom glowing gradients, responsive tooltips, and time-series transformation.
 */

class TelemetryCharts {
  constructor() {
    this.chart = null;
    this.currentMode = "combined"; // 'combined', 'temp', 'humi', 'light'
    this.historyData = [];
  }

  init() {
    const ctx = document.getElementById("telemetryChart");
    if (!ctx) return;

    const chartCtx = ctx.getContext("2d");

    // Create glowing gradient fills
    const tempGrad = chartCtx.createLinearGradient(0, 0, 0, 300);
    tempGrad.addColorStop(0, "rgba(239, 68, 68, 0.35)");
    tempGrad.addColorStop(1, "rgba(239, 68, 68, 0.0)");

    const humiGrad = chartCtx.createLinearGradient(0, 0, 0, 300);
    humiGrad.addColorStop(0, "rgba(6, 182, 212, 0.35)");
    humiGrad.addColorStop(1, "rgba(6, 182, 212, 0.0)");

    const lightGrad = chartCtx.createLinearGradient(0, 0, 0, 300);
    lightGrad.addColorStop(0, "rgba(245, 158, 11, 0.35)");
    lightGrad.addColorStop(1, "rgba(245, 158, 11, 0.0)");

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
          duration: 400,
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
              color: "#94a3b8",
              font: {
                family: "'Plus Jakarta Sans', sans-serif",
                size: 12,
                weight: "500"
              },
              usePointStyle: true,
              pointStyle: "circle",
              padding: 20
            }
          },
          tooltip: {
            backgroundColor: "rgba(15, 23, 42, 0.95)",
            titleColor: "#f8fafc",
            bodyColor: "#cbd5e1",
            borderColor: "rgba(255, 255, 255, 0.1)",
            borderWidth: 1,
            padding: 12,
            boxPadding: 6,
            cornerRadius: 8,
            titleFont: { family: "'JetBrains Mono', monospace", size: 12 },
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
              font: { family: "'JetBrains Mono', monospace", size: 10 },
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
              text: "Temp (°C) / Humi (%)",
              color: "#94a3b8",
              font: { size: 11, family: "'Plus Jakarta Sans', sans-serif" }
            },
            grid: {
              color: "rgba(255, 255, 255, 0.05)",
              drawBorder: false
            },
            ticks: {
              color: "#94a3b8",
              font: { family: "'JetBrains Mono', monospace", size: 10 }
            },
            suggestedMin: 20,
            suggestedMax: 85
          },
          yLight: {
            type: "linear",
            position: "right",
            title: {
              display: true,
              text: "Light (lx)",
              color: "#f59e0b",
              font: { size: 11, family: "'Plus Jakarta Sans', sans-serif" }
            },
            grid: {
              drawOnChartArea: false,
              drawBorder: false
            },
            ticks: {
              color: "#f59e0b",
              font: { family: "'JetBrains Mono', monospace", size: 10 }
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
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    });

    const tempData = records.map((item) => (item.temp !== undefined ? item.temp : null));
    const humiData = records.map((item) => (item.humi !== undefined ? item.humi : null));
    const lightData = records.map((item) => (item.light !== undefined ? item.light : null));

    const allDatasets = [
      {
        id: "temp",
        label: "Temperature (°C)",
        data: tempData,
        borderColor: "#ef4444",
        backgroundColor: this.gradients.temp,
        borderWidth: 2.5,
        tension: 0.35,
        fill: true,
        pointRadius: 2.5,
        pointHoverRadius: 6,
        pointBackgroundColor: "#ef4444",
        yAxisID: "yTemp"
      },
      {
        id: "humi",
        label: "Humidity (%)",
        data: humiData,
        borderColor: "#06b6d4",
        backgroundColor: this.gradients.humi,
        borderWidth: 2.5,
        tension: 0.35,
        fill: true,
        pointRadius: 2.5,
        pointHoverRadius: 6,
        pointBackgroundColor: "#06b6d4",
        yAxisID: "yTemp"
      },
      {
        id: "light",
        label: "Light (lx)",
        data: lightData,
        borderColor: "#f59e0b",
        backgroundColor: this.gradients.light,
        borderWidth: 2.5,
        tension: 0.35,
        fill: true,
        pointRadius: 2.5,
        pointHoverRadius: 6,
        pointBackgroundColor: "#f59e0b",
        yAxisID: "yLight"
      }
    ];

    let filtered = allDatasets;
    if (this.currentMode === "temp") {
      filtered = allDatasets.filter((d) => d.id === "temp");
      this.chart.options.scales.yLight.display = false;
      this.chart.options.scales.yTemp.display = true;
      this.chart.options.scales.yTemp.title.text = "Temperature (°C)";
    } else if (this.currentMode === "humi") {
      filtered = allDatasets.filter((d) => d.id === "humi");
      this.chart.options.scales.yLight.display = false;
      this.chart.options.scales.yTemp.display = true;
      this.chart.options.scales.yTemp.title.text = "Humidity (%)";
    } else if (this.currentMode === "light") {
      filtered = allDatasets.filter((d) => d.id === "light");
      this.chart.options.scales.yTemp.display = false;
      this.chart.options.scales.yLight.display = true;
    } else {
      this.chart.options.scales.yTemp.display = true;
      this.chart.options.scales.yLight.display = true;
      this.chart.options.scales.yTemp.title.text = "Temp (°C) / Humi (%)";
    }

    this.chart.data.labels = labels;
    this.chart.data.datasets = filtered;
    this.chart.update();
  }
}

// Global instance
const telemetryCharts = new TelemetryCharts();
