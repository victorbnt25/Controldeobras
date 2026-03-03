import { useEffect, useState } from "react";
import { api } from "../services/api";
import ClientesForm from "../components/ClientesForm";
import { motion, AnimatePresence } from "framer-motion";
import ModalConfirmacion from "../components/ModalConfirmacion";

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [clienteEnEdicion, setClienteEnEdicion] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [error, setError] = useState(null);

  const [buscaNombre, setBuscaNombre] = useState("");
  const [buscaTelefono, setBuscaTelefono] = useState("");
  const [buscaPoblacion, setBuscaPoblacion] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [notificacion, setNotificacion] = useState({ mensaje: "", tipo: "" });
  const [modalConfirmacion, setModalConfirmacion] = useState({ visible: false, idBorrar: null });

  const mostrarNotificacion = (mensaje, tipo = "success") => {
    setNotificacion({ mensaje, tipo });
    setTimeout(() => setNotificacion({ mensaje: "", tipo: "" }), 5000);
  };

  const cargarClientes = () => {
    api
      .obtenerClientes()
      .then(setClientes)
      .catch(() => setError("No se han podido cargar los clientes"));
  };

  useEffect(() => {
    cargarClientes();
  }, []);

  const alNuevoCliente = () => {
    setClienteEnEdicion(null);
    setMostrarFormulario(true);
  };

  const alEditarCliente = (cliente) => {
    setClienteEnEdicion(cliente);
    setMostrarFormulario(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const alEliminarCliente = async (id) => {
    setModalConfirmacion({ visible: true, idBorrar: id });
  };

  const confirmarBorrado = async () => {
    if (!modalConfirmacion.idBorrar) return;
    try {
      await api.borrarCliente(modalConfirmacion.idBorrar);
      cargarClientes();
      mostrarNotificacion("Cliente eliminado");
      setModalConfirmacion({ visible: false, idBorrar: null });
    } catch {
      mostrarNotificacion("Error al eliminar el cliente", "danger");
      setModalConfirmacion({ visible: false, idBorrar: null });
    }
  };

  const clientesFiltrados = clientes.filter((c) => {
    const coincideNombre = !buscaNombre || c.nombre?.toLowerCase().includes(buscaNombre.toLowerCase());
    const coincideTelefono = !buscaTelefono || c.telefono?.toLowerCase().includes(buscaTelefono.toLowerCase());
    const coincidePoblacion = !buscaPoblacion || c.poblacion?.toLowerCase().includes(buscaPoblacion.toLowerCase());
    const coincideTipo = filtroTipo === "todos" || c.tipo === filtroTipo;
    return coincideNombre && coincideTelefono && coincidePoblacion && coincideTipo;
  });

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
          <h1 className="titulo-pagina">Gestión de Clientes</h1>
          <p className="subtitulo-pagina">
            Administración y control de datos de contacto de tu cartera.
          </p>
        </div>

        <AnimatePresence>
          {!mostrarFormulario && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="btn btn-primary px-4 py-2"
              onClick={alNuevoCliente}
              id="botonNuevoCliente"
            >
              <i className="bi bi-plus-lg me-2"></i>Nuevo cliente
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <ModalConfirmacion
        visible={modalConfirmacion.visible}
        mensaje="¿Eliminar este cliente definitivamente?"
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

      {/* SECCIÓN ANIMADA: BUSCADOR O FORMULARIO */}
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
            <input
              type="text"
              className="form-control"
              placeholder="Teléfono..."
              value={buscaTelefono}
              onChange={(e) => setBuscaTelefono(e.target.value)}
              id="filtroTelefono"
            />
            <input
              type="text"
              className="form-control"
              placeholder="Población..."
              value={buscaPoblacion}
              onChange={(e) => setBuscaPoblacion(e.target.value)}
              id="filtroPoblacion"
            />
            <select
              className="form-select"
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              id="filtroTipo"
            >
              <option value="todos">Todos los tipos</option>
              <option value="empresa">Empresa</option>
              <option value="particular">Particular</option>
            </select>
          </motion.div>
        ) : (
          <motion.div
            key="formulario"
            {...animacionEntrada}
            className="tarjeta-corporativa p-4 shadow-sm mb-4"
            id="seccionFormulario"
          >
            <ClientesForm
              cliente={clienteEnEdicion}
              onCreated={() => {
                setMostrarFormulario(false);
                setClienteEnEdicion(null);
                cargarClientes();
              }}
              onCancel={() => {
                setMostrarFormulario(false);
                setClienteEnEdicion(null);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* GRID DE CLIENTES: Lista de tarjetas con todos los datos */}
      <div className="row g-4" id="rejilla-clientes">
        <AnimatePresence>
          {clientesFiltrados.length > 0 ? (
            clientesFiltrados.map((cliente) => (
              <motion.div
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="col-12 col-md-6 col-xl-4"
                key={cliente.id}
              >
                <div className="tarjeta-cliente h-100" id={`cliente-tarjeta-${cliente.id}`}>
                  <div className="cabecera-tarjeta-cliente">
                    <div>
                      <h5 className="fw-bold mb-1 text-dark">{cliente.nombre}</h5>
                      <span className="text-primary fw-bold small text-uppercase" style={{ letterSpacing: '0.5px' }}>
                        {cliente.tipo}
                      </span>
                    </div>

                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-sm btn-link text-primary p-0"
                        onClick={() => alEditarCliente(cliente)}
                        title="Editar datos"
                      >
                        <i className="bi bi-pencil-square fs-5"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-link text-danger p-0"
                        onClick={() => alEliminarCliente(cliente.id)}
                        title="Eliminar cliente"
                      >
                        <i className="bi bi-trash fs-5"></i>
                      </button>
                    </div>
                  </div>

                  <div className="p-4 pt-3 pb-3">
                    <p className="mb-2 d-flex justify-content-between border-bottom pb-1">
                      <strong className="text-muted small">DNI/CIF:</strong>
                      <span className="fw-bold">{cliente.cif_dni || "No definido"}</span>
                    </p>
                    <p className="mb-2 d-flex justify-content-between border-bottom pb-1">
                      <strong className="text-muted small">Teléfono:</strong>
                      <span className="fw-bold">{cliente.telefono || "-"}</span>
                    </p>
                    <p className="mb-2 d-flex justify-content-between border-bottom pb-1">
                      <strong className="text-muted small">Localización:</strong>
                      <span className="fw-bold text-end">{cliente.poblacion} {cliente.ciudad ? `(${cliente.ciudad})` : ""}</span>
                    </p>
                    <p className="mb-0 d-flex justify-content-between">
                      <strong className="text-muted small">Email:</strong>
                      <span className="fw-bold" style={{ fontSize: '0.9rem' }}>{cliente.email || "-"}</span>
                    </p>
                  </div>

                  {cliente.notas && (
                    <div className="p-3 bg-light border-top mt-auto">
                      <small className="text-muted d-block fw-bold text-uppercase mb-1" style={{ fontSize: '0.7rem' }}>Notas:</small>
                      <p className="small mb-0 text-dark" style={{ lineHeight: '1.4' }}>{cliente.notas}</p>
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
              <i className="bi bi-person-x display-1 mb-3"></i>
              <h4 className="fw-bold">No se han encontrado clientes</h4>
              <p>Prueba a ajustar los filtros o crea uno nuevo.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}