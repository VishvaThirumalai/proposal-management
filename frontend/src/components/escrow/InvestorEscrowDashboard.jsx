import React, { useState, useEffect } from 'react';
import { FiDollarSign, FiRefreshCw, FiPlus } from 'react-icons/fi';
import { escrowService } from '../../services/escrowService';
import CreateEscrowModal from './CreateEscrowModal';
import EscrowDetails from './EscrowDetails';

const InvestorEscrowDashboard = ({ investorId, startups }) => {
    const [escrows, setEscrows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedStartup, setSelectedStartup] = useState(null);
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

    const handleEscrowCreated = () => {
        loadEscrows();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FiDollarSign className="text-green-600" />
                        My Escrows
                    </h2>
                    <p className="text-sm text-gray-500">
                        Manage milestone-based funding
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition"
                    >
                        <FiRefreshCw className={refreshing ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Escrow List */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    <p className="text-gray-600 mt-2">Loading escrows...</p>
                </div>
            ) : escrows.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <FiDollarSign className="mx-auto text-gray-300 text-5xl mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                        No Escrows Yet
                    </h3>
                    <p className="text-gray-500 mb-6">
                        Create a milestone escrow to fund a startup securely.
                    </p>

                    {startups && startups.length > 0 && (
                        <div className="inline-block text-left">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Startup:
                            </label>
                            <div className="space-y-2">
                                {startups.map((s) => (
                                    <button
                                        key={s.id || s.startupId}
                                        onClick={() => {
                                            setSelectedStartup(s);
                                            setShowCreateModal(true);
                                        }}
                                        className="block w-full text-left px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition"
                                    >
                                        <FiPlus className="inline mr-2" />
                                        Create Escrow for: {s.title}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid gap-4">
                    {escrows.map((escrow, idx) => (
                        <div
                            key={escrow.escrowId || idx}
                            className="cursor-pointer"
                            onClick={() => setSelectedEscrow(escrow)}
                        >
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md p-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-gray-800">
                                            {escrow.escrowId}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Startup ID: {escrow.startupId}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-green-600">
                                            ₹{escrow.releasedAmount?.toLocaleString() || 0}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            of ₹{escrow.totalAmount?.toLocaleString() || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Escrow Modal */}
            {showCreateModal && selectedStartup && (
                <CreateEscrowModal
                    startup={selectedStartup}
                    investorId={investorId}
                    founderId={selectedStartup.founderId || 1}
                    onClose={() => {
                        setShowCreateModal(false);
                        setSelectedStartup(null);
                    }}
                    onSuccess={handleEscrowCreated}
                />
            )}

            {/* Escrow Details Modal */}
            {selectedEscrow && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="max-w-4xl w-full">
                        <button
                            onClick={() => setSelectedEscrow(null)}
                            className="mb-2 text-white bg-gray-800 hover:bg-gray-900 px-4 py-2 rounded-lg"
                        >
                            ← Back to List
                        </button>
                        <EscrowDetails
                            escrow={selectedEscrow}
                            currentUserRole="INVESTOR"
                            currentUserId={investorId}
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

export default InvestorEscrowDashboard;