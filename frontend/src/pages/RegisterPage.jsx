import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { keyService } from '../services/keyService';
import { FiUser, FiMail, FiLock, FiPhone, FiArrowLeft } from 'react-icons/fi';

const RegisterPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedRole, setSelectedRole] = useState('FOUNDER');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'FOUNDER',
        // Mentor fields
        company: '',
        designation: '',
        yearsExperience: '',
        expertise: '',
        linkedin: '',
        // Investor fields
        organization: '',
        website: '',
        investmentDomains: '',
        investmentStage: ''
    });

    const roles = [
        { value: 'FOUNDER', label: 'Founder', description: 'Share your startup idea' },
        { value: 'MENTOR', label: 'Mentor', description: 'Guide and support startups' },
        { value: 'INVESTOR', label: 'Investor', description: 'Invest in promising startups' }
    ];

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleRoleChange = (role) => {
        setSelectedRole(role);
        setFormData({
            ...formData,
            role: role
        });
    };

    const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // ✅ Clean the data - remove empty fields
    const cleanData = {};
    for (const [key, value] of Object.entries(formData)) {
        if (value !== '' && value !== null && value !== undefined) {
            cleanData[key] = value;
        }
    }

    // ✅ Make sure role is always included
    cleanData.role = formData.role;

    console.log('📤 Sending clean registration data:', cleanData);

    try {
        const result = await authService.register(cleanData);
        console.log('✅ Registration successful:', result);
        
        // ✅ Check if privateKey exists before downloading
        if (result.privateKey && result.privateKey.length > 0) {
            console.log("📥 Private key received, downloading...");
            keyService.downloadPrivateKey(
                result.privateKey,
                `private_key_${result.userId}.key`
            );
            keyService.savePrivateKey(result.privateKey);
        } else {
            console.warn("⚠️ No private key received in response");
        }
        
        // Show success message
        const isMentorInvestor = result.role === 'MENTOR' || result.role === 'INVESTOR';
        const message = isMentorInvestor 
            ? `✅ Registration Successful!\n\nYour account is pending admin verification.\nYou will be notified when approved.`
            : `✅ Registration Successful!\n\nYou can now login to your dashboard.`;
        
        alert(message);

        // Navigate based on role
        if (result.role === 'FOUNDER' && result.token) {
            localStorage.setItem('jwtToken', result.token);
            localStorage.setItem('refreshToken', result.refreshToken);
            localStorage.setItem('userRole', result.role);
            localStorage.setItem('userId', result.userId);
            localStorage.setItem('userName', result.name);
            localStorage.setItem('userEmail', result.email);
            localStorage.setItem('walletAddress', result.walletAddress);
            navigate('/dashboard/founder');
        } else if (result.role === 'MENTOR' || result.role === 'INVESTOR') {
            navigate('/login');
        }

    } catch (err) {
        console.error('❌ Registration error:', err);
        const errorMsg = err.response?.data || err.message || 'Registration failed. Please try again.';
        setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    } finally {
        setLoading(false);
    }
};
    

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                <Link to="/" className="inline-flex items-center text-gray-600 hover:text-blue-600 mb-4">
                    <FiArrowLeft className="mr-2" /> Back to Home
                </Link>

                <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <span className="text-white font-bold text-2xl">SH</span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">Create Your Account</h2>
                        <p className="text-gray-600">Join StartupHub and launch your startup journey</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                            {error}
                        </div>
                    )}

                    {/* Role Selection */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        {roles.map((role) => (
                            <button
                                key={role.value}
                                type="button"
                                onClick={() => handleRoleChange(role.value)}
                                className={`p-3 rounded-lg border-2 text-center transition ${
                                    selectedRole === role.value
                                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                                        : 'border-gray-200 hover:border-blue-300'
                                }`}
                            >
                                <div className="font-semibold text-sm">{role.label}</div>
                                <div className="text-xs text-gray-500">{role.description}</div>
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Full Name *
                                </label>
                                <div className="relative">
                                    <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="input-field pl-10"
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email Address *
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
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Password * (min 6 chars)
                                </label>
                                <div className="relative">
                                    <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="input-field pl-10"
                                        placeholder="••••••••"
                                        minLength={6}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="input-field pl-10"
                                        placeholder="9876543210"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Mentor Fields */}
                        {selectedRole === 'MENTOR' && (
                            <div className="border-t border-gray-200 pt-4 mt-2">
                                <h3 className="font-semibold text-gray-700 mb-3">Mentor Profile Details</h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Company/Organization
                                        </label>
                                        <input
                                            type="text"
                                            name="company"
                                            value={formData.company}
                                            onChange={handleChange}
                                            className="input-field"
                                            placeholder="Your company name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Designation
                                        </label>
                                        <input
                                            type="text"
                                            name="designation"
                                            value={formData.designation}
                                            onChange={handleChange}
                                            className="input-field"
                                            placeholder="e.g., AI Research Lead"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Years of Experience
                                        </label>
                                        <input
                                            type="number"
                                            name="yearsExperience"
                                            value={formData.yearsExperience}
                                            onChange={handleChange}
                                            className="input-field"
                                            placeholder="e.g., 10"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            LinkedIn Profile
                                        </label>
                                        <input
                                            type="url"
                                            name="linkedin"
                                            value={formData.linkedin}
                                            onChange={handleChange}
                                            className="input-field"
                                            placeholder="https://linkedin.com/in/..."
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Areas of Expertise (comma separated)
                                        </label>
                                        <input
                                            type="text"
                                            name="expertise"
                                            value={formData.expertise}
                                            onChange={handleChange}
                                            className="input-field"
                                            placeholder="e.g., Computer Vision, AI, Agriculture"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Investor Fields */}
                        {selectedRole === 'INVESTOR' && (
                            <div className="border-t border-gray-200 pt-4 mt-2">
                                <h3 className="font-semibold text-gray-700 mb-3">Investor Profile Details</h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Organization/Fund Name
                                        </label>
                                        <input
                                            type="text"
                                            name="organization"
                                            value={formData.organization}
                                            onChange={handleChange}
                                            className="input-field"
                                            placeholder="e.g., ABC Ventures"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Website
                                        </label>
                                        <input
                                            type="url"
                                            name="website"
                                            value={formData.website}
                                            onChange={handleChange}
                                            className="input-field"
                                            placeholder="https://yourfund.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Investment Domains (comma separated)
                                        </label>
                                        <input
                                            type="text"
                                            name="investmentDomains"
                                            value={formData.investmentDomains}
                                            onChange={handleChange}
                                            className="input-field"
                                            placeholder="e.g., AI, Healthcare, AgriTech"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Investment Stage (comma separated)
                                        </label>
                                        <input
                                            type="text"
                                            name="investmentStage"
                                            value={formData.investmentStage}
                                            onChange={handleChange}
                                            className="input-field"
                                            placeholder="e.g., Seed, Series A"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            LinkedIn Profile
                                        </label>
                                        <input
                                            type="url"
                                            name="linkedin"
                                            value={formData.linkedin}
                                            onChange={handleChange}
                                            className="input-field"
                                            placeholder="https://linkedin.com/in/..."
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-3 text-lg disabled:opacity-50 mt-4"
                        >
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>

                    <p className="text-center text-gray-600 mt-6">
                        Already have an account?{' '}
                        <Link to="/login" className="text-blue-600 hover:text-blue-800 font-semibold">
                            Login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;