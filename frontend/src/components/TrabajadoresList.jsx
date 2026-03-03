export default function TrabajadoresList({
  trabajadores = [],
  alEditar,
  alBorrar,
}) {
  if (!trabajadores.length) {
    return (
      <div className="alert alert-info mt-3 shadow-sm border-0">
        No hay trabajadores registrados que coincidan.
      </div>
    );
  }

  return (
    <div className="card tarjeta-corporativa mt-3 border-0 shadow-sm">
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" id="tablaTrabajadores">
            <thead className="table-light text-muted small text-uppercase">
              <tr>
                <th className="ps-4">Nombre</th>
                <th>Contrato</th>
                <th>Teléfono</th>
                <th>Día</th>
                <th>Hora</th>
                <th>Sábado</th>
                <th className="text-end pe-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {trabajadores.map((t) => (
                <tr key={t.id}>
                  <td className="ps-4">
                    <strong className="text-dark">{t.nombre}</strong>
                  </td>
                  <td>
                    <span
                      className={`badge ${t.tipo === "fijo" ? "bg-primary-subtle text-primary" : "bg-outline-secondary"
                        }`}
                    >
                      {t.tipo === "fijo" ? "FIJO" : "EVENTUAL"}
                    </span>
                  </td>
                  <td>{t.telefono || "-"}</td>
                  <td className="fw-bold">{t.precio_dia ? `${Number(t.precio_dia).toFixed(0)}€` : "-"}</td>
                  <td className="fw-bold">{t.precio_hora}€</td>
                  <td className="fw-bold text-primary">{t.precio_sabado}€</td>
                  <td className="text-end pe-4">
                    <button
                      className="btn btn-sm btn-outline-primary me-2 fw-bold"
                      onClick={() => alEditar(t)}
                    >
                      EDITAR
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => alBorrar(t.id)}
                      title="Eliminar"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
