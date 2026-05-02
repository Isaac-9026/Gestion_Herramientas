"use strict";
function formatDate(date) {
  const fecha = new Date(date);
  if (isNaN(fecha)) {
    return "Fecha inválida"; // Si la fecha no es válida
  }
  return fecha.toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

const PrestamosModule = {
  prestamoActual: {
    herramientas: [],
    herramientasDisponibles: [],
    herramientasFiltradas: [],
  },
  async init() {
    this._bindEvents();
    await this.load();
  },

  async load() {
    document.getElementById("bodyPrestamos").innerHTML =
      `<tr><td colspan="7" class="text-center py-5"><div class="spinner-custom"></div></td></tr>`;

    try {
      const { data } = await http("/api/prestamos");
      this.lista = data;
      this._render(this.lista);
    } catch (e) {
      showToast("Error al cargar préstamos: " + e.message, "error");
    }
  },

  //RENDER TABLA PRINCIPAL
  _render(lista) {
    const tbody = document.getElementById("bodyPrestamos");

    document.getElementById("totalPrestamosLabel").innerText =
      `${lista.length} préstamo(s)`;

    if (!lista.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6">
            <div class="empty-state">
              <i class="bi bi-journal-x"></i>
              <p>No hay préstamos registrados</p>
            </div>
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = lista
      .map((p, i) => {
        //para determinar si el prestamo está "ATRASADO"
        const hoy = new Date();
        const limite = new Date(p.fecha_limite);
        let estado = p.estado_prestamo;

        if (estado === "EN_CURSO" && limite < hoy) {
          estado = "ATRASADO";
        }

        const badgeClass =
          estado === "CERRADO"
            ? "bg-success"
            : estado === "ATRASADO"
              ? "bg-danger"
              : "bg-warning";

        return `
          <tr>
            <td>
  <span class="badge bg-secondary" style="font-family: monospace; font-size: 0.9rem;">
    PR-${String(p.id_prestamo).padStart(4, "0")}
  </span>
</td>
            <td>${p.nombres}</td>
            <td>
              <span class="badge bg-info">
                ${p.total_items} ítem(s)
              </span>
            </td>
            <td>
              <div><strong>Prestamo:</strong> ${formatDate(p.fecha_salida)}</div>
              <div>
                <strong>Limite:</strong> ${formatDate(p.fecha_limite)}
              </div>
              <div style="font-size:11px;color:gray">
                por ${p.username}
              </div>
            </td>
            <td>
              <span class="badge ${badgeClass}">
                ${estado}
              </span>
            </td>
            <td>
              <button class="btn-action btn-action-edit"
                onclick="PrestamosModule.openDetalle(${p.id_prestamo})"
                title="Ver detalle">
                <i class="bi bi-eye-fill"></i>
              </button>
              ${
                p.estado_prestamo === "CERRADO"
                  ? `<button class="btn-action btn-action-delete"
                       onclick="PrestamosModule.confirmDel(${p.id_prestamo})"
                       title="Eliminar">
                       <i class="bi bi-trash3-fill"></i>
                     </button>`
                  : ""
              }
            </td>
          </tr>
        `;
      })
      .join("");
  },

  async openNew() {
    this.prestamoActual = { herramientas: [] };

    await this._loadPersonas();
    await this._loadHerramientasDisponibles();

    document.getElementById("listaHerramientas").innerHTML = "";

    openOverlay("modalPrestamo");
  },

  async _loadPersonas() {
    const { data } = await http("/api/personas");

    const sel = document.getElementById("pPersona");
    sel.innerHTML = data
      .map((p) => `<option value="${p.id_persona}">${p.nombres}</option>`)
      .join("");
  },

  async _loadHerramientasDisponibles() {
    const { data } = await http("/api/herramientas");

    const disponibles = data.filter(
      (h) => h.disponible && (h.estado === "BUENO" || h.estado === "REGULAR"),
    );

    this.herramientasDisponibles = disponibles;
    this.herramientasFiltradas = disponibles;

    const sel = document.getElementById("pHerramienta");

    sel.innerHTML = disponibles
      .map(
        (h) =>
          `<option value="${h.id_herramienta}">
        ${h.codigo_inventario} - ${h.producto}
      </option>`,
      )
      .join("");

    this._renderHerramientasDisponibles();
  },
  _filterHerramientasModal() {
    const search = document
      .getElementById("searchHerramientaModal")
      .value.toLowerCase()
      .trim();

    this.herramientasFiltradas = this.herramientasDisponibles.filter(
      (h) =>
        h.codigo_inventario.toLowerCase().includes(search) ||
        h.producto.toLowerCase().includes(search) ||
        h.marca.toLowerCase().includes(search),
    );

    this._renderHerramientasDisponibles();
  },
  _renderHerramientasDisponibles() {
    const sel = document.getElementById("pHerramienta");

    sel.innerHTML = this.herramientasFiltradas
      .map(
        (h) =>
          `<option value="${h.id_herramienta}">
          ${h.codigo_inventario} - ${h.producto}
        </option>`,
      )
      .join("");
  },

  _filter() {
    const search = document
      .getElementById("searchPrestamo")
      .value.toLowerCase()
      .trim();

    const filtrado = this.lista.filter((p) => {

      const folio = `pr-${String(p.id_prestamo).padStart(4, '0')}`;
      const idReal = String(p.id_prestamo);
      let estado = p.estado_prestamo;
      //comprobar si el estado necesita ser actualizado a 'ATRASADO'
      const hoy = new Date();
      const limite = new Date(p.fecha_limite);

      if (estado === "EN_CURSO" && limite < hoy) {
        estado = "ATRASADO";
      }

      return (
        p.nombres.toLowerCase().includes(search) ||
        p.username.toLowerCase().includes(search) ||
        estado.toLowerCase().includes(search) ||
        folio.includes(search) ||
        idReal.includes(search)
      );
    });

    this._render(filtrado);
  },

  _addHerramienta() {
    const select = document.getElementById("pHerramienta");
    const id = select.value;

    // obtener objeto completo desde lista original
    const herramienta = this.herramientasDisponibles.find(
      (h) => h.id_herramienta == id,
    );

    if (!herramienta) return;

    if (this.prestamoActual.herramientas.some((h) => h.id_herramienta == id)) {
      return showToast("Ya agregada", "info");
    }

    this.prestamoActual.herramientas.push(herramienta);

    this._renderLista();
  },

  _renderLista() {
    const ul = document.getElementById("listaHerramientas");

    ul.innerHTML = this.prestamoActual.herramientas
      .map(
        (h) => `
    <li class="list-group-item d-flex justify-content-between align-items-center">
      
      <div>
        <strong>${h.codigo_inventario}</strong>
        <div style="font-size:12px;color:gray">
          ${h.producto} • ${h.marca}
        </div>
      </div>

      <button class="btn-action btn-action-delete"
        onclick="PrestamosModule._removeHerramienta(${h.id_herramienta})">
        <i class="bi bi-x-lg"></i>
      </button>

    </li>
  `,
      )
      .join("");
  },

  _removeHerramienta(id) {
    this.prestamoActual.herramientas = this.prestamoActual.herramientas.filter(
      (h) => h.id_herramienta != id,
    );

    this._renderLista();
  },

  async _savePrestamo() {
    const persona = document.getElementById("pPersona").value;
    const motivo = document.getElementById("pMotivo").value;
    const fecha_limite = document.getElementById("pFechaLimite").value;

    clearErrors(["pFechaLimite"]);

    if (!fecha_limite) {
      setError(
        "pFechaLimite",
        "err-pFechaLimite",
        "La fecha límite es obligatoria",
      );
      return;
    }

    if (!persona) return showToast("Selecciona persona", "error");
    if (!this.prestamoActual.herramientas.length)
      return showToast("Agrega herramientas", "error");

    setLoading(
      "btnSavePrestamo",
      "btnSavePrestamoText",
      "btnSavePrestamoSpinner",
      true,
    );

    try {
      await http("/api/prestamos", "POST", {
        id_persona: persona,
        id_usuario_despachador: 1,
        motivo,
        fecha_limite,
        herramientas: this.prestamoActual.herramientas.map(
          (h) => h.id_herramienta,
        ),
      });

      showToast("Préstamo creado correctamente", "success");

      closeOverlay("modalPrestamo");

      await this.load();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(
        "btnSavePrestamo",
        "btnSavePrestamoText",
        "btnSavePrestamoSpinner",
        false,
      );
    }
  },

  //VER DETALLE DEL PRÉSTAMO
  async openDetalle(id) {
    const tbody = document.getElementById("bodyDetallePrestamo");

    openOverlay("modalDetallePrestamo");

    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4"><div class="spinner-custom"></div></td></tr>`;

    try {
      const { data } = await http(`/api/prestamos/${id}`);

      const { prestamo, detalle } = data;
      const fechaLimpia = new Date(prestamo.fecha_limite).toLocaleString(
        "es-PE",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        },
      );

      // info general arriba
      document.getElementById("detalleInfo").innerHTML = `
        <strong>Persona:</strong> ${prestamo.nombres} <br>
        <strong>Motivo:</strong> ${prestamo.motivo || "—"} <br>
        <strong>Fecha Limite:</strong> ${fechaLimpia}
      `;

      if (!detalle.length) {
        tbody.innerHTML = `
          <tr><td colspan="7">Sin detalles</td></tr>`;
        return;
      }

      tbody.innerHTML = detalle
        .map(
          (d) => `
        <tr>
          <td>${d.codigo_inventario}</td>
          <td>${d.producto}</td>

          <td>
            <span class="badge ${
              d.estado_entrega === "BUENO"
                ? "bg-success"
                : d.estado_entrega === "REGULAR"
                  ? "bg-warning"
                  : "bg-danger"
            }">${d.estado_entrega}</span>
          </td>

          <td>
            ${
              d.fecha_devolucion
                ? `<span class="badge bg-success">Devuelto</span>`
                : `<span class="badge bg-warning">Pendiente</span>`
            }
          </td>

          <td>
  ${
    d.fecha_devolucion
      ? new Date(d.fecha_devolucion).toLocaleString("es-PE", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : "—"
  }
</td>

          <td>
            ${d.observaciones || "—"}
          </td>

          <td>
            ${
              !d.fecha_devolucion
                ? `<button class="btn-action btn-action-edit"
                     onclick="PrestamosModule.openDevolucion(${d.id_detalle_prestamo}, '${d.codigo_inventario}')">
                     <i class="bi bi-box-arrow-down"></i>
                   </button>`
                : `<span class="text-muted">${d.usuario_receptor || "—"}</span>`
            }
          </td>
        </tr>
      `,
        )
        .join("");
    } catch (e) {
      showToast("Error al cargar detalle", "error");
    }
  },

  openDevolucion(id_detalle, codigo) {
    document.getElementById("devIdDetalle").value = id_detalle;
    document.getElementById("devEstado").value = "";
    document.getElementById("devObs").value = "";

    document.getElementById("devolucionInfo").innerHTML =
      `Herramienta: <strong>${codigo}</strong>`;

    clearErrors(["devEstado"]);

    openOverlay("modalDevolucion");
  },

  async _saveDevolucion() {
    const id = document.getElementById("devIdDetalle").value;
    const estado = document.getElementById("devEstado").value;
    const obs = document.getElementById("devObs").value.trim();

    clearErrors(["devEstado"]);

    if (!estado) {
      setError("devEstado", "err-devEstado", "Selecciona un estado");
      return;
    }

    setLoading(
      "btnSaveDevolucion",
      "btnSaveDevText",
      "btnSaveDevSpinner",
      true,
    );

    try {
      await http(`/api/prestamos/devolver/${id}`, "PUT", {
        estado_devolucion: estado,
        observaciones: obs || null,
        id_usuario_receptor: 1,
      });

      showToast("Devolución registrada correctamente", "success");

      closeOverlay("modalDevolucion");
      await this.load();
      closeOverlay("modalDetallePrestamo");
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(
        "btnSaveDevolucion",
        "btnSaveDevText",
        "btnSaveDevSpinner",
        false,
      );
    }
  },

  //ELIMINAR
  confirmDel(id) {
    DeleteModal.open("prestamo", id, "este préstamo", async () => {
      try {
        await http(`/api/prestamos/${id}`, "DELETE");
        showToast("Préstamo eliminado", "success");
        await this.load();
      } catch (e) {
        showToast(e.message, "error");
      }
    });
  },

  //EVENTOS
  _bindEvents() {
    document
      .getElementById("btnRefreshPrestamos")
      ?.addEventListener("click", () => this.load());

    document
      .getElementById("btnCloseDetallePrestamo")
      ?.addEventListener("click", () => closeOverlay("modalDetallePrestamo"));

    document
      .getElementById("btnCloseDetallePrestamoFooter")
      ?.addEventListener("click", () => closeOverlay("modalDetallePrestamo"));

    document
      .getElementById("btnSaveDevolucion")
      ?.addEventListener("click", () => this._saveDevolucion());

    document
      .getElementById("btnCancelDevolucion")
      ?.addEventListener("click", () => closeOverlay("modalDevolucion"));

    document
      .getElementById("btnCloseDevolucion")
      ?.addEventListener("click", () => closeOverlay("modalDevolucion"));

    document
      .getElementById("modalDevolucion")
      ?.addEventListener("click", (e) => {
        if (e.target.id === "modalDevolucion") closeOverlay("modalDevolucion");
      });

    document
      .getElementById("btnNuevoPrestamo")
      ?.addEventListener("click", () => this.openNew());

    document
      .getElementById("btnAddHerramienta")
      ?.addEventListener("click", () => this._addHerramienta());

    document
      .getElementById("btnSavePrestamo")
      ?.addEventListener("click", () => this._savePrestamo());

    document
      .getElementById("btnCancelPrestamo")
      ?.addEventListener("click", () => closeOverlay("modalPrestamo"));

    document
      .getElementById("btnClosePrestamo")
      ?.addEventListener("click", () => closeOverlay("modalPrestamo"));

    document
      .getElementById("searchPrestamo")
      ?.addEventListener("input", () => this._filter());

    document
      .getElementById("searchHerramientaModal")
      ?.addEventListener("input", () => this._filterHerramientasModal());
  },
};
