"use strict";

const HerramientasModule = {
  lista: [],
  productos: [],
  ubicaciones: [],
  currentProductoId: null,

  async init() {
    this._bindEvents();
    await this._loadCatalogs();
    await this.load();
  },

  async _loadCatalogs() {
    try {
      const [prodRes, ubiRes] = await Promise.all([
        fetch("/api/productos"),
        fetch("/api/ubicaciones"),
      ]);

      const prodData = await prodRes.json();
      const ubiData = await ubiRes.json();

      this.productos = prodData.data || [];
      this.ubicaciones = ubiData.data || [];
    } catch (e) {
      console.error("Error cargando catálogos:", e);
    }
  },

  async openPrestar(id) {
    try {
      const herramienta = this.lista.find((h) => h.id_herramienta == id);

      document.getElementById("prestamoHerramientaId").value = id;
      document.getElementById("prestamoToolInfo").innerText =
        `${herramienta.producto} (${herramienta.codigo_inventario})`;

      await this._loadPersonas();

      openOverlay("modalPrestarOverlay");
    } catch (e) {
      console.error(e);
    }
  },

  async _loadPersonas() {
    try {
      const res = await fetch("/api/personas");
      const data = await res.json();

      const select = document.getElementById("prestamoPersona");

      select.innerHTML =
        `<option value="">Seleccionar persona</option>` +
        data.data
          .map(
            (p) =>
              `<option value="${p.id_persona}">
          ${p.nombres}
        </option>`,
          )
          .join("");
    } catch (e) {
      console.error(e);
    }
  },

  async savePrestamo() {
    const id_herramienta = document.getElementById(
      "prestamoHerramientaId",
    ).value;
    const id_persona = document.getElementById("prestamoPersona").value;
    const motivo = document.getElementById("prestamoMotivo").value;

    if (!id_persona) {
      alert("Selecciona una persona");
      return;
    }

    try {
      const res = await fetch("/api/prestamos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_persona,
          id_usuario_despachador: 1,
          motivo,
          herramientas: [id_herramienta],
        }),
      });

      const data = await res.json();

      if (!data.success) throw new Error(data.message);

      closeOverlay("modalPrestarOverlay");

      await this.load();

      alert("Préstamo registrado correctamente");
    } catch (e) {
      alert("Error: " + e.message);
    }
  },
  _fillProductos(selected = "") {
    const sel = document.getElementById("hProducto");
    if (!sel) return;

    sel.innerHTML =
      `<option value="">— Seleccionar producto —</option>` +
      this.productos
        .map((p) => {
          const label = `${p.nombre}${p.modelo ? " - " + p.modelo : ""}`;
          return `<option value="${p.id_producto}" ${
            String(p.id_producto) === String(selected) ? "selected" : ""
          }>${label}</option>`;
        })
        .join("");
  },

  _fillUbicaciones(selected = "") {
    const sel = document.getElementById("hUbicacion");
    if (!sel) return;

    sel.innerHTML =
      `<option value="">— Sin ubicación —</option>` +
      this.ubicaciones
        .map(
          (u) => `
          <option value="${u.id_ubicacion}" ${
            String(u.id_ubicacion) === String(selected) ? "selected" : ""
          }>
            ${u.nombre}
          </option>`,
        )
        .join("");
  },

  async load() {
    document.getElementById("bodyHerramientas").innerHTML =
      `<tr><td colspan="7" class="text-center py-5"><div class="spinner-custom"></div></td></tr>`;

    try {
      const res = await fetch("/api/herramientas");
      const data = await res.json();

      this.lista = data.data || [];
      this._render(this.lista);
    } catch (e) {
      console.error(e);
      document.getElementById("bodyHerramientas").innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-5 text-danger">
            Error al cargar herramientas
          </td>
        </tr>`;
    }
  },

  _render(lista) {
    const tbody = document.getElementById("bodyHerramientas");
    document.getElementById("totalHerramientasLabel").innerText =
      `${lista.length} herramienta(s)`;

    if (!lista.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="empty-state">
              <i class="bi bi-tools"></i>
              <p>No hay herramientas registradas</p>
            </div>
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = lista
      .map(
        (h, i) => `
        <tr>
          <td>${String(i + 1).padStart(2, "0")}</td>

          <td>
            <strong>${h.codigo_inventario}</strong>
            <div style="font-size:12px;color:gray">
              ${h.numero_serie || "Sin serie"}
            </div>
          </td>

          <td>
            <div><strong>${h.producto || "—"}</strong></div>
            <div style="font-size:12px;color:gray">
              ${h.marca || "—"} • ${h.categoria || "—"}
            </div>
          </td>

          <td>
            <span class="badge ${
              h.estado === "BUENO"
                ? "bg-success"
                : h.estado === "REGULAR"
                  ? "bg-warning"
                  : "bg-danger"
            }">
              ${h.estado}
            </span>
          </td>

          <td>
            ${
              h.ubicacion
                ? h.ubicacion
                : '<span class="text-muted">Sin ubicación</span>'
            }
          </td>

          <td>
            <span class="badge ${h.disponible ? "bg-success" : "bg-danger"}">
              ${h.disponible ? "Disponible" : "Prestado"}
            </span>
          </td>

          <td>
            <button class="btn-action btn-action-edit" title="Editar"
              onclick="HerramientasModule.openEdit(${h.id_herramienta})">
              <i class="bi bi-pencil-fill"></i>
            </button>

            <button class="btn-action btn-action-delete" title="Eliminar"
              onclick="HerramientasModule.confirmDel(${h.id_herramienta}, '${(h.codigo_inventario || "").replace(/'/g, "\\'")}')">
              <i class="bi bi-trash3-fill"></i>
            </button>

             ${
               h.disponible
                 ? `<button class="btn-action btn-action-edit"
           onclick="HerramientasModule.openPrestar(${h.id_herramienta})">
           <i class="bi bi-box-arrow-up"></i>
         </button>`
                 : `<span class="text-muted">En uso</span>`
             }
          </td>
        </tr>
      `,
      )
      .join("");
  },

  _openModal(mode, herramienta = null) {
    const isEdit = mode === "edit";

    document.getElementById("modalHerramientaTitle").innerText = isEdit
      ? "Editar Herramienta"
      : "Nueva Herramienta";

    document.getElementById("modalHerramientaSubtitle").innerText = isEdit
      ? "Modifica los campos permitidos"
      : "Completa los campos del formulario";

    document.getElementById("herramientaId").value = isEdit
      ? herramienta.id_herramienta
      : "";
    document.getElementById("hCodigo").value = isEdit
      ? herramienta.codigo_inventario || ""
      : "";
    document.getElementById("hSerie").value = isEdit
      ? herramienta.numero_serie || ""
      : "";
    document.getElementById("hEstado").value = isEdit
      ? herramienta.estado || "BUENO"
      : "BUENO";

    const wrapSelect = document.getElementById("wrapProductoSelect");
    const wrapText = document.getElementById("wrapProductoText");
    const txtProducto = document.getElementById("hProductoText");

    if (isEdit) {
      this.currentProductoId = herramienta.id_producto || null;

      wrapSelect.classList.add("d-none");
      wrapText.classList.remove("d-none");

      txtProducto.value = herramienta.producto
        ? `${herramienta.producto}${herramienta.marca ? " - " + herramienta.marca : ""}`
        : "Producto no disponible";
    } else {
      this.currentProductoId = null;

      wrapSelect.classList.remove("d-none");
      wrapText.classList.add("d-none");

      this._fillProductos();
    }

    this._fillUbicaciones(isEdit ? herramienta.id_ubicacion : "");

    openOverlay("modalHerramientaOverlay");
  },

  openNew() {
    this._openModal("new");
  },

  async openEdit(id) {
    try {
      const current = this.lista.find(
        (h) => String(h.id_herramienta) === String(id),
      );

      const res = await fetch(`/api/herramientas/${id}`);
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || "No se pudo cargar la herramienta");
      }

      const herramienta = data.data;

      this._openModal("edit", {
        ...herramienta,
        // esto ayuda a mostrar el texto bonito en el modal
        producto: current?.producto || "Producto",
        marca: current?.marca || "",
        categoria: current?.categoria || "",
      });
    } catch (e) {
      console.error(e);
      alert("No se pudo cargar la herramienta");
    }
  },

  async _save() {
    const id = document.getElementById("herramientaId").value;
    const isEdit = !!id;

    const codigo = document.getElementById("hCodigo").value.trim();
    const serie = document.getElementById("hSerie").value.trim();
    const estado = document.getElementById("hEstado").value;
    const idUbicacion = document.getElementById("hUbicacion").value || null;

    let idProducto = null;
    if (isEdit) {
      idProducto = this.currentProductoId;
    } else {
      idProducto = document.getElementById("hProducto").value;
    }

    if (!codigo) {
      alert("El código de inventario es obligatorio");
      return;
    }

    if (!idProducto) {
      alert("Debes seleccionar un producto");
      return;
    }

    const body = {
      codigo_inventario: codigo,
      numero_serie: serie || null,
      id_producto: idProducto,
      estado: estado || "BUENO",
      id_ubicacion: idUbicacion,
    };

    try {
      const res = await fetch(
        isEdit ? `/api/herramientas/${id}` : "/api/herramientas",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.message || "No se pudo guardar la herramienta");
      }

      closeOverlay("modalHerramientaOverlay");
      await this.load();
    } catch (e) {
      console.error(e);
      alert(e.message || "Error al guardar");
    }
  },

  confirmDel(id, name) {
    DeleteModal.open("herramienta", id, name, async () => {
      try {
        const res = await fetch(`/api/herramientas/${id}`, {
          method: "DELETE",
        });

        const json = await res.json();

        if (!json.success) {
          throw new Error(json.message || "No se pudo eliminar");
        }

        await this.load();
      } catch (e) {
        alert(e.message);
      }
    });
  },

  _filter() {
    const search = document
      .getElementById("searchHerramienta")
      .value.toLowerCase();

    const filtrado = this.lista.filter(
      (h) =>
        h.codigo_inventario.toLowerCase().includes(search) ||
        (h.numero_serie || "").toLowerCase().includes(search) ||
        (h.producto || "").toLowerCase().includes(search) ||
        (h.marca || "").toLowerCase().includes(search) ||
        (h.categoria || "").toLowerCase().includes(search) ||
        (h.ubicacion || "").toLowerCase().includes(search) ||
        h.estado.toLowerCase().includes(search),
    );

    this._render(filtrado);
  },

  _bindEvents() {
    document
      .getElementById("btnNuevaHerramienta")
      ?.addEventListener("click", () => this.openNew());

    document
      .getElementById("btnSaveHerramienta")
      ?.addEventListener("click", () => this._save());

    document
      .getElementById("btnCancelHerramienta")
      ?.addEventListener("click", () =>
        closeOverlay("modalHerramientaOverlay"),
      );

    document
      .getElementById("btnCloseModalHerramienta")
      ?.addEventListener("click", () =>
        closeOverlay("modalHerramientaOverlay"),
      );

    document
      .getElementById("btnRefreshHerramientas")
      ?.addEventListener("click", () => this.load());

    document
      .getElementById("searchHerramienta")
      ?.addEventListener("input", () => this._filter());

    document
      .getElementById("modalHerramientaOverlay")
      ?.addEventListener("click", (e) => {
        if (e.target.id === "modalHerramientaOverlay") {
          closeOverlay("modalHerramientaOverlay");
        }
      });

    document
      .getElementById("btnSavePrestar")
      ?.addEventListener("click", () => this.savePrestamo());

    document
      .getElementById("btnCancelPrestar")
      ?.addEventListener("click", () => closeOverlay("modalPrestarOverlay"));

    document
      .getElementById("btnClosePrestar")
      ?.addEventListener("click", () => closeOverlay("modalPrestarOverlay"));

    document
      .getElementById("modalPrestarOverlay")
      ?.addEventListener("click", (e) => {
        if (e.target.id === "modalPrestarOverlay")
          closeOverlay("modalPrestarOverlay");
      });
  },
};
