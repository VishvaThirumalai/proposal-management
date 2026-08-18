import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowLeft, FiAlertCircle, FiClock } from 'react-icons/fi';

const LoginPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [errorType, setErrorType] = useState(''); // 'pending', 'rejected', 'invalid'
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        role: 'FOUNDER'
    });

    const roles = [
        { value: 'FOUNDER', label: 'Founder' },
        { value: 'MENTOR', label: 'Mentor' },
        { value: 'INVESTOR', label: 'Investor' },
        { value: 'ADMIN', label: 'Admin' }
    ];

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
        setErrorType('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setErrorType('');

        try {
            const response = await login(formData);
            
            // Redirect based on role
            if (response.role === 'ADMIN') {
                navigate('/dashboard/admin');
            } else if (response.role === 'FOUNDER') {
                navigate('/dashboard/founder');
            } else if (response.role === 'MENTOR') {
                navigate('/dashboard/mentor');
            } else if (response.role === 'INVESTOR') {
                navigate('/dashboard/investor');
            }
        } catch (err) {
            const errorMessage = err.message || 'Login failed. Please try again.';
            setError(errorMessage);
            
            // Check for specific error types
            if (errorMessage.toLowerCase().includes('pending admin verification')) {
                setErrorType('pending');
            } else if (errorMessage.toLowerCase().includes('rejected')) {
                setErrorType('rejected');
            } else {
                setErrorType('invalid');
            }
        } finally {
            setLoading(false);
        }
    };

    // Render error message based on type
    const renderError = () => {
        if (!error) return null;

        if (errorType === 'pending') {
            return (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                        <FiClock className="text-yellow-600 text-xl mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-yellow-800">Account Pending Verification</h4>
                            <p className="text-sm text-yellow-700">{error}</p>
                            <p className="text-sm text-yellow-600 mt-1">
                                Your account is waiting for admin approval. You will be notified once verified.
                            </p>
                            <button
                                onClick={() => navigate('/')}
                                className="mt-2 text-sm text-yellow-700 underline hover:text-yellow-900"
                            >
                                Return to Home
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        if (errorType === 'rejected') {
            return (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                        <FiAlertCircle className="text-red-600 text-xl mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-red-800">Account Rejected</h4>
                            <p className="text-sm text-red-700">{error}</p>
                            <p className="text-sm text-red-600 mt-1">
                                Your account has been rejected by the admin. Please contact support for more information.
                            </p>
                            <button
                                onClick={() => navigate('/')}
                                className="mt-2 text-sm text-red-700 underline hover:text-red-900"
                            >
                                Return to Home
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        // Default error message
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
            </div>
        );
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
                {/* Back Button */}
                <Link to="/" className="inline-flex items-center text-gray-600 hover:text-blue-600 mb-6">
                    <FiArrowLeft className="mr-2" /> Back to Home
                </Link>

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-white font-bold text-2xl">SH</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
                    <p className="text-gray-600">Login to your StartupHub account</p>
                </div>

                {/* Error Message */}
                {renderError()}

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                        </label>
                        <div className="relative">
                            <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="input-field pl-10"
                                placeholder="you@example.com"
                                required
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                        </label>
                        <div className="relative">
                            <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="input-field pl-10 pr-10"
                                placeholder="Enter your password"
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

                    {/* Role Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Login As
                        </label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="input-field"
                        >
                            {roles.map((role) => (
                                <option key={role.value} value={role.value}>
                                    {role.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Forgot Password Link */}
                    <div className="text-right">
                        <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800">
                            Forgot password?
                        </Link>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full py-3 text-lg disabled:opacity-50"
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                {/* Register Link */}
                <p className="text-center text-gray-600 mt-6">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-blue-600 hover:text-blue-800 font-semibold">
                        Register now
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;