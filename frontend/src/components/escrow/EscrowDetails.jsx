import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { escrowService } from '../../services/escrowService';
import SubmitProofModal from './SubmitProofModal';
import ApproveRejectModal from './ApproveRejectModal';
import { 
    FiDollarSign, FiCalendar, FiCheckCircle, FiClock, 
    FiXCircle, FiArrowLeft, FiUpload, FiUserCheck 
} from 'react-icons/fi';

const EscrowDetails = () => {
    const { escrowId } = useParams();
    const navigate = useNavigate();
    const { getUserRole } = useAuth();
    const role = getUserRole();

    const [escrow, setEscrow] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedMilestone, setSelectedMilestone] = useState(null);
    const [showProofModal, setShowProofModal] = useState(false);
    const [showApproveModal, setShowApproveModal] = useState(false);

    const loadEscrow = async () => {
    setLoading(true);
    setError('');
    try {
        const data = await escrowService.getEscrow(escrowId);
        console.log('📊 Escrow data received:', data);
        
        if (!data) {
            setError('Escrow not found');
            return;
        }

        // Parse if response is a string
        let escrowData = data;
        if (typeof data === 'string') {
            try {
                escrowData = JSON.parse(data);
            } catch (parseErr) {
                console.error('❌ JSON parse failed:', parseErr);
                setError('Invalid escrow data format');
                return;
            }
        }
        
        setEscrow(escrowData);
    } catch (err) {
        console.error('❌ Failed to load escrow:', err);
        setError('Failed to load escrow: ' + err.message);
    } finally {
        setLoading(false);
    }
};
    useEffect(() => {
        loadEscrow();
    }, [escrowId]);

    const handleSubmitProof = (milestone) => {
        setSelectedMilestone(milestone);
        setShowProofModal(true);
    };

    const handleApproveReject = (milestone) => {
        setSelectedMilestone(milestone);
        setShowApproveModal(true);
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto p-6 text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-gray-600 mt-2">Loading escrow details...</p>
            </div>
        );
    }

    if (error || !escrow) {
        return (
            <div className="max-w-7xl mx-auto p-6">
                <button
                    onClick={() => navigate('/escrow')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
                >
                    <FiArrowLeft /> Back to Escrows
                </button>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
                    {error || 'Escrow not found'}
                </div>
            </div>
        );
    }

    const releasedAmount = escrow.milestones
        ?.filter(m => m.status === 'FUNDS_RELEASED')
        .reduce((sum, m) => sum + (m.amount || 0), 0) || 0;

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Back Button */}
            <button
                onClick={() => navigate('/escrow')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
            >
                <FiArrowLeft /> Back to Escrows
            </button>

            {/* Header */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            Escrow {escrow.escrowId}
                        </h1>
                        <p className="text-gray-600">
                            Startup: {escrow.startupTitle || `ID ${escrow.startupId}`}
                        </p>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                        escrow.status === 'COMPLETED' ? 'bg-green-50 text-green-700' :
                        escrow.status === 'FUNDS_LOCKED' ? 'bg-yellow-50 text-yellow-700' :
                        'bg-blue-50 text-blue-700'
                    }`}>
                        {escrow.status}
                    </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-500">Total</p>
                        <p className="text-2xl font-bold text-gray-800">
                            ₹{(escrow.totalAmount || 0).toLocaleString()}
                        </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-500">Released</p>
                        <p className="text-2xl font-bold text-green-600">
                            ₹{releasedAmount.toLocaleString()}
                        </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-500">Remaining</p>
                        <p className="text-2xl font-bold text-orange-600">
                            ₹{((escrow.totalAmount || 0) - releasedAmount).toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>

            {/* Milestones */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                    Milestones ({escrow.milestones?.length || 0})
                </h2>

                <div className="space-y-4">
                    {escrow.milestones?.map((milestone, idx) => (
                        <MilestoneCard
                            key={milestone.milestoneId || idx}
                            milestone={milestone}
                            escrowId={escrow.escrowId}
                            userRole={role}
                            onRefresh={loadEscrow}
                            onSubmitProof={handleSubmitProof}
                            onApproveReject={handleApproveReject}
                        />
                    ))}
                </div>
            </div>

            {/* Modals */}
            {showProofModal && selectedMilestone && (
                <SubmitProofModal
                    escrowId={escrow.escrowId}
                    milestone={selectedMilestone}
                    onClose={() => {
                        setShowProofModal(false);
                        setSelectedMilestone(null);
                    }}
                    onSuccess={() => {
                        setShowProofModal(false);
                        setSelectedMilestone(null);
                        loadEscrow();
                    }}
                />
            )}

            {showApproveModal && selectedMilestone && (
                <ApproveRejectModal
                    escrowId={escrow.escrowId}
                    milestone={selectedMilestone}
                    onClose={() => {
                        setShowApproveModal(false);
                        setSelectedMilestone(null);
                    }}
                    onSuccess={() => {
                        setShowApproveModal(false);
                        setSelectedMilestone(null);
                        loadEscrow();
                    }}
                />
            )}
        </div>
    );
};

// ================================================================
// MILESTONE CARD
// ================================================================
const MilestoneCard = ({ milestone, escrowId, userRole, onRefresh, onSubmitProof, onApproveReject }) => {
    const getStatusBadge = (status) => {
        switch (status) {
            case 'PENDING':
                return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700">⏳ Pending</span>;
            case 'PROOF_SUBMITTED':
                return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">📤 Proof Submitted</span>;
            case 'APPROVED':
                return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">✅ Approved</span>;
            case 'REJECTED':
                return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">❌ Rejected</span>;
            case 'FUNDS_RELEASED':
                return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 font-semibold">💸 Funds Released</span>;
            default:
                return <span className="text-xs text-gray-500">{status}</span>;
        }
    };

    return (
        <div className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition">
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-800">
                            {milestone.milestoneId}
                        </h3>
                        {getStatusBadge(milestone.status)}
                    </div>
                    <p className="text-gray-600 mt-1">{milestone.description}</p>
                    
                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                            <FiDollarSign /> ₹{(milestone.amount || 0).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                            <FiCalendar /> Due: {milestone.dueDate || 'N/A'}
                        </span>
                    </div>

                    {milestone.proofCid && (
                        <div className="mt-2 text-xs text-gray-500">
                            📎 Proof: {milestone.proofCid.substring(0, 30)}...
                        </div>
                    )}

                    {milestone.approvals && milestone.approvals.length > 0 && (
                        <div className="mt-2 text-xs text-green-600">
                            ✅ Approved by: {milestone.approvals.join(', ')}
                        </div>
                    )}

                    {milestone.rejectReason && (
                        <div className="mt-2 text-xs text-red-600">
                            ❌ Rejected: {milestone.rejectReason}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 ml-4">
                    {/* Founder can submit proof */}
                    {userRole === 'FOUNDER' && 
                     (milestone.status === 'PENDING' || milestone.status === 'REJECTED') && (
                        <button
                            onClick={() => onSubmitProof(milestone)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
                        >
                            <FiUpload /> Submit Proof
                        </button>
                    )}

                    {/* Investor/Mentor can approve */}
                    {(userRole === 'INVESTOR' || userRole === 'MENTOR') && 
                     milestone.status === 'PROOF_SUBMITTED' && (
                        <button
                            onClick={() => onApproveReject(milestone)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition"
                        >
                            <FiUserCheck /> Review
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EscrowDetails;