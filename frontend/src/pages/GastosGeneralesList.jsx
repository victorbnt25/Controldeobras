import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../services/api";
import ModalConfirmacion from "../components/ModalConfirmacion";

const TypeaheadSelect = ({ data, idKey, labelKey, placeholder, value, onChange, isRequired }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (value) {
            const selected = data.find(item => item[idKey] == value);
            if (selected) setSearchTerm(selected[labelKey]);
        } else {
            setSearchTerm("");
        }
    }, [value, data, idKey, labelKey]);

    const filtered = data.filter(item =>
        item[labelKey]?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="position-relative">
            <input
                type="text"
                className="form-control"
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsOpen(true);
                    onChange(""); // reset id when typing naturally
                }}
                onFocus={() => setIsOpen(true)}
                required={isRequired && !value}
            />
            {isOpen && (
                <ul className="list-group position-absolute w-100 shadow" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                    {filtered.length > 0 ? filtered.map(item => (
                        <li
                            key={item[idKey]}
                            className="list-group-item list-group-item-action cursor-pointer"
                            onMouseDown={() => {
                                setSearchTerm(item[labelKey]);
                                onChange(item[idKey]);
                                setIsOpen(false);
                            }}
                            style={{ cursor: "pointer" }}
                        >
                            {item[labelKey]}
                        </li>
                    )) : (
                        <li className="list-group-item text-muted">Sin coincidencias</li>
                    )}
                </ul>
            )}
        </div>
    );
};

