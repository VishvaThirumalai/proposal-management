import React, { useState } from 'react';
import { FiEdit, FiSave, FiX, FiCheck, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';

const AISummaryReview = ({ aiData, onApprove, onReject, onEdit, loading }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedData, setEditedData] = useState(aiData || {});
    const [error, setError] = useState('');

    const handleEdit = () => {
        setIsEditing(true);
        setEditedData({ ...aiData });
        setError('');
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditedData({ ...aiData });
        setError('');
    };

    const handleSaveEdit = () => {
        if (!editedData.summary || editedData.summary.trim().length < 10) {
            setError('Summary must be at least 10 characters');
            return;
        }
        onEdit(editedData);
        setIsEditing(false);
    };

    const handleFieldChange = (field, value) => {
        setEditedData(prev => ({ ...prev, [field]: value }));
        setError('');
    };

    if (!aiData) {
        return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                <FiAlertCircle className="mx-auto text-yellow-500 text-4xl mb-3" />
                <p className="text-yellow-700">No AI data available for review</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <FiEdit className="text-purple-600" />
                    AI Generated Summary
                </h3>
                <div className="flex gap-2">
                    {!isEditing && (
                        <button
                            onClick={handleEdit}
                            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition"
                        >
                            <FiEdit /> Edit
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-700 text-sm">
                    {error}
                </div>
            )}

            <div className="space-y-4">
                {/* Summary */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Summary *
                    </label>
                    {isEditing ? (
                        <textarea
                            value={editedData.summary || ''}
                            onChange={(e) => handleFieldChange('summary', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none min-h-[80px]"
                            placeholder="Enter proposal summary..."
                        />
                    ) : (
                        <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{aiData.summary || 'N/A'}</p>
                    )}
                </div>

                {/* Domain & Technology */}
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Domain
                        </label>
                        {isEditing ? (
                            <input
                                type="text"
                                value={editedData.domain || ''}
                                onChange={(e) => handleFieldChange('domain', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                placeholder="e.g., Technology"
                            />
                        ) : (
                            <p className="text-gray-700 bg-gray-50 p-2 rounded-lg">{aiData.domain || 'N/A'}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Technology Stack
                        </label>
                        {isEditing ? (
                            <input
                                type="text"
                                value={editedData.technologyStack || ''}
                                onChange={(e) => handleFieldChange('technologyStack', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                placeholder="e.g., AI, Cloud, IoT"
                            />
                        ) : (
                            <p className="text-gray-700 bg-gray-50 p-2 rounded-lg">{aiData.technologyStack || 'N/A'}</p>
                        )}
                    </div>
                </div>

                {/* Keywords & Tags */}
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Keywords (comma separated)
                        </label>
                        {isEditing ? (
                            <input
                                type="text"
                                value={editedData.keywords || ''}
                                onChange={(e) => handleFieldChange('keywords', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                placeholder="e.g., AI, Blockchain, IoT"
                            />
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {aiData.keywords?.split(',').map((kw, idx) => (
                                    <span key={idx} className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-medium">
                                        {kw.trim()}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tags (comma separated)
                        </label>
                        {isEditing ? (
                            <input
                                type="text"
                                value={editedData.tags || ''}
                                onChange={(e) => handleFieldChange('tags', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                placeholder="e.g., AI, SaaS, Startup"
                            />
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {aiData.tags?.split(',').map((tag, idx) => (
                                    <span key={idx} className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full text-xs font-medium">
                                        {tag.trim()}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Mentor Requirements */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mentor Requirements
                    </label>
                    {isEditing ? (
                        <input
                            type="text"
                            value={editedData.mentorRequirements || ''}
                            onChange={(e) => handleFieldChange('mentorRequirements', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="e.g., AI Expert, Startup Strategist"
                        />
                    ) : (
                        <p className="text-gray-700 bg-gray-50 p-2 rounded-lg">{aiData.mentorRequirements || 'N/A'}</p>
                    )}
                </div>

                {/* Investor Pitch */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Investor Pitch
                    </label>
                    {isEditing ? (
                        <textarea
                            value={editedData.investorPitch || ''}
                            onChange={(e) => handleFieldChange('investorPitch', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none min-h-[60px]"
                            placeholder="Pitch for investors..."
                        />
                    ) : (
                        <p className="text-gray-700 bg-gray-50 p-2 rounded-lg">{aiData.investorPitch || 'N/A'}</p>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            {isEditing ? (
                <div className="flex gap-3 mt-6">
                    <button
                        onClick={handleCancelEdit}
                        className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition"
                    >
                        <FiX className="inline mr-2" /> Cancel
                    </button>
                    <button
                        onClick={handleSaveEdit}
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
                    >
                        <FiSave className="inline mr-2" /> Save Changes
                    </button>
                </div>
            ) : (
                <div className="flex gap-3 mt-6">
                    <button
                        onClick={() => onReject(aiData)}
                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition"
                    >
                        <FiX className="inline mr-2" /> Reject
                    </button>
                    <button
                        onClick={() => onApprove(aiData)}
                        className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition"
                    >
                        <FiCheck className="inline mr-2" /> Approve
                    </button>
                </div>
            )}
        </div>
    );
};

export default AISummaryReview;