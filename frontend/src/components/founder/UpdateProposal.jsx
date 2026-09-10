import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { founderService } from '../../services/founderService';
import { FiSave, FiArrowLeft, FiCheck, FiEdit, FiInfo } from 'react-icons/fi';

const UpdateProposal = () => {
    const navigate = useNavigate();
    const { startupId } = useParams();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [proposal, setProposal] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        domain: '',
        stage: 'IDEA',
        fundingAmount: '',
        summary: '',
        keywords: '',
        technologyStack: '',
        mentorRequirements: '',
        investorPitch: '',
        problemStatement: '',
        solution: '',
        businessModel: ''
    });

    const stages = ['IDEA', 'MVP', 'PROTOTYPE', 'REVENUE'];
    const domains = [
        'Technology', 'Healthcare', 'Agriculture', 'FinTech', 
        'EdTech', 'AI', 'IoT', 'Sustainability', 'Energy', 
        'Transportation', 'E-commerce', 'Other'
    ];

    useEffect(() => {
        loadProposal();
    }, [startupId]);

    const loadProposal = async () => {
        try {
            const result = await founderService.getProposals();
            const found = result.proposals?.find(p => p.startupId === parseInt(startupId));
            if (found) {
                setProposal(found);
                setFormData({
                    title: found.title || '',
                    domain: found.domain || '',
                    stage: found.stage || 'IDEA',
                    fundingAmount: found.fundingAmount || '',
                    summary: found.aiSummary || '',
                    keywords: found.aiKeywords || '',
                    technologyStack: found.aiTechnologyStack || '',
                    mentorRequirements: found.aiMentorRequirements || '',
                    investorPitch: found.aiInvestorPitch || '',
                    problemStatement: found.aiProblemStatement || '',
                    solution: found.aiSolution || '',
                    businessModel: found.aiBusinessModel || ''
                });
            } else {
                setError('Proposal not found');
            }
        } catch (err) {
            setError('Failed to load proposal: ' + err.message);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const result = await founderService.updateProposal(startupId, formData);
            setSuccess('✅ Proposal updated successfully with DCH!');
            
            // Log DCH info for debugging
            console.log('🔄 DCH Update Result:', result);
            console.log('📊 New Version:', result.version);
            console.log('🔑 DCH Random Param:', result.dchRandomParam);
            
            setTimeout(() => {
                navigate('/dashboard/founder');
            }, 3000);
        } catch (err) {
            setError('Update failed: ' + (err.response?.data || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            {/* Back Button */}
            <button
                onClick={() => navigate('/dashboard/founder')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition"
            >
                <FiArrowLeft /> Back to Dashboard
            </button>

            {/* Header */}
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <FiEdit className="text-purple-600" />
                        Update Proposal
                    </h1>
                    <p className="text-gray-600">Update your proposal with DCH (Distributed Chameleon Hash)</p>
                </div>
                {proposal && (
                    <div className="flex flex-wrap gap-2">
                        <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1.5 rounded-lg">
                            Version: {proposal.version}
                        </span>
                        <span className={`text-sm px-3 py-1.5 rounded-lg ${
                            proposal.status === 'INDEXED' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                        }`}>
                            Status: {proposal.status}
                        </span>
                    </div>
                )}
            </div>

            {/* DCH Info Banner */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-xl flex-shrink-0">
                        🔐
                    </div>
                    <div>
                        <p className="font-semibold text-purple-800">DCH (Distributed Chameleon Hash)</p>
                        <p className="text-sm text-purple-600">
                            Your proposal will be updated on the blockchain using DCH. 
                            This preserves blockchain integrity while allowing the index to be updated.
                            <br />
                            <span className="text-xs text-purple-500 mt-1 block">
                                ℹ️ The blockchain block hash remains unchanged, but the proposal data is updated.
                            </span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            {success && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 text-green-700 flex items-center gap-3">
                    <FiCheck className="text-xl flex-shrink-0" />
                    {success}
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-red-700 flex items-start gap-3">
                    <FiInfo className="text-xl flex-shrink-0 mt-0.5" />
                    {error}
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="grid md:grid-cols-2 gap-4">
                    {/* Title */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Proposal Title *
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                            placeholder="Enter your startup proposal title"
                            required
                        />
                    </div>

                    {/* Domain */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Domain
                        </label>
                        <select
                            name="domain"
                            value={formData.domain}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                        >
                            <option value="">Select Domain</option>
                            {domains.map((d) => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>

                    {/* Stage */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Startup Stage
                        </label>
                        <select
                            name="stage"
                            value={formData.stage}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                        >
                            {stages.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    {/* Funding */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Expected Funding Amount (₹)
                        </label>
                        <input
                            type="number"
                            name="fundingAmount"
                            value={formData.fundingAmount}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                            placeholder="e.g., 5000000"
                            min="0"
                            step="100000"
                        />
                    </div>

                    {/* AI Summary */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            AI Summary
                        </label>
                        <textarea
                            name="summary"
                            value={formData.summary}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition min-h-[80px]"
                            placeholder="Update your AI summary"
                        />
                    </div>

                    {/* Keywords */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Keywords (comma separated)
                        </label>
                        <input
                            type="text"
                            name="keywords"
                            value={formData.keywords}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                            placeholder="e.g., AI, Agriculture, Computer Vision"
                        />
                    </div>

                    {/* Technology Stack */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Technology Stack
                        </label>
                        <input
                            type="text"
                            name="technologyStack"
                            value={formData.technologyStack}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                            placeholder="e.g., CNN, Deep Learning, Mobile App"
                        />
                    </div>

                    {/* Mentor Requirements */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Mentor Requirements
                        </label>
                        <input
                            type="text"
                            name="mentorRequirements"
                            value={formData.mentorRequirements}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                            placeholder="e.g., Computer Vision, AI, Agriculture"
                        />
                    </div>

                    {/* Investor Pitch */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Investor Pitch
                        </label>
                        <textarea
                            name="investorPitch"
                            value={formData.investorPitch}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition min-h-[60px]"
                            placeholder="Update your investor pitch"
                        />
                    </div>

                    {/* Problem Statement */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Problem Statement
                        </label>
                        <textarea
                            name="problemStatement"
                            value={formData.problemStatement}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition min-h-[60px]"
                            placeholder="Update the problem statement"
                        />
                    </div>

                    {/* Solution */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Solution
                        </label>
                        <textarea
                            name="solution"
                            value={formData.solution}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition min-h-[60px]"
                            placeholder="Update your solution description"
                        />
                    </div>

                    {/* Business Model */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Business Model
                        </label>
                        <input
                            type="text"
                            name="businessModel"
                            value={formData.businessModel}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                            placeholder="e.g., Subscription-based, Freemium"
                        />
                    </div>
                </div>

                <div className="flex gap-4 mt-6 pt-4 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={() => navigate('/dashboard/founder')}
                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2.5 px-4 rounded-lg transition"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 px-4 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                                Updating...
                            </>
                        ) : (
                            <>
                                <FiSave /> Update with DCH
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UpdateProposal;