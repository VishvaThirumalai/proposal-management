import api from './api';

export const adminService = {
    // Get all pending mentors
    getPendingMentors: async () => {
        try {
            const response = await api.get('/admin/pending-mentors');
            return response.data;
        } catch (error) {
            console.error('❌ Failed to fetch pending mentors:', error);
            throw error;
        }
    },

    // Get all pending investors
    getPendingInvestors: async () => {
        try {
            const response = await api.get('/admin/pending-investors');
            return response.data;
        } catch (error) {
            console.error('❌ Failed to fetch pending investors:', error);
            throw error;
        }
    },

    // Get all users
    getAllUsers: async () => {
        try {
            const response = await api.get('/admin/all-users');
            return response.data;
        } catch (error) {
            console.error('❌ Failed to fetch all users:', error);
            throw error;
        }
    },

    // Verify a user (approve/reject)
    verifyUser: async (userId, approve, reason = null) => {
        try {
            const response = await api.put('/admin/verify-user', {
                userId,
                approve,
                reason
            });
            return response.data;
        } catch (error) {
            console.error('❌ Failed to verify user:', error);
            throw error;
        }
    },

    // Get system logs (if available)
    getSystemLogs: async () => {
        try {
            const response = await api.get('/admin/logs');
            return response.data;
        } catch (error) {
            console.error('❌ Failed to fetch logs:', error);
            throw error;
        }
    },

    // Get blockchain status
    getBlockchainStatus: async () => {
        try {
            const response = await api.get('/admin/blockchain/status');
            return response.data;
        } catch (error) {
            console.error('❌ Failed to fetch blockchain status:', error);
            throw error;
        }
    }
};