import api from './api';

export const recommendationService = {
    // Get Top 20 Mentors for a startup
    getMentorRecommendations: async (startupId) => {
        try {
            const response = await api.get(`/recommend/mentors/${startupId}`);
            return response.data;
        } catch (error) {
            console.error('❌ Failed to fetch mentor recommendations:', error);
            throw error;
        }
    },

    // Get Top 20 Investors for a startup
    getInvestorRecommendations: async (startupId) => {
        try {
            const response = await api.get(`/recommend/investors/${startupId}`);
            return response.data;
        } catch (error) {
            console.error('❌ Failed to fetch investor recommendations:', error);
            throw error;
        }
    },

    // Get match score for a specific mentor
    getMentorMatch: async (startupId, mentorId) => {
        try {
            const response = await api.get(`/recommend/mentor-match/${startupId}/${mentorId}`);
            return response.data;
        } catch (error) {
            console.error('❌ Failed to fetch mentor match:', error);
            throw error;
        }
    },

    // Get match score for a specific investor
    getInvestorMatch: async (startupId, investorId) => {
        try {
            const response = await api.get(`/recommend/investor-match/${startupId}/${investorId}`);
            return response.data;
        } catch (error) {
            console.error('❌ Failed to fetch investor match:', error);
            throw error;
        }
    }
};