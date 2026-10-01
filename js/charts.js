/**
 * Chart.js Integration for ESP32 IoT Dashboard - Minecraft Pixel Edition
 * 
 * Renders retro 8-bit telemetry curves with square pixel markers,
 * pixel fonts (Press Start 2P, Silkscreen, VT323), and Minecraft color accents.
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

    // Pixel gradient fills
    const tempGrad = chartCtx.createLinearGradient(0, 0, 0, 300);
    tempGrad.addColorStop(0, "rgba(255, 51, 51, 0.3)");
    tempGrad.addColorStop(1, "rgba(255, 51, 51, 0.0)");

    const humiGrad = chartCtx.createLinearGradient(0, 0, 0, 300);
    humiGrad.addColorStop(0, "rgba(56, 189, 248, 0.3)");
    humiGrad.addColorStop(1, "rgba(56, 189, 248, 0.0)");

    const lightGrad = chartCtx.createLinearGradient(0, 0, 0, 300);
    lightGrad.addColorStop(0, "rgba(255, 170, 0, 0.3)");
    lightGrad.addColorStop(1, "rgba(255, 170, 0, 0.0)");

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
          duration: 300,
          easing: "linear"
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
              color: "#ffff55",
              font: {
                family: "'Press Start 2P', monospace",
                size: 9
              },
              usePointStyle: true,
              pointStyle: "rect",
              padding: 16
            }
          },
          tooltip: {
            backgroundColor: "#181818",
            titleColor: "#ffff55",
            bodyColor: "#ffffff",
            borderColor: "#3a3a3a",
            borderWidth: 2,
            padding: 10,
            boxPadding: 4,
            cornerRadius: 0,
            titleFont: { family: "'Press Start 2P', monospace", size: 10 },
            bodyFont: { family: "'Silkscreen', monospace", size: 11 }
          }
        },
        scales: {
          x: {
            grid: {
              color: "rgba(255, 255, 255, 0.06)",
              drawBorder: false
            },
            ticks: {
              color: "#aaaaaa",
              font: { family: "'VT323', monospace", size: 14 },
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
              color: "#aaaaaa",
              font: { size: 9, family: "'Press Start 2P', monospace" }
            },
            grid: {
              color: "rgba(255, 255, 255, 0.06)",
              drawBorder: false
            },
            ticks: {
              color: "#ffffff",
              font: { family: "'VT323', monospace", size: 14 }
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
              color: "#ffaa00",
              font: { size: 9, family: "'Press Start 2P', monospace" }
            },
            grid: {
              drawOnChartArea: false,
              drawBorder: false
            },
            ticks: {
              color: "#ffaa00",
              font: { family: "'VT323', monospace", size: 14 }
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
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    });

    const tempData = records.map((item) => (item.temp !== undefined ? item.temp : null));
    const humiData = records.map((item) => (item.humi !== undefined ? item.humi : null));
    const lightData = records.map((item) => (item.light !== undefined ? item.light : null));

    const allDatasets = [
      {
        id: "temp",
        label: "TEMP (°C)",
        data: tempData,
        borderColor: "#ff3333",
        backgroundColor: this.gradients.temp,
        borderWidth: 2,
        tension: 0.1,
        fill: true,
        pointStyle: "rect",
        pointRadius: 4,
        pointHoverRadius: 7,
        pointBackgroundColor: "#ff3333",
        yAxisID: "yTemp"
      },
      {
        id: "humi",
        label: "HUMI (%)",
        data: humiData,
        borderColor: "#38bdf8",
        backgroundColor: this.gradients.humi,
        borderWidth: 2,
        tension: 0.1,
        fill: true,
        pointStyle: "rect",
        pointRadius: 4,
        pointHoverRadius: 7,
        pointBackgroundColor: "#38bdf8",
        yAxisID: "yTemp"
      },
      {
        id: "light",
        label: "LIGHT (LX)",
        data: lightData,
        borderColor: "#ffaa00",
        backgroundColor: this.gradients.light,
        borderWidth: 2,
        tension: 0.1,
        fill: true,
        pointStyle: "rect",
        pointRadius: 4,
        pointHoverRadius: 7,
        pointBackgroundColor: "#ffaa00",
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
