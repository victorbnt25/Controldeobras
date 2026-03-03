import { useState, useEffect } from "react";
import { api } from "../services/api";
import { useConfig } from "../context/ConfigContext";
import ModalSeleccionPartida from "./ModalSeleccionPartida";

export default function PresupuestoForm({ presupuesto, onSaved, onCancel }) {
  const { configuracion } = useConfig();
  const [clientes, setClientes] = useState([]);
  const [partidasDisponibles, setPartidasDisponibles] = useState([]);
  const [idCliente, setIdCliente] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [iva, setIva] = useState(0);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [numero, setNumero] = useState("");

  const [datosCliente, setDatosCliente] = useState({
    cif_dni: "",
    direccion: "",
    codigo_postal: "",
    poblacion: ""
  });

  const [lineas, setLineas] = useState([
    { descripcion: "", cantidad: 1, precio_unitario: 0 }
  ]);

  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);
  const [mostrarModalPartidas, setMostrarModalPartidas] = useState(false);

  useEffect(() => {
    cargarClientes();
    cargarPartidas();
    if (presupuesto) {
      cargarDatosEdicion();
    } else {
      cargarCorrelativo();
    }
  }, []);

  const cargarCorrelativo = async () => {
    try {
      const res = await api.obtenerProximoCorrelativo('presupuesto');
      if (res && res.next) {
        setNumero(res.next);
      }
    } catch (err) {
      console.error("Error cargando correlativo", err);
    }
  };

  const cargarDatosEdicion = async () => {
    try {
      let data = presupuesto;

      if (!presupuesto.items) {
        data = await api.obtenerPresupuesto(presupuesto.id);
      }

      setNumero(data.numero_presupuesto);
      setFecha(data.fecha_presupuesto);
      setIdCliente(data.cliente_id);
      setDescripcion(data.descripcion_general);
      setIva(Number(data.iva_porcentaje));

      if (data.items && data.items.length > 0) {
        setLineas(data.items.map(i => ({
          descripcion: i.descripcion,
          cantidad: Number(i.cantidad),
          precio_unitario: Number(i.precio_unitario)
        })));
      }
    } catch (err) {
      console.error("Error cargando datos para editar", err);
    }
  };

  useEffect(() => {
    if (idCliente && clientes.length > 0) {
      const cliente = clientes.find(c => c.id == idCliente);
      if (cliente) {
        setDatosCliente({
          cif_dni: cliente.cif_dni || "",
          direccion: cliente.direccion || "",
          codigo_postal: cliente.codigo_postal || "",
          poblacion: cliente.poblacion || ""
        });
      }
    }
  }, [idCliente, clientes]);

  const cargarClientes = async () => {
    try {
      const datos = await api.obtenerClientes();
      setClientes(datos);
    } catch (err) {
      setError("Error cargando clientes");
    }
  };

  const cargarPartidas = async () => {
    try {
      const datos = await api.obtenerPlantillas();
      setPartidasDisponibles(Array.isArray(datos) ? datos : []);
    } catch (err) {
      console.error("Error cargando plantillas:", err);
    }
  };

  const alCambiarCliente = (e) => {
    const seleccionadoId = e.target.value;
    setIdCliente(seleccionadoId);

    const cliente = clientes.find(c => c.id == seleccionadoId);
    if (cliente) {
      setDatosCliente({
        cif_dni: cliente.cif_dni || "",
        direccion: cliente.direccion || "",
        codigo_postal: cliente.codigo_postal || "",
        poblacion: cliente.poblacion || ""
      });
    } else {
      setDatosCliente({ cif_dni: "", direccion: "", codigo_postal: "", poblacion: "" });
    }
  };

  const agregarLinea = () => {
    setLineas([...lineas, { descripcion: "", cantidad: 1, precio_unitario: 0 }]);
  };

  const aplicarPartidaModal = (p) => {
    if (!p) return;

    const indiceLineaVacia = lineas.findIndex(i => !i.descripcion && i.cantidad === 1 && i.precio_unitario === 0);

    if (indiceLineaVacia >= 0) {
      const nuevas = [...lineas];
      nuevas[indiceLineaVacia] = { descripcion: p.descripcion, cantidad: parseFloat(p.cantidad || 1), precio_unitario: parseFloat(p.precio || 0) };
      setLineas(nuevas);
    } else {
      setLineas([...lineas, { descripcion: p.descripcion, cantidad: parseFloat(p.cantidad || 1), precio_unitario: parseFloat(p.precio || 0) }]);
    }
    setMostrarModalPartidas(false);
  };

  const eliminarLinea = (indice) => {
    const nuevas = [...lineas];
    nuevas.splice(indice, 1);
    setLineas(nuevas);
  };

  const actualizarLinea = (indice, campo, valor) => {
    const nuevas = [...lineas];
    nuevas[indice][campo] = valor;
    setLineas(nuevas);
  };

  const totalBruto = lineas.reduce(
    (acc, item) => acc + item.cantidad * item.precio_unitario,
    0
  );

  const importeIva = totalBruto * (iva / 100);
  const totalFinal = totalBruto + importeIva;

  const alGuardarPresupuesto = async () => {
    setMensaje(null);
    setError(null);

    if (!idCliente) {
      setError("Selecciona un cliente");
      return;
    }

    if (!descripcion.trim()) {
      setError("El nombre/descripción del presupuesto es obligatorio.");
      return;
    }

    if (!numero.trim()) {
      setError("El número de presupuesto es obligatorio (ej: 001/26).");
      return;
    }

    if (lineas.some(item => !item.descripcion.trim())) {
      setError("Todas las partidas deben tener un nombre o descripción.");
      return;
    }

    try {
      const cargaUtil = {
        cliente_id: idCliente,
        fecha_presupuesto: fecha,
        numero_presupuesto: numero,
        descripcion_general: descripcion,
        iva_porcentaje: iva,
        items: lineas
      };

      let respuesta;
      if (presupuesto) {
        cargaUtil.id = presupuesto.id;
        respuesta = await api.actualizarPresupuesto(cargaUtil);
      } else {
        respuesta = await api.crearPresupuesto(cargaUtil);
      }

      if (!respuesta) {
        throw new Error("Error de conexión: No se pudo guardar el presupuesto.");
      }

      setMensaje(presupuesto ? "Presupuesto actualizado correctamente" : "Presupuesto creado correctamente");

      setIdCliente("");
      setDescripcion("");
      setNumero("");
      setFecha(new Date().toISOString().split('T')[0]);
      setLineas([{ descripcion: "", cantidad: 1, precio_unitario: 0 }]);

      if (onSaved) onSaved();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="card tarjeta-corporativa mb-3" id="formularioPresupuesto">
      <div className="card-body p-4">
        <div className="cabecera-formulario mb-4">
          <h5 className="fw-bold mb-1">{presupuesto ? "Editar Presupuesto" : "Nuevo Presupuesto"}</h5>
          <p className="text-muted small">
            {presupuesto ? "Modifica las partidas y costes." : "Crea una nueva propuesta económica para un cliente."}
          </p>
        </div>

        {mensaje && <div className="alert alert-success mb-4 shadow-sm" id="mensajeExito">{mensaje}</div>}
        {error && <div className="alert alert-danger mb-4 shadow-sm" id="mensajeError">{error}</div>}

        <div className="acciones-formulario d-flex justify-content-end gap-2 mb-4 border-bottom pb-3">
          <button className="btn btn-outline-secondary px-4" onClick={onCancel}>Cancelar</button>
          <button className="btn btn-primary px-5 fw-bold" onClick={alGuardarPresupuesto} id="botonGuardarPresupuesto">
            {presupuesto ? "Guardar Cambios" : "Guardar Presupuesto"}
          </button>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-md-6">
            <label className="form-label fw-bold small text-muted">Número / Código *</label>
            <input
              type="text"
              className="form-control"
              value={numero}
              placeholder="Ej: P-2026-001"
              onChange={(e) => setNumero(e.target.value)}
              id="campoNumero"
            />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-bold small text-muted">Fecha de emisión *</label>
            <input
              type="date"
              className="form-control"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              id="campoFecha"
            />
          </div>
          <div className="col-12">
            <label className="form-label fw-bold small text-muted">Descripción General *</label>
            <input
              className="form-control"
              value={descripcion}
              placeholder="Ej: Reforma integral cocina..."
              onChange={(e) => setDescripcion(e.target.value)}
              id="campoDescripcionGeneral"
            />
          </div>
        </div>

        <h6 className="fw-bold mb-3 text-primary text-uppercase small"><i className="bi bi-person me-2"></i>Datos del Cliente</h6>
        <div className="row g-3 mb-4 p-3 bg-light rounded border">
          <div className="col-md-6">
            <label className="form-label fw-bold small">Seleccionar Cliente</label>
            <select
              className="form-select"
              value={idCliente}
              onChange={alCambiarCliente}
              id="seleccionCliente"
            >
              <option value="">-- Buscar cliente --</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label fw-bold small">DNI / CIF</label>
            <input className="form-control bg-white" value={datosCliente.cif_dni} readOnly disabled />
          </div>
          <div className="col-12">
            <label className="form-label fw-bold small">Dirección</label>
            <input className="form-control bg-white" value={datosCliente.direccion} readOnly disabled />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-bold small">Código Postal</label>
            <input className="form-control bg-white" value={datosCliente.codigo_postal} readOnly disabled />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-bold small">Población</label>
            <input className="form-control bg-white" value={datosCliente.poblacion} readOnly disabled />
          </div>
        </div>

        <h6 className="fw-bold mb-3 text-primary text-uppercase small"><i className="bi bi-list-check me-2"></i>Partidas y Servicios</h6>
        <div className="p-3 border rounded mb-4">
          <div className="table-responsive">
            <table className="table table-sm align-middle">
              <thead>
                <tr className="text-muted small">
                  <th>Descripción</th>
                  <th style={{ width: '100px' }}>Cant.</th>
                  <th style={{ width: '120px' }}>Precio U.</th>
                  <th style={{ width: '120px' }}>Total</th>
                  <th style={{ width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {lineas.map((linea, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        className="form-control form-control-sm"
                        value={linea.descripcion}
                        placeholder="Ej: Retirada de escombros..."
                        onChange={(e) => actualizarLinea(index, "descripcion", e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control form-control-sm"
                        value={linea.cantidad}
                        onChange={(e) => actualizarLinea(index, "cantidad", Number(e.target.value))}
                      />
                    </td>
                    <td>
                      <div className="input-group input-group-sm">
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          value={linea.precio_unitario}
                          onChange={(e) => actualizarLinea(index, "precio_unitario", Number(e.target.value))}
                        />
                        <span className="input-group-text">€</span>
                      </div>
                    </td>
                    <td className="fw-bold">
                      {(linea.cantidad * linea.precio_unitario).toFixed(2)} €
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-link text-danger p-0"
                        onClick={() => eliminarLinea(index)}
                        title="Eliminar línea"
                      >
                        <i className="bi bi-x-circle-fill fs-5"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mt-3">
            <button className="btn btn-sm btn-outline-primary fw-bold" onClick={agregarLinea}>
              <i className="bi bi-plus-lg me-1"></i> Añadir partida vacía
            </button>
            <button className="btn btn-sm btn-primary fw-bold px-3" onClick={() => setMostrarModalPartidas(true)}>
              <i className="bi bi-grid-3x3-gap-fill me-2"></i> Importar de Plantillas
            </button>
          </div>
        </div>

        <ModalSeleccionPartida
          visible={mostrarModalPartidas}
          partidas={partidasDisponibles}
          onSelect={aplicarPartidaModal}
          onCancel={() => setMostrarModalPartidas(false)}
        />

        <div className="row mb-4">
          <div className="col-md-6 offset-md-6">
            <div className="card shadow-sm border-0 bg-light">
              <div className="card-body p-3">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted small text-uppercase">Total Bruto:</span>
                  <span className="fw-bold text-dark">{totalBruto.toFixed(2)} €</span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <span className="text-muted small text-uppercase">IVA:</span>
                    <select
                      className="form-select form-select-sm w-auto py-0"
                      value={iva}
                      onChange={(e) => setIva(Number(e.target.value))}
                    >
                      <option value={0}>0%</option>
                      <option value={10}>10%</option>
                      <option value={21}>21%</option>
                    </select>
                  </div>
                  <span className="fw-bold text-dark">{importeIva.toFixed(2)} €</span>
                </div>
                <div className="d-flex justify-content-between pt-2 border-top">
                  <span className="fw-bold text-uppercase">Total Presupuesto:</span>
                  <span className="fs-4 fw-bold text-primary">{totalFinal.toFixed(2)} €</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
