import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const ConfigContext = createContext(null);

export const ConfigProvider = ({ children }) => {
    const { usuario } = useAuth();
    const [configuracion, setConfiguracion] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    const cargarConfigDeApi = async () => {
        // Cargar configuración si hay sesión
        if (!usuario) {
            setCargando(false);
            return;
        }
        
        setCargando(true);
        try {
            const datos = await api.obtenerConfiguracion();
            setConfiguracion(datos);
            setError(null);
        } catch (err) {
            console.error("Error al cargar la configuración:", err);
            setError("No se pudo cargar la configuración.");
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        if (usuario) {
            cargarConfigDeApi();
        } else {
            setConfiguracion(null);
            setCargando(false);
        }
    }, [usuario]);

    const refrescarConfiguracion = async () => {
        await cargarConfigDeApi();
    };

    const valor = {
        configuracion,
        cargando,
        error,
        refrescarConfiguracion
    };

    return (
        <ConfigContext.Provider value={valor}>
            {children}
        </ConfigContext.Provider>
    );
};

export const useConfig = () => {
    const contexto = useContext(ConfigContext);
    if (!contexto) {
        throw new Error('useConfig debe ser usado dentro de un ConfigProvider');
    }
    return contexto;
};