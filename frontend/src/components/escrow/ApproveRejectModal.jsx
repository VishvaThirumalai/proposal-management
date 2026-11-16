import React, { useState } from 'react';
import { escrowService } from '../../services/escrowService';
import { FiCheck, FiX, FiThumbsUp, FiThumbsDown } from 'react-icons/fi';

const ApproveRejectModal = ({ escrowId, milestone, onClose, onSuccess }) => {
    const [action, setAction] = useState(null); // 'approve' or 'reject'
    const [reason, setReason] = useState('');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');

    const handleApprove = async () => {
        setProcessing(true);
        setError('');
        try {
            await escrowService.approveMilestone(escrowId, milestone.milestoneId);
            onSuccess();
        } catch (err) {
            setError('Failed to approve: ' + err.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!reason.trim()) {
            setError('Please provide a rejection reason');
            return;
        }
        setProcessing(true);
        setError('');
        try {
            await escrowService.rejectMilestone(escrowId, milestone.milestoneId, reason);
            onSuccess();
        } catch (err) {
            setError('Failed to reject: ' + err.message);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">
                        Review Milestone Proof
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <FiX size={24} />
                    </button>
                </div>

                {/* Milestone Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold">{milestone.milestoneId}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                    <p className="text-sm text-gray-500 mt-1">
                        Amount: ₹{(milestone.amount || 0).toLocaleString()}
                    </p>
                    {milestone.proofCid && (
                        <div className="mt-2">
                            <a
                                href={`https://ipfs.io/ipfs/${milestone.proofCid}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-800"
                            >
                                📎 View Submitted Proof
                            </a>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-700 text-sm">
                        {error}
                    </div>
                )}

                {!action && (
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setAction('approve')}
                            className="flex flex-col items-center gap-2 p-4 bg-green-50 hover:bg-green-100 border-2 border-green-200 rounded-lg transition"
                        >
                            <FiThumbsUp className="text-green-600 text-3xl" />
                            <span className="font-semibold text-green-700">Approve</span>
                            <span className="text-xs text-gray-500">Release funds</span>
                        </button>
                        <button
                            onClick={() => setAction('reject')}
                            className="flex flex-col items-center gap-2 p-4 bg-red-50 hover:bg-red-100 border-2 border-red-200 rounded-lg transition"
                        >
                            <FiThumbsDown className="text-red-600 text-3xl" />
                            <span className="font-semibold text-red-700">Reject</span>
                            <span className="text-xs text-gray-500">Ask for changes</span>
                        </button>
                    </div>
                )}

                {action === 'approve' && (
                    <div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                            <p className="text-sm text-green-800">
                                ✅ Confirming approval will release ₹{(milestone.amount || 0).toLocaleString()} to the founder.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setAction(null)}
                                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleApprove}
                                disabled={processing}
                                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg disabled:opacity-50"
                            >
                                {processing ? 'Approving...' : 'Confirm Approval'}
                            </button>
                        </div>
                    </div>
                )}

                {action === 'reject' && (
                    <div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Rejection Reason *
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                                rows={4}
                                placeholder="Explain what needs to be fixed..."
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setAction(null)}
                                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={processing}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg disabled:opacity-50"
                            >
                                {processing ? 'Rejecting...' : 'Confirm Rejection'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ApproveRejectModal;