'use strict';

const ProveedoresModule = {

  async init() {
    this._bindEvents();
    await this.load();
  },

  async load() {
    const res = await fetch('/api/proveedores');
    const data = await res.json();

    this.lista = data.data;
    this._render(this.lista);
  },

  _render(lista) {
    const tbody = document.getElementById('bodyProveedores');

    document.getElementById('totalProveedoresLabel').innerText =
      `${lista.length} proveedor(es)`;

    tbody.innerHTML = lista.map((p, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${p.ruc}</td>
        <td>${p.razon_social}</td>
        <td>${p.contacto || '-'}</td>
        <td>${p.telefono || '-'}</td>

        <td>
          <span class="badge ${p.estado === 'ACTIVO' ? 'bg-success' : 'bg-danger'}">
            ${p.estado}
          </span>
        </td>

        <td>
          <button class="btn-action btn-action-edit"
            onclick="ProveedoresModule.openEdit(${p.id_proveedor})">
            <i class="bi bi-pencil-fill"></i>
          </button>

          <button class="btn-action btn-action-delete"
            onclick="ProveedoresModule.toggleEstado(${p.id_proveedor}, '${p.estado}')">
            <i class="bi bi-arrow-repeat"></i>
          </button>
        </td>
      </tr>
    `).join('');
  },

  async toggleEstado(id, estado) {
    const nuevo = estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';

    await fetch(`/api/proveedores/${id}/estado`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevo })
    });

    await this.load();
  },


  openModal(mode = 'new', proveedor = null) {

  const isEdit = mode === 'edit';

  document.getElementById('modalProveedorTitle').innerText =
    isEdit ? 'Editar Proveedor' : 'Nuevo Proveedor';

  document.getElementById('provId').value = isEdit ? proveedor.id_proveedor : '';
  document.getElementById('provRuc').value = isEdit ? proveedor.ruc : '';
  document.getElementById('provNombre').value = isEdit ? proveedor.razon_social : '';
  document.getElementById('provContacto').value = isEdit ? proveedor.contacto || '' : '';
  document.getElementById('provTelefono').value = isEdit ? proveedor.telefono || '' : '';
  document.getElementById('provDireccion').value = isEdit ? proveedor.direccion || '' : '';

  openOverlay('modalProveedorOverlay');
},
openEdit(id) {
  const proveedor = this.lista.find(p => p.id_proveedor === id);
  if (!proveedor) return;

  this.openModal('edit', proveedor);
},
async save() {

  const id = document.getElementById('provId').value;

  const payload = {
    ruc: document.getElementById('provRuc').value.trim(),
    razon_social: document.getElementById('provNombre').value.trim(),
    contacto: document.getElementById('provContacto').value.trim(),
    telefono: document.getElementById('provTelefono').value.trim(),
    direccion: document.getElementById('provDireccion').value.trim(),
  };

  if (!payload.ruc || payload.ruc.length !== 11) {
    return alert("RUC inválido");
  }

  if (!payload.razon_social) {
    return alert("Razón social obligatoria");
  }

  try {

    await fetch(id ? `/api/proveedores/${id}` : `/api/proveedores`, {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    closeOverlay('modalProveedorOverlay');
    await this.load();

  } catch (e) {
    console.error(e);
  }
},

  _bindEvents() {

  document.getElementById('btnNuevoProveedor')
    ?.addEventListener('click', () => this.openModal());

  document.getElementById('btnSaveProveedor')
    ?.addEventListener('click', () => this.save());

  document.getElementById('btnCancelProveedor')
    ?.addEventListener('click', () => closeOverlay('modalProveedorOverlay'));

  document.getElementById('btnCloseProveedor')
    ?.addEventListener('click', () => closeOverlay('modalProveedorOverlay'));
}
};