import api from './api';

export const investorService = {
    // Get all proposals
    getProposals: async () => {
        const response = await api.get('/investor/proposals');
        return response.data;
    },

    // Search proposals
    searchProposals: async (query) => {
        const response = await api.get(`/investor/search?q=${encodeURIComponent(query)}`);
        return response.data;
    },

    // Get recommendations
    getRecommendations: async () => {
        const response = await api.get('/investor/recommendations');
        return response.data;
    },

    // Get requests for investor
    getRequests: async () => {
        const response = await api.get('/investor/requests');
        return response.data;
    },

    // Respond to request (accept/reject)
    respondToRequest: async (requestId, accept, reason = null) => {
        const response = await api.put(`/investor/requests/${requestId}`, { 
            accept, 
            reason 
        });
        return response.data;
    },

    // Get assigned proposals
    getAssignedProposals: async () => {
        const response = await api.get('/investor/assigned');
        return response.data;
    },

    // View proposal with PRE
    viewProposal: async (startupId, privateKey) => {
        const response = await api.post('/investor/view-proposal', {
            startupId,
            privateKey
        }, {
            responseType: 'blob'  // For PDF download
        });
        return response.data;
    },

    // Check access status
    checkAccessStatus: async (startupId) => {
        const response = await api.get(`/investor/access-status/${startupId}`);
        return response.data;
    },

    // Get access logs
    getAccessLogs: async () => {
        const response = await api.get('/investor/access-logs');
        return response.data;
    },

    // Get proposal details
    getProposalDetails: async (startupId) => {
        const response = await api.get(`/investor/proposal/${startupId}`);
        return response.data;
    },

    // Get portfolio
    getPortfolio: async () => {
        const response = await api.get('/investor/portfolio');
        return response.data;
    },

    // Invest in startup
    invest: async (startupId, amount) => {
        const response = await api.post('/investor/invest', {
            startupId,
            amount
        });
        return response.data;
    }
};