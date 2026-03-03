import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { useConfig } from "../context/ConfigContext";

export default function Configuracion() {
    const { refrescarConfiguracion } = useConfig();

    // Estado para Empresa
    const [datosEmpresa, setDatosEmpresa] = useState({
        nombre_empresa: "",
        nombre_ceo: "",
        cif_dni: "",
        direccion: "",
        poblacion: "",
        telefono: "",
        cuenta_bancaria: "",
        email_empresa: ""
    });

    // Estado para Trabajadores
    const [trabajadores, setTrabajadores] = useState([]);
    const [idTrabajadorSeleccionado, setIdTrabajadorSeleccionado] = useState("");
    const [datosTrabajador, setDatosTrabajador] = useState(null);

    // Estado de UI
    const [seccionActiva, setSeccionActiva] = useState(null); // 'empresa' | 'trabajador' | null
    const [mensaje, setMensaje] = useState(null);
    const [error, setError] = useState(null);
    const [cargando, setCargando] = useState(false);

    useEffect(() => {
        cargarConfiguracion();
        cargarTrabajadores();
    }, []);

    const cargarConfiguracion = async () => {
        try {
            const datos = await api.obtenerConfiguracion();
            if (datos) setDatosEmpresa(datos);
        } catch (err) {
            console.error(err);
        }
    };

    const cargarTrabajadores = async () => {
        try {
            const datos = await api.obtenerTrabajadores();
            setTrabajadores(datos);
        } catch (err) {
            console.error("Error cargando trabajadores", err);
        }
    };

    // --- LÓGICA EMPRESA ---
    const alCambioEmpresa = (e) => {
        const { name, value } = e.target;
        setDatosEmpresa(prev => ({ ...prev, [name]: value }));
    };

    const alSubirLogo = (e) => {
        const archivo = e.target.files[0];
        if (archivo) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setDatosEmpresa(prev => ({ ...prev, logo_url: reader.result }));
            };
            reader.readAsDataURL(archivo);
        }
    };

    const alEnviarEmpresa = async (e) => {
        e.preventDefault();
        setCargando(true);
        setMensaje(null);
        setError(null);
        try {
            await api.actualizarConfiguracion(datosEmpresa);
            setMensaje("Datos de empresa actualizados correctamente.");
            await refrescarConfiguracion();
        } catch (err) {
            setError("Error al guardar la configuración de empresa.");
        } finally {
            setCargando(false);
        }
    };

    // --- LÓGICA TRABAJADOR ---
    const alSeleccionarTrabajador = (e) => {
        const id = e.target.value;
        setIdTrabajadorSeleccionado(id);
        if (id) {
            const t = trabajadores.find(w => w.id == id);
            setDatosTrabajador({ ...t });
        } else {
            setDatosTrabajador(null);
        }
    };

    const alCambioTrabajador = (e) => {
        const { name, value } = e.target;
        setDatosTrabajador(prev => ({ ...prev, [name]: value }));
    };

    const alEnviarTrabajador = async (e) => {
        e.preventDefault();
        if (!datosTrabajador) return;

        setCargando(true);
        setMensaje(null);
        setError(null);
        try {
            await api.actualizarTrabajador(datosTrabajador.id, datosTrabajador);
            setMensaje(`Tarifas de ${datosTrabajador.nombre} actualizadas.`);
            cargarTrabajadores();
        } catch (err) {
            setError("Error al actualizar las tarifas del trabajador.");
        } finally {
            setCargando(false);
        }
    };

    const alternarSeccion = (seccion) => {
        setSeccionActiva(seccionActiva === seccion ? null : seccion);
    };

    return (
        <div className="diseño-corporativo">
            <div className="cabecera-pagina mb-4">
                <div>
                    <h1 className="titulo-pagina">Configuración</h1>
                    <p className="subtitulo-pagina">Ajustes generales de empresa y gestión de tarifas de personal.</p>
                </div>
            </div>

            <div className="mx-auto" style={{ maxWidth: '800px' }}>

                {mensaje && <div className="alert alert-success mb-3 shadow-sm">{mensaje}</div>}
                {error && <div className="alert alert-danger mb-3 shadow-sm">{error}</div>}

                {/* ACORDEÓN 1: AJUSTES DE EMPRESA */}
                <div className="tarjeta-corporativa mb-3">
                    <div
                        className="p-3 d-flex justify-content-between align-items-center bg-white border-bottom"
                        onClick={() => alternarSeccion('empresa')}
                        style={{ cursor: 'pointer', borderRadius: '2px 2px 0 0' }}
                        id="acordeonEmpresa"
                    >
                        <h5 className="m-0 fw-bold text-dark">
                            <i className="bi bi-building me-2 text-primary"></i>Ajustes de Empresa
                        </h5>
                        <i className={`bi bi-chevron-${seccionActiva === 'empresa' ? 'up' : 'down'} fs-5 text-muted`}></i>
                    </div>

                    {seccionActiva === 'empresa' && (
                        <div className="p-4" id="formularioEmpresa">
                            <form onSubmit={alEnviarEmpresa}>
                                <div className="mb-3">
                                    <label className="form-label">Nombre de la Empresa</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="nombre_empresa"
                                        value={datosEmpresa.nombre_empresa || ''}
                                        onChange={alCambioEmpresa}
                                        id="campoNombreEmpresa"
                                    />
                                </div>
                                <div className="mb-3">


                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Nombre del CEO / Autónomo</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="nombre_ceo"
                                        value={datosEmpresa.nombre_ceo || ''}
                                        onChange={alCambioEmpresa}
                                        id="campoNombreCeo"
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">CIF / DNI</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="cif_dni"
                                        value={datosEmpresa.cif_dni || ''}
                                        onChange={alCambioEmpresa}
                                        id="campoCifEmpresa"
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Dirección</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="direccion"
                                        value={datosEmpresa.direccion || ''}
                                        onChange={alCambioEmpresa}
                                        id="campoDireccionEmpresa"
                                    />
                                </div>
                                <div className="row g-3 mb-3">
                                    <div className="col-md-6">
                                        <label className="form-label">Población</label>
                                        <input type="text" className="form-control" name="poblacion" value={datosEmpresa.poblacion || ''} onChange={alCambioEmpresa} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Teléfono</label>
                                        <input type="text" className="form-control" name="telefono" value={datosEmpresa.telefono || ''} onChange={alCambioEmpresa} />
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Cuenta Bancaria (IBAN)</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="cuenta_bancaria"
                                        value={datosEmpresa.cuenta_bancaria || ''}
                                        onChange={alCambioEmpresa}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Email Corporativo</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        name="email_empresa"
                                        value={datosEmpresa.email_empresa || ''}
                                        onChange={alCambioEmpresa}
                                    />
                                </div>

                                <div className="acciones-formulario">
                                    <button type="submit" className="btn btn-primary px-4 fw-bold" disabled={cargando} id="botonGuardarEmpresa">
                                        {cargando ? "Guardando..." : "Guardar Datos Empresa"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>

                {/* ACORDEÓN 2: AJUSTES DE TRABAJADOR */}
                <div className="tarjeta-corporativa mb-3">
                    <div
                        className="p-3 d-flex justify-content-between align-items-center bg-white border-bottom"
                        onClick={() => alternarSeccion('trabajador')}
                        style={{ cursor: 'pointer', borderRadius: '2px 2px 0 0' }}
                        id="acordeonTrabajador"
                    >
                        <h5 className="m-0 fw-bold text-dark">
                            <i className="bi bi-people me-2 text-primary"></i>Ajustes de Tarifas de Personal
                        </h5>
                        <i className={`bi bi-chevron-${seccionActiva === 'trabajador' ? 'up' : 'down'} fs-5 text-muted`}></i>
                    </div>

                    {seccionActiva === 'trabajador' && (
                        <div className="p-4" id="formularioTarifas">
                            <div className="mb-4">
                                <label className="form-label">Seleccionar Trabajador</label>
                                <select
                                    className="form-select form-select-lg"
                                    value={idTrabajadorSeleccionado}
                                    onChange={alSeleccionarTrabajador}
                                    id="seleccionTrabajador"
                                >
                                    <option value="">-- Selecciona un trabajador --</option>
                                    {trabajadores.map(t => (
                                        <option key={t.id} value={t.id}>{t.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            {datosTrabajador && (
                                <div className="bg-light p-4 rounded border shadow-sm">
                                    <h6 className="fw-bold mb-3 text-muted text-uppercase small">Tarifas de {datosTrabajador.nombre}</h6>
                                    <form onSubmit={alEnviarTrabajador}>
                                        <div className="row g-3">
                                            <div className="col-md-4">
                                                <label className="form-label">Precio Hora (€)</label>
                                                <div className="input-group">
                                                    <input
                                                        type="number" step="0.01"
                                                        className="form-control fw-bold"
                                                        name="precio_hora"
                                                        value={datosTrabajador.precio_hora}
                                                        onChange={alCambioTrabajador}
                                                        id="campoPrecioHora"
                                                    />
                                                    <span className="input-group-text">€/h</span>
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label">Precio Jornada/Día (€)</label>
                                                <div className="input-group">
                                                    <input
                                                        type="number" step="0.01"
                                                        className="form-control fw-bold"
                                                        name="precio_dia"
                                                        value={datosTrabajador.precio_dia || ''}
                                                        onChange={alCambioTrabajador}
                                                        placeholder="0.00"
                                                        id="campoPrecioDia"
                                                    />
                                                    <span className="input-group-text">€/día</span>
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label">Precio Sábado (€)</label>
                                                <div className="input-group">
                                                    <input
                                                        type="number" step="0.01"
                                                        className="form-control fw-bold"
                                                        name="precio_sabado"
                                                        value={datosTrabajador.precio_sabado}
                                                        onChange={alCambioTrabajador}
                                                        id="campoPrecioSabado"
                                                    />
                                                    <span className="input-group-text">€</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="acciones-formulario mt-4">
                                            <button type="submit" className="btn btn-success px-4 fw-bold" disabled={cargando} id="botonGuardarTarifas">
                                                {cargando ? "Guardando..." : "Actualizar Tarifas"}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
// Forzado de recarga HMR 2