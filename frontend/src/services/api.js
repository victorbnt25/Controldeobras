const API_URL = import.meta.env.VITE_API_URL ?? "/api";

async function peticion(url, opciones = {}) {
  opciones.credentials = 'include';

  // Evitar que respuestas GET agresivas se queden cacheadas en el navegador
  if (!opciones.method || opciones.method.toUpperCase() === 'GET') {
    opciones.cache = 'no-store';
  }

  let res;
  try {
    res = await fetch(url, opciones);
  } catch (err) {
    // Error de red o CORS bloqueado — probablemente sesión expirada
    window.dispatchEvent(new Event('sesionExpirada'));
    throw new Error('Error de conexión. Por favor, inicia sesión de nuevo.');
  }

  let datos = null;
  try {
    datos = await res.json();
  } catch {
    datos = null;
  }

  if (!res.ok) {
    if (res.status === 401) {
      window.dispatchEvent(new Event('sesionExpirada'));
    }
    const mensaje =
      (datos && (datos.error || datos.mensaje)) ||
      `Error HTTP ${res.status} en ${url}`;
    throw new Error(mensaje);
  }

  return datos;
}

export const api = {
  /* =======================
     RESUMEN / DASHBOARD
  ======================= */
  obtenerResumen: (filtros = {}) => {
    const parametros = new URLSearchParams(filtros);
    return peticion(`${API_URL}/resumen.php?${parametros.toString()}`);
  },

  /* =======================
     CALENDARIO
  ======================= */
  obtenerCalendario: () => peticion(`${API_URL}/calendario.php`),

  planificarObra: (datos) =>
    peticion(`${API_URL}/calendario.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    }),

  borrarPlanificacion: (id) =>
    peticion(`${API_URL}/calendario.php?id=${id}`, {
      method: "DELETE",
    }),

  /* =======================
     EMAIL / NOTIFICACIONES
  ======================= */
  enviarEmail: (datos) =>
    peticion(`${API_URL}/enviar_email.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    }),

  /* =======================
     CLIENTES
  ======================= */
  obtenerClientes: () => peticion(`${API_URL}/clientes.php`),

  crearCliente: (datos) =>
    peticion(`${API_URL}/clientes.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    }),

  actualizarCliente: (id, datos) =>
    peticion(`${API_URL}/clientes.php?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    }),

  borrarCliente: (id) =>
    peticion(`${API_URL}/clientes.php?id=${id}`, {
      method: "DELETE",
    }),

  /* =======================
     TRABAJADORES
  ======================= */
  obtenerTrabajadores: () => peticion(`${API_URL}/trabajadores.php`),

  crearTrabajador: (datos) =>
    peticion(`${API_URL}/trabajadores.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    }),

  actualizarTrabajador: (id, datos) =>
    peticion(`${API_URL}/trabajadores.php?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    }),

  borrarTrabajador: (id) =>
    peticion(`${API_URL}/trabajadores.php?id=${id}`, {
      method: "DELETE",
    }),

  /* =======================
     PROVEEDORES
  ======================= */
  obtenerProveedores: () => peticion(`${API_URL}/proveedores.php`),

  crearProveedor: (datos) =>
    peticion(`${API_URL}/proveedores.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    }),

  actualizarProveedor: (id, datos) =>
    peticion(`${API_URL}/proveedores.php?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    }),

  borrarProveedor: (id) =>
    peticion(`${API_URL}/proveedores.php?id=${id}`, {
      method: "DELETE",
    }),

  /* =======================
     PRESUPUESTOS
  ======================= */

  obtenerPresupuestos: () =>
    peticion(`${API_URL}/presupuestos.php`),

  obtenerPresupuesto: (id) =>
    peticion(`${API_URL}/presupuestos.php?id=${id}`),

  crearPresupuesto: (datos) =>
    peticion(`${API_URL}/presupuestos.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    }),

  actualizarPresupuesto: (datos) =>
    peticion(`${API_URL}/presupuestos.php`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    }),

  borrarPresupuesto: (id) =>
    peticion(`${API_URL}/presupuestos.php?id=${id}`, {
      method: "DELETE",
    }),

  aceptarPresupuesto: (presupuestoId) =>
    peticion(`${API_URL}/presupuesto_aceptar.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ presupuesto_id: presupuestoId }),
    }),

  obtenerProximoCorrelativo: (tipo) =>
    peticion(`${API_URL}/correlativos.php?tipo=${tipo}`),

  // Guardar documento (Excel o PDF)
  exportarDocumento: async (cargaUtil) => {
    let respuesta;
    try {
      respuesta = await fetch(`${API_URL}/presupuesto_excel.php`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cargaUtil)
      });
    } catch { window.dispatchEvent(new Event('sesionExpirada')); throw new Error('Sesión expirada'); }
    if (respuesta.status === 401) { window.dispatchEvent(new Event('sesionExpirada')); throw new Error('Sesión expirada'); }
    if (!respuesta.ok) throw new Error('Error generando documento');
    return respuesta.blob();
  },

  exportarFactura: async (cargaUtil) => {
    let respuesta;
    try {
      respuesta = await fetch(`${API_URL}/factura_excel.php`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cargaUtil)
      });
    } catch { window.dispatchEvent(new Event('sesionExpirada')); throw new Error('Sesión expirada'); }
    if (respuesta.status === 401) { window.dispatchEvent(new Event('sesionExpirada')); throw new Error('Sesión expirada'); }
    if (!respuesta.ok) throw new Error('Error generando factura');
    return respuesta.blob();
  },

  /* =======================
     FACTURAS
  ======================= */
  obtenerFacturas: (filtros = {}) => {
    const parametros = new URLSearchParams(filtros);
    return peticion(`${API_URL}/facturas.php?${parametros.toString()}`);
  },

  obtenerFactura: (id) => peticion(`${API_URL}/facturas.php?id=${id}&with_items=1`),

  crearFactura: (datos) =>
    peticion(`${API_URL}/facturas.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    }),

  actualizarFactura: (id, datos) =>
    peticion(`${API_URL}/facturas.php?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    }),

  borrarFactura: (id) =>
    peticion(`${API_URL}/facturas.php?id=${id}`, {
      method: "DELETE",
    }),

  /* =======================
     OBRAS
  ======================= */

  obtenerObras: () =>
    peticion(`${API_URL}/obras.php`),

  obtenerObraPorId: (id) =>
    peticion(`${API_URL}/obras.php?id=${id}`),

  // Crear nuevo gasto
  crearGasto: (idObra, importe, concepto, es_extra = 0) =>
    peticion(`${API_URL}/obras.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ obra_id: idObra, importe, concepto, es_extra }),
    }),

  // Editar gasto existente
  actualizarGasto: (idGasto, importe, concepto) =>
    peticion(`${API_URL}/obras.php`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gasto_id: idGasto, importe, concepto }),
    }),

  // Eliminar gasto
  borrarGasto: (idGasto) =>
    peticion(`${API_URL}/obras.php?gasto_id=${idGasto}`, {
      method: "DELETE",
    }),

  // Crear jornada (Mano de obra)
  crearJornada: (datos) =>
    peticion(`${API_URL}/obras.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...datos, tipo_registro: 'jornada' }),
    }),

  borrarJornada: (idJornada) =>
    peticion(`${API_URL}/obras.php?jornada_id=${idJornada}`, {
      method: "DELETE",
    }),

  /* =======================
     GASTOS GENERALES
  ======================= */
  obtenerGastosGenerales: (year, month) => peticion(`${API_URL}/gastos_generales.php?year=${year}&month=${month}`),
  crearGastoGeneral: (datos) => peticion(`${API_URL}/gastos_generales.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  }),
  actualizarGastoGeneral: (id, datos) => peticion(`${API_URL}/gastos_generales.php?id=${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  }),
  borrarGastoGeneral: (id) => peticion(`${API_URL}/gastos_generales.php?id=${id}`, {
    method: "DELETE"
  }),

  /* =======================
     CONFIGURACIÓN
  ======================= */
  obtenerConfiguracion: () => peticion(`${API_URL}/configuracion.php`),

  actualizarConfiguracion: (datos) =>
    peticion(`${API_URL}/configuracion.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    }),

  /* =======================
     PLANTILLAS
  ======================= */
  obtenerPlantillas: () => peticion(`${API_URL}/plantillas.php`),

  crearPlantilla: (datos) =>
    peticion(`${API_URL}/plantillas.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    }),

  actualizarPlantilla: (id, datos) =>
    peticion(`${API_URL}/plantillas.php?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    }),

  borrarPlantilla: (id) =>
    peticion(`${API_URL}/plantillas.php?id=${id}`, {
      method: "DELETE",
    }),

  /* =======================
     AUTENTICACIÓN Y USUARIOS
  ======================= */
  comprobarSesion: () => peticion(`${API_URL}/usuario_actual.php`),

  iniciarSesion: (username, password) =>
    peticion(`${API_URL}/inicio_sesion.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    }),

  cerrarSesion: () =>
    peticion(`${API_URL}/cierre_sesion.php`, {
      method: "POST",
    }),

  obtenerUsuarios: () => peticion(`${API_URL}/usuarios.php`),

  crearUsuario: (datos) =>
    peticion(`${API_URL}/usuarios.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    }),

  actualizarUsuario: (datos) =>
    peticion(`${API_URL}/usuarios.php`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    }),
};
