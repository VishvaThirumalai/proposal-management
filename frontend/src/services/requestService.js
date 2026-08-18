import api from './api';

export const requestService = {
    // Get all requests for the current user (mentor/investor)
    getRequests: async () => {
        const response = await api.get('/mentor/requests');
        return response.data;
    },

    // Respond to a request (accept/reject)
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