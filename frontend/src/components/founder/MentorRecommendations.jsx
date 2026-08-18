import React, { useState, useEffect, useCallback } from 'react';
import { recommendationService } from '../../services/recommendationService';
import { 
    FiUsers, FiAward, 
    FiLinkedin, FiX,
    FiRefreshCw, FiSend, FiMessageSquare
} from 'react-icons/fi';

const MentorRecommendations = ({ startupId, startupTitle, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [mentors, setMentors] = useState([]);
    const [error, setError] = useState('');
    const [selectedMentor, setSelectedMentor] = useState(null);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [requestMessage, setRequestMessage] = useState('');
    const [sendingRequest, setSendingRequest] = useState(false);

    const loadRecommendations = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const result = await recommendationService.getMentorRecommendations(startupId);
            setMentors(result.recommendations || []);
        } catch (err) {
            setError('Failed to load mentor recommendations: ' + err.message);
            setMentors([]);
        } finally {
            setLoading(false);
        }
    }, [startupId]);

    useEffect(() => {
        loadRecommendations();
    }, [loadRecommendations]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadRecommendations();
        setRefreshing(false);
    };

    const handleSendRequest = async () => {
        if (!selectedMentor) return;
        
        setSendingRequest(true);
        setError('');
        
        try {
            // Import requestService dynamically to avoid circular dependency
            const { requestService } = await import('../../services/requestService');
            const recipientId = selectedMentor.id || selectedMentor.mentorId || selectedMentor.userId;

            if (!recipientId) throw new Error('Recipient user id not found');

            await requestService.sendRequest(
                startupId,
                recipientId,
                'MENTOR',
                requestMessage
            );
            
            setShowRequestModal(false);
            setSelectedMentor(null);
            setRequestMessage('');
            
            // Show success message (you can use a toast notification)
            alert('✅ Request sent successfully!');
            
        } catch (err) {
            setError('Failed to send request: ' + err.message);
        } finally {
            setSendingRequest(false);
        }
    };

    const getMatchBadge = (score) => {
        const percentage = Math.round(score * 100);
        if (percentage >= 80) return 'bg-green-100 text-green-800';
        if (percentage >= 60) return 'bg-yellow-100 text-yellow-800';
        return 'bg-gray-100 text-gray-600';
    };

    const getMatchIcon = (score) => {
        const percentage = Math.round(score * 100);
        if (percentage >= 80) return '🔥';
        if (percentage >= 60) return '⭐';
        return '📌';
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <FiUsers className="text-blue-600" />
                        Top Mentor Recommendations
                    </h2>
                    <p className="text-sm text-gray-500">For: {startupTitle}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
                    >
                        <FiRefreshCw className={refreshing ? 'animate-spin' : ''} />
                    </button>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                        >
                            <FiX />
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-700 text-sm">
                    {error}
                </div>
            )}

            {/* Loading State */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-gray-600 mt-2">Finding mentors...</p>
                </div>
            ) : mentors.length === 0 ? (
                <div className="text-center py-12">
                    <FiUsers className="mx-auto text-gray-300 text-5xl mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No Mentors Found</h3>
                    <p className="text-gray-500">No mentors available for this proposal</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {mentors.map((mentor, index) => (
                        <div key={mentor.id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                            <div className="flex flex-wrap justify-between items-start gap-4">
                                {/* Left - Mentor Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                                            {( (mentor.name || mentor.mentor?.user?.name || mentor.mentor?.user?.fullName || 'M').charAt(0) )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-gray-800">
                                                    {mentor.name || mentor.mentor?.user?.name || mentor.mentor?.user?.fullName || 'Unknown'}
                                                </span>
                                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getMatchBadge(mentor.similarity || 0)}`}>
                                                    {getMatchIcon(mentor.similarity || 0)} {Math.round((mentor.similarity || 0) * 100)}% Match
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                {mentor.designation || 'N/A'} 
                                                {mentor.company ? ` at ${mentor.company}` : ''}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Experience & Expertise */}
                                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <FiAward className="text-gray-400" />
                                            {mentor.yearsExperience || 0} years
                                        </span>
                                        <span className="text-gray-300">|</span>
                                        <span className="flex items-center gap-1">
                                            <FiUsers className="text-gray-400" />
                                            {mentor.expertise || 'N/A'}
                                        </span>
                                    </div>

                                    {/* LinkedIn */}
                                    {(mentor.linkedin || mentor.mentor?.linkedin) && (
                                        <a 
                                            href={mentor.linkedin || mentor.mentor?.linkedin} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mt-1"
                                        >
                                            <FiLinkedin /> View LinkedIn Profile
                                        </a>
                                    )}
                                </div>

                                {/* Right - Action Button */}
                                <button
                                    onClick={() => {
                                        setSelectedMentor(mentor);
                                        setShowRequestModal(true);
                                        setRequestMessage('');
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
                                >
                                    <FiSend /> Connect
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Request Modal */}
            {showRequestModal && selectedMentor && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <FiMessageSquare className="text-blue-600" />
                                Send Request to Mentor
                            </h3>
                            <button
                                onClick={() => {
                                    setShowRequestModal(false);
                                    setSelectedMentor(null);
                                    setRequestMessage('');
                                }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <FiX size={24} />
                            </button>
                        </div>

                        <div className="mb-4">
                            <p className="text-sm text-gray-600">Sending request to:</p>
                            <p className="font-semibold text-gray-800">{selectedMentor.name || selectedMentor.mentor?.user?.name || selectedMentor.mentor?.user?.fullName || 'Unknown'}</p>
                            <p className="text-sm text-gray-500">{selectedMentor.designation || 'N/A'}</p>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Message (Optional)
                            </label>
                            <textarea
                                value={requestMessage}
                                onChange={(e) => setRequestMessage(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none min-h-[100px]"
                                placeholder="Write a message to the mentor..."
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-700 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowRequestModal(false);
                                    setSelectedMentor(null);
                                    setRequestMessage('');
                                }}
                                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSendRequest}
                                disabled={sendingRequest}
                                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition disabled:opacity-50"
                            >
                                {sendingRequest ? 'Sending...' : 'Send Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MentorRecommendations;