"use strict";

const DashboardModule = {
  herramientas: [],
  prestamos: [],
  productos: [],
  empleados: [],
  proveedores: [],

  async init() {
    this._bindEvents();
    await this.load();
  },

  async load() {
    try {
      const [herramientas, prestamos, productos, empleados, proveedores] =
        await Promise.all([
          this._safeFetchList("/api/herramientas"),
          this._safeFetchList("/api/prestamos"),
          this._safeFetchList("/api/productos"),
          this._safeFetchList("/api/empleados"),
          this._safeFetchList("/api/proveedores"),
        ]);

      this.herramientas = herramientas;
      this.prestamos = prestamos;
      this.productos = productos;
      this.empleados = empleados;
      this.proveedores = proveedores;

      this._renderKpis();
      this._renderAlertas();
      this._renderPrestamosRecientes();
      this._renderDonutHerramientas();
      this._renderCatalogosBase();
    } catch (e) {
      showToast("Error al cargar dashboard: " + e.message, "error");
    }
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

  _renderKpis() {
    const totalHerramientas = this.herramientas.length;
    const disponibles = this.herramientas.filter((h) => !!h.disponible).length;
    const prestadas = totalHerramientas - disponibles;
    const malo = this.herramientas.filter(
      (h) => String(h.estado).toUpperCase() === "MALO",
    ).length;
    const prestamosActivos = this.prestamos.filter(
      (p) => String(p.estado_prestamo).toUpperCase() === "EN_CURSO",
    ).length;
    const atrasados = this._getPrestamosAtrasados().length;

    setText("stat-total-herramientas", totalHerramientas);
    setText("stat-herramientas-disponibles", disponibles);
    setText("stat-herramientas-prestadas", prestadas);
    setText("stat-herramientas-malo", malo);
    setText("stat-prestamos-activos", prestamosActivos);
    setText("stat-prestamos-atrasados", atrasados);
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
          Tienes <strong>${atrasados.length}</strong> préstamo(s) atrasado(s).
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

    if (
      estado === "EN_CURSO" &&
      fechaLimite &&
      !isNaN(fechaLimite.getTime()) &&
      fechaLimite < new Date()
    ) {
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
          <td colspan="6">
            <div class="empty-state">
              <i class="bi bi-journal-x"></i>
              <p>No hay préstamos registrados</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = recientes
      .map((p) => {
        const estado = this._getEstadoPrestamo(p);

        return `
        <tr>
          <td>
            <div class="fw-600">${this._escape(p.nombres || "—")}</div>
          </td>
          <td>
            <span class="badge-garantia">
              ${p.total_items || 0} ítem(s)
            </span>
          </td>
          <td style="white-space:nowrap;font-size:13px">
            ${this._formatDate(p.fecha_prestamo)}
          </td>
          <td style="white-space:nowrap;font-size:13px">
            ${this._formatDate(p.fecha_limite)}
          </td>
          <td style="white-space:nowrap;font-size:13px">
            ${this._formatDate(p.fecha_cierre)}
          </td>
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

  _renderDonutHerramientas() {
    const donut = document.getElementById("chartHerramientasDonut");
    const legend = document.getElementById("legendHerramientas");
    if (!donut || !legend) return;

    const total = this.herramientas.length;
    const disponibles = this.herramientas.filter((h) => !!h.disponible).length;
    const prestadas = total - disponibles;
    const malo = this.herramientas.filter(
      (h) => String(h.estado).toUpperCase() === "MALO",
    ).length;

    const disponiblesPct = total ? (disponibles / total) * 100 : 0;
    const prestadasPct = total ? (prestadas / total) * 100 : 0;
    const maloPct = total ? (malo / total) * 100 : 0;

    donut.innerHTML = `
      <div style="
        width:180px;
        height:180px;
        border-radius:50%;
        background: conic-gradient(
          var(--primary) 0 ${disponiblesPct}%,
          #f59e0b ${disponiblesPct}% ${disponiblesPct + prestadasPct}%,
          #ef4444 ${disponiblesPct + prestadasPct}% 100%
        );
        display:flex;
        align-items:center;
        justify-content:center;
        box-shadow: 0 0 0 10px rgba(255,255,255,.04) inset;
      ">
        <div style="
          width:112px;
          height:112px;
          border-radius:50%;
          background: var(--surface);
          display:flex;
          align-items:center;
          justify-content:center;
          flex-direction:column;
          text-align:center;
        ">
          <div style="font-size:22px;font-weight:700;line-height:1">${total}</div>
          <div style="font-size:11px;color:var(--text-muted)">herramientas</div>
        </div>
      </div>
    `;

    legend.innerHTML = `
      <div class="d-flex flex-column gap-2 mt-2">
        <div class="d-flex justify-content-between align-items-center">
          <span class="text-muted text-sm">
            <span class="me-2" style="display:inline-block;width:10px;height:10px;border-radius:999px;background:var(--primary)"></span>
            Disponibles
          </span>
          <strong>${disponibles} (${disponiblesPct.toFixed(0)}%)</strong>
        </div>
        <div class="d-flex justify-content-between align-items-center">
          <span class="text-muted text-sm">
            <span class="me-2" style="display:inline-block;width:10px;height:10px;border-radius:999px;background:#f59e0b"></span>
            Prestadas
          </span>
          <strong>${prestadas} (${prestadasPct.toFixed(0)}%)</strong>
        </div>
        <div class="d-flex justify-content-between align-items-center">
          <span class="text-muted text-sm">
            <span class="me-2" style="display:inline-block;width:10px;height:10px;border-radius:999px;background:#ef4444"></span>
            En mal estado
          </span>
          <strong>${malo} (${maloPct.toFixed(0)}%)</strong>
        </div>
      </div>
    `;
  },

  _renderCatalogosBase() {
    const el = document.getElementById("catalogosBase");
    if (!el) return;

    const empleadosActivos = this.empleados.filter(
      (p) => String(p.estado || "").toUpperCase() === "ACTIVO",
    ).length;

    el.innerHTML = `
      <div class="d-flex flex-column gap-3 p-2">
        <div class="d-flex justify-content-between align-items-center">
          <span class="text-muted">Productos</span>
          <span class="fw-600">${this.productos.length}</span>
        </div>
        <div class="d-flex justify-content-between align-items-center">
          <span class="text-muted">Personal activo</span>
          <span class="fw-600">${empleadosActivos}</span>
        </div>
        <div class="d-flex justify-content-between align-items-center">
          <span class="text-muted">Proveedores</span>
          <span class="fw-600">${this.proveedores.length}</span>
        </div>
      </div>
    `;
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
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  },
};
