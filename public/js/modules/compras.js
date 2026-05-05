"use strict";

const ComprasModule = {
  lista: [],
  proveedores: [],
  productos: [],
  carrito: [],

  async init() {
    this._bindEvents();
    await this._loadOptions();
    await this.load();
  },

  async _loadOptions() {
    try {
      const res = await fetch("/api/compras/opciones");
      const json = await res.json();

      this.proveedores = json.data.proveedores || [];
      this.productos = json.data.productos || [];

      this._fillProveedores();
      this._fillProductos();
    } catch (e) {
      console.error("Error cargando opciones de compras:", e);
      this.proveedores = [];
      this.productos = [];
    }
  },

  _fillProveedores(selected = "") {
    const sel = document.getElementById("cProveedor");
    if (!sel) return;

    sel.innerHTML =
      `<option value="">— Seleccionar proveedor —</option>` +
      this.proveedores
        .map(
          (p) => `
        <option value="${p.id_proveedor}" ${String(p.id_proveedor) === String(selected) ? "selected" : ""}>
          ${this._escape(p.razon_social)}
        </option>
      `,
        )
        .join("");
  },

  _fillProductos(selected = "") {
    const sel = document.getElementById("cProducto");
    if (!sel) return;

    sel.innerHTML =
      `<option value="">— Seleccionar producto —</option>` +
      this.productos
        .map((p) => {
          const label = p.modelo ? `${p.nombre} - ${p.modelo}` : p.nombre;
          return `<option value="${p.id_producto}" ${String(p.id_producto) === String(selected) ? "selected" : ""}>${this._escape(label)}</option>`;
        })
        .join("");
  },

  async load() {
    document.getElementById("bodyCompras").innerHTML =
      `<tr><td colspan="8" class="text-center py-5"><div class="spinner-custom"></div></td></tr>`;

    try {
      const res = await fetch("/api/compras");
      const json = await res.json();

      this.lista = json.data || [];
      this._render(this.lista);
    } catch (e) {
      console.error(e);
      document.getElementById("bodyCompras").innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-5 text-danger">
            Error al cargar compras
          </td>
        </tr>`;
    }
  },

  _render(lista) {
    const tbody = document.getElementById("bodyCompras");
    document.getElementById("totalComprasLabel").innerText =
      `${lista.length} compra(s) registrada(s)`;

    if (!lista.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8">
            <div class="empty-state">
              <i class="bi bi-receipt"></i>
              <p>No hay compras registradas</p>
            </div>
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = lista
      .map(
        (c, i) => `
      <tr>
        <td>${String(i + 1).padStart(2, "0")}</td>
        <td><strong>${this._escape(c.num_factura)}</strong></td>
        <td>${this._escape(c.razon_social)}</td>
        <td><span class="badge-garantia">${c.total_items} ítem(s)</span></td>
        <td><strong>${this._formatMoney(c.total_compra)}</strong></td>
        <td>${c.fecha_formateada || "—"}</td>
        <td>${this._escape(c.username || "—")}</td>
        <td>
          <button class="btn-action btn-action-edit" title="Ver detalle"
            onclick="ComprasModule.openDetail(${c.id_compra})">
            <i class="bi bi-eye-fill"></i>
          </button>
        </td>
      </tr>
    `,
      )
      .join("");
  },

  openNew() {
    this.carrito = [];
    document.getElementById("cFactura").value = "";
    document.getElementById("cProveedor").value = "";
    document.getElementById("cProducto").value = "";
    document.getElementById("cCantidad").value = 1;
    document.getElementById("cPrecio").value = "0.00";
    this._renderCarrito();
    openOverlay("modalCompraOverlay");
  },

  _addDetalle() {
    const id_producto = document.getElementById("cProducto").value;
    const cantidad = Number(document.getElementById("cCantidad").value);
    const precio_unitario = Number(document.getElementById("cPrecio").value);

    if (!id_producto) {
      showToast("Selecciona un producto", "error");
      return;
    }

    if (!cantidad || cantidad <= 0) {
      showToast("La cantidad debe ser mayor a 0", "error");
      return;
    }

    if (!precio_unitario || precio_unitario <= 0) {
      showToast("El precio unitario debe ser mayor a 0", "error");
      return;
    }

    const producto = this.productos.find(
      (p) => String(p.id_producto) === String(id_producto),
    );
    if (!producto) {
      showToast("Producto no encontrado", "error");
      return;
    }

    const existing = this.carrito.find(
      (item) => String(item.id_producto) === String(id_producto),
    );

    if (existing) {
      existing.cantidad += cantidad;
      existing.precio_unitario = precio_unitario;
      existing.subtotal = existing.cantidad * existing.precio_unitario;
    } else {
      this.carrito.push({
        id_producto,
        nombre: producto.modelo
          ? `${producto.nombre} - ${producto.modelo}`
          : producto.nombre,
        cantidad,
        precio_unitario,
        subtotal: cantidad * precio_unitario,
      });
    }

    this._renderCarrito();

    document.getElementById("cProducto").value = "";
    document.getElementById("cCantidad").value = 1;
    document.getElementById("cPrecio").value = "0.00";
  },

  _removeDetalle(index) {
    this.carrito.splice(index, 1);
    this._renderCarrito();
  },

  _renderCarrito() {
    const tbody = document.getElementById("bodyDetalleCompraForm");
    const total = this.carrito.reduce((sum, item) => sum + item.subtotal, 0);

    document.getElementById("compraTotalLabel").innerText =
      this._formatMoney(total);

    if (!this.carrito.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6">
            <div class="empty-state">
              <p>No hay productos agregados</p>
            </div>
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = this.carrito
      .map(
        (item, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${this._escape(item.nombre)}</td>
        <td>${item.cantidad}</td>
        <td>${this._formatMoney(item.precio_unitario)}</td>
        <td>${this._formatMoney(item.subtotal)}</td>
        <td>
          <button class="btn-action btn-action-delete"
            onclick="ComprasModule._removeDetalle(${i})"
            title="Eliminar">
            <i class="bi bi-trash3-fill"></i>
          </button>
        </td>
      </tr>
    `,
      )
      .join("");
  },

  async _save() {
    const num_factura = document.getElementById("cFactura").value.trim();
    const id_proveedor = document.getElementById("cProveedor").value;

    clearErrors(["cFactura", "cProveedor"]);

    let ok = true;

    if (!num_factura) {
      setError("cFactura", "err-cFactura", "La factura es obligatoria");
      ok = false;
    }

    if (!id_proveedor) {
      setError("cProveedor", "err-cProveedor", "Selecciona un proveedor");
      ok = false;
    }

    if (!this.carrito.length) {
      showToast("Agrega al menos un producto al detalle", "error");
      ok = false;
    }

    if (!ok) return;

    const payload = {
      num_factura,
      id_proveedor,
      detalles: this.carrito.map((item) => ({
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
      })),
    };

    setLoading(
      "btnSaveCompra",
      "btnSaveCompraText",
      "btnSaveCompraSpinner",
      true,
    );

    try {
      const res = await fetch("/api/compras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.message || "No se pudo registrar la compra");
      }

      showToast("Compra registrada correctamente", "success");
      closeOverlay("modalCompraOverlay");
      await this.load();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(
        "btnSaveCompra",
        "btnSaveCompraText",
        "btnSaveCompraSpinner",
        false,
      );
    }
  },

  async openDetail(id) {
    document.getElementById("bodyDetalleCompraView").innerHTML =
      `<tr><td colspan="5" class="text-center py-4"><div class="spinner-custom"></div></td></tr>`;

    try {
      const res = await fetch(`/api/compras/${id}`);
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.message || "No se pudo cargar el detalle");
      }

      const { compra, detalle } = json.data;

      document.getElementById("detalleCompraInfo").innerHTML =
        `Factura: <strong>${this._escape(compra.num_factura)}</strong> · Proveedor: <strong>${this._escape(compra.razon_social)}</strong> · Fecha: <strong>${this._escape(compra.fecha_formateada)}</strong>`;

      const tbody = document.getElementById("bodyDetalleCompraView");

      if (!detalle.length) {
        tbody.innerHTML = `
          <tr>
            <td colspan="5">
              <div class="empty-state">
                <p>Sin detalle</p>
              </div>
            </td>
          </tr>`;
      } else {
        tbody.innerHTML = detalle
          .map(
            (d, i) => `
          <tr>
            <td>${i + 1}</td>
            <td>${this._escape(d.nombre)}${d.modelo ? ` - ${this._escape(d.modelo)}` : ""}</td>
            <td>${d.cantidad}</td>
            <td>${this._formatMoney(d.precio_unitario)}</td>
            <td>${this._formatMoney(d.subtotal)}</td>
          </tr>
        `,
          )
          .join("");
      }

      openOverlay("modalDetalleCompraOverlay");
    } catch (e) {
      showToast(e.message, "error");
    }
  },

  _filter() {
    const search = document.getElementById("searchCompra").value.toLowerCase();

    const filtrado = this.lista.filter(
      (c) =>
        (c.num_factura || "").toLowerCase().includes(search) ||
        (c.razon_social || "").toLowerCase().includes(search),
    );

    this._render(filtrado);
  },

  _bindEvents() {
    document
      .getElementById("btnNuevaCompra")
      ?.addEventListener("click", () => this.openNew());

    document
      .getElementById("btnAddDetalle")
      ?.addEventListener("click", () => this._addDetalle());

    document
      .getElementById("btnSaveCompra")
      ?.addEventListener("click", () => this._save());

    document
      .getElementById("btnCancelCompra")
      ?.addEventListener("click", () => closeOverlay("modalCompraOverlay"));

    document
      .getElementById("btnCloseCompra")
      ?.addEventListener("click", () => closeOverlay("modalCompraOverlay"));

    document
      .getElementById("modalCompraOverlay")
      ?.addEventListener("click", (e) => {
        if (e.target.id === "modalCompraOverlay")
          closeOverlay("modalCompraOverlay");
      });

    document
      .getElementById("btnRefreshCompras")
      ?.addEventListener("click", () => this.load());

    document
      .getElementById("searchCompra")
      ?.addEventListener("input", () => this._filter());

    document
      .getElementById("btnCloseDetalleCompra")
      ?.addEventListener("click", () =>
        closeOverlay("modalDetalleCompraOverlay"),
      );

    document
      .getElementById("btnCloseDetalleCompraFooter")
      ?.addEventListener("click", () =>
        closeOverlay("modalDetalleCompraOverlay"),
      );

    document
      .getElementById("modalDetalleCompraOverlay")
      ?.addEventListener("click", (e) => {
        if (e.target.id === "modalDetalleCompraOverlay")
          closeOverlay("modalDetalleCompraOverlay");
      });
  },

  _formatMoney(value) {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(Number(value || 0));
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
