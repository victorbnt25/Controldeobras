import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './Landing.css';

const PoliticaPrivacidad = () => {
    useEffect(() => {
        document.title = "Política de Privacidad | ControlObra";
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
                <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '2rem', color: '#0f172a' }}>Política de Privacidad</h1>

                <div style={{ color: '#475569', lineHeight: '1.8' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '2rem', marginBottom: '1rem', color: '#1e293b' }}>1. Información General</h2>
                    <p>
                        En cumplimiento del Reglamento (UE) 2016/679 del Parlamento Europeo y del Consejo (RGPD) y la Ley Orgánica 3/2018 de Protección de Datos Personales, le informamos del tratamiento de datos personales que se realiza en el contexto del uso de ControlObra (en adelante, "el Proyecto" o "la Plataforma").
                    </p>
                    <p>
                        Es importante destacar que el Proyecto es una herramienta de uso privado que no presta servicios comerciales abiertos al público de forma general. No obstante, por máxima cautela y compromiso con la privacidad, se aplican principios estrictos de protección de datos a los usuarios autorizados.
                    </p>

                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '2rem', marginBottom: '1rem', color: '#1e293b' }}>2. Tratamiento de Datos Alojados en la Plataforma</h2>
                    <p>
                        Durante el uso del software, el USUARIO autorizado podrá cargar y almacenar información en la Plataforma sobre proyectos, expedientes o clientes. Respecto a esta información:
                    </p>
                    <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                        <li>El <strong>USUARIO</strong> actúa como único <strong>Responsable del Tratamiento</strong> de cualquier información de terceros que decida alojar en la Plataforma, asumiendo la responsabilidad de contar con base legal para realizar dicho tratamiento.</li>
                        <li>Los <strong>Responsables del Proyecto</strong> actúan como <strong>Encargados del Tratamiento</strong>, limitándose a guardar y proveer la infraestructura técnica para dicha información, sin usar, ceder ni procesar estos datos para ningún otro fin propio.</li>
                    </ul>

                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '2rem', marginBottom: '1rem', color: '#1e293b' }}>3. Datos de los Usuarios Registrados</h2>
                    <p>
                        Para gestionar el acceso privado, recopilamos del usuario:
                    </p>
                    <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                        <li>Nombre comercial o identificador.</li>
                        <li>Dirección de correo electrónico de contacto.</li>
                        <li>Información técnica de conexión básica de seguridad.</li>
                    </ul>
                    <p>
                        La <strong>finalidad</strong> exclusiva de tratar estos datos es administrar el acceso a la plataforma de forma segura y proveer soporte técnico.
                    </p>

                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '2rem', marginBottom: '1rem', color: '#1e293b' }}>4. Legitimación para el tratamiento</h2>
                    <p>
                        La base legal para el tratamiento de sus datos es el <strong>consentimiento explícito</strong> prestado al aceptar los términos para acceder a la plataforma privada, así como la necesidad técnica de posibilitar dicho acceso.
                    </p>

                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '2rem', marginBottom: '1rem', color: '#1e293b' }}>5. Plazos de Conservación y Seguridad</h2>
                    <p>
                        Los datos se mantendrán almacenados mientras el usuario permanezca dado de alta en la plataforma. 
                    </p>
                    <p>
                        Los datos viajan de forma segura mediante HTTPS e interactúan en entornos aislados con medidas de seguridad proporcionales para evitar el acceso no autorizado.
                    </p>

                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '2rem', marginBottom: '1rem', color: '#1e293b' }}>6. Destinatarios y Alojamiento</h2>
                    <p>
                        Todo dato procesado en la plataforma es estrictamente confidencial y <strong>no se comercializará ni se cederá a terceros</strong>, salvo requerimiento u obligación legal.
                    </p>
                    <p>
                        No obstante, le informamos que los datos se recogen y se encuentran alojados en infraestructuras tecnológicas de terceros (proveedores de hosting y bases de datos) necesarias para el funcionamiento técnico de la plataforma. Estos proveedores actúan como encargados del tratamiento y cumplen con estándares de seguridad adecuados.
                    </p>

                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '2rem', marginBottom: '1rem', color: '#1e293b' }}>7. Derechos de Privacidad</h2>
                    <p>
                        Usted tiene derecho a acceder a sus datos personales, solicitar su rectificación o supresión, limitar su tratamiento y retirar su consentimiento para usar la plataforma en cualquier momento.
                    </p>
                    <p>
                        Para ejercer estos derechos y darse de baja, debe contactar vía correo electrónico a: <strong>victorbenito.dev@gmail.com</strong>. Asimismo, dispone del derecho a reclamar ante la Agencia Española de Protección de Datos (AEPD).
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

export default PoliticaPrivacidad;
