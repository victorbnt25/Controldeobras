import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function TrabajadoresForm({ trabajador, onSaved, onCancel }) {
  const [error, setError] = useState(null);
  const [datosFormulario, setDatosFormulario] = useState({
    nombre: "",
    telefono: "",
    tipo: "eventual",
    precio_dia: "",
    precio_hora: "",
    precio_sabado: "",
  });

  useEffect(() => {
    if (trabajador) {
      setDatosFormulario({
        nombre: trabajador.nombre || "",
        telefono: trabajador.telefono || "",
        tipo: trabajador.tipo || "eventual",
        precio_dia: trabajador.precio_dia ?? "",
        precio_hora: trabajador.precio_hora ?? "",
        precio_sabado: trabajador.precio_sabado ?? "",
      });
    }
  }, [trabajador]);

  const alCambiarCampo = (e) => {
    const { name, value } = e.target;
    setDatosFormulario(prev => ({ ...prev, [name]: value }));
  };

  const alEnviarFormulario = async (e) => {
    e.preventDefault();
    setError(null);

    if (!datosFormulario.nombre.trim() || datosFormulario.precio_hora === "" || datosFormulario.precio_sabado === "") {
      setError("⚠️ Nombre y tarifas obligatorias");
      return;
    }

    try {
      if (trabajador) {
        await api.actualizarTrabajador(trabajador.id, datosFormulario);
      } else {
        await api.crearTrabajador(datosFormulario);
      }
      onSaved();
    } catch {
      setError("Error al guardar el trabajador");
    }
  };

  return (
    <div className="card tarjeta-corporativa mb-3" id="formularioTrabajador">
      <div className="card-body p-4">
        <div className="cabecera-formulario mb-4">
          <h5 className="fw-bold mb-1">{trabajador ? "Editar trabajador" : "Nuevo trabajador"}</h5>
          <p className="text-muted small">
            {trabajador ? "Actualiza los datos del empleado." : "Introduce la información del trabajador."}
          </p>
        </div>

        {error && <div className="alert alert-danger mb-4 shadow-sm" id="errorFormulario">{error}</div>}

        <form onSubmit={alEnviarFormulario}>
          <div className="row g-3">
            <div className="col-md-8">
              <label className="form-label fw-bold small text-muted">Nombre Completo</label>
              <input
                className="form-control"
                name="nombre"
                value={datosFormulario.nombre}
                onChange={alCambiarCampo}
                placeholder="Nombre del trabajador"
                id="campoNombre"
              />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-bold small text-muted">Tipo de Contrato</label>
              <select className="form-select" name="tipo" value={datosFormulario.tipo} onChange={alCambiarCampo} id="campoTipo">
                <option value="eventual">Eventual</option>
                <option value="fijo">Fijo</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-bold small text-muted">Teléfono</label>
              <input
                className="form-control"
                name="telefono"
                value={datosFormulario.telefono}
                onChange={alCambiarCampo}
                placeholder="Teléfono de contacto"
                id="campoTelefono"
              />
            </div>
            <div className="col-md-2">
              <label className="form-label fw-bold small text-muted">€/Día</label>
              <input type="number" step="0.01" className="form-control" name="precio_dia" value={datosFormulario.precio_dia} onChange={alCambiarCampo} id="campoPrecioDia" />
            </div>
            <div className="col-md-2">
              <label className="form-label fw-bold small text-muted">€/Hora</label>
              <input type="number" step="0.01" className="form-control" name="precio_hora" value={datosFormulario.precio_hora} onChange={alCambiarCampo} id="campoPrecioHora" />
            </div>
            <div className="col-md-2">
              <label className="form-label fw-bold small text-muted">€/Sábado</label>
              <input type="number" step="0.01" className="form-control" name="precio_sabado" value={datosFormulario.precio_sabado} onChange={alCambiarCampo} id="campoPrecioSabado" />
            </div>
          </div>

          <div className="acciones-formulario d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <button type="button" className="btn btn-outline-secondary px-4" onClick={onCancel}>Cancelar</button>
            <button type="submit" className="btn btn-primary px-5 fw-bold" id="botonGuardarTrabajador">
              {trabajador ? "Guardar cambios" : "Crear trabajador"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}