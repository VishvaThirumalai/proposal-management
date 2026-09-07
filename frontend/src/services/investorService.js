import api from './api';

export const investorService = {
    // ===== PROPOSALS =====
    getProposals: async () => {
        const response = await api.get('/investor/proposals');
        return response.data;
    },

    getInvestedProposals: async () => {
        const response = await api.get('/investor/invested');
        return response.data;
    },

    searchProposals: async (query) => {
        const response = await api.get(`/investor/search?q=${encodeURIComponent(query)}`);
        return response.data;
    },

    getProposalDetails: async (startupId) => {
        const response = await api.get(`/investor/proposal/${startupId}`);
        return response.data;
    },

    // ===== RECOMMENDATIONS =====
    getRecommendations: async () => {
        const response = await api.get('/investor/recommendations');
        return response.data;
    },

    // ===== REQUESTS =====
    getRequests: async () => {
        const response = await api.get('/investor/requests');
        return response.data;
    },

    respondToRequest: async (requestId, accept, reason = null) => {
        const response = await api.put(`/investor/requests/${requestId}`, { 
            accept, 
            reason 
        });
        return response.data;
    },

    requestAccess: async (startupId, message) => {
        const response = await api.post('/investor/request-access', {
            startupId,
            message
        });
        return response.data;
    },

    // ===== ACCESS =====
    checkAccessStatus: async (startupId) => {
        const response = await api.get(`/investor/access-status/${startupId}`);
        return response.data;
    },

    getAccessLogs: async () => {
        const response = await api.get('/investor/access-logs');
        return response.data;
    },

    viewProposal: async (startupId, privateKey) => {
        const response = await api.post('/investor/view-proposal', {
            startupId,
            privateKey
        }, {
            responseType: 'blob'
        });
        return response.data;
    },

    // ===== PORTFOLIO & INVESTMENT =====
    getPortfolio: async () => {
        const response = await api.get('/investor/portfolio');
        return response.data;
    },

    invest: async (startupId, amount) => {
        const response = await api.post('/investor/invest', {
            startupId,
            amount
        });
        return response.data;
    },

    addToPortfolio: async (startupId, amount) => {
        const response = await api.post('/investor/portfolio/add', {
            startupId,
            amount
        });
        return response.data;
    },

    // ===== ASSIGNED =====
    getAssignedProposals: async () => {
        const response = await api.get('/investor/assigned');
        return response.data;
    }
};