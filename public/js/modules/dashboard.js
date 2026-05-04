"use strict";

const DashboardModule = {
  herramientas: [],
  prestamos: [],

  async init() {
    this._bindEvents();
    this._initCharts();
    await this.load();
  },

  async load() {
    try {
      const [herramientas, prestamos] = await Promise.all([
        this._safeFetchList("/api/herramientas"),
        this._safeFetchList("/api/prestamos"),
      ]);

      this.herramientas = herramientas;
      this.prestamos = prestamos;

      this._renderAlertas();
      this._renderPrestamosRecientes();
      this._renderCharts();
    } catch (e) {
      showToast("Error al cargar dashboard: " + e.message, "error");
    }
  },

  _initCharts() {
    const ctxHerr = document.getElementById("chartHerramientas");
    const ctxPrest = document.getElementById("chartPrestamos");

    if (!ctxHerr || !ctxPrest) return;

    this.chartHerramientas = new Chart(ctxHerr, {
      type: "doughnut",
      data: {
        labels: ["Disponibles", "Prestadas", "Mal estado"],
        datasets: [
          {
            data: [0, 0, 0],
            backgroundColor: [
              "rgba(16, 185, 129, 0.7)",
              "rgba(245, 158, 11, 0.7)",
              "rgba(239, 68, 68, 0.7)",
            ],
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "bottom" },
        },
      },
    });

    this.chartPrestamos = new Chart(ctxPrest, {
      type: "bar",
      data: {
        labels: ["En curso", "Cerrados", "Atrasados"],
        datasets: [
          {
            label: "Préstamos",
            data: [0, 0, 0],
            backgroundColor: [
              "rgba(245, 158, 11, 0.7)",
              "rgba(16, 185, 129, 0.7)",
              "rgba(239, 68, 68, 0.7)",
            ],
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true },
        },
      },
    });
  },

  _renderCharts() {
    if (!this.chartHerramientas || !this.chartPrestamos) return;

    const total = this.herramientas.length;
    const disponibles = this.herramientas.filter((h) => h.disponible).length;
    const prestadas = total - disponibles;
    const malo = this.herramientas.filter((h) => h.estado === "MALO").length;

    this.chartHerramientas.data.datasets[0].data = [
      disponibles,
      prestadas,
      malo,
    ];
    this.chartHerramientas.update();

    const enCurso = this.prestamos.filter(
      (p) => p.estado_prestamo === "EN_CURSO",
    ).length;

    const cerrados = this.prestamos.filter(
      (p) => p.estado_prestamo === "CERRADO",
    ).length;

    const atrasados = this._getPrestamosAtrasados().length;

    this.chartPrestamos.data.datasets[0].data = [enCurso, cerrados, atrasados];
    this.chartPrestamos.update();
  },

  async _safeFetchList(url) {
    try {
      const res = await http(url);
      return Array.isArray(res.data) ? res.data : [];
    } catch (e) {
      console.error(`Error cargando ${url}:`, e);
      return [];
    }
  },

  _renderAlertas() {
    const atrasados = this._getPrestamosAtrasados();
    const wrap = document.getElementById("dashboardAlertWrap");
    if (!wrap) return;

    if (!atrasados.length) {
      wrap.innerHTML = "";
      return;
    }

    wrap.innerHTML = `
      <div class="alert alert-danger d-flex align-items-center justify-content-between gap-3 mb-4" role="alert">
        <div>
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          Hay <strong>${atrasados.length}</strong> préstamo(s) atrasado(s).
        </div>
        <a href="#" class="btn-link" id="linkIrPrestamosAtrasados">Ver préstamos</a>
      </div>
    `;

    document
      .getElementById("linkIrPrestamosAtrasados")
      ?.addEventListener("click", (e) => {
        e.preventDefault();
        Router.navigateTo("prestamos");
      });
  },

  _getPrestamosAtrasados() {
    const ahora = new Date();

    return this.prestamos.filter((p) => {
      const estado = String(p.estado_prestamo || "").toUpperCase();
      const fechaLimite = p.fecha_limite ? new Date(p.fecha_limite) : null;

      if (estado !== "EN_CURSO") return false;
      if (!fechaLimite || isNaN(fechaLimite.getTime())) return false;

      return fechaLimite < ahora;
    });
  },

  _getEstadoPrestamo(p) {
    const estado = String(p.estado_prestamo || "").toUpperCase();
    const fechaLimite = p.fecha_limite ? new Date(p.fecha_limite) : null;

    if (estado === "EN_CURSO" && fechaLimite && fechaLimite < new Date()) {
      return { text: "ATRASADO", cls: "bg-danger" };
    }

    if (estado === "EN_CURSO") return { text: "EN CURSO", cls: "bg-warning" };
    if (estado === "CERRADO") return { text: "CERRADO", cls: "bg-success" };

    return { text: estado || "—", cls: "bg-secondary" };
  },

  _renderPrestamosRecientes() {
    const tbody = document.getElementById("tablaPrestamosRecientes");
    if (!tbody) return;

    const recientes = [...this.prestamos]
      .sort((a, b) => Number(b.id_prestamo) - Number(a.id_prestamo))
      .slice(0, 5);

    if (!recientes.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6">No hay préstamos registrados</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = recientes
      .map((p) => {
        const estado = this._getEstadoPrestamo(p);

        return `
        <tr>
          <td>${this._escape(p.nombres || "—")}</td>
          <td>${p.total_items || 0}</td>
          <td>${this._formatDate(p.fecha_prestamo)}</td>
          <td>${this._formatDate(p.fecha_limite)}</td>
          <td>${this._formatDate(p.fecha_cierre)}</td>
          <td>
            <span class="badge ${estado.cls}">
              ${estado.text}
            </span>
          </td>
        </tr>
      `;
      })
      .join("");
  },

  _bindEvents() {
    document
      .getElementById("linkVerPrestamos")
      ?.addEventListener("click", (e) => {
        e.preventDefault();
        Router.navigateTo("prestamos");
      });
  },

  _formatDate(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("es-PE");
  },

  _escape(text) {
    return String(text ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  },
};
