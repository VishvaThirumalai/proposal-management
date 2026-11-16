import React, { useState } from 'react';
import { FiX, FiPlus, FiTrash2, FiDollarSign } from 'react-icons/fi';
import { escrowService } from '../../services/escrowService';

const CreateEscrowModal = ({ startup, investorId, founderId, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [totalAmount, setTotalAmount] = useState('');
    const [milestones, setMilestones] = useState([
        { milestoneId: 'MS_001', description: '', amount: '', dueDate: '' }
    ]);
    const [approvers, setApprovers] = useState([investorId, 'MENTOR_12']);

    const addMilestone = () => {
        const newId = `MS_${String(milestones.length + 1).padStart(3, '0')}`;
        setMilestones([...milestones, { milestoneId: newId, description: '', amount: '', dueDate: '' }]);
    };

    const removeMilestone = (index) => {
        if (milestones.length === 1) return;
        const updated = milestones.filter((_, i) => i !== index);
        // Reassign IDs
        const reassigned = updated.map((m, i) => ({
            ...m,
            milestoneId: `MS_${String(i + 1).padStart(3, '0')}`,
        }));
        setMilestones(reassigned);
    };

    const updateMilestone = (index, field, value) => {
        const updated = [...milestones];
        updated[index][field] = value;
        setMilestones(updated);
    };

    const calculateTotalMilestones = () => {
        return milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validations
        if (!totalAmount || parseFloat(totalAmount) <= 0) {
            setError('Total amount must be greater than 0');
            return;
        }

        const totalMilestoneAmount = calculateTotalMilestones();
        if (Math.abs(totalMilestoneAmount - parseFloat(totalAmount)) > 0.01) {
            setError(`Milestone amounts (₹${totalMilestoneAmount}) don't match total (₹${totalAmount})`);
            return;
        }

        for (let i = 0; i < milestones.length; i++) {
            if (!milestones[i].description || !milestones[i].amount) {
                setError(`Milestone ${i + 1} is incomplete`);
                return;
            }
        }

        setLoading(true);

        try {
            const escrowData = {
                startupId: startup.id || startup.startupId,
                investorId: investorId,
                founderId: founderId,
                totalAmount: parseFloat(totalAmount),
                milestones: milestones.map(m => ({
                    milestoneId: m.milestoneId,
                    description: m.description,
                    amount: parseFloat(m.amount),
                    dueDate: m.dueDate,
                })),
                approvers: approvers,
            };

            const result = await escrowService.createEscrow(escrowData);
            onSuccess(result);
            onClose();
        } catch (err) {
            setError(err.response?.data || err.message || 'Failed to create escrow');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <FiDollarSign className="text-green-600" />
                            Create Milestone Escrow
                        </h2>
                        <p className="text-sm text-gray-500">For: {startup.title}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <FiX size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* Total Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Total Escrow Amount (₹) *
                        </label>
                        <input
                            type="number"
                            value={totalAmount}
                            onChange={(e) => setTotalAmount(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g., 5000000"
                            required
                        />
                    </div>

                    {/* Milestones */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <label className="block text-sm font-medium text-gray-700">
                                Milestones *
                            </label>
                            <button
                                type="button"
                                onClick={addMilestone}
                                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                            >
                                <FiPlus /> Add Milestone
                            </button>
                        </div>

                        <div className="space-y-3">
                            {milestones.map((milestone, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="font-medium text-gray-700">
                                            Milestone {index + 1} ({milestone.milestoneId})
                                        </span>
                                        {milestones.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeMilestone(index)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <FiTrash2 />
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-3">
                                        <div className="md:col-span-2">
                                            <input
                                                type="text"
                                                placeholder="Description (e.g., MVP Built)"
                                                value={milestone.description}
                                                onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <input
                                                type="number"
                                                placeholder="Amount (₹)"
                                                value={milestone.amount}
                                                onChange={(e) => updateMilestone(index, 'amount', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <input
                                                type="date"
                                                value={milestone.dueDate}
                                                onChange={(e) => updateMilestone(index, 'dueDate', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-3 text-sm text-gray-600">
                            Total Allocated: <strong>₹{calculateTotalMilestones().toLocaleString()}</strong>
                            {totalAmount && Math.abs(calculateTotalMilestones() - parseFloat(totalAmount)) > 0.01 && (
                                <span className="text-red-500 ml-2">
                                    (must match ₹{parseFloat(totalAmount).toLocaleString()})
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Approvers */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Approvers (must approve each milestone)
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {approvers.map((a, i) => (
                                <span key={i} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                                    {a}
                                </span>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            By default, Investor + Mentor will need to approve each milestone.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Lock Funds & Create Escrow'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateEscrowModal;