import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { 
    FiUser, FiCheckCircle, FiXCircle, FiRefreshCw, 
    FiClock, FiArrowLeft, FiMail, FiBriefcase, FiGlobe,
    FiLinkedin, FiUsers, FiDollarSign, FiTag, FiCalendar,
    FiEye, FiEyeOff, FiStar
} from 'react-icons/fi';

const VerifyInvestors = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [investors, setInvestors] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [processing, setProcessing] = useState({});
    const [expandedUser, setExpandedUser] = useState(null);

    useEffect(() => {
        loadInvestors();
    }, []);

    const loadInvestors = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await adminService.getPendingInvestors();
            console.log('📋 Pending Investors:', data);
            setInvestors(data || []);
        } catch (err) {
            console.error('❌ Failed to load investors:', err);
            setError('Failed to load investors: ' + err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadInvestors();
    };

    const handleVerify = async (userId, approve, reason = null) => {
        setProcessing(prev => ({ ...prev, [userId]: true }));
        setSuccess('');
        setError('');
        
        try {
            await adminService.verifyUser(userId, approve, reason);
            await loadInvestors();
            setSuccess(`Investor ${approve ? 'approved' : 'rejected'} successfully!`);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Failed to verify investor: ' + err.message);
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

    const getDomainsList = (domains) => {
        if (!domains) return [];
        return domains.split(',').map(item => item.trim());
    };

    const getStagesList = (stages) => {
        if (!stages) return [];
        return stages.split(',').map(item => item.trim());
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
                        <FiUsers className="text-blue-600" />
                        Verify Investors
                    </h1>
                    <p className="text-gray-600">Review and verify investor registrations</p>
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
                    <span className="font-bold text-blue-600">{investors.length}</span> investor(s) pending verification
                </p>
            </div>

            {/* Investor Cards */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-gray-600 mt-2">Loading investors...</p>
                </div>
            ) : investors.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <FiCheckCircle className="mx-auto text-green-400 text-5xl mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">All Clear!</h3>
                    <p className="text-gray-500">No pending investor verifications</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {investors.map((investor) => {
                        const isExpanded = expandedUser === investor.userId;
                        return (
                            <div key={investor.userId} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition overflow-hidden">
                                {/* Header Card */}
                                <div className="p-6 border-b border-gray-100">
                                    <div className="flex flex-wrap gap-4">
                                        {/* Avatar */}
                                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold flex-shrink-0">
                                            {investor.name?.charAt(0) || 'I'}
                                        </div>
                                        
                                        {/* Basic Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-start justify-between gap-2">
                                                <div>
                                                    <h3 className="text-xl font-semibold text-gray-800">{investor.name}</h3>
                                                    <p className="text-sm text-gray-600 flex items-center gap-1">
                                                        <FiMail className="text-gray-400" /> {investor.email}
                                                    </p>
                                                    <p className="text-sm text-gray-500 flex items-center gap-1">
                                                        <FiCalendar className="text-gray-400" /> 
                                                        Registered: {new Date(investor.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-flex items-center gap-1 text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-sm font-medium">
                                                        <FiClock /> Pending
                                                    </span>
                                                    {/* Show Details Button */}
                                                    <button
                                                        onClick={() => toggleExpand(investor.userId)}
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

                                {/* Investor Profile Details - Visible only when expanded */}
                               {isExpanded && investor.investorProfile && (
    <div className="p-6 bg-gray-50 border-b border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
                <FiBriefcase className="text-gray-400 mt-1 flex-shrink-0" />
                <div>
                    <p className="text-xs text-gray-500">Organization</p>
                    <p className="text-sm font-medium text-gray-700">
                        {investor.investorProfile.organization || 'N/A'}
                    </p>
                </div>
            </div>
            <div className="flex items-start gap-3">
                <FiGlobe className="text-gray-400 mt-1 flex-shrink-0" />
                <div>
                    <p className="text-xs text-gray-500">Website</p>
                    {investor.investorProfile.website ? (
                        <a 
                            href={investor.investorProfile.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 truncate block"
                        >
                            Visit Website
                        </a>
                    ) : (
                        <p className="text-sm text-gray-500">N/A</p>
                    )}
                </div>
            </div>
                                            <div className="flex items-start gap-3">
                                                <FiLinkedin className="text-gray-400 mt-1 flex-shrink-0" />
                                                <div>
                                                    <p className="text-xs text-gray-500">LinkedIn</p>
                                                    {investor.investorProfile.linkedin ? (
                                                        <a 
                                                            href={investor.investorProfile.linkedin} 
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

                                               {/* Investment Domains */}
        {investor.investorProfile.investmentDomains && (
            <div className="mt-4">
                <p className="text-xs text-gray-500 mb-2">Investment Domains</p>
                <div className="flex flex-wrap gap-2">
                    {investor.investorProfile.investmentDomains.split(',').map((domain, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                            <FiTag className="text-purple-400" size={14} />
                            {domain.trim()}
                        </span>
                    ))}
                </div>
            </div>
        )}
        {/* Investment Stages */}
        {investor.investorProfile.investmentStage && (
            <div className="mt-3">
                <p className="text-xs text-gray-500 mb-2">Investment Stages</p>
                <div className="flex flex-wrap gap-2">
                    {investor.investorProfile.investmentStage.split(',').map((stage, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                            <FiDollarSign className="text-green-400" size={14} />
                            {stage.trim()}
                        </span>
                    ))}
                </div>
            </div>
        )}
    </div>
)}

{isExpanded && !investor.investorProfile && (
    <div className="p-6 bg-yellow-50 border-b border-yellow-100 text-yellow-700">
        <p className="text-sm">⚠️ No investor profile data available</p>
    </div>
)}

                                {/* Actions */}
                                <div className="p-6 bg-white flex flex-wrap gap-3">
                                    <button
                                        onClick={() => handleVerify(investor.userId, true)}
                                        disabled={processing[investor.userId]}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition disabled:opacity-50"
                                    >
                                        {processing[investor.userId] ? (
                                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                        ) : (
                                            <FiCheckCircle />
                                        )}
                                        Approve Investor
                                    </button>
                                    <button
                                        onClick={() => handleReject(investor.userId)}
                                        disabled={processing[investor.userId]}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition disabled:opacity-50"
                                    >
                                        <FiXCircle />
                                        Reject Investor
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

export default VerifyInvestors;