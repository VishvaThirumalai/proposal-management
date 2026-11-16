import api from './api';

export const escrowService = {
    // Investor creates escrow
    createEscrow: async (escrowData) => {
        console.log('📤 Creating escrow:', escrowData);
        const response = await api.post('/escrow/create', escrowData);
        console.log('✅ Escrow created:', response.data);
        return response.data;
    },

    // Get escrow by ID
    getEscrow: async (escrowId) => {
        const response = await api.get(`/escrow/${escrowId}`);
        return response.data;
    },

    // Get all escrows for a startup
    getEscrowsByStartup: async (startupId) => {
        const response = await api.get(`/escrow/startup/${startupId}`);
        return response.data;
    },

    // Get all escrows for logged-in investor
    getMyEscrowsAsInvestor: async () => {
        const response = await api.get('/escrow/my-escrows/investor');
        return response.data;
    },

    // Get all escrows for logged-in founder
    getMyEscrowsAsFounder: async () => {
        const response = await api.get('/escrow/my-escrows/founder');
        return response.data;
    },

    // Founder submits milestone proof
    submitMilestoneProof: async (escrowId, milestoneId, proofFile, proofNotes) => {
        const formData = new FormData();
        formData.append('escrowId', escrowId);
        formData.append('milestoneId', milestoneId);
        formData.append('proofFile', proofFile);
        formData.append('proofNotes', proofNotes);

        console.log('📤 Submitting milestone proof:', escrowId, milestoneId);
        const response = await api.post('/escrow/submit-proof', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    // Approve milestone
    approveMilestone: async (escrowId, milestoneId) => {
        console.log('✅ Approving milestone:', escrowId, milestoneId);
        const response = await api.post('/escrow/approve', {
            escrowId,
            milestoneId
        });
        return response.data;
    },

    // Reject milestone
    rejectMilestone: async (escrowId, milestoneId, reason) => {
        console.log('❌ Rejecting milestone:', escrowId, milestoneId);
        const response = await api.post('/escrow/reject', {
            escrowId,
            milestoneId,
            reason
        });
        return response.data;
    }
};