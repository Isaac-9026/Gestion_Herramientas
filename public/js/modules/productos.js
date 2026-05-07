"use strict";

const ProductosModule = {
  loading: false,
  lista: [],
  opciones: null,

  async init() {
    this._bindEvents();
    await this.load();
  },

  async load() {
  const token = localStorage.getItem("token");

  const res = await fetch("/api/productos", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();

  this.lista = data.data || data.productos || data || [];

  this._render(this.lista);
},

  _render(lista) {
    const tbody = document.getElementById("bodyProductos");

    document.getElementById("totalProductosLabel").innerText =
      `${lista.length} producto(s)`;

    if (!lista.length) {
      tbody.innerHTML = `<tr><td colspan="5">Sin registros</td></tr>`;
      return;
    }

    tbody.innerHTML = lista
      .map(
        (p, i) => `
      <tr>
        <td>${i + 1}</td>

        <td>
          <strong>${p.nombre}</strong>
          <div style="font-size:12px;color:gray">
            ${p.modelo || "Sin modelo"}
          </div>
        </td>

        <td>
          ${p.marca} • ${p.categoria}
        </td>

        <td>
          <span class="badge ${p.estado === "ACTIVO" ? "bg-success" : "bg-secondary"}">
            ${p.estado}
          </span>
        </td>

        <td>
            <strong>${p.total_herramientas} Herramientas</strong>
            <div style="font-size:12px;color:gray">
            ${p.disponibles} disponibles • ${p.en_uso} en uso
            </div>
        </td>

        <td>
          <button class="btn-action btn-action-edit"
            onclick="ProductosModule.openEdit(${p.id_producto})"
            title="Editar">
            <i class="bi bi-pencil-fill"></i>
          </button>

          <button class="btn-action btn-action-delete"
            onclick="ProductosModule.toggleEstado(${p.id_producto}, '${p.nombre}', '${p.estado}')"
            title="${p.estado === "ACTIVO" ? "Inactivar" : "Reactivar"}">
            <i class="bi ${p.estado === "ACTIVO" ? "bi-x-circle-fill" : "bi-arrow-counterclockwise"}"></i>
          </button>
        </td>
      </tr>
    `,
      )
      .join("");
  },

  async _openModal(mode = "new", producto = null) {
    document.getElementById("modalProductoTitle").innerText =
      mode === "edit" ? "Editar Producto" : "Nuevo Producto";

    //limpiar formulario
    document.getElementById("productoId").value = "";
    document.getElementById("pNombre").value = "";
    document.getElementById("pModelo").value = "";

    clearErrors(["pNombre", "pMarca", "pCategoria"]);

    if (!this.opciones) {
      const res = await fetch("/api/productos/opciones");
      const data = await res.json();
      this.opciones = data.data;
    }

    document.getElementById("pMarca").innerHTML =
      `<option value="">Seleccione</option>` +
      this.opciones.marcas
        .map((m) => `<option value="${m.id_marca}">${m.nombre}</option>`)
        .join("");

    document.getElementById("pCategoria").innerHTML =
      `<option value="">Seleccione</option>` +
      this.opciones.categorias
        .map((c) => `<option value="${c.id_categoria}">${c.nombre}</option>`)
        .join("");

    if (mode === "edit" && producto) {
      document.getElementById("productoId").value = producto.id_producto;
      document.getElementById("pNombre").value = producto.nombre;
      document.getElementById("pModelo").value = producto.modelo;
      document.getElementById("pMarca").value = producto.id_marca;
      document.getElementById("pCategoria").value = producto.id_categoria;
    }

    openOverlay("modalProductoOverlay");
  },

  openEdit(id) {
    const p = this.lista.find((x) => x.id_producto === id);
    this._openModal("edit", p);
  },

  async _save() {
    if (this.loading) return;

    const id = document.getElementById("productoId").value;
    const nombre = document.getElementById("pNombre").value.trim();
    const modelo = document.getElementById("pModelo").value.trim();
    const id_marca = document.getElementById("pMarca").value;
    const id_categoria = document.getElementById("pCategoria").value;

    clearErrors(["pNombre", "pMarca", "pCategoria"]);

    let hasError = false;

    if (!nombre) {
      setError("pNombre", "err-pNombre", "El nombre es obligatorio");
      hasError = true;
    }

    if (!id_marca) {
      setError("pMarca", "err-pMarca", "Seleccione una marca");
      hasError = true;
    }

    if (!id_categoria) {
      setError("pCategoria", "err-pCategoria", "Seleccione una categoría");
      hasError = true;
    }

    if (hasError) return;

    const isEdit = !!id;

    this.loading = true;
    setLoading(
      "btnSaveProducto",
      "btnSaveProductoText",
      "btnSaveProductoSpinner",
      true,
    );

    try {
      const res = await fetch(
        isEdit ? `/api/productos/${id}` : "/api/productos",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre, modelo, id_marca, id_categoria }),
        },
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      showToast(
        `Producto ${isEdit ? "actualizado" : "creado"} correctamente`,
        "success",
      );

      closeOverlay("modalProductoOverlay");
      await this.load();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      this.loading = false;
      setLoading(
        "btnSaveProducto",
        "btnSaveProductoText",
        "btnSaveProductoSpinner",
        false,
      );
    }
  },

  async toggleEstado(id, nombre, estado) {
    const nuevo = estado === "ACTIVO" ? "INACTIVO" : "ACTIVO";

    try {
      await fetch(`/api/productos/${id}/estado`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevo }),
      });

      showToast(`Estado actualizado: ${nombre}`, "success");
      await this.load();
    } catch (e) {
      showToast("Error al cambiar estado", "error");
    }
  },

  _safeClose() {
    if (this.loading) return;
    closeOverlay("modalProductoOverlay");
  },

  _bindEvents() {
    document
      .getElementById("btnNuevoProducto")
      ?.addEventListener("click", () => this._openModal("new"));

    document
      .getElementById("btnSaveProducto")
      ?.addEventListener("click", () => this._save());

    document
      .getElementById("btnCancelProducto")
      ?.addEventListener("click", () => this._safeClose());

    document
      .getElementById("btnCloseProducto")
      ?.addEventListener("click", () => this._safeClose());

    document
      .getElementById("modalProductoOverlay")
      ?.addEventListener("click", (e) => {
        if (e.target.id === "modalProductoOverlay") {
          this._safeClose();
        }
      });
  },
};
