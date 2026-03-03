import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ModalConfirmacion({ visible, mensaje, alConfirmar, alCancelar, tipo = 'danger', textoConfirmar = 'Aceptar' }) {
    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(3px)'
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="bg-white rounded border-0 shadow-lg p-4 mx-3"
                        style={{ maxWidth: '450px', width: '100%' }}
                    >
                        <div className="d-flex align-items-center mb-3">
                            <div className={`rounded-circle bg-${tipo}-subtle p-3 me-3 text-${tipo} d-flex align-items-center justify-content-center`} style={{ width: '50px', height: '50px' }}>
                                <i className={`fs-3 bi bi-${tipo === 'danger' ? 'exclamation-triangle-fill' : tipo === 'success' ? 'check-circle-fill' : 'info-circle-fill'}`}></i>
                            </div>
                            <h5 className="mb-0 fw-bold">Confirmación</h5>
                        </div>
                        <p className="text-secondary mb-4 ps-1" style={{ fontSize: '1.05rem' }}>{mensaje}</p>
                        <div className="d-flex justify-content-end gap-2 mt-2">
                            <button className="btn btn-light fw-bold px-4 border" onClick={alCancelar}>Cancelar</button>
                            <button
                                className={`btn btn-${tipo} fw-bold px-4`}
                                onClick={() => {
                                    if (alConfirmar) alConfirmar();
                                }}
                            >
                                {textoConfirmar}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
