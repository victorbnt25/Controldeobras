import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import PresupuestoForm from "../components/PresupuestoForm";
import ModalNombreArchivo from "../components/ModalNombreArchivo";

export default function Presupuestos() {
  const [presupuestos, setPresupuestos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const navegar = useNavigate();

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [buscaTexto, setBuscaTexto] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");

  const [notificacion, setNotificacion] = useState({ mensaje: "", tipo: "" });

  // Estado del Formulario
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [presupuestoEnEdicion, setPresupuestoEnEdicion] = useState(null);

  // Modal de confirmaciones web
  const [modalConfirmacion, setModalConfirmacion] = useState({
    visible: false,
    mensaje: "",
    tipo: "danger",
    alConfirmar: null,
    textoConfirmar: "Aceptar"
  });

  // Modal nombre de archivo para descarga
  const [modalNombre, setModalNombre] = useState({ visible: false, nombreDefecto: '', extension: 'pdf', datosPendientes: null });

  const solicitarConfirmacion = (mensaje, accionConfirmar, tipo = "danger", texto = "Aceptar") => {
    setModalConfirmacion({
      visible: true,
      mensaje,
      tipo,
      alConfirmar: accionConfirmar,
      textoConfirmar: texto
    });
  };

  const cerrarModalConfirmacion = () => {
    setModalConfirmacion({ ...modalConfirmacion, visible: false });
  };

  const mostrarNotificacion = (mensaje, tipo = "success") => {
    setNotificacion({ mensaje, tipo });
    setTimeout(() => setNotificacion({ mensaje: "", tipo: "" }), 5000);
  };

  useEffect(() => {
    cargarPresupuestos();
  }, []);

  const cargarPresupuestos = async () => {
    try {
      setCargando(true);
      const datos = await api.obtenerPresupuestos();
      setPresupuestos(datos || []);
    } catch (err) {
      setError("Error al cargar presupuestos");
    } finally {
      setCargando(false);
    }
  };

  const alBorrar = (id) => {
    solicitarConfirmacion(
      "¿Seguro que deseas eliminar este presupuesto? Esta acción no se puede deshacer.",
      async () => {
        try {
          await api.borrarPresupuesto(id);
          cargarPresupuestos();
          mostrarNotificacion("Presupuesto eliminado");
        } catch (err) {
          mostrarNotificacion("Error al eliminar", "danger");
        }
      },
      "danger",
      "Eliminar Presupuesto"
    );
  };

  const alNuevoPresupuesto = () => {
    setPresupuestoEnEdicion(null);
    setMostrarFormulario(true);
  };

  const alEditar = (presupuesto) => {
    setPresupuestoEnEdicion(presupuesto);
    setMostrarFormulario(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const alAceptarPresupuesto = async (presupuestoId) => {
    try {
      const respuesta = await api.aceptarPresupuesto(presupuestoId);
      if (respuesta && respuesta.obra_id) {
        mostrarNotificacion("Presupuesto aceptado y obra creada");
        setTimeout(() => navegar(`/obras/${respuesta.obra_id}`), 1000);
      }
    } catch (error) {
      mostrarNotificacion("Error al crear la obra desde el presupuesto", "danger");
    }
  };

  const alCambiarEstado = (id, nuevoEstado) => {
    solicitarConfirmacion(
      `¿Cambiar el estado de este presupuesto a ${nuevoEstado.toUpperCase()}?`,
      async () => {
        try {
          await api.actualizarPresupuesto({ id, estado: nuevoEstado });
          cargarPresupuestos();
          mostrarNotificacion("Estado actualizado a " + nuevoEstado.toUpperCase());

          if (nuevoEstado === "aceptado") {
            setTimeout(() => {
              solicitarConfirmacion(
                "El presupuesto se ha marcado como ACEPTADO. ¿Deseas crear la obra activa ahora automáticamente?",
                () => alAceptarPresupuesto(id),
                "success",
                "Crear Obra Ahora"
              );
            }, 600); // Dar tiempo a que termine la animación del cierre del modal anterior
          }
        } catch (err) {
          mostrarNotificacion("Error al actualizar estado", "danger");
        }
      },
      nuevoEstado === 'aceptado' ? 'success' : nuevoEstado === 'rechazado' ? 'danger' : 'primary',
      "Confirmar Cambio"
    );
  };

  const alGenerarDocumento = async (presupuestoId, formato) => {
    try {
      mostrarNotificacion(`Preparando ${formato.toUpperCase()}...`);
      const pCompleto = await api.obtenerPresupuesto(presupuestoId);
      const config = await api.obtenerConfiguracion();
      const clientesStr = await api.obtenerClientes();
      const cliente = clientesStr.find(c => c.id == pCompleto.cliente_id) || {};

      const cargaUtil = {
        presupuesto: {
          numero_presupuesto: pCompleto.numero_presupuesto || 'Borrador',
          fecha_presupuesto: pCompleto.fecha_presupuesto || new Date().toISOString().split('T')[0],
          nombre_obra: pCompleto.descripcion_general || '',
          iva_porcentaje: pCompleto.iva_porcentaje || 0
        },
        items: pCompleto.items || [],
        cliente: {
          nombre: cliente.nombre || '',
          cif_dni: cliente.cif_dni || '',
          direccion: cliente.direccion || '',
          poblacion: cliente.poblacion || '',
          ciudad: cliente.ciudad || '',
          codigo_postal: cliente.codigo_postal || '',
          email: cliente.email || ''
        },
        config: config || {},
        format: formato,
        forma_pago: 'Transferencia bancaria o efectivo'
      };

      const nSerie = pCompleto.numero_presupuesto || 'Borrador';
      const extension = formato === 'excel' ? 'xlsx' : 'pdf';
      const nombreDefecto = `Presupuesto_${nSerie.replace(/\//g, '-')}`;

      setModalNombre({ visible: true, nombreDefecto, extension, datosPendientes: { cargaUtil, extension } });
    } catch (err) {
      mostrarNotificacion(`Error preparando documento: ${err.message}`, "danger");
    }
  };

  const ejecutarDescargaPresupuesto = async (nombreElegido) => {
    const { cargaUtil, extension } = modalNombre.datosPendientes;
    setModalNombre(prev => ({ ...prev, visible: false }));
    try {
      mostrarNotificacion(`Generando archivo...`);
      const blob = await api.exportarDocumento(cargaUtil);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${nombreElegido}.${extension}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      mostrarNotificacion(`Archivo descargado correctamente`);
    } catch (err) {
      mostrarNotificacion(`Error generando documento: ${err.message}`, "danger");
    }
  };

  const presupuestosFiltrados = presupuestos.filter(p => {
    const coincideEstado = filtroEstado === "todos" ? p.estado !== "rechazado" : p.estado === filtroEstado;
    const coincideTexto = !buscaTexto ||
      p.numero_presupuesto?.toLowerCase().includes(buscaTexto.toLowerCase()) ||
      p.cliente_nombre?.toLowerCase().includes(buscaTexto.toLowerCase());
    const coincideFecha = !filtroFecha || p.fecha_presupuesto === filtroFecha;

    return coincideEstado && coincideTexto && coincideFecha;
  });

  const animacionEntrada = {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: 0.3, ease: "easeInOut" }
  };

  return (
    <div className="diseño-corporativo">
      <ModalNombreArchivo
        visible={modalNombre.visible}
        nombreDefecto={modalNombre.nombreDefecto}
        extension={modalNombre.extension}
        onDescargar={ejecutarDescargaPresupuesto}
        onCancelar={() => setModalNombre(prev => ({ ...prev, visible: false }))}
      />
      {/* CABECERA */}
      <div className="cabecera-pagina mb-4 gap-3">
        <div>
          <h1 className="titulo-pagina">Presupuestos</h1>
          <p className="subtitulo-pagina">Gestión de ofertas comerciales y proyectos potenciales.</p>
        </div>

        {/* MODAL DE CONFIRMACIÓN */}
        <AnimatePresence>
          {modalConfirmacion.visible && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(3px)'
              }}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded border-0 shadow-lg p-4 mx-3"
                style={{ maxWidth: '450px', width: '100%' }}
              >
                <div className="d-flex align-items-center mb-3">
                  <div className={`rounded-circle bg-${modalConfirmacion.tipo}-subtle p-3 me-3 text-${modalConfirmacion.tipo} d-flex align-items-center justify-content-center`} style={{ width: '50px', height: '50px' }}>
                    <i className={`fs-3 bi bi-${modalConfirmacion.tipo === 'danger' ? 'exclamation-triangle-fill' : modalConfirmacion.tipo === 'success' ? 'check-circle-fill' : 'info-circle-fill'}`}></i>
                  </div>
                  <h5 className="mb-0 fw-bold">Confirmación</h5>
                </div>
                <p className="text-secondary mb-4 ps-1" style={{ fontSize: '1.05rem' }}>{modalConfirmacion.mensaje}</p>
                <div className="d-flex justify-content-end gap-2 mt-2">
                  <button className="btn btn-light fw-bold px-4 border" onClick={cerrarModalConfirmacion}>Cancelar</button>
                  <button
                    className={`btn btn-${modalConfirmacion.tipo} fw-bold px-4`}
                    onClick={() => {
                      if (modalConfirmacion.alConfirmar) modalConfirmacion.alConfirmar();
                      cerrarModalConfirmacion();
                    }}
                  >
                    {modalConfirmacion.textoConfirmar}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!mostrarFormulario && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="btn btn-primary px-4 py-2"
              onClick={alNuevoPresupuesto}
              id="botonNuevoPresupuesto"
            >
              <i className="bi bi-plus-lg me-2"></i>Nuevo Presupuesto
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {notificacion.mensaje && (
        <div className={`alert alert-${notificacion.tipo} alert-dismissible fade show shadow-sm border-0 mb-4`} role="alert">
          <i className={`bi bi-${notificacion.tipo === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2`}></i>
          {notificacion.mensaje}
          <button type="button" className="btn-close" onClick={() => setNotificacion({ mensaje: "", tipo: "" })}></button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {!mostrarFormulario ? (
          <motion.div
            key="filtros"
            {...animacionEntrada}
            className="p-3 bg-white border rounded shadow-sm d-flex flex-column flex-md-row gap-3 mb-4"
            id="seccionFiltros"
          >
            <div className="flex-grow-1">
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por número o cliente..."
                value={buscaTexto}
                onChange={(e) => setBuscaTexto(e.target.value)}
                id="filtroTexto"
              />
            </div>
            <div style={{ width: '180px' }}>
              <select
                className="form-select text-uppercase fw-bold small"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                id="filtroEstado"
              >
                <option value="todos">Todos los estados</option>
                <option value="borrador">Borrador</option>
                <option value="pendiente">Pendiente</option>
                <option value="aceptado">Aceptado</option>
                <option value="rechazado">Rechazado</option>
              </select>
            </div>
            <div style={{ width: '160px' }}>
              <input
                type="date"
                className="form-control"
                value={filtroFecha}
                onChange={(e) => setFiltroFecha(e.target.value)}
                id="filtroFecha"
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="formulario"
            {...animacionEntrada}
            id="seccionFormulario"
          >
            <PresupuestoForm
              presupuesto={presupuestoEnEdicion}
              onSaved={() => {
                setMostrarFormulario(false);
                setPresupuestoEnEdicion(null);
                cargarPresupuestos();
              }}
              onCancel={() => {
                setMostrarFormulario(false);
                setPresupuestoEnEdicion(null);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {!mostrarFormulario && (
        <div className="row g-4" id="rejilla-presupuestos">
          {cargando ? (
            <div className="col-12 text-center py-5">
              <div className="spinner-border text-primary spinner-border-sm me-2"></div>
              Cargando presupuestos...
            </div>
          ) : presupuestosFiltrados.length === 0 ? (
            <div className="col-12 text-center py-5 text-muted">
              <i className="bi bi-file-earmark-x display-1 opacity-25"></i>
              <h4 className="fw-bold mt-3">No se han encontrado presupuestos.</h4>
            </div>
          ) : (
            presupuestosFiltrados.map((p) => (
              <div key={p.id} className="col-12 col-md-6 col-xl-4 d-flex">
                <div className="card shadow border-0 position-relative w-100 flex-column" style={{ borderRadius: '12px', transition: 'all 0.3s ease' }}>

                  {/* Etiqueta color superior para destacar estado */}
                  <div style={{ height: '6px', borderTopLeftRadius: '12px', borderTopRightRadius: '12px', backgroundColor: p.estado === 'aceptado' ? '#10b981' : p.estado === 'pendiente' ? '#f59e0b' : p.estado === 'rechazado' ? '#ef4444' : '#6b7280' }}></div>

                  <div className="card-body p-4 d-flex flex-column h-100">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <span className="badge bg-light text-dark border font-monospace shadow-sm" style={{ letterSpacing: '0.5px' }}>{p.numero_presupuesto}</span>
                      <button className="btn btn-sm btn-link text-danger p-0 border-0" onClick={() => alBorrar(p.id)} title="Eliminar Presupuesto">
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>

                    <h5 className="fw-bold text-dark mb-1 d-flex align-items-center" title={p.cliente_nombre}>
                      <i className="bi bi-person-circle fs-4 me-2" style={{ color: p.estado === 'aceptado' ? '#10b981' : '#2563eb' }}></i>
                      {p.cliente_nombre || "Cliente sin asignar"}
                    </h5>

                    <div className="mb-3 d-flex flex-column gap-2 text-muted small mt-3">
                      <div className="d-flex justify-content-between border-bottom pb-2">
                        <span><i className="bi bi-calendar-event me-1"></i> Fecha</span>
                        <span className="fw-medium text-dark">{new Date(p.fecha_presupuesto).toLocaleDateString('es-ES')}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                        <span><i className="bi bi-activity me-1"></i> Estado</span>
                        <select
                          className={`form-select form-select-sm shadow-none fw-bold ${p.estado === 'aceptado' ? 'text-success bg-success-subtle border-success' :
                            p.estado === 'pendiente' ? 'text-warning bg-warning-subtle border-warning' :
                              p.estado === 'rechazado' ? 'text-danger bg-danger-subtle border-danger' :
                                'text-secondary bg-light border-secondary'
                            }`}
                          value={p.estado}
                          onChange={(e) => alCambiarEstado(p.id, e.target.value)}
                          style={{ width: 'auto', fontSize: '0.75rem', cursor: 'pointer' }}
                        >
                          <option value="borrador" className="text-secondary fw-bold">BORRADOR</option>
                          <option value="pendiente" className="text-warning fw-bold">PENDIENTE</option>
                          <option value="aceptado" className="text-success fw-bold">ACEPTADO (Obra)</option>
                          <option value="rechazado" className="text-danger fw-bold">RECHAZADO</option>
                        </select>
                      </div>
                    </div>

                    {p.descripcion_general && (
                      <div className="mb-3 text-muted small fst-italic flex-grow-1" style={{ display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        "{p.descripcion_general}"
                      </div>
                    )}

                    <div className="mt-auto">
                      <div className="d-flex justify-content-between align-items-end mb-3 bg-light p-3 rounded border">
                        <small className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.7rem' }}>Total Bruto</small>
                        <span className="fw-bold fs-4 text-primary" style={{ letterSpacing: '-0.5px' }}>
                          {parseFloat(p.total_bruto || p.total_neto || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                        </span>
                      </div>

                      {/* Botones de acción organizados y bonitos */}
                      <div className="row g-2">
                        <div className="col-4">
                          <button className="btn btn-outline-danger btn-sm w-100 fw-bold d-flex flex-column align-items-center py-2" onClick={() => alGenerarDocumento(p.id, 'pdf')} title="Descargar PDF">
                            <i className="bi bi-file-earmark-pdf fs-5 mb-1"></i> PDF
                          </button>
                        </div>
                        <div className="col-4">
                          <button className="btn btn-outline-success btn-sm w-100 fw-bold d-flex flex-column align-items-center py-2" onClick={() => alGenerarDocumento(p.id, 'excel')} title="Descargar Excel">
                            <i className="bi bi-file-earmark-excel fs-5 mb-1"></i> Excel
                          </button>
                        </div>
                        <div className="col-4">
                          <button className="btn btn-primary btn-sm w-100 fw-bold text-white d-flex flex-column align-items-center py-2" onClick={() => alEditar(p)} title="Editar Presupuesto">
                            <i className="bi bi-pencil-square fs-5 mb-1"></i> Editar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}