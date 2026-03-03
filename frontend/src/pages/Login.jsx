import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

export default function Login() {
    const { iniciarSesion } = useAuth();
    const [nombreUsuario, setNombreUsuario] = useState('');
    const [contraseña, setContraseña] = useState('');
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);

    const alEnviarFormulario = async (e) => {
        e.preventDefault();
        if (!nombreUsuario || !contraseña) {
            setError('Por favor, ingresa usuario y contraseña');
            return;
        }
        setError('');
        setCargando(true);
        try {
            await iniciarSesion(nombreUsuario, contraseña);
        } catch (err) {
            setError('Usuario o contraseña incorrectos');
        } finally {
            setCargando(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            minHeight: '100vh',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#dde3ea', // El mismo `--bg-light` que tiene el body del resto de la app
            padding: '2rem',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Animaciones Blobs - Colores corporativos de la Sidebar y Botones de la App */}
            <motion.div
                animate={{ x: [0, 40, 0], y: [0, -20, 0] }}
                transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
                style={{
                    position: 'absolute', top: '-10%', left: '-5%', width: '45vw', height: '45vw',
                    background: 'radial-gradient(circle, rgba(13, 110, 253, 0.12) 0%, transparent 60%)', // primary-color sutil
                    filter: 'blur(60px)', borderRadius: '50%', zIndex: 0
                }}
            />
            <motion.div
                animate={{ x: [0, -50, 0], y: [0, 30, 0] }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                style={{
                    position: 'absolute', bottom: '-15%', right: '-10%', width: '50vw', height: '50vw',
                    background: 'radial-gradient(circle, rgba(15, 23, 42, 0.08) 0%, transparent 60%)', // sidebar-bg sutil
                    filter: 'blur(60px)', borderRadius: '50%', zIndex: 0
                }}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="card text-center"
                style={{
                    width: '100%',
                    maxWidth: '440px',
                    padding: '3rem',
                    borderRadius: '8px',
                    border: '1px solid #c0c8d0', // Corporate border color
                    borderTop: '4px solid #0d6efd', // Primary blue accent top banner
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    backgroundColor: '#ffffff',
                    zIndex: 1
                }}
                id="contenedorLogin"
            >
                <div className="mb-4 pb-2">
                    <div className="d-inline-flex align-items-center justify-content-center mb-3 text-white" style={{ width: '60px', height: '60px', borderRadius: '12px', background: '#0f172a' }}>
                        <i className="bi bi-buildings fs-2"></i>
                    </div>
                    <h2 className="fw-bolder mb-1" style={{ letterSpacing: '-0.5px', fontSize: '2rem', color: '#212529' }}>ControlObra</h2>
                    <p className="m-0 fw-bold text-uppercase tracking-wide" style={{ letterSpacing: '2px', fontSize: '0.75rem', color: '#6c757d' }}>controla tu negocio</p>
                </div>

                {error && <div className="alert alert-danger p-2 text-center" id="mensajeError">{error}</div>}

                <form onSubmit={alEnviarFormulario} className="text-start">
                    <div className="mb-3">
                        <label className="form-label fw-bold" style={{ fontSize: '0.8rem', letterSpacing: '0.5px', color: '#334155' }}>USUARIO</label>
                        <input
                            type="text"
                            className="form-control shadow-none"
                            placeholder="Ej. admin"
                            value={nombreUsuario}
                            onChange={e => setNombreUsuario(e.target.value)}
                            autoFocus
                            id="inputUsuario"
                            style={{ fontSize: '1rem', padding: '0.75rem 1rem', backgroundColor: '#ffffff', borderRadius: '4px', border: '1px solid #c0c8d0', color: '#212529' }}
                        />
                    </div>
                    <div className="mb-4">
                        <label className="form-label fw-bold" style={{ fontSize: '0.8rem', letterSpacing: '0.5px', color: '#334155' }}>CONTRASEÑA</label>
                        <input
                            type="password"
                            className="form-control shadow-none"
                            placeholder="••••••••"
                            value={contraseña}
                            onChange={e => setContraseña(e.target.value)}
                            id="inputPassword"
                            style={{ fontSize: '1rem', padding: '0.75rem 1rem', backgroundColor: '#ffffff', borderRadius: '4px', border: '1px solid #c0c8d0', color: '#212529' }}
                        />
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="btn w-100 fw-bold border-0 text-white mt-3 shadow-sm"
                        disabled={cargando}
                        id="botonLogin"
                        style={{
                            background: '#0d6efd',
                            padding: '0.75rem',
                            borderRadius: '4px',
                            fontSize: '1rem'
                        }}
                    >
                        {cargando ? 'Accediendo...' : 'INICIAR SESIÓN'}
                    </motion.button>
                </form>
            </motion.div>
        </div>
    );
}
