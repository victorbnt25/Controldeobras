import { useEffect, useState } from "react";
import { api } from "../services/api";
import TrabajadoresForm from "../components/TrabajadoresForm";
import { motion, AnimatePresence } from "framer-motion";
import ModalConfirmacion from "../components/ModalConfirmacion";

export default function Trabajadores() {
  const [trabajadores, setTrabajadores] = useState([]);
  const [trabajadorEnEdicion, setTrabajadorEnEdicion] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [error, setError] = useState(null);
  const [buscaNombre, setBuscaNombre] = useState("");
  const [notificacion, setNotificacion] = useState({ mensaje: "", tipo: "" });
  const [modalConfirmacion, setModalConfirmacion] = useState({ visible: false, idBorrar: null });

  const mostrarNotificacion = (mensaje, tipo = "success") => {
    setNotificacion({ mensaje, tipo });
    setTimeout(() => setNotificacion({ mensaje: "", tipo: "" }), 5000);
  };

  const cargarTrabajadores = () => {
    api.obtenerTrabajadores()
      .then(setTrabajadores)
      .catch(() => setError("No se han podido cargar los trabajadores"));
  };

  useEffect(() => {
    cargarTrabajadores();
  }, []);

  const alNuevoTrabajador = () => {
    setTrabajadorEnEdicion(null);
    setMostrarFormulario(true);
  };

  const alEditarTrabajador = (t) => {
    setTrabajadorEnEdicion(t);
    setMostrarFormulario(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const alEliminarTrabajador = async (id) => {
    setModalConfirmacion({ visible: true, idBorrar: id });
  };

  const confirmarBorrado = async () => {
    if (!modalConfirmacion.idBorrar) return;
    try {
      await api.borrarTrabajador(modalConfirmacion.idBorrar);
      cargarTrabajadores();
      mostrarNotificacion("Trabajador eliminado");
      setModalConfirmacion({ visible: false, idBorrar: null });
    } catch {
      mostrarNotificacion("Error al eliminar el trabajador", "danger");
      setModalConfirmacion({ visible: false, idBorrar: null });
    }
  };

  const trabajadoresFiltrados = trabajadores.filter((t) =>
    t.nombre?.toLowerCase().includes(buscaNombre.toLowerCase())
  );

  const animacionEntrada = {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: 0.3, ease: "easeInOut" }
  };

  return (
    <div className="diseño-corporativo">
      <div className="cabecera-pagina mb-4 gap-3">
        <div>
          <h1 className="titulo-pagina">Gestión de Trabajadores</h1>
          <p className="subtitulo-pagina">
            Administración de personal, tipos de contrato y tarifas.
          </p>
        </div>

        <AnimatePresence>
          {!mostrarFormulario && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="btn btn-primary px-4 py-2"
              onClick={alNuevoTrabajador}
              id="botonNuevoTrabajador"
            >
              <i className="bi bi-plus-lg me-2"></i>Nuevo trabajador
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <ModalConfirmacion
        visible={modalConfirmacion.visible}
        mensaje="¿Eliminar este trabajador definitivamente?"
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
          <motion.div key="filtros" {...animacionEntrada} className="p-3 bg-white border rounded shadow-sm mb-4" id="contenedorFiltros">
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por nombre..."
              value={buscaNombre}
              onChange={(e) => setBuscaNombre(e.target.value)}
              id="filtroNombre"
            />
          </motion.div>
        ) : (
          <motion.div key="formulario" {...animacionEntrada} className="tarjeta-corporativa p-4 shadow-sm mb-4" id="seccionFormulario">
            <TrabajadoresForm
              trabajador={trabajadorEnEdicion}
              onSaved={() => { setMostrarFormulario(false); setTrabajadorEnEdicion(null); cargarTrabajadores(); }}
              onCancel={() => { setMostrarFormulario(false); setTrabajadorEnEdicion(null); }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="row g-4" id="rejilla-trabajadores">
        <AnimatePresence>
          {trabajadoresFiltrados.length > 0 ? (
            trabajadoresFiltrados.map((t) => (
              <motion.div
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="col-12 col-md-6 col-xl-4"
                key={t.id}
              >
                <div className="tarjeta-cliente h-100" id={`trabajador-tarjeta-${t.id}`}>
                  <div className="cabecera-tarjeta-cliente p-3">
                    <div>
                      <h5 className="fw-bold mb-1 text-dark">{t.nombre}</h5>
                      <span className="text-primary fw-bold small text-uppercase">
                        {t.tipo === "fijo" ? "FIJO" : "EVENTUAL"}
                      </span>
                    </div>
                    <div className="d-flex gap-2">
                      <button className="btn btn-sm btn-link text-primary p-0" onClick={() => alEditarTrabajador(t)} title="Editar">
                        <i className="bi bi-pencil-square fs-5"></i>
                      </button>
                      <button className="btn btn-sm btn-link text-danger p-0" onClick={() => alEliminarTrabajador(t.id)} title="Eliminar">
                        <i className="bi bi-trash fs-5"></i>
                      </button>
                    </div>
                  </div>

                  <div className="p-4 pt-3">
                    <div className="d-flex justify-content-between mb-2 border-bottom pb-1">
                      <span className="text-muted small">Teléfono:</span>
                      <span className="fw-bold">{t.telefono || "-"}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2 border-bottom pb-1">
                      <span className="text-muted small">Precio Día:</span>
                      <span className="fw-bold">{t.precio_dia ? `${t.precio_dia} €` : "-"}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2 border-bottom pb-1">
                      <span className="text-muted small">Precio Hora:</span>
                      <span className="fw-bold">{t.precio_hora} €</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted small">Precio Sábado:</span>
                      <span className="fw-bold">{t.precio_sabado} €</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-12 text-center p-5 text-muted"
            >
              <i className="bi bi-person-x display-1 mb-3"></i>
              <h4 className="fw-bold">No hay trabajadores que coincidan</h4>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}