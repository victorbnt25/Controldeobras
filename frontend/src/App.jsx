import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./layout/Layout";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Trabajadores from "./pages/Trabajadores";
import Proveedores from "./pages/Proveedores";
import Presupuestos from "./pages/Presupuestos";
import Obras from "./pages/Obras";
import ObraDetalle from "./pages/ObraDetalle";
import Configuracion from "./pages/Configuracion";
import Plantillas from "./pages/Plantillas";
import Facturas from "./pages/Facturas";
import Calendario from "./pages/Calendario";
import GastosGeneralesSelector from "./pages/GastosGeneralesSelector";
import GastosGeneralesList from "./pages/GastosGeneralesList";
import { ConfigProvider } from "./context/ConfigContext";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Usuarios from "./pages/Usuarios";
import Landing from "./pages/Landing";
import AvisoLegal from "./pages/AvisoLegal";
import PoliticaPrivacidad from "./pages/PoliticaPrivacidad";
import PoliticaCookies from "./pages/PoliticaCookies";
import NotFound from "./pages/NotFound";

const PrivateLayoutRoutes = () => {
  const { usuario } = useAuth();

  if (usuario.rol === 'superusuario') {
    return (
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/usuarios" />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/trabajadores" element={<Trabajadores />} />
        <Route path="/proveedores" element={<Proveedores />} />
        <Route path="/presupuestos" element={<Presupuestos />} />
        <Route path="/obras" element={<Obras />} />
        <Route path="/obras/:id" element={<ObraDetalle />} />
        <Route path="/calendario" element={<Calendario />} />
        <Route path="/facturas" element={<Facturas />} />
        <Route path="/gastos-generales" element={<GastosGeneralesSelector />} />
        <Route path="/gastos-generales/:year/:month" element={<GastosGeneralesList />} />
        <Route path="/plantillas" element={<Plantillas />} />
        <Route path="/configuracion" element={<Configuracion />} />
        <Route path="/usuarios" element={<Navigate to="/dashboard" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
};


const AppRouter = () => {
  const { usuario, cargando } = useAuth();

  if (cargando) return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary"></div></div>;

  return (
    <ConfigProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={!usuario ? <Landing /> : <Navigate to={usuario.rol === 'superusuario' ? '/usuarios' : '/dashboard'} />} />
          <Route path="/login" element={!usuario ? <Login /> : <Navigate to={usuario.rol === 'superusuario' ? '/usuarios' : '/dashboard'} />} />
          <Route path="/aviso-legal" element={<AvisoLegal />} />
          <Route path="/politica-privacidad" element={<PoliticaPrivacidad />} />
          <Route path="/politica-cookies" element={<PoliticaCookies />} />

          {/* Rutas privadas */}
          <Route path="/*" element={usuario ? <PrivateLayoutRoutes /> : <Navigate to="/login" replace />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>


      </Router>
    </ConfigProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppRouter />
      <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} theme="colored" />
    </AuthProvider>
  );
}

export default App;
