import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ModalSeleccionPartida({ visible, partidas, onSelect, onCancel }) {
  const [filtro, setFiltro] = useState("");

  const partidasFiltradas = partidas.filter(p =>
    p.descripcion?.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="modal-partidas-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="modal-overlay-custom"
          onClick={onCancel}
        >
          <motion.div
            key="modal-partidas-container"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="modal-container-custom"
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header-custom">
              <div>
                <h5 className="modal-title-custom">Seleccionar Partida de Plantilla</h5>
                <p className="modal-subtitle-custom">Busca y selecciona una partida predefinida para añadirla al documento.</p>
              </div>
              <button className="btn-close-custom" onClick={onCancel}><i className="bi bi-x-lg"></i></button>
            </div>

            <div className="modal-search-box">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0"><i className="bi bi-search text-muted"></i></span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Filtrar por nombre o descripción..."
                  value={filtro}
                  onChange={e => setFiltro(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="mt-2 small text-muted">
                Mostrando {partidasFiltradas.length} de {partidas.length} partidas.
              </div>
            </div>

            <div className="modal-body-custom">
              <div className="list-group list-group-flush custom-list">
                {partidasFiltradas.length === 0 ? (
                  <div className="text-center py-5" key="no-results">
                    <i className="bi bi-search display-4 opacity-25"></i>
                    <p className="mt-3 text-muted">No se encontraron partidas con ese filtro.</p>
                  </div>
                ) : (
                  partidasFiltradas.map((p, idx) => (
                    <button
                      key={p.id ? `p-${p.id}` : `idx-${idx}`}
                      className="list-group-item list-group-item-action partida-item-custom"
                      onClick={() => onSelect(p)}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="partida-info-main">
                          <span className="partida-nombre">{p.descripcion}</span>
                        </div>
                        <div className="partida-precios">
                          <span className="badge rounded-pill bg-light text-dark border me-2">Cant: {Number(p.cantidad).toFixed(2)}</span>
                          <span className="badge rounded-pill bg-primary text-white">{Number(p.precio).toFixed(2)} €/ud</span>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="modal-footer-custom">
              <button className="btn btn-secondary px-4 fw-bold" onClick={onCancel}>Cerrar</button>
            </div>
          </motion.div>
        </motion.div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        .modal-overlay-custom {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(4px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }
        .modal-container-custom {
          background: white;
          width: 100%;
          max-width: 800px;
          max-height: 90vh;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          overflow: hidden;
        }
        .modal-header-custom {
          padding: 1.5rem;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .modal-title-custom {
          margin: 0;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.5px;
        }
        .modal-subtitle-custom {
          margin: 0.25rem 0 0;
          font-size: 0.9rem;
          color: #64748b;
        }
        .btn-close-custom {
          background: #e2e8f0;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #475569;
          transition: all 0.2s;
        }
        .btn-close-custom:hover {
          background: #cbd5e1;
          color: #0f172a;
        }
        .modal-search-box {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #e2e8f0;
        }
        .modal-body-custom {
          flex: 1;
          overflow-y: auto;
          background: white;
        }
        .custom-list .partida-item-custom {
          padding: 1rem 1.5rem;
          border-left: 0;
          border-right: 0;
          transition: all 0.2s;
        }
        .partida-item-custom:hover {
          background-color: #f1f5f9;
        }
        .partida-nombre {
          font-weight: 600;
          color: #1e293b;
          font-size: 1.05rem;
          display: block;
        }
        .partida-precios {
          display: flex;
          gap: 0.5rem;
        }
        .modal-footer-custom {
          padding: 1rem 1.5rem;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: flex-end;
        }
        @media (max-width: 576px) {
          .partida-item-custom .d-flex {
            flex-direction: column;
            align-items: flex-start !important;
          }
          .partida-precios {
            margin-top: 0.5rem;
          }
        }
      `}} />
    </AnimatePresence>
  );
}
