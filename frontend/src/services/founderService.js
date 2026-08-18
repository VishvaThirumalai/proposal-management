import api from './api';

export const founderService = {
    // Preview AI analysis (Step 1)
    previewAI: async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/founder/preview-ai', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Upload proposal with approved AI metadata (Step 2)
    uploadProposal: async (file, details) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('details', JSON.stringify(details));

        const response = await api.post('/founder/upload-proposal', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Get all proposals
    getProposals: async () => {
        const response = await api.get('/founder/proposals');
        return response.data;
    },

    // Get recommendations for a startup
    getRecommendations: async (startupId) => {
        const response = await api.get(`/founder/recommendations/${startupId}`);
        return response.data;
    },

    // Send request to mentor/investor
    sendRequest: async (startupId, recipientId, recipientRole, message) => {
        const response = await api.post('/founder/send-request', {
            startupId,
            recipientId,
            recipientRole,
            message
        });
        return response.data;
    },

    // Get all requests
    getRequests: async () => {
        const response = await api.get('/founder/requests');
        return response.data;
    },

    // Grant access (upload private key)
    grantAccess: async (requestId, privateKey) => {
        const response = await api.post('/founder/grant-access', {
            requestId,
            privateKey
        });
        return response.data;
    },

    // Revoke access
    revokeAccess: async (requestId) => {
        const response = await api.post('/founder/revoke-access', {
            requestId
        });
        return response.data;
    }
};