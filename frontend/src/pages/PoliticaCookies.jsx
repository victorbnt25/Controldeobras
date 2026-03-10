import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './Landing.css';

const PoliticaCookies = () => {
    useEffect(() => {
        document.title = "Política de Cookies | ControlObra";
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="landing-page">
            <nav className="landing-nav">
                <Link to="/" className="logo-text">
                    <i className="bi bi-buildings text-primary"></i>
                    ControlObra
                </Link>
                <div className="nav-actions">
                    <Link to="/" className="btn-landing btn-landing-secondary">
                        Volver al inicio
                    </Link>
                </div>
            </nav>

            <main className="legal-section" style={{ padding: '8rem 2rem 5rem', maxWidth: '800px', margin: '0 auto', background: 'white', minHeight: 'calc(100vh - 200px)' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '2rem', color: '#0f172a' }}>Política de Cookies</h1>

                <div style={{ color: '#475569', lineHeight: '1.8' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '2rem', marginBottom: '1rem', color: '#1e293b' }}>1. Uso de Cookies Técnicas</h2>
                    <p>
                        ControlObra es un proyecto de uso privado. Para garantizar el funcionamiento técnico del software durante su uso por parte de los usuarios autorizados, empleamos algunas funcionalidades de almacenamiento local en el navegador, tal como indica la presente política.
                    </p>

                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '2rem', marginBottom: '1rem', color: '#1e293b' }}>2. Tipos de tecnologías utilizadas</h2>
                    <p>
                        Cualquier tecnología de almacenamiento local (cookies o <em>Local Storage</em>) empleada en este sitio tiene una finalidad <strong>estrictamente técnica y necesaria</strong> para acceder a las áreas restringidas del aplicativo.
                    </p>
                    <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                        <li><strong>Autenticación y Sesión:</strong> Utilizamos el almacenamiento local ("Local Storage") del navegador para manejar de forma segura el estado de la sesión ("token") una vez que un usuario autorizado ingresa sus credenciales de prueba.</li>
                    </ul>
                    <p>
                        Esta plataforma de pruebas <strong>no emplea cookies de terceros, sistemas de rastreo analítico, cookies publicitarias ni perfiles comerciales</strong> de ninguna clase.
                    </p>

                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '2rem', marginBottom: '1rem', color: '#1e293b' }}>3. Exención de Banner de Consentimiento</h2>
                    <p>
                        Dado que el uso de estas tecnologías se limita a la gestión indispensable del acceso a las áreas y funcionalidades en las que el propio usuario ha iniciado sesión (cookies "técnicas" o de sesión), su uso queda exento del deber de recabar un consentimiento explícito previo, conforme a las guías publicadas por las autoridades de control en materia de protección de datos aplicables a desarrollos web.
                    </p>

                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '2rem', marginBottom: '1rem', color: '#1e293b' }}>4. Gestión del Almacenamiento Local</h2>
                    <p>
                        Aunque son necesarias para acceder al área probada, el USUARIO siempre puede forzar su eliminación cerrando la sesión de manera explícita en el programa, o configurando su navegador para borrar la caché y los datos de sitios locales.
                    </p>
                    <p>Consulte las opciones de privacidad de los siguientes navegadores para eliminarlas de forma manual:</p>
                    <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                        <li><a href="https://support.google.com/chrome/answer/95647?hl=es" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
                        <li><a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
                        <li><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a></li>
                        <li><a href="https://support.microsoft.com/es-es/windows/eliminar-y-administrar-cookies-168dab11-0753-043d-7c16-ede5947fc64d" target="_blank" rel="noopener noreferrer">Microsoft Edge</a></li>
                    </ul>

                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '2rem', marginBottom: '1rem', color: '#1e293b' }}>5. Contacto sobre Privacidad</h2>
                    <p>
                        Para cualquier cuestión relacionada con el tratamiento de datos y aspectos técnicos en el uso del almacenamiento local, escríbanos a: <strong>victorbenito.dev@gmail.com</strong>
                    </p>

                    <p style={{ marginTop: '2rem', fontSize: '0.875rem', color: '#94a3b8' }}>Última actualización: Marzo 2026</p>
                </div>
            </main>

            <footer className="landing-footer">
                <div className="footer-content">
                    <p className="footer-copy">&copy; {new Date().getFullYear()} ControlObra Software.</p>
                </div>
            </footer>
        </div>
    );
};

export default PoliticaCookies;
