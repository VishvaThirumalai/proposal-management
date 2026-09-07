import api from './api';

export const recommendationService = {
    // ===== GET MENTOR RECOMMENDATIONS =====
    getMentorRecommendations: async (startupId) => {
        try {
            console.log('📤 Fetching mentor recommendations for startup:', startupId);
            const response = await api.get(`/recommend/mentors/${startupId}`);
            console.log('✅ Mentor recommendations response:', response.data);
            
            // ✅ Return the data in the format the component expects
            if (response.data && response.data.success) {
                return {
                    success: true,
                    recommendations: response.data.recommendations || []
                };
            }
            
            // If the response is an array directly
            if (Array.isArray(response.data)) {
                return {
                    success: true,
                    recommendations: response.data
                };
            }
            
            // If the response has recommendations directly
            if (response.data && response.data.recommendations) {
                return {
                    success: true,
                    recommendations: response.data.recommendations
                };
            }
            
            return {
                success: false,
                recommendations: [],
                message: 'Invalid response format'
            };
            
        } catch (error) {
            console.error('❌ Failed to get mentor recommendations:', error);
            throw error;
        }
    },

    // ===== GET INVESTOR RECOMMENDATIONS =====
    getInvestorRecommendations: async (startupId) => {
        try {
            console.log('📤 Fetching investor recommendations for startup:', startupId);
            const response = await api.get(`/recommend/investors/${startupId}`);
            console.log('✅ Investor recommendations response:', response.data);
            
            // ✅ Return the data in the format the component expects
            if (response.data && response.data.success) {
                return {
                    success: true,
                    recommendations: response.data.recommendations || []
                };
            }
            
            // If the response is an array directly
            if (Array.isArray(response.data)) {
                return {
                    success: true,
                    recommendations: response.data
                };
            }
            
            // If the response has recommendations directly
            if (response.data && response.data.recommendations) {
                return {
                    success: true,
                    recommendations: response.data.recommendations
                };
            }
            
            return {
                success: false,
                recommendations: [],
                message: 'Invalid response format'
            };
            
        } catch (error) {
            console.error('❌ Failed to get investor recommendations:', error);
            throw error;
        }
    },

    // ===== GET MENTOR MATCH SCORE =====
    getMentorMatch: async (startupId, mentorId) => {
        try {
            const response = await api.get(`/recommend/mentor-match/${startupId}/${mentorId}`);
            return response.data;
        } catch (error) {
            console.error('❌ Failed to get mentor match:', error);
            throw error;
        }
    },

    // ===== GET INVESTOR MATCH SCORE =====
    getInvestorMatch: async (startupId, investorId) => {
        try {
            const response = await api.get(`/recommend/investor-match/${startupId}/${investorId}`);
            return response.data;
        } catch (error) {
            console.error('❌ Failed to get investor match:', error);
            throw error;
        }
    }
};