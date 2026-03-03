import React from 'react';

const ClientesList = ({ clientes = [], alEditar, alBorrar }) => {
  if (!clientes || clientes.length === 0) {
    return (
      <div className="alert alert-info mt-3 shadow-sm border-0">
        No hay clientes registrados que coincidan con la búsqueda.
      </div>
    );
  }

  return (
    <div className="card tarjeta-corporativa mt-3 border-0 shadow-sm">
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" id="tablaClientes">
            <thead className="table-light text-muted small text-uppercase">
              <tr>
                <th className="ps-4">Nombre</th>
                <th>Tipo</th>
                <th>Contacto</th>
                <th>Población</th>
                <th className="text-end pe-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((cliente) => (
                <tr key={cliente.id}>
                  <td className="ps-4 fw-bold">{cliente.nombre}</td>
                  <td>
                    <span className={`badge ${cliente.tipo === 'empresa' ? 'bg-primary-subtle text-primary' : 'bg-secondary-subtle text-secondary'}`}>
                      {cliente.tipo.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div className="small text-dark fw-bold">{cliente.telefono}</div>
                    <div className="small text-muted">{cliente.email}</div>
                  </td>
                  <td className="text-muted small">
                    {cliente.poblacion}
                  </td>
                  <td className="text-end pe-4">
                    <button
                      className="btn btn-sm btn-outline-primary me-2 fw-bold"
                      onClick={() => alEditar(cliente)}
                    >
                      EDITAR
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => alBorrar(cliente.id)}
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
};

export default ClientesList;
