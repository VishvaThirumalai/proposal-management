import api from './api';

export const authService = {
    // ✅ Register user
    register: async (userData) => {
        console.log('📤 Registering user:', userData);
        try {
            const response = await api.post('/auth/register', userData);
            console.log('✅ Registration successful:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Registration error:', error);
            throw error;
        }
    },

    // ✅ Login user
    login: async (credentials) => {
        console.log('📤 Logging in:', credentials.email);
        try {
            const response = await api.post('/auth/login', credentials);
            
            if (response.data.token) {
                // ✅ Save ALL required fields
                localStorage.setItem('jwtToken', response.data.token);
                localStorage.setItem('refreshToken', response.data.refreshToken);
                localStorage.setItem('userRole', response.data.role);
                localStorage.setItem('userId', response.data.userId);
                localStorage.setItem('userName', response.data.name);
                localStorage.setItem('userEmail', response.data.email);
                localStorage.setItem('walletAddress', response.data.walletAddress);
                
                console.log('✅ Login successful. Token saved.');
                console.log('✅ Role:', response.data.role);
                console.log('✅ User ID:', response.data.userId);
            }
            return response.data;
        } catch (error) {
            console.error('❌ Login error:', error);
            throw error;
        }
    },

    // ✅ Forgot password
    forgotPassword: async (email) => {
        try {
            const response = await api.post('/auth/forgot-password', { email });
            return response.data;
        } catch (error) {
            console.error('❌ Forgot password error:', error);
            throw error;
        }
    },

    // ✅ Reset password
    resetPassword: async (token, newPassword) => {
        try {
            const response = await api.post('/auth/reset-password', { token, newPassword });
            return response.data;
        } catch (error) {
            console.error('❌ Reset password error:', error);
            throw error;
        }
    },

    // ✅ Logout
    logout: () => {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('walletAddress');
        window.location.href = '/';
    },

    // ✅ Get current user
    getCurrentUser: () => {
        const token = localStorage.getItem('jwtToken');
        const role = localStorage.getItem('userRole');
        const userId = localStorage.getItem('userId');
        const name = localStorage.getItem('userName');
        const email = localStorage.getItem('userEmail');
        const walletAddress = localStorage.getItem('walletAddress');
        
        if (token && role && userId) {
            return { token, role, userId, name, email, walletAddress };
        }
        return null;
    },

    // ✅ Check if authenticated
    isAuthenticated: () => {
        return !!localStorage.getItem('jwtToken');
    },

    // ✅ Get user role
    getUserRole: () => {
        return localStorage.getItem('userRole');
    },

    // ✅ Get user ID
    getUserId: () => {
        return localStorage.getItem('userId');
    },

    // ✅ Get user name
    getUserName: () => {
        return localStorage.getItem('userName');
    },

    // ✅ Get wallet address
    getWalletAddress: () => {
        return localStorage.getItem('walletAddress');
    }
};