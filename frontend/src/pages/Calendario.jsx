import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

// Configurar moment para español
moment.locale('es');
const localizer = momentLocalizer(moment);

export default function CalendarioPage() {
    const [eventos, setEventos] = useState([]);
    const [obras, setObras] = useState([]);
    const [cargando, setCargando] = useState(true);

    // Estado del modal de nueva planificación
    const [modalAbierto, setModalAbierto] = useState(false);
    const [fechaInicio, setFechaInicio] = useState(null);
    const [fechaFin, setFechaFin] = useState(null);
    const [obrasSeleccionadas, setObrasSeleccionadas] = useState([]);
    const [modoFecha, setModoFecha] = useState('uno'); // 'uno' | 'varios'

    // Estado confirmación borrar
    const [modalBorrar, setModalBorrar] = useState({ visible: false, db_id: null, titulo: "" });

    const cargarDatos = async () => {
        try {
            setCargando(true);
            const [dataEventos, dataObras] = await Promise.all([
                api.obtenerCalendario(),
                api.obtenerObras()
            ]);

            // Convertir fechas string a objetos Date
            const eventosConvertidos = dataEventos.map(ev => ({
                ...ev,
                start: new Date(ev.start),
                end: new Date(ev.end)
            }));
            setEventos(eventosConvertidos);

            // Obras en curso para el selector
            setObras(dataObras.filter(o => o.estado === 'en_curso'));
        } catch (error) {
            toast.error("Error al cargar datos del calendario: " + error.message);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    const eventStyleGetter = (event) => {
        var backgroundColor = event.color;
        var style = {
            backgroundColor: backgroundColor,
            borderRadius: '4px',
            opacity: 0.9,
            color: 'white',
            border: '0px',
            display: 'block',
            padding: '2px 5px',
            fontWeight: 'bold',
            fontSize: '0.85em'
        };
        return {
            style: style
        };
    };

    const alSeleccionarEspacio = ({ start, end }) => {
        setFechaInicio(start);

        let finDate = new Date(end);
        if (finDate.getHours() === 0 && finDate.getMinutes() === 0 && finDate > start) {
            finDate = new Date(finDate.getTime() - 1);
        }
        setFechaFin(finDate);
        setObrasSeleccionadas([]);

        // Auto-detectar modo: si arrastró más de un día -> 'varios'
        const diffDias = Math.round((finDate - start) / (1000 * 60 * 60 * 24));
        setModoFecha(diffDias > 0 ? 'varios' : 'uno');

        setModalAbierto(true);
    };

    const guardarPlanificacion = async () => {
        if (obrasSeleccionadas.length === 0) {
            toast.warning("Debe seleccionar al menos una obra");
            return;
        }

        try {
            const fiStr = moment(fechaInicio).format('YYYY-MM-DD');
            const ffStr = moment(fechaFin).format('YYYY-MM-DD');
            await api.planificarObra({
                obras_ids: obrasSeleccionadas,
                fecha_inicio: fiStr,
                fecha_fin: ffStr
            });
            toast.success("Fechas planificadas correctamente");
            setModalAbierto(false);
            cargarDatos();
        } catch (error) {
            toast.error("Error al guardar planificación");
        }
    };

    const alSeleccionarEvento = async (evento) => {
        // Evento azul: planificacion (Se puede borrar libremente)
        if (evento.type === 'planificacion') {
            setModalBorrar({
                visible: true,
                db_id: evento.db_id,
                titulo: evento.title
            });
        }
    };

    const confirmarBorrado = async () => {
        try {
            await api.borrarPlanificacion(modalBorrar.db_id);
            toast.success("Planificación eliminada");
            setModalBorrar({ visible: false, db_id: null, titulo: "" });
            cargarDatos();
        } catch (error) {
            toast.error("Error al borrar planificación");
        }
    };

    if (cargando && eventos.length === 0) return <div className="p-5 text-center text-muted"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="diseño-corporativo h-100 d-flex flex-column">
            {/* Cabecera */}
            <div className="cabecera-pagina">
                <div>
                    <h1 className="titulo-pagina">Calendario y Planificación</h1>
                    <p className="subtitulo-pagina">Arrastra sobre varios días para planificar un rango. Haz click en una obra fijada para borrarla.</p>
                </div>
                <button className="btn btn-outline-secondary" onClick={cargarDatos}>
                    <i className="bi bi-arrow-clockwise"></i> Refrescar
                </button>
            </div>

            {/* Modal de Borrado */}
            <AnimatePresence>
                {modalBorrar.visible && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded border-0 shadow-lg p-4 mx-3" style={{ maxWidth: '400px', width: '100%' }}
                        >
                            <h5 className="fw-bold mb-3 text-danger"><i className="bi bi-trash text-danger me-2"></i> Eliminar Planificación</h5>
                            <p className="text-muted mb-4">¿Deseas eliminar del calendario la planificación de <strong>"{modalBorrar.titulo}"</strong> para este día?</p>
                            <div className="d-flex justify-content-end gap-2 mt-2">
                                <button className="btn btn-light fw-bold px-4 border" onClick={() => setModalBorrar({ visible: false, db_id: null, titulo: "" })}>Cancelar</button>
                                <button className="btn btn-danger fw-bold px-4" onClick={confirmarBorrado}>Eliminar</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal de Asignación */}
            <AnimatePresence>
                {modalAbierto && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded border-0 shadow-lg p-4 mx-3" style={{ maxWidth: '420px', width: '100%' }}
                        >
                            <h5 className="fw-bold mb-3"><i className="bi bi-calendar-plus text-primary me-2"></i> Planificar Obra</h5>

                            {/* Toggle Un día / Varios días */}
                            <div className="btn-group w-100 mb-3" role="group">
                                <button
                                    type="button"
                                    className={`btn btn-sm ${modoFecha === 'uno' ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => {
                                        setModoFecha('uno');
                                        setFechaFin(fechaInicio);
                                    }}
                                >
                                    <i className="bi bi-calendar-event me-1"></i> Un día
                                </button>
                                <button
                                    type="button"
                                    className={`btn btn-sm ${modoFecha === 'varios' ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => setModoFecha('varios')}
                                >
                                    <i className="bi bi-calendar-range me-1"></i> Varios días
                                </button>
                            </div>

                            {/* Inputs de fecha según modo */}
                            {modoFecha === 'uno' ? (
                                <div className="mb-3">
                                    <label className="form-label small fw-bold mb-1">Fecha</label>
                                    <input
                                        type="date"
                                        className="form-control form-control-sm"
                                        value={fechaInicio ? moment(fechaInicio).format('YYYY-MM-DD') : ''}
                                        onChange={(e) => {
                                            const d = new Date(e.target.value);
                                            setFechaInicio(d);
                                            setFechaFin(d);
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="row g-2 mb-3">
                                    <div className="col-6">
                                        <label className="form-label small fw-bold mb-1">Desde</label>
                                        <input
                                            type="date"
                                            className="form-control form-control-sm"
                                            value={fechaInicio ? moment(fechaInicio).format('YYYY-MM-DD') : ''}
                                            onChange={(e) => setFechaInicio(new Date(e.target.value))}
                                        />
                                    </div>
                                    <div className="col-6">
                                        <label className="form-label small fw-bold mb-1">Hasta</label>
                                        <input
                                            type="date"
                                            className="form-control form-control-sm"
                                            value={fechaFin ? moment(fechaFin).format('YYYY-MM-DD') : ''}
                                            onChange={(e) => setFechaFin(new Date(e.target.value))}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="mb-4" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                <label className="form-label small fw-bold mb-2 d-block">Obras en Curso</label>
                                {obras.length === 0 && <span className="small text-muted">No hay obras en curso</span>}
                                {obras.map(o => (
                                    <div className="form-check" key={o.id}>
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            value={o.id}
                                            id={`obraCheck_${o.id}`}
                                            checked={obrasSeleccionadas.includes(o.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setObrasSeleccionadas([...obrasSeleccionadas, o.id]);
                                                } else {
                                                    setObrasSeleccionadas(obrasSeleccionadas.filter(id => id !== o.id));
                                                }
                                            }}
                                        />
                                        <label className="form-check-label small" htmlFor={`obraCheck_${o.id}`}>
                                            {o.numero_obra} - {o.titulo || o.cliente_nombre}
                                        </label>
                                    </div>
                                ))}
                            </div>

                            <div className="d-flex justify-content-end gap-2 mt-2">
                                <button className="btn btn-light fw-bold px-4 border" onClick={() => setModalAbierto(false)}>Cancelar</button>
                                <button className="btn btn-primary fw-bold px-4" onClick={guardarPlanificacion}>Guardar</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="tarjeta-corporativa flex-grow-1 p-3 bg-white" style={{ minHeight: '600px', position: 'relative' }}>
                <div className="d-flex gap-4 mb-3 align-items-center bg-light p-2 rounded justify-content-center border">
                    <span className="d-flex align-items-center small fw-bold text-secondary">
                        <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#1f3a8a', display: 'inline-block', marginRight: 6 }}></span> Planificación de Obra
                    </span>
                </div>

                <Calendar
                    localizer={localizer}
                    events={eventos}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: 'calc(100% - 50px)' }}
                    views={['month', 'week', 'agenda']}
                    defaultView="month"
                    messages={{
                        next: "Siguiente",
                        previous: "Anterior",
                        today: "Hoy",
                        month: "Mes",
                        week: "Semana",
                        day: "Día",
                        agenda: "Agenda",
                        noEventsInRange: "No hay planificación en este rango.",
                    }}
                    eventPropGetter={eventStyleGetter}
                    selectable={true}
                    longPressThreshold={10}
                    onSelectSlot={alSeleccionarEspacio}
                    onSelectEvent={alSeleccionarEvento}
                />
            </div>
        </div>
    );
}
