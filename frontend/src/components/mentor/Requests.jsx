import React, { useState, useEffect } from 'react';
import { mentorService } from '../../services/mentorService';
import { FiClock, FiCheckCircle, FiXCircle, FiUser, FiMail, FiRefreshCw } from 'react-icons/fi';

const MentorRequests = () => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [requests, setRequests] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [processing, setProcessing] = useState({});

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await mentorService.getRequests();
            console.log('📋 Requests data:', data);
            setRequests(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('❌ Failed to load requests:', err);
            setError('Failed to load requests: ' + err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadRequests();
    };

    const handleRespond = async (requestId, accept) => {
        setProcessing(prev => ({ ...prev, [requestId]: true }));
        try {
            await mentorService.respondToRequest(requestId, accept);
            setSuccess(`Request ${accept ? 'accepted' : 'rejected'} successfully!`);
            setTimeout(() => setSuccess(''), 3000);
            await loadRequests();
        } catch (err) {
            setError('Failed to respond: ' + err.message);
        } finally {
            setProcessing(prev => ({ ...prev, [requestId]: false }));
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'PENDING':
                return <span className="inline-flex items-center gap-1 text-yellow-600 bg-yellow-50 px-2.5 py-1 rounded-full text-xs font-medium"><FiClock /> Pending</span>;
            case 'ACCEPTED':
                return <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2.5 py-1 rounded-full text-xs font-medium"><FiCheckCircle /> Accepted</span>;
            case 'REJECTED':
                return <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2.5 py-1 rounded-full text-xs font-medium"><FiXCircle /> Rejected</span>;
            default:
                return <span className="text-xs text-gray-500">{status}</span>;
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <h1 className="text-2xl font-bold text-gray-800">📩 Mentorship Requests</h1>
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
                    <span className="font-bold text-yellow-600">{requests.filter(r => r.status === 'PENDING').length}</span> pending request(s)
                </p>
            </div>

            {/* Requests List */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-gray-600 mt-2">Loading...</p>
                </div>
            ) : requests.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <FiMail className="mx-auto text-gray-300 text-5xl mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No Requests</h3>
                    <p className="text-gray-500">No pending mentorship requests</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {requests.map((request) => (
                        <div key={request.requestId} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition p-6">
                            <div className="flex flex-wrap justify-between items-start gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                                            {request.founder?.name?.charAt(0) || 'F'}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800">{request.founder?.name || 'Unknown'}</h3>
                                            <p className="text-sm text-gray-500">{request.startup?.title || 'Unknown Startup'}</p>
                                            <p className="text-xs text-gray-400">{request.founder?.email}</p>
                                        </div>
                                    </div>
                                    {request.message && (
                                        <p className="text-sm text-gray-600 mt-2 italic bg-gray-50 p-3 rounded-lg">"{request.message}"</p>
                                    )}
                                    <div className="mt-3">
                                        {getStatusBadge(request.status)}
                                    </div>
                                </div>
                                {request.status === 'PENDING' && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleRespond(request.requestId, true)}
                                            disabled={processing[request.requestId]}
                                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
                                        >
                                            {processing[request.requestId] ? (
                                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                            ) : (
                                                <FiCheckCircle />
                                            )}
                                            Accept
                                        </button>
                                        <button
                                            onClick={() => handleRespond(request.requestId, false)}
                                            disabled={processing[request.requestId]}
                                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
                                        >
                                            <FiXCircle />
                                            Decline
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MentorRequests;