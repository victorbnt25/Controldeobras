import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import ModalConfirmacion from "./ModalConfirmacion";

const ClientesForm = ({ cliente, onCreated, onCancel }) => {
  const [error, setError] = useState(null);
  const [datosFormulario, setDatosFormulario] = useState({
    nombre: "", tipo: "empresa", cif_dni: "", direccion: "",
    poblacion: "", ciudad: "", codigo_postal: "", telefono: "",
    email: "", notas: "", activo: true,
  });
  const [modalConfirmacion, setModalConfirmacion] = useState({ visible: false });

  useEffect(() => {
    if (cliente) {
      setDatosFormulario({
        nombre: cliente.nombre || "",
        tipo: cliente.tipo || "empresa",
        cif_dni: cliente.cif_dni || "",
        direccion: cliente.direccion || "",
        poblacion: cliente.poblacion || "",
        ciudad: cliente.ciudad || "",
        codigo_postal: cliente.codigo_postal || "",
        telefono: cliente.telefono || "",
        email: cliente.email || "",
        notas: cliente.notas || "",
        activo: cliente.activo !== false,
      });
    }
  }, [cliente]);

  const buscarDatosPorCP = async (cp) => {
    if (cp.length === 5) {
      try {
        const res = await fetch(`https://api.zippopotam.us/es/${cp}`);
        if (res.ok) {
          const data = await res.json();
          if (data.places && data.places.length > 0) {
            const lugar = data.places[0];
            setDatosFormulario(prev => ({
              ...prev,
              ciudad: lugar["place name"],
              poblacion: lugar["state"]
            }));
          }
        }
      } catch (err) {
        console.error("Error consultando el código postal:", err);
      }
    }
  };

  const alCambiarCampo = (e) => {
    const { name, value } = e.target;
    setDatosFormulario((prev) => ({ ...prev, [name]: value }));
    if (name === "codigo_postal") {
      buscarDatosPorCP(value);
    }
  };

  const alEnviarFormulario = async (e) => {
    e.preventDefault();
    setError(null);
    if (!datosFormulario.nombre.trim() || !datosFormulario.telefono.trim() || !datosFormulario.direccion.trim() || !datosFormulario.poblacion.trim()) {
      setError("Debes rellenar nombre, teléfono, dirección y población.");
      return;
    }
    try {
      if (cliente) { await api.actualizarCliente(cliente.id, datosFormulario); }
      else { await api.crearCliente(datosFormulario); }
      onCreated();
    } catch { setError("No se ha podido guardar el cliente."); }
  };

  const alBorrarCliente = async () => {
    if (!cliente) return;
    setModalConfirmacion({ visible: true });
  };

  const confirmarBorrado = async () => {
    try {
      await api.borrarCliente(cliente.id);
      setModalConfirmacion({ visible: false });
      onCreated();
    } catch {
      setError("No se ha podido eliminar el cliente.");
      setModalConfirmacion({ visible: false });
    }
  };

  return (
    <div className="card tarjeta-corporativa mb-3" id="formularioCliente">
      <div className="card-body p-4">
        <div className="cabecera-formulario mb-4">
          <h5 className="fw-bold mb-1">{cliente ? "Editar cliente" : "Nuevo cliente"}</h5>
          <p className="text-muted small">
            {cliente ? "Actualiza los datos del cliente." : "Introduce la información del cliente."}
          </p>
        </div>

        <ModalConfirmacion
          visible={modalConfirmacion.visible}
          mensaje="¿Deseas eliminar este cliente definitivamente?"
          alConfirmar={confirmarBorrado}
          alCancelar={() => setModalConfirmacion({ visible: false })}
        />

        {error && <div className="alert alert-danger mb-4 shadow-sm" id="errorFormulario">{error}</div>}

        <form onSubmit={alEnviarFormulario}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-bold small text-muted">Nombre</label>
              <input className="form-control" name="nombre" value={datosFormulario.nombre} onChange={alCambiarCampo} placeholder="Nombre completo" id="campoNombre" />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-bold small text-muted">Tipo</label>
              <select className="form-select" name="tipo" value={datosFormulario.tipo} onChange={alCambiarCampo} id="campoTipo">
                <option value="empresa">Empresa</option>
                <option value="particular">Particular</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-bold small text-muted">DNI / CIF</label>
              <input className="form-control" name="cif_dni" value={datosFormulario.cif_dni} onChange={alCambiarCampo} placeholder="DNI o CIF" id="campoCif" />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-bold small text-muted">Teléfono</label>
              <input className="form-control" name="telefono" value={datosFormulario.telefono} onChange={alCambiarCampo} placeholder="Teléfono de contacto" id="campoTelefono" />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-bold small text-muted">Email</label>
              <input className="form-control" name="email" value={datosFormulario.email} onChange={alCambiarCampo} placeholder="correo@ejemplo.com" id="campoEmail" />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-bold small text-muted">Código postal</label>
              <input className="form-control" name="codigo_postal" value={datosFormulario.codigo_postal} onChange={alCambiarCampo} placeholder="C.P." id="campoCP" />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-bold small text-muted">Ciudad</label>
              <input className="form-control" name="ciudad" value={datosFormulario.ciudad} onChange={alCambiarCampo} placeholder="Ciudad / Localidad" id="campoCiudad" />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-bold small text-muted">Población / Provincia</label>
              <input className="form-control" name="poblacion" value={datosFormulario.poblacion} onChange={alCambiarCampo} placeholder="Provincia" id="campoPoblacion" />
            </div>
            <div className="col-12">
              <label className="form-label fw-bold small text-muted">Dirección</label>
              <input className="form-control" name="direccion" value={datosFormulario.direccion} onChange={alCambiarCampo} placeholder="Dirección completa" id="campoDireccion" />
            </div>
            <div className="col-12">
              <label className="form-label fw-bold small text-muted">Observaciones</label>
              <textarea className="form-control" name="notas" value={datosFormulario.notas} onChange={alCambiarCampo} rows={3} placeholder="Notas internas o comentarios" id="campoNotas" />
            </div>
          </div>

          <div className="acciones-formulario d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <button type="button" className="btn btn-outline-secondary px-4" onClick={onCancel}>Cancelar</button>
            {cliente && (
              <button type="button" className="btn btn-outline-danger" onClick={alBorrarCliente} title="Eliminar definitivamente">
                <i className="bi bi-trash"></i>
              </button>
            )}
            <button type="submit" className="btn btn-primary px-5 fw-bold" id="botonGuardarCliente">
              {cliente ? "Guardar cambios" : "Crear cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientesForm;