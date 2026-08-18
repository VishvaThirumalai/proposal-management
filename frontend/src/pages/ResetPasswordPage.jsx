import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import { FiLock, FiEye, FiEyeOff, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';

const ResetPasswordPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    
    // Get token from URL or from state (passed from forgot password page)
    const urlToken = searchParams.get('token');
    const stateToken = location.state?.token;
    const initialToken = urlToken || stateToken || '';

    const [token, setToken] = useState(initialToken);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        if (!initialToken) {
            setError('Please enter a reset token');
        }
    }, [initialToken]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (!token || token.length < 10) {
            setError('Please enter a valid reset token');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await authService.resetPassword(token, password);
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError(err.message || 'Failed to reset password. Please try again.');
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
                    <h2 className="text-2xl font-bold text-gray-800">Set New Password</h2>
                    <p className="text-gray-600">Enter your reset token and new password</p>
                </div>

                {success ? (
                    <div className="text-center">
                        <div className="flex justify-center mb-4">
                            <FiCheckCircle className="text-5xl text-green-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Password Reset Successfully!</h3>
                        <p className="text-gray-600">You can now login with your new password.</p>
                        <div className="text-sm text-gray-500 mt-2">Redirecting to login...</div>
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
                                Reset Token
                            </label>
                            <input
                                type="text"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                className="input-field font-mono"
                                placeholder="Enter your reset token"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Enter the token you received from the forgot password page.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                New Password (min 6 chars)
                            </label>
                            <div className="relative">
                                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-field pl-10 pr-10"
                                    placeholder="Enter new password"
                                    minLength={6}
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="input-field pl-10 pr-10"
                                    placeholder="Confirm your password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-3 text-lg disabled:opacity-50"
                        >
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ResetPasswordPage;