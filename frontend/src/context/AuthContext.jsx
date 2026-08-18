import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
            setUser(currentUser);
        }
        setLoading(false);
    }, []);

    const login = async (credentials) => {
        const response = await authService.login(credentials);
        setUser({
            token: response.token,
            refreshToken: response.refreshToken,
            role: response.role,
            userId: response.userId,
            name: response.name,
            email: response.email,
            walletAddress: response.walletAddress
        });
        return response;
    };

    const logout = () => {
        authService.logout();
        setUser(null);
    };

    const value = {
        user,
        loading,
        login,
        logout,
        isAuthenticated: authService.isAuthenticated,
        getUserRole: authService.getUserRole,
        getUserName: authService.getUserName,
        getUserId: authService.getUserId,
        getWalletAddress: authService.getWalletAddress
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};