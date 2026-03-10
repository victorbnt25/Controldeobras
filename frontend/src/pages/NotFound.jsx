import React from 'react';
import { useNavigate } from 'react-router-dom';
import { House, ExclamationTriangle } from 'react-bootstrap-icons';
import './NotFound.css';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="not-found-container">
            <div className="not-found-content">
                <div className="error-code">404</div>
                <div className="error-icon">
                    <ExclamationTriangle />
                </div>
                <h1 className="error-title">¡Ups! Página no encontrada</h1>
                <p className="error-description">
                    Parece que te has perdido en los andamios. La página que buscas no existe o ha sido movida.
                </p>
                <div className="actions">
                    <button 
                        className="btn-home" 
                        onClick={() => navigate('/')}
                    >
                        <House className="me-2" /> Volver al Inicio
                    </button>

                </div>
            </div>
            
            {/* Elementos decorativos de fondo */}
            <div className="bg-circles">
                <div className="circle circle-1"></div>
                <div className="circle circle-2"></div>
                <div className="circle circle-3"></div>
            </div>
        </div>
    );
};

export default NotFound;
