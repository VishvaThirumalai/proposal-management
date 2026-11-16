import React, { useState, useEffect } from 'react';
import { mentorService } from '../../services/mentorService';
import MentorEscrowDashboard from '../escrow/MentorEscrowDashboard';
import {
    FiUsers, FiSearch, FiMail, FiEye, FiCheck, FiX,
    FiRefreshCw, FiClock, FiCheckCircle, FiAward,
    FiUnlock, FiLock, FiFile, FiBriefcase
} from 'react-icons/fi';

const MentorDashboard = () => {
    const [activeTab, setActiveTab] = useState('assigned');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [assignedStartups, setAssignedStartups] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [requests, setRequests] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [processing, setProcessing] = useState({});
    const [viewingProposal, setViewingProposal] = useState({});
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        const storedUserId = localStorage.getItem('userId');
        setUserId(storedUserId);
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            const [assignedData, requestsData] = await Promise.all([
                mentorService.getAssignedProposals().catch(() => []),
                mentorService.getRequests().catch(() => [])
            ]);
            setAssignedStartups(assignedData || []);
            setRequests(requestsData || []);
        } catch (err) {
            setError('Failed to load data: ' + err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        setError('');

        try {
            const results = await mentorService.searchProposals(searchQuery);
            setSearchResults(results || []);
        } catch (err) {
            setError('Search failed: ' + err.message);
        } finally {
            setSearching(false);
        }
    };

    const handleRequestAccess = async (proposalId) => {
        const message = prompt('Enter a message for the founder:');
        if (message === null) return;

        try {
            await mentorService.requestAccess(proposalId, message);
            setSuccess('Access request sent successfully!');
            setTimeout(() => setSuccess(''), 3000);
            await loadData();
        } catch (err) {
            setError('Failed to send request: ' + err.message);
        }
    };

    const handleRespondToRequest = async (requestId, accept) => {
        setProcessing(prev => ({ ...prev, [requestId]: true }));
        setError('');
        setSuccess('');

        try {
            const result = await mentorService.respondToRequest(requestId, accept);
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
            const status = await mentorService.checkAccessStatus(startupId);

            if (!status.hasAccess) {
                setError('You do not have access to this proposal yet.');
                return;
            }

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
                        const blob = await mentorService.viewProposal(startupId, privateKey);
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
        } catch (err) {
            setError('Failed to check access: ' + err.message);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'INDEXED':
                return <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2.5 py-1 rounded-full text-xs font-medium"><FiCheckCircle /> Indexed</span>;
            case 'ACTIVE':
                return <span className="inline-flex items-center gap-1 text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full text-xs font-medium"><FiClock /> Active</span>;
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

    const renderAssigned = () => (
        <div className="space-y-4">
            {assignedStartups.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <FiAward className="mx-auto text-gray-300 text-5xl mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                        No Assigned Startups
                    </h3>
                    <p className="text-gray-500">
                        Founders will send you mentorship requests. Once you accept, they will appear here.
                    </p>
                </div>
            ) : (
                assignedStartups.map((startup, idx) => (
                    <div key={startup.startupId || idx} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition p-6">
                        <div className="flex flex-wrap justify-between items-start gap-4">
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-gray-800">{startup.title}</h3>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <span className="text-sm text-gray-500">{startup.domain}</span>
                                    <span className="text-sm text-gray-300">•</span>
                                    <span className="text-sm text-gray-500">{startup.stage}</span>
                                    <span className="text-sm text-gray-300">•</span>
                                    <span className="text-sm text-gray-500 font-medium">
                                        ₹{startup.fundingAmount?.toLocaleString() || '0'}
                                    </span>
                                </div>
                                {startup.aiSummary && (
                                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                        {startup.aiSummary}
                                    </p>
                                )}
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {getStatusBadge(startup.status)}
                                    {startup.permissionGranted && (
                                        <span className="inline-flex items-center gap-1 text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full text-xs font-medium">
                                            <FiUnlock /> Access Granted
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {startup.permissionGranted && (
                                    <button
                                        onClick={() => handleViewProposal(startup.startupId)}
                                        disabled={viewingProposal[startup.startupId]}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
                                    >
                                        {viewingProposal[startup.startupId] ? (
                                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                        ) : (
                                            <><FiEye /> View Proposal</>
                                        )}
                                    </button>
                                )}
                                {!startup.permissionGranted && (
                                    <span className="text-sm text-yellow-600 bg-yellow-50 px-3 py-1.5 rounded-lg">
                                        Waiting for founder approval
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );

    const renderSearch = () => (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex flex-wrap gap-2 mb-6">
                <div className="flex-1 min-w-[200px] relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by keyword, domain, or title..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                </div>
                <button
                    onClick={handleSearch}
                    disabled={searching}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
                >
                    {searching ? 'Searching...' : 'Search'}
                </button>
                <button
                    onClick={() => {
                        setSearchQuery('');
                        setSearchResults([]);
                    }}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                >
                    Clear
                </button>
            </div>

            {/* Search Results */}
            {searchResults.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <FiSearch className="mx-auto text-gray-300 text-5xl mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                        {searchQuery ? 'No Results Found' : 'Start Searching'}
                    </h3>
                    <p className="text-gray-500">
                        {searchQuery
                            ? 'Try different keywords'
                            : 'Enter a keyword to search for startups'
                        }
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {searchResults.map((startup, idx) => (
                        <div key={startup.startupId || idx} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md p-6">
                            <div className="flex flex-wrap justify-between items-start gap-4">
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-semibold text-gray-800">
                                        {startup.title}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                        <span className="text-sm text-gray-500">{startup.domain}</span>
                                        <span className="text-sm text-gray-300">•</span>
                                        <span className="text-sm text-gray-500">{startup.stage}</span>
                                        <span className="text-sm text-gray-300">•</span>
                                        <span className="text-sm text-gray-500">
                                            ₹{startup.fundingAmount?.toLocaleString()}
                                        </span>
                                    </div>
                                    {startup.aiSummary && (
                                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                            {startup.aiSummary}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleRequestAccess(startup.startupId)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition"
                                >
                                    <FiMail /> Request Access
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderRequests = () => (
        <div className="space-y-4">
            {requests.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <FiMail className="mx-auto text-gray-300 text-5xl mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No Requests</h3>
                    <p className="text-gray-500">No pending mentorship requests</p>
                </div>
            ) : (
                requests.map((req, idx) => (
                    <div key={req.requestId || idx} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition p-6">
                        <div className="flex flex-wrap justify-between items-start gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                                        {req.founderName?.charAt(0) || 'F'}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800">
                                            {req.founderName}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {req.startupTitle}
                                        </p>
                                    </div>
                                </div>
                                {req.message && (
                                    <p className="text-sm text-gray-600 mt-2 italic">
                                        "{req.message}"
                                    </p>
                                )}
                                <div className="mt-2">
                                    {getRequestStatusBadge(req.status)}
                                </div>
                            </div>
                            {req.status === 'PENDING' && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleRespondToRequest(req.requestId, true)}
                                        disabled={processing[req.requestId]}
                                        className="flex items-center gap-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
                                    >
                                        {processing[req.requestId] ? (
                                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                        ) : (
                                            <><FiCheck /> Accept</>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleRespondToRequest(req.requestId, false)}
                                        disabled={processing[req.requestId]}
                                        className="flex items-center gap-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
                                    >
                                        <FiX /> Decline
                                    </button>
                                </div>
                            )}
                            {req.status === 'ACCEPTED' && !req.permissionGranted && (
                                <span className="text-sm text-yellow-600 bg-yellow-50 px-3 py-1.5 rounded-lg">
                                    Waiting for founder to grant access...
                                </span>
                            )}
                            {req.permissionGranted && (
                                <button
                                    onClick={() => handleViewProposal(req.startupId)}
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

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                        <FiUsers className="text-blue-600" />
                        Mentor Dashboard
                    </h1>
                    <p className="text-gray-600">Guide startups and support founders</p>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <p className="text-sm text-gray-500">Assigned Startups</p>
                    <p className="text-2xl font-bold text-blue-600">{assignedStartups.length}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <p className="text-sm text-gray-500">Pending Requests</p>
                    <p className="text-2xl font-bold text-yellow-600">
                        {requests.filter(r => r.status === 'PENDING').length}
                    </p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <p className="text-sm text-gray-500">Access Granted</p>
                    <p className="text-2xl font-bold text-green-600">
                        {assignedStartups.filter(s => s.permissionGranted).length}
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('assigned')}
                    className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition ${
                        activeTab === 'assigned'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <FiAward className="inline mr-2" /> Assigned ({assignedStartups.length})
                </button>
                <button
                    onClick={() => setActiveTab('search')}
                    className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition ${
                        activeTab === 'search'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <FiSearch className="inline mr-2" /> Search Startups
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
                    onClick={() => setActiveTab('escrow')}
                    className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition ${
                        activeTab === 'escrow'
                            ? 'text-green-600 border-b-2 border-green-600'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <FiBriefcase className="inline mr-2" /> Milestones
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
                    {activeTab === 'assigned' && renderAssigned()}
                    {activeTab === 'search' && renderSearch()}
                    {activeTab === 'requests' && renderRequests()}
                    {activeTab === 'escrow' && (
                        <MentorEscrowDashboard 
                            mentorId={userId} 
                            startups={assignedStartups}
                        />
                    )}
                </>
            )}
        </div>
    );
};

export default MentorDashboard;