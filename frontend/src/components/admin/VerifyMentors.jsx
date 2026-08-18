import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { 
    FiUser, FiCheckCircle, FiXCircle, FiRefreshCw, 
    FiClock, FiArrowLeft, FiMail, FiBriefcase, FiAward,
    FiLinkedin, FiUsers, FiStar, FiCalendar, FiEye, FiEyeOff
} from 'react-icons/fi';

const VerifyMentors = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [mentors, setMentors] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [processing, setProcessing] = useState({});
    const [expandedUser, setExpandedUser] = useState(null);

    useEffect(() => {
        loadMentors();
    }, []);

    const loadMentors = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await adminService.getPendingMentors();
            console.log('📋 Raw Response Data:', data);
            
            // ✅ If data is an array, use it directly
            if (Array.isArray(data)) {
                console.log('📋 Total mentors:', data.length);
                // Log first mentor to see structure
                if (data.length > 0) {
                    console.log('📋 First mentor keys:', Object.keys(data[0]));
                    console.log('📋 First mentor profile:', data[0].mentorProfile);
                }
                setMentors(data);
            } else if (data && data.data && Array.isArray(data.data)) {
                // If data is wrapped in a data property
                setMentors(data.data);
            } else {
                console.warn('⚠️ Unexpected data format:', data);
                setMentors([]);
            }
        } catch (err) {
            console.error('❌ Failed to load mentors:', err);
            setError('Failed to load mentors: ' + err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadMentors();
    };

    const handleVerify = async (userId, approve, reason = null) => {
        setProcessing(prev => ({ ...prev, [userId]: true }));
        setSuccess('');
        setError('');
        
        try {
            await adminService.verifyUser(userId, approve, reason);
            await loadMentors();
            setSuccess(`Mentor ${approve ? 'approved' : 'rejected'} successfully!`);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Failed to verify mentor: ' + err.message);
        } finally {
            setProcessing(prev => ({ ...prev, [userId]: false }));
        }
    };

    const handleReject = (userId) => {
        const reason = prompt('Enter rejection reason (optional):');
        if (reason !== null) {
            handleVerify(userId, false, reason);
        }
    };

    const toggleExpand = (userId) => {
        setExpandedUser(expandedUser === userId ? null : userId);
    };

    const getExpertiseList = (expertise) => {
        if (!expertise) return [];
        return expertise.split(',').map(item => item.trim());
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div>
                    <button 
                        onClick={() => navigate('/dashboard/admin')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-2"
                    >
                        <FiArrowLeft /> Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                        <FiUsers className="text-yellow-600" />
                        Verify Mentors
                    </h1>
                    <p className="text-gray-600">Review and verify mentor registrations</p>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
                >
                    <FiRefreshCw className={refreshing ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Messages */}
            {success && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 text-green-700">
                    {success}
                </div>
            )}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-red-700">
                    {error}
                </div>
            )}

            {/* Count */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                <p className="text-gray-600">
                    <span className="font-bold text-yellow-600">{mentors.length}</span> mentor(s) pending verification
                </p>
            </div>

            {/* Mentor Cards */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-gray-600 mt-2">Loading mentors...</p>
                </div>
            ) : mentors.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <FiCheckCircle className="mx-auto text-green-400 text-5xl mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">All Clear!</h3>
                    <p className="text-gray-500">No pending mentor verifications</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {mentors.map((mentor) => {
                        const isExpanded = expandedUser === mentor.userId;
                        // ✅ Access the mentorProfile (it should be at the root level)
                        const profile = mentor.mentorProfile || {};
                        
                        return (
                            <div key={mentor.userId} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition overflow-hidden">
                                {/* Header Card */}
                                <div className="p-6 border-b border-gray-100">
                                    <div className="flex flex-wrap gap-4">
                                        {/* Avatar */}
                                        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 text-2xl font-bold flex-shrink-0">
                                            {mentor.name?.charAt(0) || 'M'}
                                        </div>
                                        
                                        {/* Basic Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-start justify-between gap-2">
                                                <div>
                                                    <h3 className="text-xl font-semibold text-gray-800">{mentor.name}</h3>
                                                    <p className="text-sm text-gray-600 flex items-center gap-1">
                                                        <FiMail className="text-gray-400" /> {mentor.email}
                                                    </p>
                                                    <p className="text-sm text-gray-500 flex items-center gap-1">
                                                        <FiCalendar className="text-gray-400" /> 
                                                        Registered: {mentor.createdAt ? new Date(mentor.createdAt).toLocaleDateString() : 'N/A'}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-flex items-center gap-1 text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full text-sm font-medium">
                                                        <FiClock /> Pending
                                                    </span>
                                                    <button
                                                        onClick={() => toggleExpand(mentor.userId)}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition"
                                                    >
                                                        {isExpanded ? (
                                                            <>
                                                                <FiEyeOff /> Hide Details
                                                            </>
                                                        ) : (
                                                            <>
                                                                <FiEye /> Show Details
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Mentor Profile Details - Visible only when expanded */}
                                {isExpanded && (
                                    <div className="p-6 bg-gray-50 border-b border-gray-100">
                                        {profile && Object.keys(profile).length > 0 ? (
                                            <>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="flex items-start gap-3">
                                                        <FiBriefcase className="text-gray-400 mt-1 flex-shrink-0" />
                                                        <div>
                                                            <p className="text-xs text-gray-500">Designation</p>
                                                            <p className="text-sm font-medium text-gray-700">
                                                                {profile.designation || 'N/A'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-3">
                                                        <FiAward className="text-gray-400 mt-1 flex-shrink-0" />
                                                        <div>
                                                            <p className="text-xs text-gray-500">Company</p>
                                                            <p className="text-sm font-medium text-gray-700">
                                                                {profile.company || 'N/A'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-3">
                                                        <FiUsers className="text-gray-400 mt-1 flex-shrink-0" />
                                                        <div>
                                                            <p className="text-xs text-gray-500">Experience</p>
                                                            <p className="text-sm font-medium text-gray-700">
                                                                {profile.yearsExperience || 0} years
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-3">
                                                        <FiLinkedin className="text-gray-400 mt-1 flex-shrink-0" />
                                                        <div>
                                                            <p className="text-xs text-gray-500">LinkedIn</p>
                                                            {profile.linkedin ? (
                                                                <a 
                                                                    href={profile.linkedin} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    className="text-sm font-medium text-blue-600 hover:text-blue-800 truncate block"
                                                                >
                                                                    View Profile
                                                                </a>
                                                            ) : (
                                                                <p className="text-sm text-gray-500">N/A</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Expertise Tags */}
                                                {profile.expertise && (
                                                    <div className="mt-4">
                                                        <p className="text-xs text-gray-500 mb-2">Areas of Expertise</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {getExpertiseList(profile.expertise).map((exp, idx) => (
                                                                <span key={idx} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                                                                    <FiStar className="text-blue-400" size={14} />
                                                                    {exp}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <p className="text-sm text-yellow-600">⚠️ No mentor profile data available</p>
                                        )}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="p-6 bg-white flex flex-wrap gap-3">
                                    <button
                                        onClick={() => handleVerify(mentor.userId, true)}
                                        disabled={processing[mentor.userId]}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition disabled:opacity-50"
                                    >
                                        {processing[mentor.userId] ? (
                                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                        ) : (
                                            <FiCheckCircle />
                                        )}
                                        Approve Mentor
                                    </button>
                                    <button
                                        onClick={() => handleReject(mentor.userId)}
                                        disabled={processing[mentor.userId]}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition disabled:opacity-50"
                                    >
                                        <FiXCircle />
                                        Reject Mentor
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default VerifyMentors;