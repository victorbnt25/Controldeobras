import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [usuario, setUsuario] = useState(null);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        comprobarSesion();

        const manejarSesionExpirada = () => {
            setUsuario(null);
        };

        window.addEventListener('sesionExpirada', manejarSesionExpirada);

        return () => {
            window.removeEventListener('sesionExpirada', manejarSesionExpirada);
        };
    }, []);

    const comprobarSesion = async () => {
        try {
            const datos = await api.comprobarSesion();
            if (datos && datos.usuario) {
                setUsuario(datos.usuario);
            } else {
                setUsuario(null);
            }
        } catch (error) {
            setUsuario(null);
        } finally {
            setCargando(false);
        }
    };

    const iniciarSesion = async (nombreUsuario, password) => {
        const datos = await api.iniciarSesion(nombreUsuario, password);
        setUsuario(datos.usuario);
        return datos;
    };

    const cerrarSesion = async () => {
        await api.cerrarSesion();
        setUsuario(null);
    };

    return (
        <AuthContext.Provider value={{ usuario, cargando, iniciarSesion, cerrarSesion, comprobarSesion }}>
            {children}
        </AuthContext.Provider>
    );
};
// Force HMR reload AuthContext
