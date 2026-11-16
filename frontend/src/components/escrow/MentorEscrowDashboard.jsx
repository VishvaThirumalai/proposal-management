import React, { useState, useEffect } from 'react';
import { FiAward, FiRefreshCw } from 'react-icons/fi';
import { escrowService } from '../../services/escrowService';
import EscrowDetails from './EscrowDetails';

const MentorEscrowDashboard = ({ mentorId, startups }) => {
    const [escrows, setEscrows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedEscrow, setSelectedEscrow] = useState(null);

    const loadEscrows = async () => {
        setLoading(true);
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
                    console.warn(e);
                }
            }
            setEscrows(allEscrows);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadEscrows();
    }, [startups]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FiAward className="text-purple-600" />
                        Milestones Awaiting My Approval
                    </h2>
                    <p className="text-sm text-gray-500">
                        Approve milestone proofs as a mentor
                    </p>
                </div>
                <button
                    onClick={() => {
                        setRefreshing(true);
                        loadEscrows();
                    }}
                    disabled={refreshing}
                    className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg"
                >
                    <FiRefreshCw className={refreshing ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
            ) : escrows.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <FiAward className="mx-auto text-gray-300 text-5xl mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                        No Escrows to Approve
                    </h3>
                    <p className="text-gray-500">
                        You'll see milestone approvals here once a founder grants you access.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {escrows.map((escrow, idx) => (
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
                                    <p className="text-sm text-gray-500">
                                        Review milestone proofs
                                    </p>
                                </div>
                                <span className="text-sm text-purple-600 font-medium">
                                    Click to review →
                                </span>
                            </div>
                        </div>
                    ))}
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
                            currentUserRole="MENTOR"
                            currentUserId={mentorId}
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

export default MentorEscrowDashboard;