import { useEffect, useState } from "react";
import { api } from "../services/api";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

const COLORES = ["#16a34a", "#dc2626", "#2563eb", "#7c3aed"];

export default function Dashboard() {
  const [datos, setDatos] = useState(null);
  const [tipoFiltro, setTipoFiltro] = useState("month"); // 'month' | 'year'
  const [añoSeleccionado, setAñoSeleccionado] = useState(new Date().getFullYear());
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth() + 1);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, [tipoFiltro, añoSeleccionado, mesSeleccionado]);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const resultado = await api.obtenerResumen({
        type: tipoFiltro,
        year: añoSeleccionado,
        month: mesSeleccionado
      });
      setDatos(resultado);
    } catch (error) {
      console.error(error);
    } finally {
      setCargando(false);
    }
  };

  if (!datos && cargando) return <div className="p-5 text-center text-muted">Cargando cuadro de mando...</div>;
  if (!datos) return <div className="p-5 text-center text-danger">Error al cargar datos</div>;

  const ingresos = Number(datos.ingresos_mes ?? 0);
  const gastos = Number(datos.gastos_mes ?? 0);
  const beneficio = ingresos - gastos;

  const datosGrafico = datos.grafico_meses || [];
  const datosDistribucion = datos.grafico_distribucion || [];

  // Generar años para el select (últimos 5 años)
  const años = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const mesesArr = [
    { id: 1, nombre: "Enero" }, { id: 2, nombre: "Febrero" }, { id: 3, nombre: "Marzo" },
    { id: 4, nombre: "Abril" }, { id: 5, nombre: "Mayo" }, { id: 6, nombre: "Junio" },
    { id: 7, nombre: "Julio" }, { id: 8, nombre: "Agosto" }, { id: 9, nombre: "Septiembre" },
    { id: 10, nombre: "Octubre" }, { id: 11, nombre: "Noviembre" }, { id: 12, nombre: "Diciembre" }
  ];

  return (
    <div className="diseño-corporativo">

      {/* CABECERA Y FILTROS */}
      <div className="cabecera-pagina">
        <div>
          <h1 className="titulo-pagina">Resumen Financiero</h1>
          <p className="subtitulo-pagina">Visión global del estado de la empresa.</p>
        </div>

        <div className="d-flex gap-2 bg-white p-2 rounded shadow-sm border" id="filtros-resumen">
          <div className="btn-group" role="group">
            <button
              type="button"
              className={`btn btn-sm fw-bold ${tipoFiltro === 'month' ? 'btn-primary' : 'btn-light border-0 text-secondary'}`}
              onClick={() => setTipoFiltro('month')}
            >
              Mensual
            </button>
            <button
              type="button"
              className={`btn btn-sm fw-bold ${tipoFiltro === 'year' ? 'btn-primary' : 'btn-light border-0 text-secondary'}`}
              onClick={() => setTipoFiltro('year')}
            >
              Anual
            </button>
          </div>

          <div className="vr mx-1"></div>

          {tipoFiltro === 'month' && (
            <select
              className="form-select form-select-sm border-0 bg-light"
              style={{ width: '110px', fontWeight: '600' }}
              value={mesSeleccionado}
              onChange={(e) => setMesSeleccionado(Number(e.target.value))}
              id="seleccionMes"
            >
              {mesesArr.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          )}

          <select
            className="form-select form-select-sm border-0 bg-light"
            style={{ width: '90px', fontWeight: '600' }}
            value={añoSeleccionado}
            onChange={(e) => setAñoSeleccionado(Number(e.target.value))}
            id="seleccionAño"
          >
            {años.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* KPIs */}
      <div className="rejilla-kpi">
        <IndicadorClave titulo={tipoFiltro === 'month' ? "Gastos del Mes" : "Gastos del Año"} valor={gastos} color="rojo" icono="bi-graph-down-arrow" />
        <IndicadorClave titulo={tipoFiltro === 'month' ? "Ingresos del Mes" : "Ingresos del Año"} valor={ingresos} color="verde" icono="bi-graph-up-arrow" />
        <IndicadorClave titulo="Beneficio Neto" valor={beneficio} color="azul" icono="bi-wallet2" />
        <IndicadorClave titulo="Beneficio Histórico" valor={datos.total_historico ?? 0} color="morado" icono="bi-trophy" />
      </div>

      {/* GRÁFICO PRINCIPAL */}
      <div className="tarjeta-corporativa p-4 shadow-sm mb-4" id="grafico-principal">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold text-dark m-0">Evolución {tipoFiltro === 'month' ? 'Diaria' : 'Mensual'}</h5>
          <span className="badge bg-light text-secondary border">
            {tipoFiltro === 'month' ? mesesArr[mesSeleccionado - 1].nombre : añoSeleccionado}
          </span>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={datosGrafico}>
            <defs>
              <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#16a34a" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#dc2626" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
            <YAxis />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Legend />
            <Area type="monotone" dataKey="ingresos" stroke="#16a34a" strokeWidth={3} fillOpacity={1} fill="url(#colorIngresos)" name="Ingresos" />
            <Area type="monotone" dataKey="gastos" stroke="#dc2626" strokeWidth={3} fillOpacity={1} fill="url(#colorGastos)" name="Gastos" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* SEGUNDA FILA */}
      <div className="row g-4">
        <div className="col-md-6">
          <div className="tarjeta-corporativa p-3 shadow-sm h-100">
            <h5 className="fw-bold text-dark mb-3">Comparativa</h5>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={datosGrafico}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" hide />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="ingresos" fill="#16a34a" radius={[4, 4, 0, 0]} name="Ingresos" />
                <Bar dataKey="gastos" fill="#dc2626" radius={[4, 4, 0, 0]} name="Gastos" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-md-6">
          <div className="tarjeta-corporativa p-3 shadow-sm h-100">
            <h5 className="fw-bold text-dark mb-3">Distribución de Gastos</h5>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={datosDistribucion}
                  dataKey="value"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                >
                  {datosDistribucion.map((_, index) => (
                    <Cell key={index} fill={COLORES[index % COLORES.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
}

function IndicadorClave({ titulo, valor, color, icono }) {
  return (
    <div className={`tarjeta-kpi kpi-${color}`}>
      <div className="d-flex justify-content-between align-items-start">
        <span className="titulo-kpi">{titulo}</span>
        {icono && <i className={`bi ${icono} fs-5 opacity-50`}></i>}
      </div>
      <span className="valor-kpi">
        {Number(valor).toLocaleString("es-ES")} €
      </span>
    </div>
  );
}
