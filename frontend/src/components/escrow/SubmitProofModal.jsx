import React, { useState } from 'react';
import { escrowService } from '../../services/escrowService';
import { FiUpload, FiX, FiCheck } from 'react-icons/fi';

const SubmitProofModal = ({ escrowId, milestone, onClose, onSuccess }) => {
    const [file, setFile] = useState(null);
    const [notes, setNotes] = useState('');
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.size > 50 * 1024 * 1024) {
                setError('File must be less than 50MB');
                return;
            }
            setFile(selectedFile);
            setError('');
        }
    };

    const handleSubmit = async () => {
        if (!file) {
            setError('Please select a proof file');
            return;
        }

        setUploading(true);
        setError('');

        try {
            await escrowService.submitMilestoneProof(
                escrowId,
                milestone.milestoneId,
                file,
                notes
            );
            setSuccess(true);
            setTimeout(() => {
                onSuccess();
            }, 2000);
        } catch (err) {
            setError('Failed to submit: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
                {success ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FiCheck className="text-green-600 text-3xl" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Proof Submitted!</h3>
                        <p className="text-gray-600">
                            Approvers will review and approve your milestone.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-800">
                                Submit Milestone Proof
                            </h3>
                            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                                <FiX size={24} />
                            </button>
                        </div>

                        <div className="mb-4">
                            <p className="text-sm text-gray-600">Milestone:</p>
                            <p className="font-semibold">{milestone.milestoneId}</p>
                            <p className="text-sm text-gray-500">{milestone.description}</p>
                            <p className="text-sm text-green-600 font-medium mt-1">
                                Amount: ₹{(milestone.amount || 0).toLocaleString()}
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-700 text-sm">
                                {error}
                            </div>
                        )}

                        {/* File Upload */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Proof Document *
                            </label>
                            <div className="relative">
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip"
                                />
                                <div className={`border-2 border-dashed rounded-xl p-6 text-center transition ${
                                    file ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400'
                                }`}>
                                    {file ? (
                                        <div>
                                            <FiCheck className="text-green-500 text-2xl mx-auto mb-2" />
                                            <p className="font-medium text-gray-700">{file.name}</p>
                                            <p className="text-sm text-gray-500">
                                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>
                                    ) : (
                                        <div>
                                            <FiUpload className="mx-auto text-gray-400 text-3xl mb-2" />
                                            <p className="text-gray-600">Click to upload proof</p>
                                            <p className="text-sm text-gray-400">
                                                PDF, DOC, Images, ZIP (max 50MB)
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Notes (Optional)
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                rows={3}
                                placeholder="Describe what you completed..."
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={uploading || !file}
                                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition disabled:opacity-50"
                            >
                                {uploading ? 'Uploading...' : 'Submit Proof'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default SubmitProofModal;