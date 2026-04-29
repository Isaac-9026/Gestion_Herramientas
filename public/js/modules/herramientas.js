'use strict';

const HerramientasModule = {

  async init() {
    this._bindEvents();
    await this.load();
  },

  async load() {
    document.getElementById('bodyHerramientas').innerHTML =
      `<tr><td colspan="5" class="text-center py-5"><div class="spinner-custom"></div></td></tr>`;

    try {
      const res = await fetch('/api/herramientas');
      const data = await res.json();

      this.lista = data.data;
      this._render(this.lista);

    } catch (e) {
      console.error(e);
    }
  },

  _render(lista) {
  const tbody = document.getElementById('bodyHerramientas');

  document.getElementById('totalHerramientasLabel').innerText =
    `${lista.length} herramienta(s)`;

  if (!lista.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            <i class="bi bi-tools"></i>
            <p>No hay herramientas registradas</p>
          </div>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = lista.map((h, i) => `
    <tr>
      <td>${String(i + 1).padStart(2, '0')}</td>

      <td>
        <strong>${h.codigo_inventario}</strong>
        <div style="font-size:12px;color:gray">
          ${h.numero_serie || 'Sin serie'}
        </div>
      </td>

      <td>
        <div><strong>${h.producto}</strong></div>
        <div style="font-size:12px;color:gray">
          ${h.marca} • ${h.categoria}
        </div>
      </td>

      <td>
        <span class="badge ${
          h.estado === 'BUENO' ? 'bg-success' :
          h.estado === 'REGULAR' ? 'bg-warning' : 'bg-danger'
        }">
          ${h.estado}
        </span>
      </td>

      <td>
        ${h.ubicacion || '<span class="text-muted">Sin ubicación</span>'}
      </td>

      <td>
        <span class="badge ${
          h.disponible ? 'bg-success' : 'bg-danger'
        }">
          ${h.disponible ? 'Disponible' : 'Prestado'}
        </span>
      </td>
    </tr>
  `).join('');
},

  _filter() {
  const search = document.getElementById('searchHerramienta').value.toLowerCase();

  const filtrado = this.lista.filter(h =>
    h.codigo_inventario.toLowerCase().includes(search) ||
    (h.numero_serie || '').toLowerCase().includes(search) ||
    h.producto.toLowerCase().includes(search) ||
    h.marca.toLowerCase().includes(search) ||
    h.categoria.toLowerCase().includes(search) ||
    (h.ubicacion || '').toLowerCase().includes(search) ||
    h.estado.toLowerCase().includes(search)
  );

  this._render(filtrado);
},

  _bindEvents() {
    document.getElementById('btnRefreshHerramientas')
      ?.addEventListener('click', () => this.load());

    document.getElementById('searchHerramienta')
      ?.addEventListener('input', () => this._filter());
  }
};