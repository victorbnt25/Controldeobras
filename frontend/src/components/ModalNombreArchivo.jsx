import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Modal para personalizar el nombre del archivo antes de descargar.
 * Props:
 *   visible        – boolean
 *   nombreDefecto  – string, nombre que aparece relleno por defecto
 *   extension      – 'pdf' | 'xlsx'
 *   onDescargar(nombre) – callback con el nombre final elegido
 *   onCancelar     – callback para cerrar sin descargar
 */
export default function ModalNombreArchivo({ visible, nombreDefecto, extension, onDescargar, onCancelar }) {
    const [nombre, setNombre] = useState('');

    // Cada vez que se abre el modal, rellenar con el nombre por defecto
    useEffect(() => {
        if (visible) setNombre(nombreDefecto || '');
    }, [visible, nombreDefecto]);

    const icono = extension === 'xlsx' ? 'bi-file-earmark-excel-fill' : 'bi-file-earmark-pdf-fill';
    const colorIcono = extension === 'xlsx' ? '#1D6F42' : '#e53e3e';

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        zIndex: 9999,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backdropFilter: 'blur(4px)'
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="bg-white rounded shadow-lg p-4 mx-3"
                        style={{ maxWidth: '460px', width: '100%' }}
                    >
                        {/* Cabecera */}
                        <div className="d-flex align-items-center gap-3 mb-3">
                            <i className={`bi ${icono} fs-2`} style={{ color: colorIcono }}></i>
                            <div>
                                <h5 className="mb-0 fw-bold">Nombre del archivo</h5>
                                <p className="text-muted small mb-0">Puedes cambiarlo antes de descargar</p>
                            </div>
                        </div>

                        {/* Input nombre */}
                        <div className="mb-3">
                            <label className="form-label fw-bold small text-muted">Nombre del archivo</label>
                            <div className="input-group">
                                <input
                                    type="text"
                                    className="form-control"
                                    value={nombre}
                                    onChange={e => setNombre(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter' && nombre.trim()) onDescargar(nombre.trim()); }}
                                    autoFocus
                                    id="inputNombreArchivo"
                                    placeholder="Nombre del archivo..."
                                />
                                <span className="input-group-text text-muted fw-bold">.{extension}</span>
                            </div>
                            <div className="form-text">El archivo se guardará como: <strong>{(nombre || 'archivo').trim()}.{extension}</strong></div>
                        </div>

                        {/* Botones */}
                        <div className="d-flex justify-content-end gap-2 mt-3">
                            <button className="btn btn-light border fw-bold px-4" onClick={onCancelar}>Cancelar</button>
                            <button
                                className="btn fw-bold px-4 text-white"
                                style={{ backgroundColor: colorIcono, borderColor: colorIcono }}
                                disabled={!nombre.trim()}
                                onClick={() => onDescargar(nombre.trim())}
                            >
                                <i className={`bi ${icono} me-2`}></i>
                                Descargar
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
