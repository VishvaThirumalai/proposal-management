import React, { useState, useEffect } from 'react';
import { FiDollarSign, FiRefreshCw, FiTarget } from 'react-icons/fi';
import { escrowService } from '../../services/escrowService';
import EscrowDetails from './EscrowDetails';

const FounderEscrowDashboard = ({ founderId, startups }) => {
    const [escrows, setEscrows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedEscrow, setSelectedEscrow] = useState(null);
    const [error, setError] = useState('');

    const loadEscrows = async () => {
        setLoading(true);
        setError('');
        try {
            const allEscrows = [];
            for (const startup of startups || []) {
                try {
                    const startupEscrows = await escrowService.getEscrowsByStartup(
                        startup.id || startup.startupId
                    );
                    let parsed = startupEscrows;
                    if (typeof startupEscrows === 'string') {
                        parsed = JSON.parse(startupEscrows || '[]');
                    }
                    allEscrows.push(...(parsed || []));
                } catch (e) {
                    console.warn('Failed for startup:', startup.id, e.message);
                }
            }
            setEscrows(allEscrows);
        } catch (err) {
            setError('Failed to load escrows: ' + err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadEscrows();
    }, [startups]);

    const handleRefresh = () => {
        setRefreshing(true);
        loadEscrows();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FiTarget className="text-blue-600" />
                        My Milestone Escrows
                    </h2>
                    <p className="text-sm text-gray-500">
                        Complete milestones to unlock funding
                    </p>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition"
                >
                    <FiRefreshCw className={refreshing ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-gray-600 mt-2">Loading escrows...</p>
                </div>
            ) : escrows.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <FiDollarSign className="mx-auto text-gray-300 text-5xl mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                        No Escrows Yet
                    </h3>
                    <p className="text-gray-500">
                        When investors fund your startup, the milestones will appear here.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {escrows.map((escrow, idx) => {
                        const totalMilestones = escrow.milestones?.length || 0;
                        const approvedMilestones = escrow.milestones?.filter(
                            m => m.status === 'APPROVED' || m.status === 'RELEASED'
                        ).length || 0;

                        return (
                            <div
                                key={escrow.escrowId || idx}
                                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md p-5 cursor-pointer"
                                onClick={() => setSelectedEscrow(escrow)}
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-gray-800">
                                            {escrow.escrowId}
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Investor ID: {escrow.investorId}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            ✅ {approvedMilestones}/{totalMilestones} milestones approved
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-bold text-green-600">
                                            ₹{escrow.releasedAmount?.toLocaleString() || 0}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            of ₹{escrow.totalAmount?.toLocaleString() || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {selectedEscrow && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="max-w-4xl w-full">
                        <button
                            onClick={() => setSelectedEscrow(null)}
                            className="mb-2 text-white bg-gray-800 hover:bg-gray-900 px-4 py-2 rounded-lg"
                        >
                            ← Back
                        </button>
                        <EscrowDetails
                            escrow={selectedEscrow}
                            currentUserRole="FOUNDER"
                            currentUserId={founderId}
                            onRefresh={() => {
                                loadEscrows();
                                setSelectedEscrow(null);
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default FounderEscrowDashboard;