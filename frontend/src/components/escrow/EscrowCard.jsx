import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FiDollarSign, FiCalendar, FiCheckCircle, FiClock, 
    FiXCircle, FiChevronRight 
} from 'react-icons/fi';

const EscrowCard = ({ escrow, userRole, onUpdate }) => {
    const navigate = useNavigate();
    const [expanded, setExpanded] = useState(false);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'FUNDS_LOCKED':
                return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700">🔒 Funds Locked</span>;
            case 'PARTIAL_RELEASED':
                return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">💰 Partial Released</span>;
            case 'COMPLETED':
                return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">✅ Completed</span>;
            case 'DISPUTED':
                return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">⚠️ Disputed</span>;
            default:
                return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700">{status}</span>;
        }
    };

    const getMilestoneStatus = (status) => {
        switch (status) {
            case 'PENDING':
                return <span className="text-xs text-gray-500">⏳ Pending</span>;
            case 'PROOF_SUBMITTED':
                return <span className="text-xs text-blue-600">📤 Proof Submitted</span>;
            case 'APPROVED':
                return <span className="text-xs text-green-600">✅ Approved</span>;
            case 'REJECTED':
                return <span className="text-xs text-red-600">❌ Rejected</span>;
            case 'FUNDS_RELEASED':
                return <span className="text-xs text-green-700 font-semibold">💸 Funds Released</span>;
            default:
                return <span className="text-xs text-gray-500">{status}</span>;
        }
    };

    // Calculate progress
    const releasedMilestones = escrow.milestones?.filter(m => m.status === 'FUNDS_RELEASED').length || 0;
    const totalMilestones = escrow.milestones?.length || 0;
    const progress = totalMilestones > 0 ? (releasedMilestones / totalMilestones) * 100 : 0;
    const releasedAmount = escrow.milestones
        ?.filter(m => m.status === 'FUNDS_RELEASED')
        .reduce((sum, m) => sum + (m.amount || 0), 0) || 0;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
            {/* Header */}
            <div 
                className="p-6 cursor-pointer"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-800">
                                Escrow {escrow.escrowId}
                            </h3>
                            {getStatusBadge(escrow.status)}
                        </div>
                        <p className="text-sm text-gray-500">
                            Startup: {escrow.startupTitle || `ID ${escrow.startupId}`}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-4 mt-3">
                            <div>
                                <p className="text-xs text-gray-500">Total Amount</p>
                                <p className="text-lg font-bold text-gray-800">
                                    ₹{(escrow.totalAmount || 0).toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Released</p>
                                <p className="text-lg font-bold text-green-600">
                                    ₹{releasedAmount.toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Remaining</p>
                                <p className="text-lg font-bold text-orange-600">
                                    ₹{((escrow.totalAmount || 0) - releasedAmount).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-3">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>Progress: {releasedMilestones}/{totalMilestones} milestones</span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className="bg-green-500 h-2 rounded-full transition-all"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    <FiChevronRight 
                        className={`text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
                        size={24}
                    />
                </div>
            </div>

            {/* Expanded - Milestones */}
            {expanded && (
                <div className="border-t border-gray-100 p-6 bg-gray-50">
                    <h4 className="font-semibold text-gray-700 mb-3">Milestones</h4>
                    <div className="space-y-3">
                        {escrow.milestones?.map((milestone, idx) => (
                            <div 
                                key={milestone.milestoneId || idx}
                                className="bg-white rounded-lg border border-gray-200 p-4"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-gray-800">
                                                {milestone.milestoneId}
                                            </span>
                                            {getMilestoneStatus(milestone.status)}
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {milestone.description}
                                        </p>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <FiDollarSign /> ₹{(milestone.amount || 0).toLocaleString()}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <FiCalendar /> {milestone.dueDate || 'No due date'}
                                            </span>
                                        </div>
                                        {milestone.proofCid && (
                                            <p className="text-xs text-gray-400 mt-1">
                                                Proof: {milestone.proofCid.substring(0, 20)}...
                                            </p>
                                        )}
                                        {milestone.rejectReason && (
                                            <p className="text-xs text-red-500 mt-1">
                                                Rejection: {milestone.rejectReason}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Action Button */}
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={() => navigate(`/escrow/${escrow.escrowId}`)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
                        >
                            View Details <FiChevronRight />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EscrowCard;