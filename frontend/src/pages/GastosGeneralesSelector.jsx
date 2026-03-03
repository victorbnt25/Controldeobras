import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function GastosGeneralesSelector() {
    const navigate = useNavigate();
    const [mes, setMes] = useState(new Date().getMonth() + 1);
    const [anio, setAnio] = useState(new Date().getFullYear());

    const alNavegar = (e) => {
        e.preventDefault();
        navigate(`/gastos-generales/${anio}/${mes}`);
    };

    const meses = [
        { num: 1, nombre: "Enero" },
        { num: 2, nombre: "Febrero" },
        { num: 3, nombre: "Marzo" },
        { num: 4, nombre: "Abril" },
        { num: 5, nombre: "Mayo" },
        { num: 6, nombre: "Junio" },
        { num: 7, nombre: "Julio" },
        { num: 8, nombre: "Agosto" },
        { num: 9, nombre: "Septiembre" },
        { num: 10, nombre: "Octubre" },
        { num: 11, nombre: "Noviembre" },
        { num: 12, nombre: "Diciembre" },
    ];

    const anios = [];
    const anioActual = new Date().getFullYear();
    for (let i = anioActual - 5; i <= anioActual + 5; i++) {
        anios.push(i);
    }

    return (
        <div className="diseño-corporativo">
            <div className="cabecera-pagina mb-4">
                <div>
                    <h1 className="titulo-pagina">Gastos Generales</h1>
                    <p className="subtitulo-pagina">Selecciona el periodo para ver o registrar gastos.</p>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card shadow-sm border-0"
                style={{ maxWidth: "500px", margin: "0 auto", borderRadius: "12px" }}
            >
                <div className="card-body p-4">
                    <form onSubmit={alNavegar}>
                        <div className="mb-4">
                            <label className="form-label text-muted fw-bold">Año</label>
                            <select className="form-select form-select-lg" value={anio} onChange={(e) => setAnio(e.target.value)}>
                                {anios.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="form-label text-muted fw-bold">Mes</label>
                            <select className="form-select form-select-lg" value={mes} onChange={(e) => setMes(e.target.value)}>
                                {meses.map(m => (
                                    <option key={m.num} value={m.num}>{m.nombre}</option>
                                ))}
                            </select>
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg w-100 fw-bold shadow-sm">
                            <i className="bi bi-search me-2"></i> Ir al Periodo
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
