import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useConfig } from "../context/ConfigContext";
import { useAuth } from "../context/AuthContext";

export default function Layout({ children }) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const localizacion = useLocation();
  const { configuracion } = useConfig();
  const { usuario, cerrarSesion } = useAuth();

  // Cerrar menú al cambiar de ruta (útil en móvil)
  useEffect(() => {
    setMenuAbierto(false);
  }, [localizacion]);

  const conmutarMenu = () => setMenuAbierto(!menuAbierto);

  return (
    <div className="contenedor-aplicacion diseño-corporativo">
      {/* Capa superpuesta para cerrar el menú en móvil al hacer click fuera */}
      <div
        className={`capa-superpuesta-menu ${menuAbierto ? "activa" : ""}`}
        onClick={() => setMenuAbierto(false)}
      />

      {/* MENÚ LATERAL (SIDEBAR) */}
      <aside className={`menu-lateral ${menuAbierto ? "abierto" : ""}`}>
        <div className="cabecera-menu">
          <div className="titulo-marca">
            {configuracion?.nombre_empresa ? (
              configuracion.nombre_empresa
            ) : (
              <></>
            )}
          </div>
          <div className="subtitulo-marca">Panel de Control</div>
          <button className="btn-close d-md-none position-absolute top-0 end-0 m-3 btn-close-white" onClick={() => setMenuAbierto(false)} aria-label="Cerrar menú"></button>
        </div>

        <nav className="lista-navegacion">
          {usuario?.rol !== 'superusuario' ? (
            <>
              <NavLink to="/clientes" className="enlace-menu">
                <i className="bi bi-people"></i> Clientes
              </NavLink>
              <NavLink to="/trabajadores" className="enlace-menu">
                <i className="bi bi-person-badge"></i> Trabajadores
              </NavLink>
              <NavLink to="/proveedores" className="enlace-menu">
                <i className="bi bi-truck"></i> Proveedores
              </NavLink>
              <NavLink to="/presupuestos" className="enlace-menu">
                <i className="bi bi-file-earmark-text"></i> Presupuestos
              </NavLink>
              <NavLink to="/facturas" className="enlace-menu">
                <i className="bi bi-receipt"></i> Facturas
              </NavLink>
              <NavLink to="/gastos-generales" className="enlace-menu">
                <i className="bi bi-wallet2"></i> Gastos generales
              </NavLink>
              <NavLink to="/obras" className="enlace-menu">
                <i className="bi bi-bricks"></i> Obras
              </NavLink>
              <NavLink to="/calendario" className="enlace-menu">
                <i className="bi bi-calendar3"></i> Calendario
              </NavLink>
              <NavLink to="/dashboard" className="enlace-menu">
                <i className="bi bi-speedometer2"></i> Dashboard
              </NavLink>
              <div className="divisor-navegacion"></div>
              <NavLink to="/plantillas" className="enlace-menu">
                <i className="bi bi-card-list"></i> Plantilla de presupuestos
              </NavLink>
              <NavLink to="/configuracion" className="enlace-menu">
                <i className="bi bi-gear"></i> Configuración
              </NavLink>
            </>
          ) : (
            <NavLink to="/usuarios" className="enlace-menu">
              <i className="bi bi-shield-lock"></i> Usuarios
            </NavLink>
          )}
        </nav>

        <div className="pie-menu">
          <div className="texto-usuario">Usuario: {usuario?.username}</div>
          <button className="btn btn-sm btn-outline-danger w-100" onClick={cerrarSesion} id="botonCerrarSesion">
            <i className="bi bi-box-arrow-right me-2"></i>Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="contenido-principal">
        {/* BARRA SUPERIOR MÓVIL */}
        <header className="barra-superior-movil d-md-none">
          <button className="btn btn-link text-dark p-0" onClick={conmutarMenu} id="botonMenuMovil">
            <i className="bi bi-list fs-1"></i>
          </button>
          <span className="titulo-barra-superior">{configuracion?.nombre_empresa || "DECOREFORM.A.B"}</span>
          <div style={{ width: 24 }}></div> {/* Espaciador para centrar título */}
        </header>

        <div className="envoltura-contenido">
          {children}
        </div>
      </main>
    </div>
  );
}