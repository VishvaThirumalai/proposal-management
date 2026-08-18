import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mentorService } from '../../services/mentorService';
import { FiSearch, FiEye, FiMessageSquare, FiClock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

const SearchStartups = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [proposals, setProposals] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        loadAllProposals();
    }, []);

    const loadAllProposals = async () => {
        setLoading(true);
        try {
            const data = await mentorService.getProposals();
            setProposals(Array.isArray(data) ? data : []);
        } catch (err) {
            setError('Failed to load proposals: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            await loadAllProposals();
            return;
        }
        setLoading(true);
        try {
            const results = await mentorService.searchProposals(searchQuery);
            setProposals(Array.isArray(results) ? results : []);
        } catch (err) {
            setError('Search failed: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestAccess = async (proposalId) => {
        const message = prompt('Enter a message for the founder:');
        if (message === null) return;
        
        try {
            await mentorService.requestAccess(proposalId, message);
            setSuccess('Access request sent successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Failed to request access: ' + err.message);
        }
    };

    const handleViewProposal = (proposalId) => {
        navigate(`/mentor/proposal/${proposalId}`);
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'INDEXED':
                return <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2.5 py-1 rounded-full text-xs font-medium"><FiCheckCircle /> Available</span>;
            case 'ASSIGNED':
                return <span className="inline-flex items-center gap-1 text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full text-xs font-medium"><FiClock /> Assigned</span>;
            default:
                return <span className="text-xs text-gray-500">{status}</span>;
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">🔍 Search Startups</h1>
            
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
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                    Search
                </button>
                <button
                    onClick={loadAllProposals}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                >
                    Clear
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

            {/* Results */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-gray-600 mt-2">Loading...</p>
                </div>
            ) : proposals.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <p className="text-gray-500">No proposals found</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {proposals.map((proposal) => (
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
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => handleViewProposal(proposal.startupId)}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm font-medium rounded-lg transition"
                                    >
                                        <FiEye /> View
                                    </button>
                                    <button
                                        onClick={() => handleRequestAccess(proposal.startupId)}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-600 text-sm font-medium rounded-lg transition"
                                    >
                                        <FiMessageSquare /> Request Access
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SearchStartups;