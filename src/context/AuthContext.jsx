import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const currentUser = authService.getCurrentUser();
        if (currentUser) setUser(currentUser);
        setLoading(false);
    }, []);

    const login = async (email, password) => await authService.login(email, password);
    const verifyOTP = async (tempToken, otp) => {
        const response = await authService.verifyOTP(tempToken, otp);
        if (response.status === 'success') setUser(response.user);
        return response;
    };
    const logout = async () => { await authService.logout(); setUser(null); };
    const isAuthenticated = () => authService.isAuthenticated();

    return <AuthContext.Provider value={{ user, login, verifyOTP, logout, isAuthenticated, loading }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
