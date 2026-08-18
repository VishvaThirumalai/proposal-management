import React, { useState, useEffect } from 'react';
import { investorService } from '../../services/investorService';
import { 
    FiSearch, FiBriefcase, FiClock, FiCheckCircle, 
    FiEye, FiRefreshCw, FiMail,
    FiStar, FiDollarSign,
    FiPieChart,
    FiPlus, FiCheck, FiX, FiUnlock
} from 'react-icons/fi';

const InvestorDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('proposals');
    const [proposals, setProposals] = useState([]);
    const [investedProposals, setInvestedProposals] = useState([]);
    const [requests, setRequests] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [portfolio, setPortfolio] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [processing, setProcessing] = useState({});
    const [viewingProposal, setViewingProposal] = useState({});
    const [investing, setInvesting] = useState({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            const [proposalsData, investedData, requestsData, recommendationsData, portfolioData] = await Promise.all([
                investorService.getProposals(),
                investorService.getInvestedProposals(),
                investorService.getRequests(),
                investorService.getRecommendations(),
                investorService.getPortfolio()
            ]);
            
            setProposals(proposalsData || []);
            setInvestedProposals(investedData || []);
            setRequests(requestsData || []);
            setRecommendations(recommendationsData || []);
            setPortfolio(portfolioData);
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

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            await loadData();
            return;
        }
        try {
            const results = await investorService.searchProposals(searchQuery);
            setProposals(results || []);
        } catch (err) {
            setError('Search failed: ' + err.message);
        }
    };

    const handleRespondToRequest = async (requestId, accept) => {
        setProcessing(prev => ({ ...prev, [requestId]: true }));
        setError('');
        setSuccess('');
        
        try {
            const result = await investorService.respondToRequest(requestId, accept);
            setSuccess(result.message);
            setTimeout(() => setSuccess(''), 3000);
            await loadData();
        } catch (err) {
            setError('Failed to respond: ' + err.message);
        } finally {
            setProcessing(prev => ({ ...prev, [requestId]: false }));
        }
    };

    const handleViewProposal = async (startupId) => {
        try {
            const status = await investorService.checkAccessStatus(startupId);
            if (status.hasAccess) {
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = '.key';
                
                fileInput.onchange = async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                        const privateKey = event.target.result;
                        setViewingProposal(prev => ({ ...prev, [startupId]: true }));
                        
                        try {
                            const blob = await investorService.viewProposal(startupId, privateKey);
                            const url = window.URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `proposal_${startupId}.pdf`;
                            document.body.appendChild(link);
                            link.click();
                            link.remove();
                            window.URL.revokeObjectURL(url);
                            setSuccess('Proposal downloaded successfully!');
                            setTimeout(() => setSuccess(''), 3000);
                        } catch (err) {
                            setError('Failed to view proposal: ' + err.message);
                        } finally {
                            setViewingProposal(prev => ({ ...prev, [startupId]: false }));
                        }
                    };
                    reader.readAsText(file);
                };
                fileInput.click();
            } else {
                setError('You do not have access to this proposal. Please contact the founder.');
            }
        } catch (err) {
            setError('Failed to check access: ' + err.message);
        }
    };

    const handleInvest = async (startupId) => {
        const amount = prompt('Enter the investment amount (₹):');
        if (!amount) return;
        
        setInvesting(prev => ({ ...prev, [startupId]: true }));
        setError('');
        setSuccess('');
        
        try {
            await investorService.invest(startupId, parseFloat(amount));
            setSuccess('Investment recorded successfully!');
            setTimeout(() => setSuccess(''), 3000);
            await loadData();
        } catch (err) {
            setError('Failed to invest: ' + err.message);
        } finally {
            setInvesting(prev => ({ ...prev, [startupId]: false }));
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'INDEXED':
                return <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2.5 py-1 rounded-full text-xs font-medium"><FiCheckCircle /> Available</span>;
            case 'INVESTED':
                return <span className="inline-flex items-center gap-1 text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full text-xs font-medium"><FiDollarSign /> Invested</span>;
            case 'PENDING':
                return <span className="inline-flex items-center gap-1 text-yellow-600 bg-yellow-50 px-2.5 py-1 rounded-full text-xs font-medium"><FiClock /> Pending</span>;
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
            default:
                return <span className="text-xs text-gray-500">{status}</span>;
        }
    };

    const renderStats = () => {
        const totalInvested = portfolio?.totalInvested || 0;
        
        return (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <p className="text-sm text-gray-500">Available Startups</p>
                    <p className="text-2xl font-bold text-gray-800">{proposals.length}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <p className="text-sm text-gray-500">Invested Startups</p>
                    <p className="text-2xl font-bold text-blue-600">{investedProposals.length}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <p className="text-sm text-gray-500">Total Invested</p>
                    <p className="text-2xl font-bold text-green-600">₹{totalInvested.toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <p className="text-sm text-gray-500">Pending Requests</p>
                    <p className="text-2xl font-bold text-yellow-600">
                        {requests.filter(r => r.status === 'PENDING').length}
                    </p>
                </div>
            </div>
        );
    };

    const renderProposals = () => (
        <div className="space-y-4">
            <div className="flex gap-2 mb-4">
                <div className="flex-1 relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search startups by keyword, domain, or title..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                </div>
                <button
                    onClick={handleSearch}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                    Search
                </button>
                <button
                    onClick={loadData}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                >
                    Clear
                </button>
            </div>

            {proposals.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <FiBriefcase className="mx-auto text-gray-300 text-5xl mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No Startups Found</h3>
                    <p className="text-gray-500">Try adjusting your search or check back later</p>
                </div>
            ) : (
                proposals.map((proposal) => (
                    <div key={proposal.startupId} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition p-6">
                        <div className="flex flex-wrap justify-between items-start gap-4">
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-gray-800">{proposal.title}</h3>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <span className="text-sm text-gray-500">{proposal.domain}</span>
                                    <span className="text-sm text-gray-300">•</span>
                                    <span className="text-sm text-gray-500">{proposal.stage}</span>
                                    <span className="text-sm text-gray-300">•</span>
                                    <span className="text-sm text-gray-500">₹{proposal.fundingAmount?.toLocaleString()}</span>
                                </div>
                                {proposal.aiSummary && (
                                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{proposal.aiSummary}</p>
                                )}
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {getStatusBadge(proposal.status)}
                                    {proposal.requested && (
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                                            proposal.requestStatus === 'PENDING' ? 'text-yellow-600 bg-yellow-50' :
                                            proposal.requestStatus === 'ACCEPTED' ? 'text-green-600 bg-green-50' :
                                            'text-red-600 bg-red-50'
                                        }`}>
                                            {proposal.requestStatus}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {proposal.requested && proposal.requestStatus === 'ACCEPTED' && (
                                    <>
                                        <button
                                            onClick={() => handleViewProposal(proposal.startupId)}
                                            disabled={viewingProposal[proposal.startupId]}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
                                        >
                                            {viewingProposal[proposal.startupId] ? (
                                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                            ) : (
                                                <>
                                                    <FiEye /> View
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleInvest(proposal.startupId)}
                                            disabled={investing[proposal.startupId]}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
                                        >
                                            {investing[proposal.startupId] ? (
                                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                            ) : (
                                                <>
                                                    <FiPlus /> Invest
                                                </>
                                            )}
                                        </button>
                                    </>
                                )}
                                {!proposal.requested && proposal.status === 'INDEXED' && (
                                    <span className="text-sm text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg">
                                        Request access to invest
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );

    const renderInvested = () => (
        <div className="space-y-4">
            {investedProposals.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <FiDollarSign className="mx-auto text-gray-300 text-5xl mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No Investments Yet</h3>
                    <p className="text-gray-500">Start investing in promising startups</p>
                </div>
            ) : (
                investedProposals.map((proposal) => (
                    <div key={proposal.startupId} className="bg-white rounded-xl shadow-sm border border-green-200 hover:shadow-md transition p-6">
                        <div className="flex flex-wrap justify-between items-start gap-4">
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-gray-800">{proposal.title}</h3>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <span className="text-sm text-gray-500">{proposal.domain}</span>
                                    <span className="text-sm text-gray-300">•</span>
                                    <span className="text-sm text-gray-500">{proposal.stage}</span>
                                    <span className="text-sm text-gray-300">•</span>
                                    <span className="text-sm text-green-600 font-medium">Invested</span>
                                </div>
                                {proposal.aiSummary && (
                                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{proposal.aiSummary}</p>
                                )}
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2.5 py-1 rounded-full text-xs font-medium">
                                        <FiDollarSign /> ₹{proposal.investedAmount?.toLocaleString() || 'N/A'}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => handleViewProposal(proposal.startupId)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
                            >
                                <FiEye /> View Details
                            </button>
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
                    <FiClock className="mx-auto text-gray-300 text-5xl mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No Requests</h3>
                    <p className="text-gray-500">No pending investment requests</p>
                </div>
            ) : (
                requests.map((request) => (
                    <div key={request.requestId} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition p-6">
                        <div className="flex flex-wrap justify-between items-start gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                                        {request.founderName?.charAt(0) || 'F'}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800">{request.founderName}</h3>
                                        <p className="text-sm text-gray-500">{request.startupTitle}</p>
                                    </div>
                                </div>
                                {request.message && (
                                    <p className="text-sm text-gray-600 mt-2 italic">"{request.message}"</p>
                                )}
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {getRequestStatusBadge(request.status)}
                                    {request.permissionGranted && (
                                        <span className="inline-flex items-center gap-1 text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full text-xs font-medium">
                                            <FiUnlock /> Access Granted
                                        </span>
                                    )}
                                </div>
                                {request.createdAt && (
                                    <p className="text-xs text-gray-400 mt-1">
                                        Received: {new Date(request.createdAt).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                            {request.status === 'PENDING' && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleRespondToRequest(request.requestId, true)}
                                        disabled={processing[request.requestId]}
                                        className="flex items-center gap-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
                                    >
                                        {processing[request.requestId] ? (
                                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                        ) : (
                                            <>
                                                <FiCheck /> Accept
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleRespondToRequest(request.requestId, false)}
                                        disabled={processing[request.requestId]}
                                        className="flex items-center gap-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
                                    >
                                        <FiX /> Decline
                                    </button>
                                </div>
                            )}
                            {request.status === 'ACCEPTED' && !request.permissionGranted && (
                                <span className="text-sm text-yellow-600 bg-yellow-50 px-3 py-1.5 rounded-lg">
                                    Waiting for founder to grant access...
                                </span>
                            )}
                            {request.permissionGranted && (
                                <button
                                    onClick={() => handleViewProposal(request.startupId)}
                                    className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
                                >
                                    <FiEye /> View Proposal
                                </button>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    );

    const renderRecommendations = () => (
        <div className="grid gap-4">
            {recommendations.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <FiStar className="mx-auto text-gray-300 text-5xl mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No Recommendations</h3>
                    <p className="text-gray-500">Check back later for personalized recommendations</p>
                </div>
            ) : (
                recommendations.map((rec, index) => (
                    <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-semibold text-gray-800">{rec.title}</h3>
                                    <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2.5 py-1 rounded-full text-xs font-medium">
                                        <FiStar /> {rec.matchScore || 85}% Match
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500">{rec.domain} • {rec.stage}</p>
                                <p className="text-sm text-gray-600 mt-2">{rec.aiSummary?.substring(0, 150)}...</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setSearchQuery(rec.domain || '');
                                        setActiveTab('proposals');
                                    }}
                                    className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-600 text-sm font-medium rounded-lg transition"
                                >
                                    View
                                </button>
                                <button
                                    onClick={() => handleInvest(rec.startupId)}
                                    disabled={investing[rec.startupId]}
                                    className="px-4 py-2 bg-green-50 hover:bg-green-100 text-green-600 text-sm font-medium rounded-lg transition disabled:opacity-50"
                                >
                                    {investing[rec.startupId] ? (
                                        <div className="animate-spin h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full"></div>
                                    ) : (
                                        <>
                                            <FiPlus /> Invest
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );

    const renderPortfolio = () => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Portfolio Overview</h3>
            {portfolio ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-500">Total Invested</p>
                        <p className="text-2xl font-bold text-gray-800">₹{portfolio.totalInvested?.toLocaleString() || '0'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-500">Startups</p>
                        <p className="text-2xl font-bold text-gray-800">{portfolio.startups || 0}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-500">Total Returns</p>
                        <p className="text-2xl font-bold text-green-600">₹{portfolio.totalReturns?.toLocaleString() || '0'}</p>
                    </div>
                </div>
            ) : (
                <p className="text-gray-500 text-center py-8">No portfolio data available</p>
            )}
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                        <FiBriefcase className="text-green-600" />
                        Investor Dashboard
                    </h1>
                    <p className="text-gray-600">Discover and invest in promising startups</p>
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

            {/* Stats */}
            {!loading && renderStats()}

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
                    <FiSearch className="inline mr-2" /> Browse Startups
                </button>
                <button
                    onClick={() => setActiveTab('invested')}
                    className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition ${
                        activeTab === 'invested'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <FiDollarSign className="inline mr-2" /> Invested ({investedProposals.length})
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition ${
                        activeTab === 'requests'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <FiMail className="inline mr-2" /> Requests ({requests.filter(r => r.status === 'PENDING').length})
                </button>
                <button
                    onClick={() => setActiveTab('recommendations')}
                    className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition ${
                        activeTab === 'recommendations'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <FiStar className="inline mr-2" /> Recommendations
                </button>
                <button
                    onClick={() => setActiveTab('portfolio')}
                    className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition ${
                        activeTab === 'portfolio'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <FiPieChart className="inline mr-2" /> Portfolio
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
                    {activeTab === 'invested' && renderInvested()}
                    {activeTab === 'requests' && renderRequests()}
                    {activeTab === 'recommendations' && renderRecommendations()}
                    {activeTab === 'portfolio' && renderPortfolio()}
                </>
            )}
        </div>
    );
};

export default InvestorDashboard;