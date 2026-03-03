import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import ModalConfirmacion from "../components/ModalConfirmacion";

export default function ObraDetalle() {
  const { id } = useParams();
  const navegar = useNavigate();
  const [obra, setObra] = useState(null);
  const [trabajadores, setTrabajadores] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [notificacion, setNotificacion] = useState({ mensaje: "", tipo: "" }); // { mensaje, tipo: 'success' | 'danger' }
  const [modalConfirmacion, setModalConfirmacion] = useState({ visible: false, id: null, tipo: null });
  const [ivaFactura, setIvaFactura] = useState(21); // IVA por defecto para la factura

  // Estado para Gastos Generales
  const [nuevoGasto, setNuevoGasto] = useState("");
  const [nuevoConcepto, setNuevoConcepto] = useState("");
  const [tipoMovimiento, setTipoMovimiento] = useState("gasto"); // 'gasto' o 'ingreso'
  const [gastoEditar, setGastoEditar] = useState(null); // Estado para saber si estamos editando

  const [presupuestoItems, setPresupuestoItems] = useState([]);
  const [mostrarImportar, setMostrarImportar] = useState(false);
  const [itemsSeleccionados, setItemsSeleccionados] = useState([]);
  const [preciosPersonalizados, setPreciosPersonalizados] = useState({});

  // Estado para Jornadas (Mano de Obra) - Trabajador
  const [nuevaJornada, setNuevaJornada] = useState({
    trabajador_id: "",
    fecha: new Date().toISOString().split('T')[0],
    tipo: "dia",
    cantidad: 1
  });

  // Estado para Jornadas (Mano de Obra) - Proveedor
  const [nuevaJornadaProveedor, setNuevaJornadaProveedor] = useState({
    proveedor_id: "",
    fecha: new Date().toISOString().split('T')[0],
    importe: "",
    descripcion_factura: ""
  });

  const mostrarNotificacion = (mensaje, tipo = "success") => {
    setNotificacion({ mensaje: mensaje, tipo });
    // Scroll arriba para ver la notificación
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setNotificacion({ mensaje: "", tipo: "" }), 5000);
  };

  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarObra();
    cargarTrabajadores();
    cargarProveedores();
  }, [id]);

  const cargarObra = async () => {
    try {
      const datos = await api.obtenerObraPorId(id);
      setObra(datos);

      if (datos.presupuesto_id) {
        try {
          const pres = await api.obtenerPresupuesto(datos.presupuesto_id);
          if (pres && pres.items) {
            const excluidas = ['SUMA', 'RESTO', 'SUBTOTAL', 'TOTAL'];
            const filtrar = pres.items.filter(i => {
              if (!i.descripcion) return false;
              const desc = i.descripcion.toUpperCase();
              return !excluidas.some(p => desc.startsWith(p));
            });
            setPresupuestoItems(filtrar);
          }
        } catch (e) { }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setCargando(false);
    }
  };

  const cargarTrabajadores = async () => {
    try {
      const datos = await api.obtenerTrabajadores();
      setTrabajadores(datos || []);
    } catch (error) {
      console.error("Error cargando trabajadores", error);
    }
  };

  const cargarProveedores = async () => {
    try {
      const datos = await api.obtenerProveedores();
      setProveedores(datos || []);
    } catch (error) {
      console.error("Error cargando proveedores", error);
    }
  };

  // --- GESTIÓN DE GASTOS GENERALES ---
  const alAgregarGasto = async (e, esExtra = false) => {
    e.preventDefault();
    if (!nuevoGasto) return;

    setGuardando(true);
    try {
      const importeFinal = tipoMovimiento === 'gasto' ? Math.abs(parseFloat(nuevoGasto)) : -Math.abs(parseFloat(nuevoGasto));

      if (gastoEditar) {
        // MODO EDICIÓN
        await api.actualizarGasto(gastoEditar.id, importeFinal, nuevoConcepto);
      } else {
        // MODO CREACIÓN
        await api.crearGasto(id, importeFinal, nuevoConcepto, esExtra ? 1 : 0);
      }

      await cargarObra();
      limpiarFormulario();
      mostrarNotificacion(gastoEditar ? "Movimiento actualizado" : "Gasto registrado correctamente");
    } catch (error) {
      mostrarNotificacion("Error al guardar el movimiento", "danger");
    } finally {
      setGuardando(false);
    }
  };

  const limpiarFormulario = () => {
    setNuevoGasto("");
    setNuevoConcepto("");
    setTipoMovimiento("gasto");
    setGastoEditar(null);
  };

  const alEditarGasto = (gasto) => {
    const importe = parseFloat(gasto.importe);
    setGastoEditar(gasto);
    setNuevoConcepto(gasto.concepto);
    setNuevoGasto(Math.abs(importe).toString());
    setTipoMovimiento(importe < 0 ? 'ingreso' : 'gasto');
  };

  const alEliminarGasto = (idGasto) => {
    setModalConfirmacion({ visible: true, id: idGasto, tipo: 'gasto' });
  };

  const toggleSeleccionItem = (indice) => {
    if (itemsSeleccionados.includes(indice)) {
      setItemsSeleccionados(itemsSeleccionados.filter(i => i !== indice));
    } else {
      setItemsSeleccionados([...itemsSeleccionados, indice]);
    }
  };

  const seleccionarTodosItems = () => {
    if (itemsSeleccionados.length === presupuestoItems.length) {
      setItemsSeleccionados([]);
    } else {
      setItemsSeleccionados(presupuestoItems.map((_, index) => index));
    }
  };

  const alImportarItems = async () => {
    if (itemsSeleccionados.length === 0) return;
    setGuardando(true);
    let errores = 0;
    try {
      for (let i of itemsSeleccionados) {
        const item = presupuestoItems[i];
        const importeOriginal = parseFloat(item.cantidad || 1) * parseFloat(item.precio_unitario || 0);

        let importeDefinitivo = importeOriginal;
        if (preciosPersonalizados[i] !== undefined && preciosPersonalizados[i] !== "") {
          importeDefinitivo = parseFloat(preciosPersonalizados[i]);
          if (isNaN(importeDefinitivo)) importeDefinitivo = importeOriginal;
        }

        await api.crearGasto(id, importeDefinitivo, item.descripcion, 0);
      }
    } catch (e) {
      errores++;
    }

    setMostrarImportar(false);
    setItemsSeleccionados([]);
    setPreciosPersonalizados({});
    await cargarObra();
    setGuardando(false);

    if (errores > 0) {
      mostrarNotificacion("Hubo errores al importar algunas partidas", "danger");
    } else {
      mostrarNotificacion("Partidas importadas correctamente");
    }
  };

  // --- GESTIÓN DE JORNADAS (MANO DE OBRA) ---
  const alAgregarJornada = async (e) => {
    e.preventDefault();
    if (!nuevaJornada.trabajador_id) {
      mostrarNotificacion("Selecciona un trabajador", "danger");
      return;
    }
    setGuardando(true);
    try {
      await api.crearJornada({ obra_id: id, ...nuevaJornada });
      await cargarObra();
      setNuevaJornada(prev => ({ ...prev, cantidad: 1 }));
      mostrarNotificacion("Jornada añadida");
    } catch (error) {
      mostrarNotificacion("Error al añadir jornada", "danger");
    } finally {
      setGuardando(false);
    }
  };

  const alAgregarJornadaProveedor = async (e) => {
    e.preventDefault();
    if (!nuevaJornadaProveedor.proveedor_id) {
      mostrarNotificacion("Selecciona un proveedor", "danger");
      return;
    }
    if (!nuevaJornadaProveedor.importe || parseFloat(nuevaJornadaProveedor.importe) <= 0) {
      mostrarNotificacion("Introduce un importe válido", "danger");
      return;
    }
    setGuardando(true);
    try {
      await api.crearJornada({
        obra_id: id,
        proveedor_id: nuevaJornadaProveedor.proveedor_id,
        fecha: nuevaJornadaProveedor.fecha,
        importe: parseFloat(nuevaJornadaProveedor.importe),
        descripcion_factura: nuevaJornadaProveedor.descripcion_factura
      });
      await cargarObra();
      setNuevaJornadaProveedor(prev => ({ ...prev, importe: "", descripcion_factura: "" }));
      mostrarNotificacion("Coste de proveedor registrado");
    } catch (error) {
      mostrarNotificacion("Error al registrar proveedor", "danger");
    } finally {
      setGuardando(false);
    }
  };

  const alEliminarJornada = (idJornada) => {
    setModalConfirmacion({ visible: true, id: idJornada, tipo: 'jornada' });
  };

  const alGenerarFactura = async () => {
    if (!obra || !obra.presupuesto_id) {
      mostrarNotificacion("Esta obra no tiene un presupuesto asociado.", "danger");
      return;
    }

    try {
      const p = await api.obtenerPresupuesto(obra.presupuesto_id);
      if (p && p.iva_porcentaje) setIvaFactura(parseFloat(p.iva_porcentaje));
    } catch (e) { }

    setModalConfirmacion({ visible: true, id: null, tipo: 'factura' });
  };

  const ejecutarGenerarFactura = async () => {
    setGuardando(true);
    try {
      const presupuestoCompleto = await api.obtenerPresupuesto(obra.presupuesto_id);

      if (!presupuestoCompleto || !presupuestoCompleto.items) {
        throw new Error("No se pudierón cargar los elementos del presupuesto.");
      }

      const palabrasExcluidas = ['SUMA', 'RESTO', 'SUBTOTAL', 'TOTAL'];

      const elementosFiltrados = presupuestoCompleto.items.filter(item => {
        const desc = (item.descripcion || "").toUpperCase();
        return !palabrasExcluidas.some(palabra => desc.startsWith(palabra));
      });

      // Crear lista de items final
      let todosLosItems = [...elementosFiltrados.map(e => ({
        descripcion: e.descripcion,
        cantidad: e.cantidad,
        precio_unitario: e.precio_unitario
      }))];

      // Añadir Gastos de Materiales si existen
      if (obra.gastos && obra.gastos.length > 0) {
        obra.gastos.forEach(g => {
          todosLosItems.push({
            descripcion: g.concepto,
            cantidad: 1,
            precio_unitario: parseFloat(g.importe)
          });
        });
      }

      // Añadir Mano de Obra si existen
      if (obra.jornadas && obra.jornadas.length > 0) {
        // Separar trabajadores de proveedores
        const jornadasTrabajadores = obra.jornadas.filter(j => !j.proveedor_id);
        const jornadasProveedores = obra.jornadas.filter(j => j.proveedor_id);

        // Agrupar todos los trabajadores en una sola línea con rango de fechas
        if (jornadasTrabajadores.length > 0) {
          const totalManoObra = jornadasTrabajadores.reduce((acc, j) => acc + parseFloat(j.total), 0);

          todosLosItems.push({
            descripcion: `mano de obra`,
            cantidad: 1,
            precio_unitario: totalManoObra
          });
        }

        // Proveedores por separado con su fecha
        jornadasProveedores.forEach(j => {
          const textoBase = j.descripcion_factura || `mano de obra`;
          todosLosItems.push({
            descripcion: textoBase,
            cantidad: 1,
            precio_unitario: parseFloat(j.importe_proveedor || j.total)
          });
        });
      }

      const totalBrutoReal = todosLosItems.reduce((acc, item) => acc + (parseFloat(item.cantidad) * parseFloat(item.precio_unitario)), 0);
      const porcentajeIva = parseFloat(ivaFactura);
      const importeIva = totalBrutoReal * (porcentajeIva / 100);
      const totalFactura = totalBrutoReal + importeIva;

      const resNumero = await api.obtenerProximoCorrelativo('factura');
      const añoCorto = new Date().getFullYear().toString().slice(-2);
      const proximoNumero = resNumero?.next || `001/${añoCorto}`;

      const cargaUtil = {
        numero_factura: proximoNumero,
        fecha_factura: new Date().toISOString().split('T')[0],
        cliente_id: obra.cliente_id,
        presupuesto_id: obra.presupuesto_id,
        oficio: obra.titulo,
        total_bruto: totalBrutoReal,
        iva_porcentaje: porcentajeIva,
        iva_importe: importeIva,
        total_factura: totalFactura,
        estado: 'pendiente',
        items: todosLosItems
      };

      const res = await api.crearFactura(cargaUtil);
      if (res && res.id) {
        mostrarNotificacion(`Factura ${cargaUtil.numero_factura} generada como pendiente de cobro.`);
        setTimeout(() => navegar('/facturas'), 1500);
      } else {
        throw new Error("La API no devolvió el ID de la factura creada.");
      }
    } catch (error) {
      console.error(error);
      mostrarNotificacion("Error al generar la factura: " + (error.mensaje || ""), "danger");
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) return <div className="p-4 text-center"><div className="spinner-border text-primary"></div></div>;
  if (!obra) return <div className="p-4 text-center text-danger">Obra no encontrada.</div>;

  const totalPresupuesto = parseFloat(obra.presupuesto_total || 0);
  const totalGastadoReal = parseFloat(obra.gastado || 0);
  const beneficio = totalPresupuesto - totalGastadoReal;
  const porcentajeRentabilidad = totalPresupuesto > 0 ? ((beneficio / totalPresupuesto) * 100).toFixed(1) : 0;

  const gastosComputables = obra.gastos?.filter(g => g.es_extra != 1) || [];
  const gastosExtra = obra.gastos?.filter(g => g.es_extra == 1) || [];

  const subtotalGastos = gastosComputables.reduce((acc, g) => acc + parseFloat(g.importe), 0) || 0;
  const subtotalManoObra = obra.jornadas?.reduce((acc, j) => acc + parseFloat(j.total), 0) || 0;
  const subtotalExtra = gastosExtra.reduce((acc, g) => acc + parseFloat(g.importe), 0) || 0;

  const facturaGenerada = parseInt(obra.creado_factura || 0) > 0;

  return (
    <div className="diseño-corporativo">
      <ModalConfirmacion
        visible={modalConfirmacion.visible}
        mensaje={
          modalConfirmacion.tipo === 'gasto' ? '¿Estás seguro de eliminar este movimiento?' :
            modalConfirmacion.tipo === 'jornada' ? '¿Eliminar este registro de trabajo?' :
              '¿Deseas generar la factura con los datos del presupuesto?'
        }
        tipo={modalConfirmacion.tipo === 'factura' ? 'success' : 'danger'}
        textoConfirmar={modalConfirmacion.tipo === 'factura' ? 'Sí, generar' : 'Eliminar'}
        alConfirmar={async () => {
          const { id: idModal, tipo } = modalConfirmacion;
          setModalConfirmacion({ visible: false, id: null, tipo: null });
          if (tipo === 'gasto') {
            try { await api.borrarGasto(idModal); cargarObra(); mostrarNotificacion('Movimiento eliminado'); }
            catch { mostrarNotificacion('Error al eliminar', 'danger'); }
          } else if (tipo === 'jornada') {
            try { await api.borrarJornada(idModal); cargarObra(); mostrarNotificacion('Registro de trabajo eliminado'); }
            catch { mostrarNotificacion('Error al eliminar jornada', 'danger'); }
          } else if (tipo === 'factura') {
            ejecutarGenerarFactura();
          }
        }}
        alCancelar={() => setModalConfirmacion({ visible: false, id: null, tipo: null })}
      />
      {/* NOTIFICACIÓN */}
      {notificacion.mensaje && (
        <div className={`alert alert-${notificacion.tipo} alert-dismissible fade show shadow-sm border-0 mb-4`} role="alert">
          <i className={`bi bi-${notificacion.tipo === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2`}></i>
          {notificacion.mensaje}
          <button type="button" className="btn-close" onClick={() => setNotificacion({ mensaje: "", tipo: "" })}></button>
        </div>
      )}

      {/* AVISO DE OBRA BLOQUEADA POR FACTURACIÓN */}
      {facturaGenerada && (
        <div className="alert alert-info border-0 shadow-sm mb-4 d-flex align-items-center" role="alert">
          <i className="bi bi-lock-fill fs-3 me-3"></i>
          <div>
            <h5 className="alert-heading fw-bold mb-1">Obra Facturada</h5>
            <p className="mb-0">Esta obra ya tiene una factura vinculada. Los gastos y jornadas están bloqueados para edición. Borra la factura para realizar cambios.</p>
          </div>
        </div>
      )}

      {/* CABECERA DE NAVEGACIÓN */}
      <div className="cabecera-pagina mb-4 gap-3 align-items-start align-items-md-center">
        <div className="d-flex align-items-center gap-3">
          <button
            className="btn btn-outline-secondary btn-sm px-3"
            onClick={() => navegar(-1)}
          >
            <i className="bi bi-arrow-left"></i> Volver
          </button>
          <div>
            <h1 className="titulo-pagina m-0">{obra.titulo || "Expediente sin título"}</h1>
            <p className="subtitulo-pagina m-0">Ref: <span className="fw-bold text-dark">{obra.numero_obra}</span> | Cliente: <span className="fw-bold text-dark">{obra.cliente_nombre}</span></p>
          </div>
        </div>
        <div className="ms-auto d-flex align-items-center gap-3">
          <button
            className="btn btn-primary fw-bold px-4"
            onClick={alGenerarFactura}
            disabled={guardando || facturaGenerada}
          >
            <i className="bi bi-receipt me-2"></i>
            {facturaGenerada ? 'FACTURA GENERADA' : 'GENERAR FACTURA'}
          </button>
          <span className={`badge ${obra.estado === 'cerrada' ? 'bg-secondary' : 'bg-success'} px-3 py-2 fs-6`}>
            {obra.estado === 'cerrada' ? 'CERRADA' : 'EN CURSO'}
          </span>
        </div>
      </div>

      {/* TARJETAS DE KPI FINANCIEROS */}
      <div className="rejilla-kpi mb-4">
        <div className="tarjeta-kpi kpi-azul">
          <span className="titulo-kpi">Presupuesto Total</span>
          <span className="valor-kpi">{totalPresupuesto.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
        </div>
        <div className="tarjeta-kpi kpi-rojo">
          <span className="titulo-kpi">Total Gastado</span>
          <span className="valor-kpi text-danger">{totalGastadoReal.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
        </div>
        <div className="tarjeta-kpi kpi-verde">
          <div className="d-flex justify-content-between align-items-center">
            <span className="titulo-kpi">Margen / Beneficio</span>
            <span className={`badge ${beneficio >= 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
              {porcentajeRentabilidad}%
            </span>
          </div>
          <span className={`valor-kpi ${beneficio >= 0 ? 'text-success' : 'text-danger'}`}>
            {beneficio.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
          </span>
        </div>
      </div>

      <div className="row g-4">
        {/* === SECCIÓN 1: GASTOS GENERALES === */}
        <div className="col-lg-6">
          <div className="tarjeta-corporativa p-0 h-100 overflow-hidden" id="seccion-materiales">
            <div className="p-3 bg-white border-bottom border-2 border-primary">
              <h6 className="m-0 fw-bold text-dark d-flex align-items-center">
                <span className="bg-primary bg-opacity-10 text-primary rounded p-2 me-2">
                  <i className="bi bi-cart"></i>
                </span>
                MATERIALES Y COMPRAS
              </h6>
            </div>
            <div className="table-responsive">
              <table className="table table-striped table-hover align-middle mb-0">
                <thead className="table-light text-muted small text-uppercase">
                  <tr>
                    <th className="ps-4">Fecha</th>
                    <th>Concepto</th>
                    <th className="text-end pe-4">Importe</th>
                    {!facturaGenerada && <th className="text-end pe-4">Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {gastosComputables.length > 0 ? (
                    gastosComputables.map((gasto) => {
                      const importe = parseFloat(gasto.importe);
                      const esIngreso = importe < 0;
                      return (
                        <tr key={gasto.id}>
                          <td className="ps-4 text-muted small">{gasto.fecha}</td>
                          <td className="fw-medium">{gasto.concepto}</td>
                          <td className={`text-end pe-4 fw-bold ${esIngreso ? 'text-success' : 'text-danger'}`}>{esIngreso ? "+" : "-"}{Math.abs(importe).toFixed(2)} €</td>
                          {!facturaGenerada && (
                            <td className="text-end pe-4">
                              <div className="d-flex justify-content-end gap-2">
                                <button
                                  className="btn btn-sm btn-link text-primary p-0"
                                  onClick={() => alEditarGasto(gasto)}
                                  title="Editar"
                                >
                                  <i className="bi bi-pencil-square fs-5"></i>
                                </button>
                                <button
                                  className="btn btn-sm btn-link text-danger p-0"
                                  onClick={() => alEliminarGasto(gasto.id)}
                                  title="Eliminar"
                                >
                                  <i className="bi bi-trash fs-5"></i>
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center py-4 text-muted">No hay gastos registrados aún.</td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-light fw-bold" style={{ borderTop: '2px solid #dee2e6' }}>
                  <tr>
                    <td colSpan="2" className="text-end text-uppercase small text-muted pe-3">Total Materiales:</td>
                    <td className="text-end pe-4 fs-5 text-dark">{subtotalGastos.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</td>
                    {!facturaGenerada && <td></td>}
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* HERRAMIENTA DE IMPORTACIÓN */}
            {!facturaGenerada && presupuestoItems.length > 0 && (
              <div className="bg-white border-top border-bottom p-3">
                <button className="btn btn-outline-primary w-100 fw-bold" onClick={() => setMostrarImportar(!mostrarImportar)}>
                  <i className="bi bi-box-arrow-in-down me-2"></i>
                  {mostrarImportar ? "Cancelar importación" : "Añadir partidas del Presupuesto..."}
                </button>

                {mostrarImportar && (
                  <div className="mt-3 bg-light border p-3 rounded shadow-sm">
                    <h6 className="fw-bold text-dark mb-3">Selecciona las partidas a añadir como Compra/Material</h6>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <button className="btn btn-sm btn-link text-decoration-none p-0" onClick={seleccionarTodosItems}>
                        {itemsSeleccionados.length === presupuestoItems.length ? "Desmarcar todo" : "Seleccionar todo"}
                      </button>
                      <span className="small badge bg-primary rounded-pill text-white">{itemsSeleccionados.length} seleccionados</span>
                    </div>

                    <div className="list-group mb-3 border border-secondary border-opacity-25" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {presupuestoItems.map((item, index) => {
                        const estaSeleccionado = itemsSeleccionados.includes(index);
                        const calcImporte = parseFloat(item.cantidad || 1) * parseFloat(item.precio_unitario || 0);
                        const valorInput = preciosPersonalizados[index] !== undefined ? preciosPersonalizados[index] : calcImporte.toFixed(2);

                        return (
                          <div key={index} className={`list-group-item ${estaSeleccionado ? 'bg-primary bg-opacity-10 border-primary border-opacity-25' : ''} d-flex justify-content-between align-items-center mb-1 rounded p-2`} style={{ borderLeft: estaSeleccionado ? '4px solid #0d6efd' : '' }}>
                            <div className="d-flex align-items-center" style={{ width: '70%', cursor: 'pointer' }} onClick={() => toggleSeleccionItem(index)}>
                              <input className="form-check-input me-3" style={{ transform: "scale(1.2)" }} type="checkbox" checked={estaSeleccionado} readOnly />
                              <div>
                                <div className="fw-medium small text-dark" style={{ whiteSpace: 'normal', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }} title={item.descripcion}>{item.descripcion}</div>
                                <div className="text-muted mt-1" style={{ fontSize: '0.75rem' }}>Presupuestado: {item.cantidad} Ud. x {parseFloat(item.precio_unitario || 0).toFixed(2)}€ ({calcImporte.toFixed(2)}€)</div>
                              </div>
                            </div>
                            <div className="d-flex align-items-center gap-1 flex-shrink-0 ms-2" style={{ width: '95px' }} onClick={e => e.stopPropagation()}>
                              <input
                                type="number"
                                step="0.01"
                                className={`form-control form-control-sm text-end fw-bold shadow-sm ${estaSeleccionado ? 'text-primary border-primary' : 'text-secondary border-secondary'}`}
                                value={valorInput}
                                onChange={(e) => setPreciosPersonalizados({ ...preciosPersonalizados, [index]: e.target.value })}
                                disabled={!estaSeleccionado}
                                placeholder="0.00"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <span className="small text-muted fw-bold">€</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button className="btn btn-primary w-100 fw-bold py-2 shadow-sm" disabled={itemsSeleccionados.length === 0 || guardando} onClick={alImportarItems}>
                      <i className="bi bi-plus-circle me-2"></i>Añadir {itemsSeleccionados.length} partida(s) al control
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* FORMULARIO GASTOS */}
            {!facturaGenerada && (
              <div className="p-4 bg-light border-top" id="formulario-gastos">
                <h6 className="fw-bold text-primary mb-3">
                  {gastoEditar ? "✏️ Editar Movimiento" : "➕ Nuevo Gasto / Compra"}
                </h6>
                <form onSubmit={(e) => alAgregarGasto(e, false)}>
                  {/* Selector Tipo Movimiento */}
                  <div className="btn-group w-100 mb-3" role="group">
                    <input
                      type="radio"
                      className="btn-check"
                      name="tipoMovimiento"
                      id="radioGasto"
                      autoComplete="off"
                      checked={tipoMovimiento === 'gasto'}
                      onChange={() => setTipoMovimiento('gasto')}
                    />
                    <label className={`btn ${tipoMovimiento === 'gasto' ? 'btn-danger' : 'btn-outline-danger'}`} htmlFor="radioGasto">
                      <i className="bi bi-dash-circle me-2"></i>Gasto (Salida)
                    </label>

                    <input
                      type="radio"
                      className="btn-check"
                      name="tipoMovimiento"
                      id="radioIngreso"
                      autoComplete="off"
                      checked={tipoMovimiento === 'ingreso'}
                      onChange={() => setTipoMovimiento('ingreso')}
                    />
                    <label className={`btn ${tipoMovimiento === 'ingreso' ? 'btn-success' : 'btn-outline-success'}`} htmlFor="radioIngreso">
                      <i className="bi bi-plus-circle me-2"></i>Ingreso (Devolución)
                    </label>
                  </div>

                  <div className="row g-2">
                    <div className="col-md-8">
                      <label className="form-label small fw-bold text-muted">Concepto</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Concepto (ej: Material eléctrico, Abono...)"
                        value={nuevoConcepto}
                        onChange={(e) => setNuevoConcepto(e.target.value)}
                        required
                        id="entradaConcepto"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">Importe</label>
                      <div className="input-group">
                        <input
                          type="number"
                          step="0.01"
                          className="form-control fw-bold"
                          placeholder="0.00"
                          value={nuevoGasto}
                          onChange={(e) => setNuevoGasto(e.target.value)}
                          required
                          id="entradaImporte"
                        />
                        <span className="input-group-text">€</span>
                      </div>
                    </div>
                    <div className="col-12 mt-3">
                      <button
                        type="submit"
                        className={`btn w-100 py-2 fw-bold ${tipoMovimiento === 'gasto' ? 'btn-danger' : 'btn-success'}`}
                        disabled={guardando}
                        id="botonGuardarGasto"
                      >
                        {gastoEditar ? "Actualizar Movimiento" : (tipoMovimiento === 'gasto' ? "Registrar Gasto" : "Registrar Ingreso")}
                      </button>
                      {gastoEditar && (
                        <button type="button" className="btn btn-link btn-sm w-100 text-muted mt-1" onClick={limpiarFormulario}>
                          Cancelar edición
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* === SECCIÓN 2: MANO DE OBRA === */}
        <div className="col-lg-6">
          <div className="tarjeta-corporativa p-0 h-100 overflow-hidden" id="seccion-mano-obra">
            <div className="p-3 bg-white border-bottom border-2 border-warning">
              <h6 className="m-0 fw-bold text-dark d-flex align-items-center">
                <span className="bg-warning bg-opacity-25 text-dark rounded p-2 me-2">
                  <i className="bi bi-person-badge"></i>
                </span>
                MANO DE OBRA
              </h6>
            </div>
            <div className="table-responsive">
              <table className="table table-striped table-hover align-middle mb-0">
                <thead className="table-light text-muted small text-uppercase">
                  <tr>
                    <th className="ps-4">Fecha</th>
                    <th>Trabajador</th>
                    <th>Tipo</th>
                    <th className="text-end pe-4">Coste</th>
                    {!facturaGenerada && <th className="text-end pe-4">Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {obra.jornadas && obra.jornadas.length > 0 ? (
                    obra.jornadas.map((jornada) => (
                      <tr key={jornada.id}>
                        <td className="ps-4 text-muted small">{new Date(jornada.fecha).toLocaleDateString()}</td>
                        <td className="fw-medium">
                          {jornada.proveedor_nombre
                            ? <><span className="badge bg-info-subtle text-info border border-info-subtle me-1"><i className="bi bi-truck me-1"></i>Proveedor</span>{jornada.proveedor_nombre}</>
                            : jornada.trabajador_nombre
                          }
                        </td>
                        <td>
                          {jornada.proveedor_nombre
                            ? <span className="badge bg-info-subtle text-info border border-info-subtle">Importe fijo</span>
                            : <span className="badge bg-white border text-dark">
                              {jornada.tipo === 'dia' ? 'Día' : jornada.tipo === 'sabado' ? 'Sábado' : 'Horas'}
                              {jornada.cantidad > 1 && ` (${jornada.cantidad})`}
                            </span>
                          }
                        </td>
                        <td className="text-end pe-4 fw-bold text-danger">-{parseFloat(jornada.total).toFixed(2)} €</td>
                        {!facturaGenerada && (
                          <td className="text-end pe-4">
                            <button className="btn btn-sm btn-link text-danger p-0" onClick={() => alEliminarJornada(jornada.id)} title="Eliminar">
                              <i className="bi bi-trash fs-5"></i>
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-muted">No hay jornadas registradas.</td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-light fw-bold" style={{ borderTop: '2px solid #dee2e6' }}>
                  <tr>
                    <td colSpan="3" className="text-end text-uppercase small text-muted pe-3">Total Mano de Obra:</td>
                    <td className="text-end pe-4 fs-5 text-dark">{subtotalManoObra.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</td>
                    {!facturaGenerada && <td></td>}
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* FORMULARIO JORNADAS */}
            {!facturaGenerada && (
              <div className="p-4 bg-light border-top" id="formulario-jornadas">
                <h6 className="fw-bold mb-3 text-uppercase" style={{ color: '#d68c00' }}>
                  ➕ Imputar Jornada (Trabajador)
                </h6>
                <form onSubmit={alAgregarJornada}>
                  <div className="row g-2">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">Trabajador</label>
                      <select
                        className="form-select"
                        value={nuevaJornada.trabajador_id}
                        onChange={e => setNuevaJornada({ ...nuevaJornada, trabajador_id: e.target.value })}
                        required
                        id="seleccionTrabajador"
                      >
                        <option value="">Seleccionar Trabajador...</option>
                        {trabajadores.map(t => (
                          <option key={t.id} value={t.id}>{t.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">Fecha</label>
                      <input
                        type="date"
                        className="form-control"
                        value={nuevaJornada.fecha}
                        onChange={e => setNuevaJornada({ ...nuevaJornada, fecha: e.target.value })}
                        id="fechaJornada"
                      />
                    </div>
                    <div className="col-md-5">
                      <label className="form-label small fw-bold text-muted">Tipo</label>
                      <select
                        className="form-select"
                        value={nuevaJornada.tipo}
                        onChange={e => setNuevaJornada({ ...nuevaJornada, tipo: e.target.value })}
                        id="tipoDeJornada"
                      >
                        <option value="dia">Día Completo</option>
                        <option value="sabado">Sábado</option>
                        <option value="hora">Horas Sueltas</option>
                      </select>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-bold text-muted">Cant.</label>
                      <input
                        type="number"
                        step="0.5"
                        className="form-control"
                        placeholder="Cant."
                        value={nuevaJornada.cantidad}
                        onChange={e => setNuevaJornada({ ...nuevaJornada, cantidad: e.target.value })}
                        id="cantidadJornada"
                      />
                    </div>
                    <div className="col-md-4">
                      <button type="submit" className="btn btn-warning w-100 py-2 fw-bold text-dark mt-4" disabled={guardando} id="botonImputar">
                        + Imputar
                      </button>
                    </div>
                  </div>
                </form>

                {/* FORMULARIO PROVEEDOR */}
                <hr className="my-3" />
                <h6 className="fw-bold mb-3 text-uppercase" style={{ color: '#0d6efd' }}>
                  <i className="bi bi-truck me-2"></i>Coste de Proveedor
                </h6>
                <form onSubmit={alAgregarJornadaProveedor}>
                  <div className="row g-2">
                    <div className="col-md-5">
                      <label className="form-label small fw-bold text-muted">Proveedor</label>
                      <select
                        className="form-select"
                        value={nuevaJornadaProveedor.proveedor_id}
                        onChange={e => setNuevaJornadaProveedor({ ...nuevaJornadaProveedor, proveedor_id: e.target.value })}
                        required
                        id="seleccionProveedor"
                      >
                        <option value="">Seleccionar Proveedor...</option>
                        {proveedores.map(p => (
                          <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-bold text-muted">Fecha</label>
                      <input
                        type="date"
                        className="form-control"
                        value={nuevaJornadaProveedor.fecha}
                        onChange={e => setNuevaJornadaProveedor({ ...nuevaJornadaProveedor, fecha: e.target.value })}
                        id="fechaProveedor"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-muted">Importe (€)</label>
                      <div className="input-group">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="form-control fw-bold"
                          placeholder="0.00"
                          value={nuevaJornadaProveedor.importe}
                          onChange={e => setNuevaJornadaProveedor({ ...nuevaJornadaProveedor, importe: e.target.value })}
                          required
                          id="importeProveedor"
                        />
                        <span className="input-group-text">€</span>
                      </div>
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-bold text-muted">Descripción para factura (opcional)</label>
                      <textarea
                        className="form-control mb-2"
                        rows="2"
                        placeholder="Escribe cómo quieres que aparezca este concepto en la factura (ej: Alquiler de andamios, Pintura fachada...)"
                        value={nuevaJornadaProveedor.descripcion_factura}
                        onChange={e => setNuevaJornadaProveedor({ ...nuevaJornadaProveedor, descripcion_factura: e.target.value })}
                        id="descripcionProveedorFactura"
                      ></textarea>
                    </div>
                    <div className="col-12">
                      <button type="submit" className="btn btn-primary w-100 py-2 fw-bold" disabled={guardando} id="botonRegistrarProveedor">
                        <i className="bi bi-truck me-2"></i>Registrar Coste Proveedor
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>



      </div>

      {/* === RESUMEN TOTAL INFERIOR === */}
      <div className="tarjeta-corporativa bg-dark text-white p-4 mt-4 shadow" style={{ borderRadius: '2px' }}>
        <div className="row align-items-center">
          <div className="col-md-8">
            <h4 className="m-0 fw-bold text-uppercase">Total Costes de Obra (Oficial)</h4>
            <p className="m-0 text-white-50">Suma de Materiales y Mano de Obra.</p>
          </div>
          <div className="col-md-4 text-md-end mt-3 mt-md-0">
            <div className="display-4 fw-bold text-danger">
              {(subtotalGastos + subtotalManoObra).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE CONFIRMACIÓN PARA FACTURA */}
      {modalConfirmacion.tipo === 'factura' && modalConfirmacion.visible && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }} id="modalFactura">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '2px' }}>
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">Configurar Factura</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setModalConfirmacion({ visible: false, id: null, tipo: null })}></button>
              </div>
              <div className="modal-body p-4">
                <div className="text-center mb-4">
                  <i className="bi bi-file-earmark-diff text-primary" style={{ fontSize: '3rem' }}></i>
                </div>
                <p className="fs-5 mb-3 text-center">¿Deseas generar la factura oficial ahora?</p>

                <div className="mb-3">
                  <label className="form-label fw-bold">IVA a aplicar (%)</label>
                  <select
                    className="form-select"
                    value={ivaFactura}
                    onChange={(e) => setIvaFactura(e.target.value)}
                    id="seleccionIva"
                  >
                    <option value="0">0% (Exento)</option>
                    <option value="4">4% (Superreducido)</option>
                    <option value="10">10% (Reducido)</option>
                    <option value="21">21% (General)</option>
                  </select>
                </div>

                <div className="p-3 bg-light rounded border mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Total Bruto:</span>
                    <span className="fw-bold">{(totalPresupuesto / (1 + ivaFactura / 100)).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
                  </div>
                  <div className="d-flex justify-content-between small text-muted">
                    <span>IVA (%):</span>
                    <span>{ivaFactura}%</span>
                  </div>
                  <hr />
                  <div className="d-flex justify-content-between fs-5 text-primary">
                    <span className="fw-bold">Total Factura:</span>
                    <span className="fw-bold">{totalPresupuesto.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
                  </div>
                </div>

                <div className="alert alert-warning small border-0 mb-0">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  La obra quedará bloqueada para edición una vez generada la factura.
                </div>
              </div>
              <div className="modal-footer border-0 p-4 pt-0">
                <button type="button" className="btn btn-outline-secondary px-4" onClick={() => setModalConfirmacion({ visible: false, id: null, tipo: null })}>Cancelar</button>
                <button type="button" className="btn btn-primary px-4 fw-bold" onClick={() => { setModalConfirmacion({ visible: false, id: null, tipo: null }); ejecutarGenerarFactura(); }} disabled={guardando}>Confirmar y Generar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}