export default function GastosGeneralesList() {
    const { year, month } = useParams();
    const navigate = useNavigate();

    const [gastos, setGastos] = useState([]);
    const [cargando, setCargando] = useState(true);

    // Data for selects
    const [clientes, setClientes] = useState([]);
    const [obras, setObras] = useState([]);
    const [proveedores, setProveedores] = useState([]);

    // Form State
    const [mostrarModal, setMostrarModal] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [notificacion, setNotificacion] = useState({ mensaje: "", tipo: "" });

    const [gastoEditandoId, setGastoEditandoId] = useState(null);
    const [modalConfirmacion, setModalConfirmacion] = useState({ visible: false, id: null });

    const estadoInicialGasto = {
        cliente_id: "",
        obra_id: "",
        proveedor_id: "",
        concepto: "",
        fecha: new Date().toISOString().split("T")[0],
        importe_base: "",
        iva_porcentaje: "21"
    };

    const [nuevoGasto, setNuevoGasto] = useState(estadoInicialGasto);


    const cargarDatos = async () => {
        try {
            setCargando(true);
            const [gastosData, clientesData, obrasData, proveedoresData] = await Promise.all([
                api.obtenerGastosGenerales(year, month),
                api.obtenerClientes(),
                api.obtenerObras(),
                api.obtenerProveedores()
            ]);
            setGastos(gastosData || []);
            setClientes(clientesData || []);
            setObras(obrasData || []);
            setProveedores(proveedoresData || []);
        } catch (err) {
            mostrarNotificacion("Error cargando los gastos generales", "danger");
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, [year, month]);

    const mostrarNotificacion = (mensaje, tipo = "success") => {
        setNotificacion({ mensaje, tipo });
        setTimeout(() => setNotificacion({ mensaje: "", tipo: "" }), 5000);
    };

    const procesarObraTitle = (obra) => {
        return obra.titulo || `${obra.numero_obra || 'S/N'} - ${obra.cliente_nombre || 'Sin cliente'}`;
    };

    const alGuardar = async (e) => {
        e.preventDefault();
        setGuardando(true);
        try {
            if (!nuevoGasto.cliente_id) {
                throw new Error("Selecciona al menos un cliente del desplegable.");
            }

            const payload = {
                ...nuevoGasto,
                importe_base: parseFloat(nuevoGasto.importe_base),
                iva_porcentaje: parseFloat(nuevoGasto.iva_porcentaje)
            };

            if (gastoEditandoId) {
                payload.id = gastoEditandoId;
                await api.actualizarGastoGeneral(gastoEditandoId, payload);
                mostrarNotificacion("Gasto actualizado correctamente.");
            } else {
                await api.crearGastoGeneral(payload);
                mostrarNotificacion("Gasto registrado correctamente.");
            }

            setMostrarModal(false);
            setNuevoGasto(estadoInicialGasto);
            setGastoEditandoId(null);
            cargarDatos();
        } catch (err) {
            mostrarNotificacion(err.message || "Error al registrar el gasto.", "danger");
        } finally {
            setGuardando(false);
        }
    };

    const alEliminar = async () => {
        if (!modalConfirmacion.id) return;
        setGuardando(true);
        try {
            await api.borrarGastoGeneral(modalConfirmacion.id);
            mostrarNotificacion("Gasto eliminado correctamente.");
            setModalConfirmacion({ visible: false, id: null });
            cargarDatos();
        } catch (err) {
            mostrarNotificacion(err.message || "Error al eliminar el gasto.", "danger");
            setGuardando(false);
            setModalConfirmacion({ visible: false, id: null });
        }
    };

    const mesNombre = new Date(year, month - 1).toLocaleString('es', { month: 'long' });

    return (
        <div className="diseño-corporativo">
            <ModalConfirmacion
                visible={modalConfirmacion.visible}
                mensaje="¿Estás seguro de eliminar este gasto general? Esta acción no se puede deshacer."
                alConfirmar={alEliminar}
                alCancelar={() => setModalConfirmacion({ visible: false, id: null })}
            />
            {/* CABECERA */}
            <div className="d-flex justify-content-between align-items-center mb-4 gap-3 bg-white p-3 rounded border shadow-sm">
                <div>
                    <button className="btn btn-sm btn-outline-secondary mb-2" onClick={() => navigate('/gastos-generales')}>
                        <i className="bi bi-arrow-left me-1"></i> Volver a selección
                    </button>
                    <h1 className="h3 fw-bold m-0 text-dark">Gastos: {mesNombre.toUpperCase()} {year}</h1>
                    <p className="text-muted small m-0 mt-1">
                        Gastos generales vinculados a obras de forma informativa. (No inyecta datos en facturas).
                    </p>
                </div>
                <button className="btn btn-primary px-4 fw-bold shadow-sm" onClick={() => {
                    setGastoEditandoId(null);
                    setNuevoGasto(estadoInicialGasto);
                    setMostrarModal(true);
                }}>
                    <i className="bi bi-plus-lg me-2"></i> Añadir Gasto
                </button>
            </div>

            {notificacion.mensaje && (
                <div className={`alert alert-${notificacion.tipo} alert-dismissible fade show shadow-sm border-0 mb-4`} role="alert">
                    <i className={`bi bi-${notificacion.tipo === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2`}></i>
                    {notificacion.mensaje}
                    <button type="button" className="btn-close" onClick={() => setNotificacion({ mensaje: "", tipo: "" })}></button>
                </div>
            )}

            {/* TABLA DE GASTOS */}
            <div className="card shadow-sm border-0 rounded-3">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover table-striped align-middle m-0" style={{ fontSize: '0.9rem' }}>
                            <thead className="table-light">
                                <tr>
                                    <th className="py-3 px-3">Cliente</th>
                                    <th className="py-3 px-3">Obra</th>
                                    <th className="py-3 px-3">Proveedor</th>
                                    <th className="py-3 px-3">Concepto</th>
                                    <th className="py-3 px-3 text-center">Fecha</th>
                                    <th className="py-3 px-3 text-end">Importe</th>
                                    <th className="py-3 px-3 text-center">%IVA</th>
                                    <th className="py-3 px-3 text-end">Cant. IVA</th>
                                    <th className="py-3 px-3 text-end fw-bold">Importe + IVA</th>
                                    <th className="py-3 px-3 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cargando ? (
                                    <tr><td colSpan="9" className="text-center py-5"><div className="spinner-border text-primary spinner-border-sm"></div> Cargando...</td></tr>
                                ) : gastos.length === 0 ? (
                                    <tr><td colSpan="9" className="text-center py-5 text-muted"><i className="bi bi-inbox fs-1 d-block mb-3 opacity-25"></i>No hay gastos generales en este periodo</td></tr>
                                ) : (
                                    gastos.map(g => (
                                        <tr key={g.id}>
                                            <td className="px-3 fw-medium text-dark">{g.cliente_nombre || <span className="text-danger">Borrado</span>}</td>
                                            <td className="px-3">
                                                {g.obra_id ? (
                                                    <Link to={`/obras/${g.obra_id}`} className="text-decoration-none fw-medium text-primary custom-link-hover">
                                                        {g.obra_nombre || `Obra #${g.obra_id}`}
                                                    </Link>
                                                ) : <span className="text-muted">—</span>}
                                            </td>
                                            <td className="px-3">
                                                {g.proveedor_nombre ? <span className="badge bg-secondary opacity-75">{g.proveedor_nombre}</span> : <span className="text-muted">—</span>}
                                            </td>
                                            <td className="px-3 text-secondary" style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={g.concepto}>{g.concepto}</td>
                                            <td className="px-3 text-center">{new Date(g.fecha).toLocaleDateString('es-ES')}</td>
                                            <td className="px-3 text-end">{parseFloat(g.importe_base).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</td>
                                            <td className="px-3 text-center">
                                                <span className="badge border bg-light text-dark">{parseFloat(g.iva_porcentaje)}%</span>
                                            </td>
                                            <td className="px-3 text-end text-muted">{parseFloat(g.cantidad_iva).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</td>
                                            <td className="px-3 text-end fw-bold text-primary">{parseFloat(g.importe_total).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</td>
                                            <td className="px-3 text-center">
                                                <button
                                                    className="btn btn-sm btn-outline-primary shadow-sm"
                                                    title="Editar gasto"
                                                    onClick={() => {
                                                        setGastoEditandoId(g.id);
                                                        setNuevoGasto({
                                                            cliente_id: g.cliente_id || "",
                                                            obra_id: g.obra_id || "",
                                                            proveedor_id: g.proveedor_id || "",
                                                            concepto: g.concepto || "",
                                                            fecha: g.fecha || "",
                                                            importe_base: g.importe_base || "",
                                                            iva_porcentaje: Math.round(g.iva_porcentaje).toString()
                                                        });
                                                        setMostrarModal(true);
                                                    }}
                                                >
                                                    <i className="bi bi-pencil-square"></i>
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline-danger shadow-sm ms-2"
                                                    title="Eliminar gasto"
                                                    onClick={() => setModalConfirmacion({ visible: true, id: g.id })}
                                                >
                                                    <i className="bi bi-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* MODAL DE AÑADIR */}
            <AnimatePresence>
                {mostrarModal && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="position-fixed top-0 start-0 w-100 h-100"
                            style={{ backdropFilter: 'blur(10px)', backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1040 }}
                        ></motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="modal fade show d-block"
                            tabIndex="-1"
                            style={{ zIndex: 1045 }}
                        >
                            <div className="modal-dialog modal-dialog-centered modal-lg">
                                <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '15px', overflow: 'hidden' }}>
                                    <div className="modal-header bg-primary text-white border-0 py-3">
                                        <h5 className="modal-title fw-bold">
                                            <i className="bi bi-wallet2 me-2"></i>
                                            {gastoEditandoId ? "Editar Gasto General" : "Nuevo Gasto General"}
                                        </h5>
                                        <button type="button" className="btn-close btn-close-white" onClick={() => setMostrarModal(false)}></button>
                                    </div>

                                    <div className="modal-body p-4 bg-light">
                                        <form onSubmit={alGuardar}>

                                            <div className="row g-3 mb-3">
                                                <div className="col-md-6">
                                                    <label className="form-label fw-bold text-secondary small">Cliente *</label>
                                                    <TypeaheadSelect
                                                        data={clientes} idKey="id" labelKey="nombre"
                                                        placeholder="Buscar cliente..."
                                                        value={nuevoGasto.cliente_id}
                                                        onChange={v => setNuevoGasto({ ...nuevoGasto, cliente_id: v, obra_id: "" })}
                                                        isRequired
                                                    />
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="form-label fw-bold text-secondary small">Obra (Opcional)</label>
                                                    <TypeaheadSelect
                                                        data={nuevoGasto.cliente_id ? obras.filter(o => o.cliente_id == nuevoGasto.cliente_id) : obras}
                                                        idKey="id" labelKey="titulo"
                                                        placeholder={nuevoGasto.cliente_id ? "Selecciona una obra (opcional)..." : "Primero elige un cliente"}
                                                        value={nuevoGasto.obra_id}
                                                        onChange={v => setNuevoGasto({ ...nuevoGasto, obra_id: v })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="row g-3 mb-3">
                                                <div className="col-md-12">
                                                    <label className="form-label fw-bold text-secondary small">Proveedor (Opcional)</label>
                                                    <TypeaheadSelect
                                                        data={proveedores} idKey="id" labelKey="nombre"
                                                        placeholder="Buscar prestatario o proveedor (opcional)..."
                                                        value={nuevoGasto.proveedor_id}
                                                        onChange={v => setNuevoGasto({ ...nuevoGasto, proveedor_id: v })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="mb-3">
                                                <label className="form-label fw-bold text-secondary small">Concepto Detallado *</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Ej. Compra masiva materiales pladur"
                                                    value={nuevoGasto.concepto}
                                                    onChange={e => setNuevoGasto({ ...nuevoGasto, concepto: e.target.value })}
                                                    required
                                                />
                                            </div>

                                            <div className="row g-3">
                                                <div className="col-md-4">
                                                    <label className="form-label fw-bold text-secondary small">Fecha *</label>
                                                    <input
                                                        type="date"
                                                        className="form-control"
                                                        value={nuevoGasto.fecha}
                                                        onChange={e => setNuevoGasto({ ...nuevoGasto, fecha: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div className="col-md-4">
                                                    <label className="form-label fw-bold text-secondary small">Importe Base (€) *</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        className="form-control font-monospace"
                                                        placeholder="0.00"
                                                        value={nuevoGasto.importe_base}
                                                        onChange={e => setNuevoGasto({ ...nuevoGasto, importe_base: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div className="col-md-4">
                                                    <label className="form-label fw-bold text-secondary small">% IVA *</label>
                                                    <select
                                                        className="form-select font-monospace"
                                                        value={nuevoGasto.iva_porcentaje}
                                                        onChange={e => setNuevoGasto({ ...nuevoGasto, iva_porcentaje: e.target.value })}
                                                    >
                                                        <option value="0">0% (Exento)</option>

                                                        <option value="10">10% (Reducido)</option>
                                                        <option value="21">21% (Normal)</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                                                <button type="button" className="btn btn-light border px-4" onClick={() => setMostrarModal(false)} disabled={guardando}>
                                                    Cancelar
                                                </button>
                                                <button type="submit" className="btn btn-primary px-4 fw-bold shadow-sm" disabled={guardando}>
                                                    {guardando ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-save me-2"></i>}
                                                    {guardando ? 'Guardando...' : (gastoEditandoId ? 'Guardar Cambios' : 'Registrar Gasto')}
                                                </button>
                                            </div>

                                        </form>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
