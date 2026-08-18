import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { FiMail, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';

const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [resetToken, setResetToken] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            const response = await authService.forgotPassword(email);
            console.log('✅ Forgot password response:', response);
            setResetToken(response.resetToken);
            setSuccess(true);
        } catch (err) {
            console.error('❌ Forgot password error:', err);
            const errorMsg = err.response?.data || err.message || 'Failed to generate reset token.';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
                <Link to="/login" className="inline-flex items-center text-gray-600 hover:text-blue-600 mb-6">
                    <FiArrowLeft className="mr-2" /> Back to Login
                </Link>

                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-white font-bold text-2xl">SH</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Reset Password</h2>
                    <p className="text-gray-600">Enter your email to get a reset token</p>
                </div>

                {success ? (
                    <div className="text-center">
                        <div className="flex justify-center mb-4">
                            <FiCheckCircle className="text-5xl text-green-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Reset Token Generated!</h3>
                        <p className="text-gray-600 mb-4">
                            A reset token has been generated for <strong>{email}</strong>
                        </p>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <p className="text-sm text-blue-700 font-mono break-all">
                                Token: {resetToken}
                            </p>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">
                            Copy this token and go to the reset password page.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => navigate('/reset-password', { state: { token: resetToken } })}
                                className="btn-primary flex-1"
                            >
                                Reset Password
                            </button>
                            <button
                                onClick={() => setSuccess(false)}
                                className="btn-secondary"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address
                            </label>
                            <div className="relative">
                                <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input-field pl-10"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-3 text-lg disabled:opacity-50"
                        >
                            {loading ? 'Generating...' : 'Generate Reset Token'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPasswordPage;