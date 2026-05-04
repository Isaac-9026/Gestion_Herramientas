'use strict';

function createCatalogModule(config) {
  const {
    endpoint,
    singularLabel,
    pluralLabel
  } = config;

  return {
    lista: [],

    async init() {
      window.CatalogoModule = this;

      if (!document.getElementById('bodyCatalogo')) return;

      this._bindEvents();
      await this.load();
    },

    async load() {
      const tbody = document.getElementById('bodyCatalogo');
      if (!tbody) return;

      tbody.innerHTML =
        `<tr><td colspan="4" class="text-center py-5"><div class="spinner-custom"></div></td></tr>`;

      try {
        const res = await fetch(endpoint);
        const json = await res.json();

        this.lista = json.data || [];
        this._render(this.lista);
      } catch (e) {
        console.error(e);
        tbody.innerHTML = `
          <tr>
            <td colspan="4" class="text-center py-5 text-danger">
              Error al cargar ${pluralLabel.toLowerCase()}
            </td>
          </tr>`;
      }
    },

    _getId(item) {
      return (
        item.id ||
        item.id_categoria ||
        item.id_marca ||
        item.id_ubicacion ||
        item.id_area ||
        item.id_rol
      );
    },

    _render(lista) {
      const tbody = document.getElementById('bodyCatalogo');
      if (!tbody) return;

      document.getElementById('totalCatalogoLabel').innerText =
        `${lista.length} ${pluralLabel.toLowerCase()}`;

      if (!lista.length) {
        tbody.innerHTML = `
          <tr>
            <td colspan="4">
              <div class="empty-state">
                <i class="bi bi-inbox"></i>
                <p>No hay ${pluralLabel.toLowerCase()} registradas</p>
              </div>
            </td>
          </tr>`;
        return;
      }

      tbody.innerHTML = lista.map((item, i) => {
        const id = this._getId(item);

        return `
        <tr>
          <td>
            <span style="font-family:'DM Mono',monospace;font-size:12px;color:var(--text-muted)">
              ${String(i + 1).padStart(2, '0')}
            </span>
          </td>

          <td>
            <div class="cell-producto-name">${this._escape(item.nombre)}</div>
          </td>

          <td>
            <span class="badge ${item.estado === 'ACTIVO' ? 'bg-success' : 'bg-secondary'}">
              ${item.estado}
            </span>
          </td>

          <td style="white-space:nowrap">
            <button
              class="btn-action btn-action-edit"
              title="Editar"
              onclick="CatalogoModule.openEdit(${id}, '${this._escapeAttr(item.nombre)}', '${item.estado}')">
              <i class="bi bi-pencil-fill"></i>
            </button>

            <button
              class="btn-action btn-action-delete"
              title="Cambiar estado"
              onclick="CatalogoModule.toggleEstado(${id}, '${item.estado}')">
              <i class="bi bi-arrow-repeat"></i>
            </button>
          </td>
        </tr>
        `;
      }).join('');
    },

    _openModal(mode, item = null) {
      const isEdit = mode === 'edit';

      document.getElementById('modalCatalogoTitle').innerText = isEdit
        ? `Editar ${singularLabel}`
        : `Nueva ${singularLabel}`;

      document.getElementById('modalCatalogoSubtitle').innerText = isEdit
        ? `Modifica los datos de ${singularLabel.toLowerCase()}`
        : `Completa los datos de ${singularLabel.toLowerCase()}`;

      document.getElementById('catalogoId').value = isEdit ? item.id : '';
      document.getElementById('catalogoNombre').value = isEdit ? item.nombre : '';

      clearErrors(['catalogoNombre']);
      openOverlay('modalCatalogoOverlay');
    },

    openNew() {
      this._openModal('new');
    },

    openEdit(id, nombre, estado) {
      this._openModal('edit', { id, nombre, estado });
    },

    async _save() {
      const id = document.getElementById('catalogoId').value;
      const isEdit = !!id;

      const nombre = document.getElementById('catalogoNombre').value.trim();

      clearErrors(['catalogoNombre']);

      if (!nombre) {
        setError('catalogoNombre', 'err-catalogoNombre', 'El nombre es obligatorio');
        return;
      }

      setLoading('btnSaveCatalogo', 'btnSaveCatalogoText', 'btnSaveCatalogoSpinner', true);

      try {
        const url = isEdit ? `${endpoint}/${id}` : endpoint;

        const res = await fetch(url, {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre })
        });

        const json = await res.json();

        if (!json.success) {
          throw new Error(json.message || 'No se pudo guardar');
        }

        showToast(
          isEdit
            ? `${singularLabel} actualizado correctamente`
            : `${singularLabel} registrado correctamente`,
          'success'
        );

        closeOverlay('modalCatalogoOverlay');
        await this.load();
      } catch (e) {
        showToast(e.message, 'error');
      } finally {
        setLoading('btnSaveCatalogo', 'btnSaveCatalogoText', 'btnSaveCatalogoSpinner', false);
      }
    },

    async toggleEstado(id, estadoActual) {
      try {
        const nuevoEstado = estadoActual === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';

        const res = await fetch(`${endpoint}/${id}/estado`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estado: nuevoEstado })
        });

        const json = await res.json();

        if (!json.success) {
          throw new Error(json.message || 'No se pudo cambiar el estado');
        }

        showToast('Estado actualizado correctamente', 'success');
        await this.load();
      } catch (e) {
        showToast(e.message, 'error');
      }
    },

    _filter() {
      const search = document.getElementById('searchCatalogo')?.value.toLowerCase() || '';

      this._render(
        this.lista.filter(i =>
          (i.nombre || '').toLowerCase().includes(search) ||
          (i.estado || '').toLowerCase().includes(search)
        )
      );
    },

    _bindEvents() {
      document.getElementById('btnNuevoCatalogo')
        ?.addEventListener('click', () => this.openNew());

      document.getElementById('btnSaveCatalogo')
        ?.addEventListener('click', () => this._save());

      document.getElementById('btnCancelCatalogo')
        ?.addEventListener('click', () => closeOverlay('modalCatalogoOverlay'));

      document.getElementById('btnCloseModalCatalogo')
        ?.addEventListener('click', () => closeOverlay('modalCatalogoOverlay'));

      document.getElementById('btnRefreshCatalogo')
        ?.addEventListener('click', () => this.load());

      document.getElementById('searchCatalogo')
        ?.addEventListener('input', () => this._filter());

      document.getElementById('modalCatalogoOverlay')
        ?.addEventListener('click', e => {
          if (e.target.id === 'modalCatalogoOverlay') {
            closeOverlay('modalCatalogoOverlay');
          }
        });
    },

    _escape(text) {
      return String(text ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    _escapeAttr(text) {
      return this._escape(text).replace(/`/g, '&#96;');
    }
  };
}