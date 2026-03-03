import { useEffect, useState } from "react";
import { api } from "../services/api";
import ProveedoresForm from "../components/ProveedoresForm";
import { motion, AnimatePresence } from "framer-motion";
import ModalConfirmacion from "../components/ModalConfirmacion";

export default function Proveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [proveedorEnEdicion, setProveedorEnEdicion] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [error, setError] = useState(null);

  const [buscaNombre, setBuscaNombre] = useState("");
  const [filtroEspecialidad, setFiltroEspecialidad] = useState("todos");
  const [notificacion, setNotificacion] = useState({ mensaje: "", tipo: "" });
  const [modalConfirmacion, setModalConfirmacion] = useState({ visible: false, idBorrar: null });

  const mostrarNotificacion = (mensaje, tipo = "success") => {
    setNotificacion({ mensaje, tipo });
    setTimeout(() => setNotificacion({ mensaje: "", tipo: "" }), 5000);
  };

  const cargarProveedores = () => {
    api
      .obtenerProveedores()
      .then(setProveedores)
      .catch(() => setError("No se han podido cargar los proveedores"));
  };

  useEffect(() => {
    cargarProveedores();
  }, []);

  const alNuevoProveedor = () => {
    setProveedorEnEdicion(null);
    setMostrarFormulario(true);
  };

  const alEditarProveedor = (proveedor) => {
    setProveedorEnEdicion(proveedor);
    setMostrarFormulario(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const alEliminarProveedor = async (id) => {
    setModalConfirmacion({ visible: true, idBorrar: id });
  };

  const confirmarBorrado = async () => {
    if (!modalConfirmacion.idBorrar) return;
    try {
      await api.borrarProveedor(modalConfirmacion.idBorrar);
      cargarProveedores();
      mostrarNotificacion("Proveedor eliminado");
      setModalConfirmacion({ visible: false, idBorrar: null });
    } catch {
      mostrarNotificacion("Error al eliminar el proveedor", "danger");
      setModalConfirmacion({ visible: false, idBorrar: null });
    }
  };

  const proveedoresFiltrados = proveedores.filter((p) => {
    const coincideNombre = !buscaNombre || p.nombre?.toLowerCase().includes(buscaNombre.toLowerCase());
    const coincideEspecialidad = filtroEspecialidad === "todos" || p.especialidad === filtroEspecialidad;
    return coincideNombre && coincideEspecialidad;
  });

  const especialidades = Array.from(new Set(proveedores.map(p => p.especialidad).filter(Boolean)));

  const animacionEntrada = {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: 0.3, ease: "easeInOut" }
  };

  return (
    <div className="diseño-corporativo">
      {/* CABECERA PRINCIPAL */}
      <div className="cabecera-pagina mb-4 gap-3">
        <div>
          <h1 className="titulo-pagina">Directorio de Proveedores</h1>
          <p className="subtitulo-pagina">
            Gestión de suministros, servicios externos y contactos clave.
          </p>
        </div>

        <AnimatePresence>
          {!mostrarFormulario && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="btn btn-primary px-4 py-2"
              onClick={alNuevoProveedor}
              id="botonNuevoProveedor"
            >
              <i className="bi bi-plus-lg me-2"></i>Nuevo proveedor
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <ModalConfirmacion
        visible={modalConfirmacion.visible}
        mensaje="¿Eliminar este proveedor definitivamente?"
        alConfirmar={confirmarBorrado}
        alCancelar={() => setModalConfirmacion({ visible: false, idBorrar: null })}
      />

      {notificacion.mensaje && (
        <div className={`alert alert-${notificacion.tipo} alert-dismissible fade show shadow-sm border-0 mb-4`} role="alert">
          <i className={`bi bi-${notificacion.tipo === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2`}></i>
          {notificacion.mensaje}
          <button type="button" className="btn-close" onClick={() => setNotificacion({ mensaje: "", tipo: "" })}></button>
        </div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      <AnimatePresence mode="wait">
        {!mostrarFormulario ? (
          <motion.div
            key="filtros"
            {...animacionEntrada}
            className="p-3 bg-white border rounded shadow-sm d-flex flex-column flex-md-row gap-2 mb-4"
            id="contenedorFiltros"
          >
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por nombre..."
              value={buscaNombre}
              onChange={(e) => setBuscaNombre(e.target.value)}
              id="filtroNombre"
            />
            <select
              className="form-select"
              value={filtroEspecialidad}
              onChange={(e) => setFiltroEspecialidad(e.target.value)}
              id="filtroEspecialidad"
            >
              <option value="todos">Todas las especialidades</option>
              {especialidades.map(esp => (
                <option key={esp} value={esp}>{esp}</option>
              ))}
            </select>
          </motion.div>
        ) : (
          <motion.div
            key="formulario"
            {...animacionEntrada}
            className="tarjeta-corporativa p-4 shadow-sm mb-4"
            id="seccionFormulario"
          >
            <ProveedoresForm
              proveedor={proveedorEnEdicion}
              onSaved={() => {
                setMostrarFormulario(false);
                setProveedorEnEdicion(null);
                cargarProveedores();
              }}
              onCancel={() => {
                setMostrarFormulario(false);
                setProveedorEnEdicion(null);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="row g-4" id="rejilla-proveedores">
        <AnimatePresence>
          {proveedoresFiltrados.length > 0 ? (
            proveedoresFiltrados.map((proveedor) => (
              <motion.div
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="col-12 col-md-6 col-xl-4"
                key={proveedor.id}
              >
                <div className="tarjeta-cliente h-100" id={`proveedor-tarjeta-${proveedor.id}`}>
                  <div className="cabecera-tarjeta-cliente p-3">
                    <div>
                      <h5 className="fw-bold mb-1 text-dark">{proveedor.nombre}</h5>
                      <span className="text-primary fw-bold small text-uppercase" style={{ letterSpacing: '0.5px' }}>
                        {proveedor.especialidad || "Sin especialidad"}
                      </span>
                    </div>

                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-sm btn-link text-primary p-0"
                        onClick={() => alEditarProveedor(proveedor)}
                        title="Editar proveedor"
                      >
                        <i className="bi bi-pencil-square fs-5"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-link text-danger p-0"
                        onClick={() => alEliminarProveedor(proveedor.id)}
                        title="Eliminar proveedor"
                      >
                        <i className="bi bi-trash fs-5"></i>
                      </button>
                    </div>
                  </div>

                  <div className="p-4 pt-3">
                    <p className="mb-2 d-flex justify-content-between border-bottom pb-1">
                      <strong className="text-muted small">Contacto:</strong>
                      <span className="fw-bold">{proveedor.contacto || "-"}</span>
                    </p>
                    <p className="mb-2 d-flex justify-content-between border-bottom pb-1">
                      <strong className="text-muted small">Teléfono:</strong>
                      <span className="fw-bold">{proveedor.telefono || "-"}</span>
                    </p>
                    <p className="mb-0 d-flex justify-content-between">
                      <strong className="text-muted small">Email:</strong>
                      <span className="fw-bold" style={{ fontSize: '0.9rem' }}>{proveedor.email || "-"}</span>
                    </p>
                  </div>

                  {(proveedor.direccion || proveedor.poblacion) && (
                    <div className="p-3 bg-light border-top mt-auto">
                      <small className="text-muted d-block fw-bold text-uppercase mb-1" style={{ fontSize: '0.7rem' }}>Ubicación:</small>
                      <p className="small mb-0 text-dark">
                        {proveedor.direccion && `${proveedor.direccion}, `}
                        {proveedor.poblacion}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-12 text-center p-5 text-muted"
            >
              <i className="bi bi-truck display-1 opacity-25"></i>
              <h4 className="fw-bold mt-3">No hay proveedores en la lista</h4>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
