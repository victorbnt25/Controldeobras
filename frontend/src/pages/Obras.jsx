import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";

export default function Obras() {
  const [obras, setObras] = useState([]);
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("activas");
  const navegar = useNavigate();

  useEffect(() => {
    cargarObras();
  }, []);

  const cargarObras = async () => {
    try {
      const datos = await api.obtenerObras();
      setObras(datos || []);
    } catch (error) {
      console.error(error);
    }
  };

  const obrasFiltradas = obras.filter(obra => {
    const coincideEstado = filtroEstado === "todas" ? true :
      filtroEstado === "terminadas" ? obra.estado === "pagada" :
        obra.estado !== "pagada";
    const texto = terminoBusqueda.toLowerCase();
    const coincideTexto = (obra.titulo || "").toLowerCase().includes(texto) ||
      (obra.cliente_nombre || "").toLowerCase().includes(texto) ||
      (obra.numero_obra || "").toLowerCase().includes(texto);
    return coincideEstado && coincideTexto;
  });

  return (
    <div className="diseño-corporativo pb-5">
      {/* Cabecera */}
      <div className="cabecera-pagina mb-5 gap-3">
        <div>
          <h1 className="titulo-pagina">Gestión de Obras</h1>
          <p className="subtitulo-pagina text-secondary mt-1" style={{ fontSize: '1.1rem' }}>Supervisión económica y control de proyectos</p>
        </div>
      </div>

      {/* Barra de Filtros */}
      <motion.div
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="p-4 bg-white border border-light-subtle rounded-4 shadow-sm d-flex flex-column flex-md-row gap-4 mb-5"
        style={{ transition: 'all 0.3s ease' }}
      >
        <div className="flex-grow-1 position-relative">
          <i className="bi bi-search position-absolute top-50 translate-middle-y text-muted ms-3"></i>
          <input
            type="text"
            className="form-control form-control-lg bg-light border-0 ps-5"
            placeholder="Buscar por título, cliente o código..."
            value={terminoBusqueda}
            onChange={(e) => setTerminoBusqueda(e.target.value)}
            style={{ borderRadius: '10px', fontSize: '1rem' }}
          />
        </div>
        <div style={{ width: '240px' }}>
          <div className="position-relative">
            <select
              className="form-select form-select-lg bg-light border-0 fw-bold text-dark cursor-pointer text-uppercase fs-6"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              style={{ borderRadius: '10px' }}
            >
              <option value="activas">🏗️ Obras en curso</option>
              <option value="terminadas">✅ Obras pagadas</option>
              <option value="todas">📁 Todas las obras</option>
            </select>
          </div>
        </div>
        <div className="d-flex align-items-center justify-content-center justify-content-md-end text-muted fw-medium px-2" style={{ minWidth: '150px' }}>
          <span className="badge bg-primary bg-opacity-10 text-primary px-4 py-2 rounded-pill fs-6">{obrasFiltradas.length} resultados</span>
        </div>
      </motion.div>

      {/* Rejilla de Obras */}
      <div className="row g-5" id="rejilla-obras">
        <AnimatePresence>
          {obrasFiltradas.map((obra, index) => {
            const totalPresupuesto = parseFloat(obra.presupuesto_total || 0);
            const totalGastado = parseFloat(obra.gastado || 0);
            const porcentajeGasto = totalPresupuesto > 0 ? (totalGastado / totalPresupuesto) * 100 : 0;
            const excesoPpto = totalGastado > totalPresupuesto;
            const statusColor = obra.estado === 'pagada' ? '#10b981' : excesoPpto ? '#ef4444' : porcentajeGasto > 80 ? '#f59e0b' : '#3b82f6';

            return (
              <motion.div
                key={obra.id}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="col-12 col-lg-6 col-xl-4 d-flex"
              >
                <div
                  className="card border-0 position-relative flex-column d-flex bg-white text-dark w-100 shadow"
                  style={{ borderRadius: '16px', transition: 'transform 0.2s, box-shadow 0.2s', overflow: 'hidden' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.classList.add('shadow-lg'); }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.classList.remove('shadow-lg'); }}
                >
                  <div style={{ height: '6px', backgroundColor: statusColor, width: '100%' }}></div>

                  <div className="card-body p-4 p-xl-5 d-flex flex-column h-100">
                    {/* Header: Code & Status */}
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <span className="badge bg-light text-secondary border border-secondary-subtle font-monospace px-3 py-2 rounded-pill shadow-sm" style={{ fontSize: '0.85rem' }}>
                        <i className="bi bi-hash me-1"></i>{obra.numero_obra}
                      </span>
                      {obra.estado === 'pagada' && (
                        <span className="badge bg-success bg-opacity-10 text-success border border-success-subtle px-3 py-2 rounded-pill shadow-sm">
                          <i className="bi bi-check-circle-fill me-1"></i>Terminada
                        </span>
                      )}
                    </div>

                    {/* Title & Client */}
                    <h3 className="fw-bolder mb-3" style={{ lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {obra.titulo || "Obra sin título"}
                    </h3>
                    <div className="d-flex align-items-center text-muted mb-4 pb-2">
                      <i className="bi bi-person-circle fs-4 me-2" style={{ color: statusColor }}></i>
                      <span className="fw-medium text-truncate fs-5">{obra.cliente_nombre || "Cliente no asignado"}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-auto mb-4 bg-light rounded-4 p-4 border border-light-subtle">
                      <div className="d-flex justify-content-between align-items-end mb-3">
                        <span className="text-secondary fw-bold text-uppercase" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>Consumo Capital</span>
                        <span className={`fw-bolder fs-4 ${excesoPpto ? 'text-danger' : 'text-dark'}`}>{porcentajeGasto.toFixed(0)}%</span>
                      </div>
                      <div className="progress overflow-visible bg-white border border-light-subtle shadow-sm flex-row" style={{ height: '12px', borderRadius: '6px' }}>
                        <div
                          className={`progress-bar rounded-pill ${excesoPpto ? 'bg-danger' : porcentajeGasto > 80 ? 'bg-warning' : 'bg-primary'}`}
                          role="progressbar"
                          style={{ width: `${Math.min(porcentajeGasto, 100)}%`, transition: 'width 1s ease-in-out' }}
                        ></div>
                      </div>
                    </div>

                    {/* Financials */}
                    <div className="d-flex justify-content-between mb-4 px-2">
                      <div>
                        <small className="d-block text-secondary fw-bold text-uppercase mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Presupuesto</small>
                        <span className="fw-bolder fs-4 text-dark">{totalPresupuesto.toLocaleString('es-ES', { minimumFractionDigits: 2 })}<span className="fs-6 text-muted fw-normal ms-1">€</span></span>
                      </div>
                      <div className="text-end">
                        <small className="d-block text-secondary fw-bold text-uppercase mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Gasto Real</small>
                        <span className={`fw-bolder fs-4 ${excesoPpto ? 'text-danger' : 'text-dark'}`}>{totalGastado.toLocaleString('es-ES', { minimumFractionDigits: 2 })}<span className="fs-6 text-muted fw-normal ms-1">€</span></span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      className="btn w-100 fw-bold py-3 shadow-sm rounded-4 mt-3"
                      style={{
                        backgroundColor: obra.estado === 'pagada' ? '#f8f9fa' : '#0d6efd',
                        color: obra.estado === 'pagada' ? '#495057' : '#fff',
                        border: obra.estado === 'pagada' ? '1px solid #dee2e6' : 'none',
                        transition: 'all 0.2s ease',
                        fontSize: '1.05rem'
                      }}
                      onClick={() => navegar(`/obras/${obra.id}`)}
                    >
                      {obra.estado === 'pagada' ? (
                        <><i className="bi bi-eye-fill me-2"></i>Ver Detalles</>
                      ) : (
                        <><i className="bi bi-tools me-2"></i>Gestionar Obra</>
                      )}
                    </button>

                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {obrasFiltradas.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="col-12 text-center py-5 text-muted d-flex flex-column align-items-center justify-content-center"
            style={{ minHeight: '400px' }}
          >
            <div className="bg-light rounded-circle d-flex align-items-center justify-content-center mb-4 border shadow-sm" style={{ width: '130px', height: '130px' }}>
              <i className="bi bi-search" style={{ fontSize: '4rem', color: '#cbd5e1' }}></i>
            </div>
            <h3 className="fw-bolder text-dark mb-3">No hay resultados</h3>
            <p className="fs-5 text-secondary" style={{ maxWidth: '400px', margin: '0 auto' }}>No hemos encontrado ninguna obra que coincida con tus criterios de búsqueda actuales.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
