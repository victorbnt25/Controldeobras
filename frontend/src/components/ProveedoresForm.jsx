import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import ModalConfirmacion from "./ModalConfirmacion";

const ProveedoresForm = ({ proveedor, onSaved, onCancel }) => {
  const [error, setError] = useState(null);
  const [modalConfirmacion, setModalConfirmacion] = useState({ visible: false });
  const [datosFormulario, setDatosFormulario] = useState({
    nombre: "",
    telefono: "",
    especialidad: "",
    cif: "",
    numero_cuenta: "",
    email: "",
    notas: "",
    activo: true,
  });

  useEffect(() => {
    if (proveedor) {
      setDatosFormulario({
        nombre: proveedor.nombre || "",
        telefono: proveedor.telefono || "",
        especialidad: proveedor.especialidad || "",
        cif: proveedor.cif || "",
        numero_cuenta: proveedor.numero_cuenta || "",
        email: proveedor.email || "",
        notas: proveedor.notas || "",
        activo: proveedor.activo !== false,
      });
    }
  }, [proveedor]);

  const alCambiarCampo = (e) => {
    const { name, value } = e.target;
    setDatosFormulario((prev) => ({ ...prev, [name]: value }));
  };

  const alEnviarFormulario = async (e) => {
    e.preventDefault();
    setError(null);

    if (!datosFormulario.nombre.trim()) {
      setError("Debes introducir al menos el nombre del proveedor.");
      return;
    }

    try {
      if (proveedor) {
        await api.actualizarProveedor(proveedor.id, datosFormulario);
      } else {
        await api.crearProveedor(datosFormulario);
      }
      onSaved();
    } catch {
      setError("No se ha podido guardar el proveedor.");
    }
  };

  const alBorrarProveedor = () => {
    if (!proveedor) return;
    setModalConfirmacion({ visible: true });
  };

  const confirmarBorradoProveedor = async () => {
    try {
      await api.borrarProveedor(proveedor.id);
      setModalConfirmacion({ visible: false });
      onSaved();
    } catch {
      setError("No se ha podido eliminar el proveedor.");
      setModalConfirmacion({ visible: false });
    }
  };

  return (
    <div className="card tarjeta-corporativa mb-3" id="formularioProveedor">
      <div className="card-body p-4">
        <div className="cabecera-formulario mb-4">
          <h5 className="fw-bold mb-1">{proveedor ? "Editar proveedor" : "Nuevo proveedor"}</h5>
          <p className="text-muted small">
            {proveedor ? "Actualiza los datos del proveedor." : "Introduce la información del proveedor externo."}
          </p>
        </div>

        <ModalConfirmacion
          visible={modalConfirmacion.visible}
          mensaje="¿Deseas eliminar este proveedor definitivamente?"
          alConfirmar={confirmarBorradoProveedor}
          alCancelar={() => setModalConfirmacion({ visible: false })}
        />

        {error && <div className="alert alert-danger mb-4 shadow-sm" id="errorFormulario">{error}</div>}

        <form onSubmit={alEnviarFormulario}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-bold small text-muted">Nombre</label>
              <input
                className="form-control"
                name="nombre"
                value={datosFormulario.nombre}
                onChange={alCambiarCampo}
                placeholder="Nombre del proveedor"
                id="campoNombre"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-bold small text-muted">Especialidad</label>
              <input
                className="form-control"
                name="especialidad"
                value={datosFormulario.especialidad}
                onChange={alCambiarCampo}
                placeholder="Fontanería, Electricidad..."
                id="campoEspecialidad"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-bold small text-muted">Teléfono</label>
              <input
                className="form-control"
                name="telefono"
                value={datosFormulario.telefono}
                onChange={alCambiarCampo}
                placeholder="Teléfono"
                id="campoTelefono"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-bold small text-muted">Email</label>
              <input
                className="form-control"
                name="email"
                value={datosFormulario.email}
                onChange={alCambiarCampo}
                placeholder="correo@ejemplo.com"
                id="campoEmail"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-bold small text-muted">CIF</label>
              <input
                className="form-control"
                name="cif"
                value={datosFormulario.cif}
                onChange={alCambiarCampo}
                placeholder="CIF"
                id="campoCif"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-bold small text-muted">Número de cuenta</label>
              <input
                className="form-control"
                name="numero_cuenta"
                value={datosFormulario.numero_cuenta}
                onChange={alCambiarCampo}
                placeholder="ES..."
                id="campoCuenta"
              />
            </div>

            <div className="col-12">
              <label className="form-label fw-bold small text-muted">Notas</label>
              <textarea
                className="form-control"
                name="notas"
                value={datosFormulario.notas}
                onChange={alCambiarCampo}
                rows={3}
                placeholder="Observaciones internas"
                id="campoNotas"
              />
            </div>
          </div>

          <div className="acciones-formulario d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <button type="button" className="btn btn-outline-secondary px-4" onClick={onCancel}>Cancelar</button>
            {proveedor && (
              <button type="button" className="btn btn-outline-danger" onClick={alBorrarProveedor} title="Eliminar definitivamente">
                <i className="bi bi-trash"></i>
              </button>
            )}
            <button type="submit" className="btn btn-primary px-5 fw-bold" id="botonGuardarProveedor">
              {proveedor ? "Guardar cambios" : "Crear proveedor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProveedoresForm;
