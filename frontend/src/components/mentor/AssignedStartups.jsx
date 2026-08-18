import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mentorService } from '../../services/mentorService';
import { FiEye, FiUsers, FiClock, FiCheckCircle } from 'react-icons/fi';

const AssignedStartups = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [assigned, setAssigned] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        loadAssigned();
    }, []);

    const loadAssigned = async () => {
        setLoading(true);
        try {
            const data = await mentorService.getAssignedProposals();
            setAssigned(Array.isArray(data) ? data : []);
        } catch (err) {
            setError('Failed to load assigned proposals: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleViewProposal = (proposalId) => {
        navigate(`/mentor/proposal/${proposalId}`);
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">📋 Assigned Startups</h1>
            
            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-gray-600 mt-2">Loading...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">{error}</div>
            ) : assigned.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <FiUsers className="mx-auto text-gray-300 text-5xl mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No Assigned Startups</h3>
                    <p className="text-gray-500">You haven't been assigned to any startups yet</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {assigned.map((proposal) => (
                        <div key={proposal.startupId} className="bg-white rounded-xl shadow-sm border border-blue-200 hover:shadow-md transition p-6">
                            <div className="flex flex-wrap justify-between items-start gap-4">
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-semibold text-gray-800">{proposal.title}</h3>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                        <span className="text-sm text-gray-500">{proposal.domain}</span>
                                        <span className="text-sm text-gray-300">•</span>
                                        <span className="text-sm text-gray-500">{proposal.stage}</span>
                                        <span className="text-sm text-gray-300">•</span>
                                        <span className="text-sm text-blue-600 font-medium">Assigned to you</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <span className="inline-flex items-center gap-1 text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full text-xs font-medium">
                                            <FiCheckCircle /> Active
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
                    ))}
                </div>
            )}
        </div>
    );
};

export default AssignedStartups;