import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { founderService } from '../../services/founderService';
import { FiUpload, FiFile, FiX, FiCheck, FiAlertCircle, FiArrowLeft } from 'react-icons/fi';

const UploadProposal = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [aiResult, setAiResult] = useState(null);
    const [editedAiResult, setEditedAiResult] = useState(null);
    const [uploadResult, setUploadResult] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        domain: '',
        stage: 'IDEA',
        fundingAmount: '',
    });

    const domains = [
        'Technology', 'Healthcare', 'Agriculture', 'FinTech', 
        'EdTech', 'AI', 'IoT', 'Sustainability', 'Energy', 
        'Transportation', 'E-commerce', 'Other'
    ];

    const stages = ['IDEA', 'MVP', 'PROTOTYPE', 'REVENUE'];

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    // ✅ File selection handler - stores file object directly
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // ✅ Check if it's a PDF
            if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
                setError('Please select a PDF file');
                return;
            }
            // ✅ Check file size (max 50MB)
            if (file.size > 50 * 1024 * 1024) {
                setError('File size must be less than 50MB');
                return;
            }
            // ✅ Store the file object directly (NOT the blob URL)
            setSelectedFile(file);
            setError('');
            console.log('✅ File selected:', file.name, file.type, file.size);
        }
    };

    const removeFile = () => {
        setSelectedFile(null);
        document.getElementById('fileInput').value = '';
    };

    // Step 1: Generate AI Preview
    const handleGeneratePreview = async (e) => {
        e.preventDefault();
        
        if (!selectedFile) {
            setError('Please select a PDF file');
            return;
        }

        if (!formData.title.trim()) {
            setError('Please enter a title');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            console.log('📤 Generating AI preview for:', selectedFile.name);
            
            const previewResult = await founderService.previewAI(selectedFile);
            console.log('✅ AI Preview Response:', previewResult);
            
            if (previewResult.success) {
                setAiResult(previewResult);
                setEditedAiResult({ ...previewResult });
                setStep(2);
                setSuccess('✅ AI summary generated successfully!');
                setTimeout(() => setSuccess(''), 5000);
            } else {
                setError('AI preview failed');
            }

        } catch (err) {
            console.error('❌ AI Preview error:', err);
            setError(err.response?.data || 'Failed to generate AI preview');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Approve & Upload
    const handleApproveAndUpload = async () => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            console.log('📤 Uploading proposal with AI metadata...');
            
            const details = {
                title: formData.title,
                domain: formData.domain || 'Technology',
                stage: formData.stage,
                fundingAmount: parseFloat(formData.fundingAmount) || 0,
            };

            console.log('📤 Upload details:', details);
            console.log('📤 File:', selectedFile.name, selectedFile.type, selectedFile.size);

            // ✅ Use the file object directly
            const result = await founderService.uploadProposal(selectedFile, details);
            console.log('✅ Upload result:', result);
            
            setUploadResult(result);
            setStep(3);
            setSuccess('✅ Proposal uploaded successfully!');

        } catch (err) {
            console.error('❌ Upload error:', err);
            console.error('❌ Error response:', err.response);
            
            const errorMsg = err.response?.data || err.message || 'Upload failed. Please try again.';
            setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Success
    const handleReset = () => {
        setStep(1);
        setSelectedFile(null);
        setAiResult(null);
        setEditedAiResult(null);
        setUploadResult(null);
        document.getElementById('fileInput').value = '';
        setFormData({
            title: '',
            domain: '',
            stage: 'IDEA',
            fundingAmount: '',
        });
        setSuccess('');
        setError('');
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            {/* Back Button */}
            <button
                onClick={() => navigate('/dashboard/founder')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
            >
                <FiArrowLeft /> Back to Dashboard
            </button>

            <h1 className="text-3xl font-bold text-gray-800 mb-6">
                {step === 1 && 'Upload Startup Proposal'}
                {step === 2 && 'Review AI Summary'}
                {step === 3 && 'Upload Complete!'}
            </h1>

            {/* Step Indicator */}
            <div className="flex items-center gap-4 mb-6">
                <div className={`flex-1 h-2 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
                <div className={`flex-1 h-2 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
                <div className={`flex-1 h-2 rounded-full ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            </div>

            {/* Messages */}
            {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 text-green-700">
                    {success}
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-red-700">
                    {error}
                </div>
            )}

            {/* Step 1: Upload */}
            {step === 1 && (
                <form onSubmit={handleGeneratePreview} className="bg-white rounded-xl shadow-lg p-6">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Proposal Title *
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                placeholder="Enter your startup proposal title"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Domain
                            </label>
                            <select
                                name="domain"
                                value={formData.domain}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            >
                                <option value="">Select Domain</option>
                                {domains.map((d) => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Startup Stage
                            </label>
                            <select
                                name="stage"
                                value={formData.stage}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            >
                                {stages.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Expected Funding Amount (₹)
                            </label>
                            <input
                                type="number"
                                name="fundingAmount"
                                value={formData.fundingAmount}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                placeholder="e.g., 5000000"
                                min="0"
                                step="100000"
                            />
                        </div>
                    </div>

                    {/* File Upload */}
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Proposal PDF *
                        </label>
                        <div className="relative">
                            <input
                                id="fileInput"
                                type="file"
                                accept=".pdf"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className={`border-2 border-dashed rounded-xl p-6 text-center transition ${selectedFile ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400'}`}>
                                {selectedFile ? (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <FiFile className="text-blue-500 text-2xl" />
                                            <div className="text-left">
                                                <p className="font-medium text-gray-700">{selectedFile.name}</p>
                                                <p className="text-sm text-gray-500">
                                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={removeFile}
                                            className="text-red-500 hover:text-red-700 p-1"
                                        >
                                            <FiX size={24} />
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <FiUpload className="mx-auto text-gray-400 text-4xl mb-2" />
                                        <p className="text-gray-600">Click or drag and drop your PDF here</p>
                                        <p className="text-sm text-gray-400">PDF files only, max 50MB</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !selectedFile}
                        className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50"
                    >
                        {loading ? 'Generating AI Preview...' : 'Generate AI Preview'}
                    </button>
                </form>
            )}

            {/* Step 2: Review */}
            {step === 2 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Review AI Summary</h2>
                    <p className="text-gray-600 mb-4">Review and approve the AI-generated summary.</p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Summary
                            </label>
                            <textarea
                                value={editedAiResult?.summary || ''}
                                onChange={(e) => setEditedAiResult({...editedAiResult, summary: e.target.value})}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none min-h-[80px]"
                            />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Domain
                                </label>
                                <input
                                    type="text"
                                    value={editedAiResult?.domain || ''}
                                    onChange={(e) => setEditedAiResult({...editedAiResult, domain: e.target.value})}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Keywords
                                </label>
                                <input
                                    type="text"
                                    value={editedAiResult?.keywords || ''}
                                    onChange={(e) => setEditedAiResult({...editedAiResult, keywords: e.target.value})}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    placeholder="Comma separated"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Mentor Requirements
                            </label>
                            <input
                                type="text"
                                value={editedAiResult?.mentorRequirements || ''}
                                onChange={(e) => setEditedAiResult({...editedAiResult, mentorRequirements: e.target.value})}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                placeholder="Comma separated"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 mt-6">
                        <button
                            onClick={() => setStep(1)}
                            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition"
                        >
                            Back
                        </button>
                        <button
                            onClick={handleApproveAndUpload}
                            disabled={loading}
                            className="flex-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
                        >
                            {loading ? 'Uploading...' : 'Approve & Upload'}
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Success */}
            {step === 3 && (
                <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiCheck className="text-green-600 text-4xl" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">✓ Proposal Uploaded Successfully!</h2>

                    <div className="bg-gray-50 rounded-lg p-4 mt-4 text-left">
                        <p className="text-sm text-gray-600"><span className="font-medium">Startup ID:</span> {uploadResult?.startupId}</p>
                        <p className="text-sm text-gray-600 break-all"><span className="font-medium">IPFS CID:</span> {uploadResult?.ipfsCid}</p>
                        <p className="text-sm text-gray-600"><span className="font-medium">Blockchain TX:</span> {uploadResult?.blockchainTx}</p>
                    </div>

                    <div className="flex gap-4 mt-6">
                        <button
                            onClick={handleReset}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                        >
                            Upload Another
                        </button>
                        <button
                            onClick={() => navigate('/dashboard/founder')}
                            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition"
                        >
                            View Dashboard
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UploadProposal;