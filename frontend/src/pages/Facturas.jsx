import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import FacturaForm from "../components/FacturaForm";
import ModalNombreArchivo from "../components/ModalNombreArchivo";

export default function Facturas() {
    const [facturas, setFacturas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [notificacion, setNotificacion] = useState({ mensaje: "", tipo: "" });
    const [error, setError] = useState(null);
    const [terminoBusqueda, setTerminoBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] = useState("todos");

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

    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [facturaEnEdicion, setFacturaEnEdicion] = useState(null);

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
        setNotificacion({ mensaje: mensaje, tipo });
        setTimeout(() => setNotificacion({ mensaje: "", tipo: "" }), 5000);
    };

    useEffect(() => {
        cargarFacturas();
    }, []);

    const cargarFacturas = async () => {
        try {
            setCargando(true);
            const datos = await api.obtenerFacturas();
            setFacturas(datos || []);
        } catch (err) {
            setError("Error cargando facturas: " + err.mensaje);
        } finally {
            setCargando(false);
        }
    };

    const alBorrarFactura = (idFactura) => {
        solicitarConfirmacion(
            "¿Estás seguro de que quieres eliminar esta factura? Esta acción no se puede deshacer.",
            async () => {
                try {
                    await api.borrarFactura(idFactura);
                    cargarFacturas();
                    mostrarNotificacion("Factura eliminada");
                } catch (err) {
                    mostrarNotificacion("Error al eliminar: " + err.mensaje, "danger");
                }
            },
            "danger",
            "Eliminar Factura"
        );
    };

    const alNuevaFactura = () => {
        setFacturaEnEdicion(null);
        setMostrarFormulario(true);
    };

    const alEditar = (factura) => {
        setFacturaEnEdicion(factura);
        setMostrarFormulario(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const actualizarCampoRapido = async (factura, campo, valor) => {
        try {
            const payload = {
                id: factura.id,
                only_status: true,
                estado: campo === 'estado' ? valor : factura.estado,
                forma_pago: campo === 'forma_pago' ? valor : (factura.forma_pago || 'Transferencia bancaria')
            };
            await api.actualizarFactura(factura.id, payload);
            cargarFacturas();
        } catch (err) {
            mostrarNotificacion("Error: " + err.message, "danger");
        }
    };

    const alGenerarDocumento = async (facturaId, formato) => {
        try {
            mostrarNotificacion(`Preparando ${formato.toUpperCase()}...`);
            const pCompleto = await api.obtenerFactura(facturaId);
            const config = await api.obtenerConfiguracion();
            const clientesStr = await api.obtenerClientes();
            const cliente = clientesStr.find(c => c.id == pCompleto.cliente_id) || {};

            const cargaUtil = {
                factura: {
                    numero_factura: pCompleto.numero_factura || 'Borrador',
                    fecha_factura: pCompleto.fecha_factura || new Date().toISOString().split('T')[0],
                    nombre_obra: pCompleto.oficio || '',
                    iva_porcentaje: Number(pCompleto.iva_porcentaje ?? 21)
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
                forma_pago: pCompleto.forma_pago || 'Transferencia bancaria'
            };

            // Calcular nombre por defecto: Factura_001-26
            const nSerie = pCompleto.numero_factura || 'Borrador';
            const extension = formato === 'excel' ? 'xlsx' : 'pdf';
            const nombreDefecto = `Factura_${nSerie.replace(/\//g, '-')}`;

            // Guardar datos y abrir modal de nombre
            setModalNombre({ visible: true, nombreDefecto, extension, datosPendientes: { cargaUtil, extension } });
        } catch (err) {
            mostrarNotificacion(`Error preparando documento: ${err.message}`, "danger");
        }
    };

    const ejecutarDescargaFactura = async (nombreElegido) => {
        const { cargaUtil, extension } = modalNombre.datosPendientes;
        setModalNombre(prev => ({ ...prev, visible: false }));
        try {
            mostrarNotificacion(`Generando archivo...`);
            const blob = await api.exportarFactura(cargaUtil);
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

    const facturasFiltradas = facturas.filter(f => {
        const busqueda = terminoBusqueda.toLowerCase();
        const coincideEstado = filtroEstado === "todos" || f.estado === filtroEstado;
        const coincideBusqueda = f.numero_factura?.toLowerCase().includes(busqueda) ||
            f.cliente_nombre?.toLowerCase().includes(busqueda) || f.oficio?.toLowerCase().includes(busqueda);
        return coincideEstado && coincideBusqueda;
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
                onDescargar={ejecutarDescargaFactura}
                onCancelar={() => setModalNombre(prev => ({ ...prev, visible: false }))}
            />
            {/* CABECERA */}
            <div className="cabecera-pagina mb-4 gap-3">
                <div>
                    <h1 className="titulo-pagina">Facturación</h1>
                    <p className="subtitulo-pagina">Generación y registro de cobros.</p>
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
                            className="btn btn-outline-secondary px-4 py-2"
                            onClick={alNuevaFactura}
                            id="botonNuevaFactura"
                        >
                            <i className="bi bi-file-earmark-plus me-2"></i>Nueva Factura
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

            {error && <div className="alert alert-danger mb-4 shadow-sm" id="mensajeError">{error}</div>}

            <AnimatePresence mode="wait">
                {!mostrarFormulario ? (
                    <motion.div
                        key="filtros"
                        {...animacionEntrada}
                        className="p-3 bg-white border rounded shadow-sm d-flex flex-column flex-md-row gap-3 mb-4"
                        id="seccionFiltrosFacturas"
                    >
                        <div className="flex-grow-1">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Buscar por número, cliente u oficio..."
                                value={terminoBusqueda}
                                onChange={(e) => setTerminoBusqueda(e.target.value)}
                                id="filtroTextoFacturas"
                            />
                        </div>
                        <div style={{ width: '180px' }}>
                            <select
                                className="form-select text-uppercase fw-bold small"
                                value={filtroEstado}
                                onChange={(e) => setFiltroEstado(e.target.value)}
                                id="filtroEstadoFactura"
                            >
                                <option value="todos">Todos los estados</option>
                                <option value="borrador">Borrador</option>
                                <option value="pendiente">Pendiente</option>
                                <option value="pagada">Pagada</option>
                                <option value="cancelada">Cancelada</option>
                            </select>
                        </div>
                        <div className="d-flex align-items-center text-muted small px-3">
                            Mostrando {facturasFiltradas.length} resultados
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="formulario"
                        {...animacionEntrada}
                        id="seccionFormularioFactura"
                    >
                        <FacturaForm
                            factura={facturaEnEdicion}
                            onSaved={() => {
                                setMostrarFormulario(false);
                                setFacturaEnEdicion(null);
                                cargarFacturas();
                            }}
                            onCancel={() => {
                                setMostrarFormulario(false);
                                setFacturaEnEdicion(null);
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>


            {!mostrarFormulario && (
                <div className="row g-4" id="rejilla-facturas">
                    {cargando ? (
                        <div className="col-12 text-center py-5">
                            <div className="spinner-border text-primary spinner-border-sm me-2"></div>
                            Cargando facturas...
                        </div>
                    ) : facturasFiltradas.length === 0 ? (
                        <div className="col-12 text-center py-5 text-muted">
                            <i className="bi bi-file-earmark-x display-1 opacity-25"></i>
                            <h4 className="fw-bold mt-3">No se han encontrado facturas.</h4>
                        </div>
                    ) : (
                        facturasFiltradas.map((f) => (
                            <div key={f.id} className="col-12 col-md-6 col-xl-4 d-flex">
                                <div className="card shadow border-0 position-relative w-100 flex-column" style={{ borderRadius: '12px', transition: 'all 0.3s ease' }}>

                                    <div style={{ height: '6px', borderTopLeftRadius: '12px', borderTopRightRadius: '12px', backgroundColor: f.estado === 'pagada' ? '#10b981' : f.estado === 'pendiente' ? '#f59e0b' : f.estado === 'cancelada' ? '#ef4444' : '#6b7280' }}></div>

                                    <div className="card-body p-4 d-flex flex-column h-100">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <span className="badge bg-light text-dark border font-monospace shadow-sm" style={{ letterSpacing: '0.5px' }}>{f.numero_factura}</span>
                                            {f.estado !== 'pagada' ? (
                                                <button className="btn btn-sm btn-link text-danger p-0 border-0" onClick={() => alBorrarFactura(f.id)} title="Eliminar Factura">
                                                    <i className="bi bi-trash"></i>
                                                </button>
                                            ) : (
                                                <button className="btn btn-sm btn-link text-secondary p-0 border-0 opacity-50" title="Bloqueado contablemente por estar PAGADA" disabled style={{ cursor: 'not-allowed' }}>
                                                    <i className="bi bi-lock-fill"></i>
                                                </button>
                                            )}
                                        </div>

                                        <h5 className="fw-bold text-dark mb-1 d-flex align-items-center" title={f.cliente_nombre}>
                                            <i className="bi bi-person-circle fs-4 me-2" style={{ color: f.estado === 'pagada' ? '#10b981' : '#2563eb' }}></i>
                                            {f.cliente_nombre || "Cliente sin asignar"}
                                        </h5>

                                        <div className="mb-3 d-flex flex-column gap-2 text-muted small mt-3">
                                            <div className="d-flex justify-content-between border-bottom pb-2">
                                                <span className="d-flex align-items-center"><i className="bi bi-calendar-event me-2"></i> Fecha</span>
                                                <span className="fw-medium text-dark">{new Date(f.fecha_factura).toLocaleDateString('es-ES')}</span>
                                            </div>
                                            <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                                                <span className="d-flex align-items-center"><i className="bi bi-activity me-2"></i> Estado</span>
                                                <select className={`form-select form-select-sm fw-bold border-0 bg-transparent text-end ${f.estado === 'pagada' ? 'text-success' : f.estado === 'pendiente' ? 'text-warning' : f.estado === 'cancelada' ? 'text-danger' : 'text-secondary'}`} style={{ width: '130px', cursor: 'pointer' }} value={f.estado} onChange={(e) => actualizarCampoRapido(f, 'estado', e.target.value)}>
                                                    <option value="borrador">BORRADOR</option>
                                                    <option value="pendiente">PENDIENTE</option>
                                                    <option value="pagada">PAGADA</option>
                                                    <option value="cancelada">CANCELADA</option>
                                                </select>
                                            </div>
                                            <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                                                <span className="d-flex align-items-center"><i className="bi bi-credit-card me-2"></i> Forma de Pago</span>
                                                <select className="form-select form-select-sm border-0 bg-transparent text-end w-auto text-dark" style={{ cursor: 'pointer' }} value={f.forma_pago || "Transferencia bancaria"} onChange={(e) => actualizarCampoRapido(f, 'forma_pago', e.target.value)}>
                                                    <option value="Transferencia bancaria">Transferencia</option>
                                                    <option value="Efectivo">Efectivo</option>
                                                    <option value="Tarjeta">Tarjeta</option>
                                                    <option value="Bizum">Bizum</option>
                                                    <option value="Cheque">Cheque</option>
                                                </select>
                                            </div>
                                        </div>

                                        {f.oficio && (
                                            <div className="mb-3 text-dark small flex-grow-1" style={{ display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                {f.oficio}
                                            </div>
                                        )}

                                        <div className="mt-auto">
                                            <div className="d-flex justify-content-between align-items-end mb-3 bg-light p-3 rounded border">
                                                <small className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.7rem' }}>Total Factura</small>
                                                <span className="fw-bold fs-4 text-primary" style={{ letterSpacing: '-0.5px' }}>
                                                    {parseFloat(f.total_factura || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                                                </span>
                                            </div>

                                            <div className="row g-2 mt-2">
                                                <div className="col-4">
                                                    <button className="btn btn-outline-danger btn-sm w-100 fw-bold d-flex flex-column align-items-center py-2" onClick={() => alGenerarDocumento(f.id, 'pdf')} title="Descargar PDF">
                                                        <i className="bi bi-file-earmark-pdf fs-5 mb-1"></i> PDF
                                                    </button>
                                                </div>
                                                <div className="col-4">
                                                    <button className="btn btn-outline-success btn-sm w-100 fw-bold d-flex flex-column align-items-center py-2" onClick={() => alGenerarDocumento(f.id, 'excel')} title="Descargar Excel">
                                                        <i className="bi bi-file-earmark-excel fs-5 mb-1"></i> Excel
                                                    </button>
                                                </div>
                                                <div className="col-4">
                                                    {f.estado !== 'pagada' ? (
                                                        <button className="btn btn-primary btn-sm w-100 fw-bold text-white d-flex flex-column align-items-center py-2" onClick={() => alEditar(f)} title="Editar Factura">
                                                            <i className="bi bi-pencil-square fs-5 mb-1"></i> Editar
                                                        </button>
                                                    ) : (
                                                        <button className="btn btn-secondary btn-sm w-100 fw-bold text-white d-flex flex-column align-items-center py-2 opacity-50" title="No se puede editar" disabled>
                                                            <i className="bi bi-lock-fill fs-5 mb-1"></i> Cerrada
                                                        </button>
                                                    )}
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
