"use strict";

const PersonalModule = {
  lista: [],
  areas: [],

  async init() {
    this._bindEvents();
    await this._loadAreas();
    await this.load();
  },

  async _loadAreas() {
    try {
      const res = await fetch("/api/areas");
      const data = await res.json();
      this.areas = data.data || [];
      this._fillAreas();
    } catch (e) {
      console.error("Error cargando áreas:", e);
      this.areas = [];
    }
  },

  _fillAreas(selected = "") {
    const select = document.getElementById("pArea");
    if (!select) return;

    select.innerHTML =
      `<option value="">— Seleccionar área —</option>` +
      this.areas
        .map(
          (a) => `
            <option value="${a.id_area}" ${String(a.id_area) === String(selected) ? "selected" : ""}>
              ${a.nombre}
            </option>
          `,
        )
        .join("");
  },

  async load() {
    document.getElementById("bodyPersonal").innerHTML =
      `<tr><td colspan="7" class="text-center py-5"><div class="spinner-custom"></div></td></tr>`;

    try {
      const res = await fetch("/api/empleados");
      const data = await res.json();

      this.lista = data.data || [];
      this._render(this.lista);
    } catch (e) {
      console.error(e);
      document.getElementById("bodyPersonal").innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-5 text-danger">
            Error al cargar personal
          </td>
        </tr>`;
    }
  },

  _render(lista) {
    const tbody = document.getElementById("bodyPersonal");

    document.getElementById("totalPersonalLabel").innerText =
      `${lista.length} registro(s)`;

    if (!lista.length) {
      tbody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-state">
            <i class="bi bi-people"></i>
            <p>No hay personal registrado</p>
          </div>
        </td>
      </tr>`;
      return;
    }

    tbody.innerHTML = lista
      .map(
        (p, i) => `
    <tr>
      <!-- NUMERO -->
      <td>
        <span style="font-family:'DM Mono', monospace; font-size:12px; color:var(--text-muted)">
          ${String(i + 1).padStart(2, "0")}
        </span>
      </td>

      <!-- DNI -->
      <td>
        <span class="fw-600">${p.dni}</span>
      </td>

      <!-- EMPLEADO -->
      <td style="max-width:260px">
        <div class="fw-600">${this._escape(p.nombres)}</div>
        <div style="font-size:12px; color:gray">
          ${p.direccion ? this._escape(p.direccion) : "Sin dirección"}
        </div>
      </td>

      <!-- AREA -->
      <td>
        <span class="badge-garantia">
          <i class="bi bi-diagram-3-fill me-1"></i>
          ${this._escape(p.area || "—")}
        </span>
      </td>

      <!-- CONTACTO -->
      <td>
        ${
          p.telefono
            ? `<span class="fw-500">${this._escape(p.telefono)}</span>`
            : `<span class="text-muted">—</span>`
        }
      </td>

      <!-- ESTADO -->
      <td>
        <span class="badge ${
          p.estado === "ACTIVO" ? "bg-success" : "bg-secondary"
        }">
          ${p.estado}
        </span>
      </td>

      <!-- ACCIONES -->
      <td style="white-space:nowrap">

        <button 
          class="btn-action btn-action-edit"
          onclick="PersonalModule.openEdit(${p.id_persona})"
          title="Editar"
        >
          <i class="bi bi-pencil-fill"></i>
        </button>

        ${
          p.estado === "ACTIVO"
            ? `
        <button 
          class="btn-action btn-action-delete"
          onclick="PersonalModule.confirmDel(${p.id_persona}, '${this._escapeAttr(p.nombres)}')"
          title="Inactivar"
        >
          <i class="bi bi-slash-circle-fill"></i>
        </button>
        `
            : `
        <span style="font-size: 12px; color: #999; margin-left: 8px;">
          <i class="bi bi-lock-fill"></i> Bloqueado
        </span>
        `
        }

      </td>
    </tr>
  `,
      )
      .join("");
  },

  _openModal(mode, persona = null) {
    const isEdit = mode === "edit";

    document.getElementById("modalPersonalTitle").innerText = isEdit
      ? "Editar Personal"
      : "Nuevo Personal";

    document.getElementById("modalPersonalSubtitle").innerText = isEdit
      ? "Modifica los datos del personal"
      : "Completa los datos para registrar personal";

    document.getElementById("personalId").value = isEdit
      ? persona.id_persona
      : "";
    document.getElementById("pDni").value = isEdit ? persona.dni || "" : "";
    document.getElementById("pNombres").value = isEdit
      ? persona.nombres || ""
      : "";
    document.getElementById("pTelefono").value = isEdit
      ? persona.telefono || ""
      : "";
    document.getElementById("pDireccion").value = isEdit
      ? persona.direccion || ""
      : "";
    document.getElementById("pEstado").value = isEdit
      ? persona.estado || "ACTIVO"
      : "ACTIVO";

    this._fillAreas(isEdit ? persona.id_area : "");

    clearErrors(["pDni", "pNombres", "pArea"]);
    openOverlay("modalPersonalOverlay");
  },

  openNew() {
    this._openModal("new");
  },

  async openEdit(id) {
    const persona = this.lista.find((p) => String(p.id_persona) === String(id));
    if (!persona) {
      showToast("Registro no encontrado", "error");
      return;
    }

    this._openModal("edit", persona);
  },

  async _save() {
    const id = document.getElementById("personalId").value;
    const isEdit = !!id;

    const dni = document.getElementById("pDni").value.trim();
    const nombres = document.getElementById("pNombres").value.trim();
    const telefono = document.getElementById("pTelefono").value.trim();
    const direccion = document.getElementById("pDireccion").value.trim();
    const id_area = document.getElementById("pArea").value;
    const estado = document.getElementById("pEstado").value;

    clearErrors(["pDni", "pNombres", "pArea"]);

    let ok = true;

    if (!dni) {
      setError("pDni", "err-pDni", "El DNI es obligatorio");
      ok = false;
    } else if (!/^\d+$/.test(dni)) {
      setError("pDni", "err-pDni", "El DNI solo debe contener números");
      ok = false;
    }

    if (!nombres) {
      setError("pNombres", "err-pNombres", "Los nombres son obligatorios");
      ok = false;
    }

    if (!id_area) {
      setError("pArea", "err-pArea", "Selecciona un área");
      ok = false;
    }

    if (!ok) return;

    const body = {
      dni,
      nombres,
      telefono: telefono || null,
      direccion: direccion || null,
      id_area,
      estado,
    };

    setLoading(
      "btnSavePersonal",
      "btnSavePersonalText",
      "btnSavePersonalSpinner",
      true,
    );

    try {
      const url = isEdit ? `/api/empleados/${id}` : "/api/empleados";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.message || "No se pudo guardar");
      }

      showToast(
        isEdit
          ? "Personal actualizado correctamente"
          : "Personal registrado correctamente",
        "success",
      );
      closeOverlay("modalPersonalOverlay");
      await this.load();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(
        "btnSavePersonal",
        "btnSavePersonalText",
        "btnSavePersonalSpinner",
        false,
      );
    }
  },

  confirmDel(id, name) {
    DeleteModal.open("personal", id, name, async () => {
      try {
        const res = await fetch(`/api/empleados/inactivar/${id}`, {
          method: "PUT",
        });

        const json = await res.json();

        if (!json.success) {
          throw new Error(json.message || "No se pudo inactivar");
        }

        showToast("Registro inactivado correctamente", "success");
        await this.load();
      } catch (e) {
        showToast(e.message, "error");
      }
    });
  },

  _filter() {
    const search = document
      .getElementById("searchPersonal")
      .value.toLowerCase();

    const filtrado = this.lista.filter(
      (p) =>
        (p.dni || "").toLowerCase().includes(search) ||
        (p.nombres || "").toLowerCase().includes(search) ||
        (p.area || "").toLowerCase().includes(search) ||
        (p.telefono || "").toLowerCase().includes(search) ||
        (p.estado || "").toLowerCase().includes(search),
    );

    this._render(filtrado);
  },

  _bindEvents() {
    document
      .getElementById("btnNuevoPersonal")
      ?.addEventListener("click", () => this.openNew());

    document
      .getElementById("btnSavePersonal")
      ?.addEventListener("click", () => this._save());

    document
      .getElementById("btnCancelPersonal")
      ?.addEventListener("click", () => closeOverlay("modalPersonalOverlay"));

    document
      .getElementById("btnCloseModalPersonal")
      ?.addEventListener("click", () => closeOverlay("modalPersonalOverlay"));

    document
      .getElementById("btnRefreshPersonal")
      ?.addEventListener("click", () => this.load());

    document
      .getElementById("searchPersonal")
      ?.addEventListener("input", () => this._filter());

    document
      .getElementById("modalPersonalOverlay")
      ?.addEventListener("click", (e) => {
        if (e.target.id === "modalPersonalOverlay") {
          closeOverlay("modalPersonalOverlay");
        }
      });
  },

  _escape(text) {
    return String(text ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  },

  _escapeAttr(text) {
    return this._escape(text).replace(/`/g, "&#96;");
  },
};
