import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './Landing.css';

const AvisoLegal = () => {
    useEffect(() => {
        document.title = "Aviso Legal | ControlObra";
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
                <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '2rem', color: '#0f172a' }}>Aviso Legal</h1>

                <div style={{ color: '#475569', lineHeight: '1.8' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '2rem', marginBottom: '1rem', color: '#1e293b' }}>1. Naturaleza del Sitio Web</h2>
                    <p>
                        El presente sitio web (controlobra.es) y el software asociado se proporcionan exclusivamente para uso privado y autorizado. 
                        Este proyecto constituye una plataforma tecnológica que <strong>no representa una actividad comercial abierta al público general</strong> y no ofrece suscripciones públicas en este momento.
                    </p>
                    <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                        <li><strong>Sitio Web:</strong> controlobra.es</li>
                        <li><strong>Email de contacto:</strong> contacto@controlobra.es</li>
                    </ul>

                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '2rem', marginBottom: '1rem', color: '#1e293b' }}>2. Condiciones de Acceso y Uso</h2>
                    <p>
                        Dado el carácter privado del proyecto, el acceso al software está restringido y sujeto a autorización por parte de los administradores.
                        El acceso y/o uso de la plataforma atribuye la condición de USUARIO e implica la aceptación de estas condiciones.
                    </p>
                    <p>
                        El USUARIO se compromete a hacer un uso adecuado de la plataforma, absteniéndose de utilizarla para incurrir en actividades ilícitas, ilegales o contrarias a la buena fe, así como de intentar vulnerar las medidas de seguridad tecnológicas implementadas.
                    </p>

                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '2rem', marginBottom: '1rem', color: '#1e293b' }}>3. Exclusión de Garantías y Limitación de Responsabilidad</h2>
                    <p>
                        El software ControlObra se proporciona "tal cual" (<em>as is</em>).
                        No se ofrece ninguna garantía, expresa ni implícita, sobre su funcionamiento, disponibilidad continua, o idoneidad para un propósito particular.
                    </p>
                    <p>
                        Los responsables no asumen responsabilidad alguna por los daños directos, indirectos, incidentales o consecuentes que pudieran derivarse de la interrupción del servicio, posibles pérdidas de datos, errores en el software, o decisiones tomadas en base a la información procesada por la herramienta. 
                        El USUARIO asume toda la responsabilidad sobre el uso de la plataforma.
                    </p>

                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '2rem', marginBottom: '1rem', color: '#1e293b' }}>4. Modificaciones</h2>
                    <p>
                        Los administradores del proyecto se reservan el derecho de efectuar sin previo aviso las modificaciones que consideren oportunas, pudiendo cambiar, suspender temporalmente o cancelar de forma definitiva el acceso a la plataforma o a la totalidad del proyecto.
                    </p>

                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '2rem', marginBottom: '1rem', color: '#1e293b' }}>5. Legislación Aplicable y Jurisdicción</h2>
                    <p>
                        La relación entre los responsables del proyecto y el USUARIO se rige por la normativa española vigente.
                        Cualquier controversia derivada del uso de esta plataforma se someterá a los Juzgados y tribunales competentes en territorio español.
                    </p>

                    <p style={{ marginTop: '2rem', fontSize: '0.875rem', color: '#94a3b8' }}>Última actualización: Marzo 2026</p>
                </div>
            </main >

            <footer className="landing-footer">
                <div className="footer-content">
                    <p className="footer-copy">&copy; {new Date().getFullYear()} ControlObra Software.</p>
                </div>
            </footer>
        </div >
    );
};

export default AvisoLegal;
