'use strict';

const PrestamosModule = {

  async init() {
    this._bindEvents();
    await this.load();
  },

  async load() {
    document.getElementById('bodyPrestamos').innerHTML =
      `<tr><td colspan="7" class="text-center py-5"><div class="spinner-custom"></div></td></tr>`;

    try {
      const { data } = await http('/api/prestamos');
      this.lista = data;
      this._render(this.lista);
    } catch (e) {
      showToast('Error al cargar préstamos: ' + e.message, 'error');
    }
  },


  // RENDER TABLA PRINCIPAL
  _render(lista) {
    const tbody = document.getElementById('bodyPrestamos');

    document.getElementById('totalPrestamosLabel').innerText =
      `${lista.length} préstamo(s)`;

    if (!lista.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="empty-state">
              <i class="bi bi-journal-x"></i>
              <p>No hay préstamos registrados</p>
            </div>
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = lista.map((p, i) => `
      <tr>
        <td>${String(i + 1).padStart(2, '0')}</td>

        <td>${p.nombres}</td>

        <td>${p.username}</td>

        <td>
          <span class="badge bg-info">
            ${p.total_items} ítem(s)
          </span>
        </td>

        <td>${formatFecha(p.fecha_prestamo)}</td>

        <td>
          <span class="badge ${
            p.estado_prestamo === 'EN_CURSO'
              ? 'bg-warning'
              : 'bg-success'
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

          ${
            p.estado_prestamo === 'CERRADO'
              ? `<button class="btn-action btn-action-delete"
                   onclick="PrestamosModule.confirmDel(${p.id_prestamo})"
                   title="Eliminar">
                   <i class="bi bi-trash3-fill"></i>
                 </button>`
              : ''
          }
        </td>
      </tr>
    `).join('');
  },


  //VER DETALLE DEL PRÉSTAMO
  async openDetalle(id) {
    const tbody = document.getElementById('bodyDetallePrestamo');

    openOverlay('modalDetallePrestamo');

    tbody.innerHTML =
      `<tr><td colspan="7" class="text-center py-4"><div class="spinner-custom"></div></td></tr>`;

    try {
      const { data } = await http(`/api/prestamos/${id}`);

      const { prestamo, detalle } = data;

      // info general arriba
      document.getElementById('detalleInfo').innerHTML = `
        <strong>Persona:</strong> ${prestamo.id_persona} <br>
        <strong>Motivo:</strong> ${prestamo.motivo || '—'} <br>
        <strong>Fecha:</strong> ${formatFecha(prestamo.fecha_prestamo)}
      `;

      if (!detalle.length) {
        tbody.innerHTML = `
          <tr><td colspan="7">Sin detalles</td></tr>`;
        return;
      }

      tbody.innerHTML = detalle.map(d => `
        <tr>
          <td>${d.codigo_inventario}</td>
          <td>${d.producto}</td>

          <td>
            <span class="badge ${
              d.estado_entrega === 'BUENO'
                ? 'bg-success'
                : d.estado_entrega === 'REGULAR'
                  ? 'bg-warning'
                  : 'bg-danger'
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
            ${d.fecha_devolucion
              ? formatFecha(d.fecha_devolucion)
              : '—'}
          </td>

          <td>
            ${d.observaciones || '—'}
          </td>

          <td>
            ${
              !d.fecha_devolucion
                ? `<button class="btn-action btn-action-edit"
                     onclick="PrestamosModule.devolver(${d.id_detalle_prestamo})">
                     <i class="bi bi-box-arrow-down"></i>
                   </button>`
                : `<span class="text-muted">${d.usuario_receptor || '—'}</span>`
            }
          </td>
        </tr>
      `).join('');

    } catch (e) {
      showToast('Error al cargar detalle', 'error');
    }
  },

  // DEVOLVER HERRAMIENTA
  async devolver(id_detalle) {

    const estado = prompt("Estado de devolución (BUENO / REGULAR / MALO):", "BUENO");
    if (!estado) return;

    const obs = prompt("Observaciones (opcional):", "");

    try {
      await http(`/api/prestamos/devolver/${id_detalle}`, 'PUT', {
        estado_devolucion: estado,
        observaciones: obs,
        id_usuario_receptor: 1
      });

      showToast('Devolución registrada', 'success');

      // refrescar
      await this.load();
      document.getElementById('modalDetallePrestamo')?.click();

    } catch (e) {
      showToast(e.message, 'error');
    }
  },

  //ELIMINAR
  confirmDel(id) {
    DeleteModal.open('prestamo', id, 'este préstamo', async () => {
      try {
        await http(`/api/prestamos/${id}`, 'DELETE');
        showToast('Préstamo eliminado', 'success');
        await this.load();
      } catch (e) {
        showToast(e.message, 'error');
      }
    });
  },

  _bindEvents() {
    document.getElementById('btnRefreshPrestamos')
      ?.addEventListener('click', () => this.load());

      document.getElementById('btnCloseDetallePrestamo')
  ?.addEventListener('click', () => closeOverlay('modalDetallePrestamo'));

document.getElementById('btnCloseDetallePrestamoFooter')
  ?.addEventListener('click', () => closeOverlay('modalDetallePrestamo'));
  }
};