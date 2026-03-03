import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Usuarios() {
    const { usuario } = useAuth();
    const navegar = useNavigate();
    const [usuarios, setUsuarios] = useState([]);
    const [error, setError] = useState(null);

    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [datosFormulario, setDatosFormulario] = useState({ id: null, username: '', password: '', rol: 'usuario', activo: 1 });
    const [mostrarPassword, setMostrarPassword] = useState(false);

    useEffect(() => {
        if (usuario?.rol !== 'superusuario') {
            navegar('/dashboard');
            return;
        }
        cargarUsuarios();
    }, [usuario, navegar]);

    const cargarUsuarios = async () => {
        try {
            const datos = await api.obtenerUsuarios();
            setUsuarios(datos);
        } catch (err) {
            setError('Error al cargar la lista de usuarios');
        }
    };

    const alEditarUsuario = (u) => {
        setDatosFormulario({ id: u.id, username: u.username, password: '', rol: u.rol, activo: u.activo });
        setMostrarFormulario(true);
    };

    const alCrearNuevoUsuario = () => {
        setDatosFormulario({ id: null, username: '', password: '', rol: 'usuario', activo: 1 });
        setMostrarFormulario(true);
    };

    const alEnviarFormulario = async (e) => {
        e.preventDefault();
        try {
            if (datosFormulario.id) {
                // Actualizar
                const datosActualizacion = { id: datosFormulario.id, username: datosFormulario.username, rol: datosFormulario.rol, activo: datosFormulario.activo };
                if (datosFormulario.password) datosActualizacion.password = datosFormulario.password;
                await api.actualizarUsuario(datosActualizacion);
            } else {
                // Crear
                if (!datosFormulario.username || !datosFormulario.password) {
                    alert('Usuario y contraseña obligatorios');
                    return;
                }
                await api.crearUsuario(datosFormulario);
            }
            setMostrarFormulario(false);
            cargarUsuarios();
        } catch (err) {
            alert('Error guardando usuario: ' + err.mensaje);
        }
    };

    return (
        <div className="diseño-corporativo">
            <div className="cabecera-pagina mb-4 gap-3">
                <div>
                    <h1 className="titulo-pagina m-0"><i className="bi bi-shield-lock text-primary me-2"></i>Seguridad y Usuarios</h1>
                    <p className="subtitulo-pagina m-0">Administración de accesos y contraseñas</p>
                </div>
                {!mostrarFormulario && (
                    <button className="btn btn-primary fw-bold px-4" onClick={alCrearNuevoUsuario} id="botonNuevoUsuario">
                        + Nuevo Usuario
                    </button>
                )}
            </div>

            {error && <div className="alert alert-danger shadow-sm mb-4">{error}</div>}

            {mostrarFormulario ? (
                <div className="tarjeta-corporativa p-4" style={{ maxWidth: '600px' }} id="seccionFormulario">
                    <h5 className="fw-bold mb-4">{datosFormulario.id ? 'Editar Usuario' : 'Crear Usuario'}</h5>
                    <form onSubmit={alEnviarFormulario}>
                        <div className="mb-3">
                            <label className="form-label">Nombre de Usuario</label>
                            <input type="text" className="form-control" value={datosFormulario.username}
                                onChange={(e) => setDatosFormulario({ ...datosFormulario, username: e.target.value })}
                                id="campoUsuario" />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Contraseña {datosFormulario.id && '(Dejar en blanco para no cambiar)'}</label>
                            <div className="input-group">
                                <input
                                    type={mostrarPassword ? "text" : "password"}
                                    className="form-control"
                                    value={datosFormulario.password}
                                    onChange={(e) => setDatosFormulario({ ...datosFormulario, password: e.target.value })}
                                    id="campoPassword"
                                />
                                <button
                                    type="button"
                                    className="btn btn-light border"
                                    onClick={() => setMostrarPassword(!mostrarPassword)}
                                    tabIndex="-1"
                                >
                                    <i className={`bi bi-eye${mostrarPassword ? '-slash' : ''}`}></i>
                                </button>
                            </div>
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Rol de Acceso</label>
                            <select
                                className="form-select"
                                value={datosFormulario.rol}
                                onChange={(e) => setDatosFormulario({ ...datosFormulario, rol: e.target.value })}
                                disabled={datosFormulario.id && (usuarios.find(u => u.id === datosFormulario.id)?.username === usuario.username)}
                                id="seleccionRol"
                            >
                                <option value="usuario">Usuario (Estándar)</option>
                                <option value="superusuario">Superusuario (Administrador)</option>
                            </select>
                        </div>
                        <div className="mb-4 form-check">
                            <input type="checkbox" className="form-check-input" id="activoCheck"
                                checked={datosFormulario.activo == 1}
                                onChange={(e) => setDatosFormulario({ ...datosFormulario, activo: e.target.checked ? 1 : 0 })}
                                disabled={datosFormulario.id && (usuarios.find(u => u.id === datosFormulario.id)?.username === usuario.username)}
                            />
                            <label className="form-check-label fw-bold" htmlFor="activoCheck">Usuario Activo (Permite login)</label>
                        </div>

                        <div className="d-flex gap-2">
                            <button type="submit" className="btn btn-success fw-bold px-4" id="botonGuardarUsuario">Guardar</button>
                            <button type="button" className="btn btn-outline-secondary" onClick={() => setMostrarFormulario(false)}>Cancelar</button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="tarjeta-corporativa shadow-sm overflow-hidden">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0" id="tablaUsuarios">
                            <thead className="table-light text-muted small text-uppercase">
                                <tr>
                                    <th className="ps-4">Usuario</th>
                                    <th>Rol</th>
                                    <th>Estado</th>
                                    <th>Creado el</th>
                                    <th className="text-end pe-4">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usuarios.map(u => (
                                    <tr key={u.id}>
                                        <td className="ps-4 fw-bold">{u.username}</td>
                                        <td><span className={`badge ${u.rol === 'superusuario' ? 'bg-danger' : 'bg-secondary'}`}>{u.rol.toUpperCase()}</span></td>
                                        <td>
                                            <span className={`badge ${u.activo ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                                                {u.activo ? 'Habilitado' : 'Bloqueado'}
                                            </span>
                                        </td>
                                        <td className="text-muted small">{u.created_at}</td>
                                        <td className="text-end pe-4">
                                            <button className="btn btn-sm btn-outline-primary" onClick={() => alEditarUsuario(u)} id={`editar-usuario-${u.id}`}>
                                                {usuario.username === u.username ? 'Mi Cuenta / Cambiar Clave' : 'Editar / Cambiar Clave'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
