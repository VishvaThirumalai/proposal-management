import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { founderService } from '../../services/founderService';
import { 
    FiPlus, FiFile, FiEye, FiClock, FiCheckCircle, 
    FiRefreshCw, FiUsers, FiBriefcase, 
    FiMail, FiSend,
    FiCheck, FiX, FiLock, FiUnlock
} from 'react-icons/fi';

const FounderDashboard = () => {
    const [proposals, setProposals] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showRecommendations, setShowRecommendations] = useState(false);
    const [selectedProposal, setSelectedProposal] = useState(null);
    const [mentorRecommendations, setMentorRecommendations] = useState([]);
    const [investorRecommendations, setInvestorRecommendations] = useState([]);
    const [loadingRecommendations, setLoadingRecommendations] = useState(false);
    const [sendingRequest, setSendingRequest] = useState({});
    const [grantingAccess, setGrantingAccess] = useState({});
    const [activeTab, setActiveTab] = useState('proposals');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            const [proposalsData, requestsData] = await Promise.all([
                founderService.getProposals(),
                founderService.getRequests()
            ]);
            setProposals(proposalsData.proposals || []);
            setRequests(requestsData || []);
        } catch (err) {
            setError('Failed to load data: ' + err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadData();
    };

    const handleViewRecommendations = async (proposal) => {
        setSelectedProposal(proposal);
        setShowRecommendations(true);
        setLoadingRecommendations(true);
        
        try {
            const result = await founderService.getRecommendations(proposal.startupId);
            setMentorRecommendations(result.mentors || []);
            setInvestorRecommendations(result.investors || []);
        } catch (err) {
            setError('Failed to load recommendations: ' + err.message);
        } finally {
            setLoadingRecommendations(false);
        }
    };

    const handleSendRequest = async (recipientId, recipientRole) => {
        if (!selectedProposal) return;

        const message = prompt('Enter a message for the ' + recipientRole.toLowerCase() + ':');
        if (message === null) return;

        setSendingRequest(prev => ({ ...prev, [recipientId]: true }));
        setError('');
        setSuccess('');

        try {
            await founderService.sendRequest(
                selectedProposal.startupId,
                recipientId,
                recipientRole,
                message
            );
            setSuccess(`Request sent to ${recipientRole} successfully!`);
            setTimeout(() => setSuccess(''), 3000);
            await loadData();
            // Remove from recommendations
            if (recipientRole === 'MENTOR') {
                setMentorRecommendations(prev => 
                    prev.filter(m => m.mentor?.mentorId !== recipientId)
                );
            } else {
                setInvestorRecommendations(prev => 
                    prev.filter(i => i.investor?.investorId !== recipientId)
                );
            }
        } catch (err) {
            setError('Failed to send request: ' + err.message);
        } finally {
            setSendingRequest(prev => ({ ...prev, [recipientId]: false }));
        }
    };

    const handleGrantAccess = async (requestId, requestData) => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.key';
        
        fileInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = async (event) => {
                const privateKey = event.target.result;
                setGrantingAccess(prev => ({ ...prev, [requestId]: true }));
                setError('');
                setSuccess('');
                
                try {
                    await founderService.grantAccess(requestId, privateKey);
                    setSuccess('Access granted successfully!');
                    setTimeout(() => setSuccess(''), 3000);
                    await loadData();
                } catch (err) {
                    setError('Failed to grant access: ' + err.message);
                } finally {
                    setGrantingAccess(prev => ({ ...prev, [requestId]: false }));
                }
            };
            reader.readAsText(file);
        };
        fileInput.click();
    };

    const handleRevokeAccess = async (requestId) => {
        if (!window.confirm('Are you sure you want to revoke access?')) return;
        
        try {
            await founderService.revokeAccess(requestId);
            setSuccess('Access revoked successfully!');
            setTimeout(() => setSuccess(''), 3000);
            await loadData();
        } catch (err) {
            setError('Failed to revoke access: ' + err.message);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'INDEXED':
                return <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2.5 py-1 rounded-full text-xs font-medium"><FiCheckCircle /> Indexed</span>;
            case 'PENDING':
                return <span className="inline-flex items-center gap-1 text-yellow-600 bg-yellow-50 px-2.5 py-1 rounded-full text-xs font-medium"><FiClock /> Pending</span>;
            case 'PROCESSING':
                return <span className="inline-flex items-center gap-1 text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full text-xs font-medium"><FiClock /> Processing</span>;
            default:
                return <span className="text-xs text-gray-500">{status}</span>;
        }
    };

    const getRequestStatusBadge = (status) => {
        switch (status) {
            case 'PENDING':
                return <span className="inline-flex items-center gap-1 text-yellow-600 bg-yellow-50 px-2.5 py-1 rounded-full text-xs font-medium"><FiClock /> Pending</span>;
            case 'ACCEPTED':
                return <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2.5 py-1 rounded-full text-xs font-medium"><FiCheck /> Accepted</span>;
            case 'REJECTED':
                return <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2.5 py-1 rounded-full text-xs font-medium"><FiX /> Rejected</span>;
            case 'REVOKED':
                return <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2.5 py-1 rounded-full text-xs font-medium"><FiX /> Revoked</span>;
            default:
                return <span className="text-xs text-gray-500">{status}</span>;
        }
    };

    const getMatchBadge = (score) => {
        const percentage = Math.round(score * 100);
        if (percentage >= 80) return 'bg-green-100 text-green-800';
        if (percentage >= 60) return 'bg-yellow-100 text-yellow-800';
        return 'bg-gray-100 text-gray-600';
    };

    const renderProposals = () => (
        <div className="grid gap-4">
            {proposals.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <FiFile className="mx-auto text-gray-300 text-5xl mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No Proposals Yet</h3>
                    <p className="text-gray-500 mb-4">Upload your first startup proposal</p>
                    <Link
                        to="/dashboard/founder/upload"
                        className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
                    >
                        Upload Proposal
                    </Link>
                </div>
            ) : (
                proposals.map((proposal) => (
                    <div key={proposal.startupId} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition p-6">
                        <div className="flex flex-wrap justify-between items-start gap-4">
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-gray-800 truncate">
                                    {proposal.title}
                                </h3>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <span className="text-sm text-gray-500">{proposal.domain || 'N/A'}</span>
                                    <span className="text-sm text-gray-300">•</span>
                                    <span className="text-sm text-gray-500">{proposal.stage || 'N/A'}</span>
                                    <span className="text-sm text-gray-300">•</span>
                                    <span className="text-sm text-gray-500 font-medium">
                                        ₹{proposal.fundingAmount?.toLocaleString() || '0'}
                                    </span>
                                </div>
                                {proposal.aiSummary && (
                                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                        {proposal.aiSummary}
                                    </p>
                                )}
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {getStatusBadge(proposal.status)}
                                    {proposal.ipfsCid && (
                                        <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200">
                                            IPFS: {proposal.ipfsCid.substring(0, 12)}...
                                        </span>
                                    )}
                                    {proposal.blockchainTxHash && (
                                        <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200">
                                            TX: {proposal.blockchainTxHash}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                {proposal.status === 'INDEXED' && (
                                    <button
                                        onClick={() => handleViewRecommendations(proposal)}
                                        className="flex items-center gap-1 text-purple-600 hover:text-purple-800 text-sm font-medium border border-purple-200 hover:border-purple-400 px-3 py-1.5 rounded-lg transition"
                                    >
                                        <FiUsers /> Recommend
                                    </button>
                                )}
                                {proposal.ipfsCid && (
                                    <button
                                        onClick={() => window.open(`https://ipfs.io/ipfs/${proposal.ipfsCid}`, '_blank')}
                                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium border border-blue-200 hover:border-blue-400 px-3 py-1.5 rounded-lg transition"
                                    >
                                        <FiEye /> View
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );

    const renderRequests = () => (
        <div className="space-y-4">
            {requests.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <FiMail className="mx-auto text-gray-300 text-5xl mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No Requests</h3>
                    <p className="text-gray-500">No requests from mentors or investors yet</p>
                </div>
            ) : (
                requests.map((req) => (
                    <div key={req.requestId} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition p-6">
                        <div className="flex flex-wrap justify-between items-start gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                                        {req.recipientName?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800">{req.recipientName}</h3>
                                        <p className="text-sm text-gray-500">{req.recipientRole} • {req.startupTitle}</p>
                                    </div>
                                </div>
                                {req.message && (
                                    <p className="text-sm text-gray-600 mt-2 italic">"{req.message}"</p>
                                )}
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {getRequestStatusBadge(req.status)}
                                    {req.permissionGranted && (
                                        <span className="inline-flex items-center gap-1 text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full text-xs font-medium">
                                            <FiUnlock /> Access Granted
                                        </span>
                                    )}
                                </div>
                                {req.createdAt && (
                                    <p className="text-xs text-gray-400 mt-1">
                                        Requested: {new Date(req.createdAt).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {req.status === 'ACCEPTED' && !req.permissionGranted && (
                                    <button
                                        onClick={() => handleGrantAccess(req.requestId, req)}
                                        disabled={grantingAccess[req.requestId]}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
                                    >
                                        {grantingAccess[req.requestId] ? (
                                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                        ) : (
                                            <>
                                                <FiUnlock /> Grant Access
                                            </>
                                        )}
                                    </button>
                                )}
                                {req.permissionGranted && (
                                    <button
                                        onClick={() => handleRevokeAccess(req.requestId)}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition"
                                    >
                                        <FiLock /> Revoke
                                    </button>
                                )}
                                {req.status === 'PENDING' && (
                                    <span className="text-sm text-yellow-600 bg-yellow-50 px-3 py-1.5 rounded-lg">
                                        Waiting for response...
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );

    const renderRecommendationsModal = () => {
        if (!showRecommendations || !selectedProposal) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Top Recommendations for</h2>
                            <p className="text-gray-600">{selectedProposal.title}</p>
                        </div>
                        <button
                            onClick={() => {
                                setShowRecommendations(false);
                                setSelectedProposal(null);
                                setMentorRecommendations([]);
                                setInvestorRecommendations([]);
                            }}
                            className="text-gray-500 hover:text-gray-700 text-2xl"
                        >
                            ×
                        </button>
                    </div>

                    <div className="p-6">
                        {loadingRecommendations ? (
                            <div className="text-center py-12">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                                <p className="text-gray-600 mt-2">Generating recommendations...</p>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Mentors */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                        <FiUsers className="text-blue-600" />
                                        Top Mentors ({mentorRecommendations.length})
                                    </h3>
                                    {mentorRecommendations.length === 0 ? (
                                        <p className="text-gray-500 text-sm">No mentors available</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {mentorRecommendations.map((rec, index) => {
                                                const mentor = rec.mentor;
                                                if (!mentor) return null;
                                                return (
                                                    <div key={mentor.mentorId || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-medium text-gray-800">{mentor.user?.name || 'Unknown'}</span>
                                                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getMatchBadge(rec.similarity || 0)}`}>
                                                                        {Math.round((rec.similarity || 0) * 100)}% Match
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-gray-600">{mentor.designation} at {mentor.company}</p>
                                                                <p className="text-sm text-gray-500">{mentor.yearsExperience || 0} years experience</p>
                                                                <p className="text-sm text-gray-500 mt-1">{mentor.expertise}</p>
                                                                <p className="text-xs text-gray-400 mt-1">
                                                                    {rec.profileText || 'No additional details'}
                                                                </p>
                                                            </div>
                                                            <button
                                                                onClick={() => handleSendRequest(mentor.mentorId, 'MENTOR')}
                                                                disabled={sendingRequest[mentor.mentorId]}
                                                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50 ml-2 flex-shrink-0"
                                                            >
                                                                {sendingRequest[mentor.mentorId] ? (
                                                                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                                                ) : (
                                                                    <>
                                                                        <FiSend /> Connect
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Investors */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                        <FiBriefcase className="text-green-600" />
                                        Top Investors ({investorRecommendations.length})
                                    </h3>
                                    {investorRecommendations.length === 0 ? (
                                        <p className="text-gray-500 text-sm">No investors available</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {investorRecommendations.map((rec, index) => {
                                                const investor = rec.investor;
                                                if (!investor) return null;
                                                return (
                                                    <div key={investor.investorId || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-medium text-gray-800">{investor.user?.name || 'Unknown'}</span>
                                                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getMatchBadge(rec.similarity || 0)}`}>
                                                                        {Math.round((rec.similarity || 0) * 100)}% Match
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-gray-600">{investor.organization}</p>
                                                                <p className="text-sm text-gray-500">Domains: {investor.investmentDomains}</p>
                                                                <p className="text-sm text-gray-500">Stage: {investor.investmentStage}</p>
                                                                <p className="text-xs text-gray-400 mt-1">
                                                                    {rec.profileText || 'No additional details'}
                                                                </p>
                                                            </div>
                                                            <button
                                                                onClick={() => handleSendRequest(investor.investorId, 'INVESTOR')}
                                                                disabled={sendingRequest[investor.investorId]}
                                                                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50 ml-2 flex-shrink-0"
                                                            >
                                                                {sendingRequest[investor.investorId] ? (
                                                                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                                                ) : (
                                                                    <>
                                                                        <FiSend /> Connect
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Founder Dashboard</h1>
                    <p className="text-gray-600">Manage your startup proposals</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
                    >
                        <FiRefreshCw className={refreshing ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    <Link
                        to="/dashboard/founder/upload"
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                    >
                        <FiPlus />
                        New Proposal
                    </Link>
                </div>
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

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <p className="text-sm text-gray-500">Total Proposals</p>
                    <p className="text-2xl font-bold text-gray-800">{proposals.length}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <p className="text-sm text-gray-500">Indexed</p>
                    <p className="text-2xl font-bold text-green-600">
                        {proposals.filter(p => p.status === 'INDEXED').length}
                    </p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <p className="text-sm text-gray-500">Requests</p>
                    <p className="text-2xl font-bold text-yellow-600">
                        {requests.filter(r => r.status === 'PENDING').length}
                    </p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <p className="text-sm text-gray-500">Access Granted</p>
                    <p className="text-2xl font-bold text-blue-600">
                        {requests.filter(r => r.permissionGranted).length}
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('proposals')}
                    className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition ${
                        activeTab === 'proposals'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <FiFile className="inline mr-2" /> Proposals ({proposals.length})
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition ${
                        activeTab === 'requests'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <FiMail className="inline mr-2" /> Requests ({requests.length})
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-gray-600 mt-2">Loading...</p>
                </div>
            ) : (
                <>
                    {activeTab === 'proposals' && renderProposals()}
                    {activeTab === 'requests' && renderRequests()}
                </>
            )}

            {/* Recommendations Modal */}
            {renderRecommendationsModal()}
        </div>
    );
};

export default FounderDashboard;