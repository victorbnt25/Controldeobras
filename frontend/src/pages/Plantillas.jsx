import { useState, useEffect } from "react";
import { api } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import ModalConfirmacion from "../components/ModalConfirmacion";

export default function Plantillas() {
    const [partidas, setPartidas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [idEnEdicion, setIdEnEdicion] = useState(null);

    const [descripcion, setDescripcion] = useState("");
    const [cantidad, setCantidad] = useState(1);
    const [precio, setPrecio] = useState(0);

    const [modal, setModal] = useState({ visible: false, idBorrar: null });
    const [terminoBusqueda, setTerminoBusqueda] = useState("");

    useEffect(() => {
        cargarPartidas();
    }, []);

    const cargarPartidas = async () => {
        try {
            setCargando(true);
            const datos = await api.obtenerPlantillas();
            setPartidas(Array.isArray(datos) ? datos : []);
        } catch (err) {
            setError("Error al cargar la lista de partidas.");
        } finally {
            setCargando(false);
        }
    };

    const partidasFiltradas = partidas.filter(p =>
        p.descripcion?.toLowerCase().includes(terminoBusqueda.toLowerCase())
    );

    const alEditarPartida = (p) => {
        setIdEnEdicion(p.id);
        setDescripcion(p.descripcion);
        setCantidad(p.cantidad || 1);
        setPrecio(p.precio || 0);
        setMostrarFormulario(true);
    };

    const limpiarFormulario = () => {
        setMostrarFormulario(false);
        setIdEnEdicion(null);
        setDescripcion("");
        setCantidad(1);
        setPrecio(0);
    };

    const alEnviarFormulario = async (e) => {
        e.preventDefault();
        setError(null);

        if (!descripcion.trim()) {
            setError("El nombre/descripción no puede estar vacío.");
            return;
        }

        try {
            const cargaUtil = { descripcion, cantidad, precio };
            if (idEnEdicion) {
                await api.actualizarPlantilla(idEnEdicion, cargaUtil);
            } else {
                await api.crearPlantilla(cargaUtil);
            }
            cargarPartidas();
            limpiarFormulario();
        } catch (err) {
            setError("Error al guardar la partida.");
        }
    };

    const alBorrarPartida = async (id) => {
        setModal({ visible: true, idBorrar: id });
    };

    const confirmarBorrado = async () => {
        if (!modal.idBorrar) return;
        try {
            await api.borrarPlantilla(modal.idBorrar);
            cargarPartidas();
            setModal({ visible: false, idBorrar: null });
        } catch (err) {
            setError("Error al borrar.");
            setModal({ visible: false, idBorrar: null });
        }
    };

    return (
        <div className="diseño-corporativo">
            <div className="cabecera-pagina mb-4 gap-3">
                <div>
                    <h1 className="titulo-pagina">Plantilla</h1>
                    <p className="subtitulo-pagina">Configura tareas o partidas genéricas para usarlos después en tus presupuestos.</p>
                </div>

                {!mostrarFormulario && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="btn btn-primary px-4"
                        onClick={() => setMostrarFormulario(true)}
                        id="botonNuevaPartida"
                    >
                        <i className="bi bi-plus-lg me-2"></i>Nueva Partida
                    </motion.button>
                )}
            </div>

            <ModalConfirmacion
                visible={modal.visible}
                mensaje="¿Seguro que deseas eliminar esta partida?"
                alConfirmar={confirmarBorrado}
                alCancelar={() => setModal({ visible: false, idBorrar: null })}
            />

            {error && <div className="alert alert-danger shadow-sm mb-4">{error}</div>}

            <div className="p-3 bg-white border rounded shadow-sm d-flex flex-column flex-md-row gap-3 mb-4 align-items-center">
                <div className="flex-grow-1 w-100">
                    <div className="input-group">
                        <span className="input-group-text bg-white border-end-0"><i className="bi bi-search text-muted"></i></span>
                        <input
                            type="text"
                            className="form-control border-start-0"
                            placeholder="Buscar en tus plantillas por nombre o descripción..."
                            value={terminoBusqueda}
                            onChange={(e) => setTerminoBusqueda(e.target.value)}
                            id="buscadorPlantillas"
                        />
                    </div>
                </div>
                <div className="text-muted small text-nowrap">
                    Mostrando {partidasFiltradas.length} de {partidas.length} partidas
                </div>
            </div>

            <AnimatePresence>
                {mostrarFormulario && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="tarjeta-corporativa mb-4 p-4 shadow-sm"
                        id="seccionFormularioPartida"
                    >
                        <h5 className="fw-bold mb-3">{idEnEdicion ? "Editar Partida" : "Crear Partida"}</h5>
                        <form onSubmit={alEnviarFormulario}>
                            <div className="row g-3 align-items-end">
                                <div className="col-md-5">
                                    <label className="form-label">Nombre / Descripción *</label>
                                    <input
                                        className="form-control"
                                        value={descripcion}
                                        onChange={e => setDescripcion(e.target.value)}
                                        placeholder="Ej. Alicatado de cocina"
                                        autoFocus
                                        id="campoDescripcion"
                                    />
                                </div>
                                <div className="col-md-2">
                                    <label className="form-label">Cant. Defecto</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-control fw-bold"
                                        value={cantidad}
                                        onChange={e => setCantidad(Number(e.target.value))}
                                        id="campoCantidad"
                                    />
                                </div>
                                <div className="col-md-2">
                                    <label className="form-label">Precio Defecto (€)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-control fw-bold text-primary"
                                        value={precio}
                                        onChange={e => setPrecio(Number(e.target.value))}
                                        id="campoPrecio"
                                    />
                                </div>
                                <div className="col-md-3 d-flex gap-2">
                                    <button type="button" className="btn btn-outline-secondary w-50" onClick={limpiarFormulario}>Cancelar</button>
                                    <button type="submit" className="btn btn-success w-50 fw-bold" id="botonGuardarPartida">Guardar</button>
                                </div>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="card tarjeta-corporativa border-0 shadow-sm">
                <div className="card-header bg-white p-4 border-bottom">
                    <h6 className="fw-bold mb-0 text-dark uppercase small tracking-wider">
                        Lista de Partidas Guardadas
                    </h6>
                </div>
                <div className="card-body p-0">
                    {cargando ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status"></div>
                            <p className="mt-2 text-muted">Cargando partidas...</p>
                        </div>
                    ) : partidasFiltradas.length === 0 ? (
                        <div className="text-center py-5">
                            <i className="bi bi-folder2-open display-4 text-muted opacity-25"></i>
                            <p className="mt-3 text-muted">No se encontraron partidas.</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="px-4 py-3 text-muted small text-uppercase">Partida / Descripción</th>
                                        <th className="py-3 text-muted small text-uppercase" style={{ width: '120px' }}>Cant.</th>
                                        <th className="py-3 text-muted small text-uppercase" style={{ width: '150px' }}>Precio U.</th>
                                        <th className="py-3 text-muted small text-uppercase text-center" style={{ width: '100px' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="border-top-0">
                                    {partidasFiltradas.map((p) => (
                                        <tr key={p.id}>
                                            <td className="px-4 py-3">
                                                <span className="fw-medium text-dark d-block" style={{ fontSize: '0.95rem' }}>{p.descripcion}</span>
                                            </td>
                                            <td className="py-3">
                                                <span className="badge bg-light text-dark border px-2 py-1">{Number(p.cantidad).toFixed(2)}</span>
                                            </td>
                                            <td className="py-3">
                                                <span className="fw-bold text-primary">{Number(p.precio).toFixed(2)} €</span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="d-flex justify-content-center gap-2">
                                                    <button
                                                        className="btn btn-sm btn-outline-primary border-0"
                                                        onClick={() => alEditarPartida(p)}
                                                        title="Editar"
                                                    >
                                                        <i className="bi bi-pencil-square fs-6"></i>
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline-danger border-0"
                                                        onClick={() => setModal({ visible: true, idBorrar: p.id })}
                                                        title="Eliminar"
                                                    >
                                                        <i className="bi bi-trash-fill fs-6"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
