"use strict";

const PrestamosModule = {

  async init() {
    this._bindEvents();
    await this.load();
  },

  async load() {
    document.getElementById("bodyPrestamos").innerHTML =
      `<tr><td colspan="7" class="text-center py-5"><div class="spinner-custom"></div></td></tr>`;

    try {
      const res = await fetch("/api/prestamos");
      const data = await res.json();

      this.lista = data.data;
      this._render(this.lista);

    } catch (e) {
      console.error(e);
    }
  },

  _render(lista) {
    const tbody = document.getElementById("bodyPrestamos");

    document.getElementById("totalPrestamosLabel").innerText =
      `${lista.length} préstamo(s)`;

    if (!lista.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="empty-state">
              <i class="bi bi-box-arrow-in-right"></i>
              <p>No hay préstamos registrados</p>
            </div>
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = lista.map((p, i) => `
      <tr>
        <td>${String(i + 1).padStart(2, "0")}</td>

        <td>
          <strong>${p.nombres}</strong>
        </td>

        <td>${p.username}</td>

        <td>${p.motivo || '<span class="text-muted">—</span>'}</td>

        <td style="font-size:13px">
          ${new Date(p.fecha_prestamo).toLocaleDateString()}
        </td>

        <td>
          <span class="badge ${
            p.estado_prestamo === "EN_CURSO"
              ? "bg-warning"
              : "bg-success"
          }">
            ${p.estado_prestamo}
          </span>
        </td>

        <td>
          <button class="btn-action btn-action-edit"
            onclick="PrestamosModule.openDetalle(${p.id_prestamo})"
            title="Ver detalle">
            <i class="bi bi-eye-fill"></i>
          </button>

          <button class="btn-action btn-action-delete"
            onclick="PrestamosModule.delete(${p.id_prestamo})"
            title="Eliminar">
            <i class="bi bi-trash3-fill"></i>
          </button>
        </td>
      </tr>
    `).join("");
  },

  _filter() {
    const search = document
      .getElementById("searchPrestamo")
      .value.toLowerCase();

    const filtrado = this.lista.filter(p =>
      p.nombres.toLowerCase().includes(search) ||
      p.username.toLowerCase().includes(search) ||
      (p.estado_prestamo || "").toLowerCase().includes(search)
    );

    this._render(filtrado);
  },

  async openDetalle(id) {
    document.getElementById("bodyDetallePrestamo").innerHTML =
      `<tr><td colspan="5" class="text-center py-4"><div class="spinner-custom"></div></td></tr>`;

    try {
      const res = await fetch(`/api/prestamos/${id}`);
      const data = await res.json();

      const { prestamo, detalle } = data.data;

      document.getElementById("detallePrestamoInfo").innerText =
        `${prestamo.motivo || "Sin motivo"} - ${new Date(prestamo.fecha_prestamo).toLocaleDateString()}`;

      this._renderDetalle(detalle);

      openOverlay("modalDetallePrestamo");

    } catch (e) {
      console.error(e);
    }
  },

  _renderDetalle(lista) {
    const tbody = document.getElementById("bodyDetallePrestamo");

    if (!lista.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5">Sin herramientas</td>
        </tr>`;
      return;
    }

    tbody.innerHTML = lista.map((d, i) => `
      <tr>
        <td>${i + 1}</td>

        <td>
          <strong>${d.nombre}</strong><br>
          <span style="font-size:12px;color:gray">
            ${d.codigo_inventario}
          </span>
        </td>

        <td>
          <span class="badge bg-info">
            ${d.estado_entrega}
          </span>
        </td>

        <td>
          ${
            d.estado_devolucion
              ? `<span class="badge bg-success">${d.estado_devolucion}</span>`
              : `<span class="badge bg-warning">Pendiente</span>`
          }
        </td>

        <td>
          ${
            !d.estado_devolucion
              ? `<button class="btn-action btn-action-edit"
                  onclick="PrestamosModule.openDevolver(${d.id_detalle_prestamo})">
                  <i class="bi bi-check-lg"></i>
                </button>`
              : `<span class="text-muted">Devuelto</span>`
          }
        </td>
      </tr>
    `).join("");
  },

  async openDevolver(id_detalle) {
    const confirmar = confirm("¿Registrar devolución?");

    if (!confirmar) return;

    try {
      const res = await fetch(`/api/prestamos/devolver/${id_detalle}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado_devolucion: "BUENO",
          observaciones: null,
          id_usuario_receptor: 1 // temporal
        })
      });

      const data = await res.json();

      if (!data.success) throw new Error(data.message);

      alert("Devolución registrada");

      await this.load();
      closeOverlay("modalDetallePrestamo");

    } catch (e) {
      alert("Error: " + e.message);
    }
  },


  async delete(id) {
    const confirmar = confirm("¿Eliminar préstamo?");

    if (!confirmar) return;

    try {
      const res = await fetch(`/api/prestamos/${id}`, {
        method: "DELETE"
      });

      const data = await res.json();

      if (!data.success) throw new Error(data.message);

      alert("Préstamo eliminado");

      await this.load();

    } catch (e) {
      alert("Error: " + e.message);
    }
  },

  _bindEvents() {
    document.getElementById("btnRefreshPrestamos")
      ?.addEventListener("click", () => this.load());

    document.getElementById("searchPrestamo")
      ?.addEventListener("input", () => this._filter());

    document.getElementById("btnCloseDetallePrestamo")
      ?.addEventListener("click", () => closeOverlay("modalDetallePrestamo"));

    document.getElementById("btnCloseDetallePrestamoFooter")
      ?.addEventListener("click", () => closeOverlay("modalDetallePrestamo"));

    document.getElementById("modalDetallePrestamo")
      ?.addEventListener("click", e => {
        if (e.target.id === "modalDetallePrestamo")
          closeOverlay("modalDetallePrestamo");
      });
  }
};