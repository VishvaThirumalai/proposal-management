import api from './api';

export const mentorService = {
    // Get all proposals
    getProposals: async () => {
        const response = await api.get('/mentor/proposals');
        return response.data;
    },

    // Search proposals
    searchProposals: async (query) => {
        const response = await api.get(`/mentor/search?q=${encodeURIComponent(query)}`);
        return response.data;
    },

    // Get recommendations
    getRecommendations: async () => {
        const response = await api.get('/mentor/recommendations');
        return response.data;
    },

    // Get requests for mentor
    getRequests: async () => {
        const response = await api.get('/mentor/requests');
        return response.data;
    },

    // Respond to request (accept/reject)
    respondToRequest: async (requestId, accept, reason = null) => {
        const response = await api.put(`/mentor/requests/${requestId}`, { 
            accept, 
            reason 
        });
        return response.data;
    },

    // Get assigned proposals
    getAssignedProposals: async () => {
        const response = await api.get('/mentor/assigned');
        return response.data;
    },

    // View proposal with PRE
    viewProposal: async (startupId, privateKey) => {
        const response = await api.post('/mentor/view-proposal', {
            startupId,
            privateKey
        }, {
            responseType: 'blob'  // For PDF download
        });
        return response.data;
    },

    // Check access status
    checkAccessStatus: async (startupId) => {
        const response = await api.get(`/mentor/access-status/${startupId}`);
        return response.data;
    },

    // Get access logs
    getAccessLogs: async () => {
        const response = await api.get('/mentor/access-logs');
        return response.data;
    },

    // Get proposal details
    getProposalDetails: async (startupId) => {
        const response = await api.get(`/mentor/proposal/${startupId}`);
        return response.data;
    }
};