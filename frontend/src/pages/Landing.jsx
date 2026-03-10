import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './Landing.css';

const Landing = () => {
    useEffect(() => {
        // SEO setup on mount
        document.title = "ControlObra | Software de Gestión para Reformas y Autónomos";

        // Find or create meta description
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
            metaDescription = document.createElement('meta');
            metaDescription.name = "description";
            document.head.appendChild(metaDescription);
        }
        metaDescription.content = "Programa de gestión especializado para autónomos y profesionales del sector de reformas: obras, presupuestos, facturación y control de gastos. Simple y eficaz.";

        // Cleanup on unmount (optional, but good practice if app router is used)
        return () => {
            document.title = "ControlObra";
            if (metaDescription) {
                metaDescription.content = "ControlObra ERP";
            }
        };
    }, []);

    return (
        <div className="landing-page">
            {/* Navbar */}
            <nav className="landing-nav">
                <Link to="/" className="logo-text">
                    <i className="bi bi-buildings text-primary"></i>
                    ControlObra
                </Link>
                <div className="nav-actions">
                    <Link to="/login" className="btn-landing btn-landing-primary">
                        Acceder
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="hero-section">
                <div className="hero-content-wrapper">
                    <div className="hero-badge fade-in-up">
                        <span className="badge-dot"></span>
                        Web de gestión para el sector reformas
                    </div>
                    <h1 className="hero-title fade-in-up delay-1">
                        Bienvenido a <span className="text-gradient">ControlObra</span>
                    </h1>
                    <p className="hero-subtitle fade-in-up delay-2">
                        La plataforma privada diseñada para simplificar y optimizar la gestión de tus obras, presupuestos y facturación con elegancia y eficacia.
                    </p>
                    <div className="hero-actions fade-in-up delay-3">
                        <Link to="/login" className="btn-landing btn-landing-primary pulse-effect">
                            Acceder a la plataforma
                            <i className="bi bi-arrow-right-short ms-2" style={{ fontSize: '1.2rem' }}></i>
                        </Link>
                    </div>
                </div>

                {/* Decoraciones de fondo */}
                <div className="hero-bg-glow glow-1"></div>
                <div className="hero-bg-glow glow-2"></div>
            </header>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="footer-content">
                    <div className="footer-logo">
                        <i className="bi bi-buildings text-primary"></i> ControlObra
                    </div>
                    <p className="footer-copy">
                        &copy; {new Date().getFullYear()} ControlObra Web. Plataforma de gestión profesional privada.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
