import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    FiUpload, 
    FiUsers, 
    FiShield, 
    FiCpu, 
    FiTrendingUp, 
    FiLock,
    FiArrowRight 
} from 'react-icons/fi';

const LandingPage = () => {
    const { isAuthenticated, getUserRole } = useAuth();

    const getStartedLink = () => {
        if (isAuthenticated()) {
            const role = getUserRole();
            return `/dashboard/${role.toLowerCase()}`;
        }
        return '/register';
    };

    const features = [
        {
            icon: <FiUpload className="text-3xl text-blue-500" />,
            title: 'Upload Your Proposal',
            description: 'Share your startup idea securely with our AI-powered platform.'
        },
        {
            icon: <FiCpu className="text-3xl text-purple-500" />,
            title: 'AI-Powered Analysis',
            description: 'Get intelligent insights, summaries, and recommendations.'
        },
        {
            icon: <FiUsers className="text-3xl text-green-500" />,
            title: 'Find the Right People',
            description: 'Connect with top mentors and investors who match your startup.'
        },
        {
            icon: <FiLock className="text-3xl text-red-500" />,
            title: 'Secure & Decentralized',
            description: 'Blockchain-based security with full control over your data.'
        },
        {
            icon: <FiTrendingUp className="text-3xl text-orange-500" />,
            title: 'Grow Your Startup',
            description: 'Get mentorship, funding, and strategic guidance.'
        },
        {
            icon: <FiShield className="text-3xl text-teal-500" />,
            title: 'Full Control',
            description: 'You decide who sees your proposal. Revoke access anytime.'
        }
    ];

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="text-4xl md:text-5xl font-bold mb-6">
                            Launch Your Startup With Confidence
                        </h1>
                        <p className="text-xl md:text-2xl text-blue-100 mb-8">
                            Upload your proposal, get AI insights, find the right mentors and investors,
                            and stay in control of your idea.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link
                                to={getStartedLink()}
                                className="bg-white text-blue-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition duration-200 inline-flex items-center justify-center"
                            >
                                {isAuthenticated() ? 'Go to Dashboard' : 'Get Started'}
                                <FiArrowRight className="ml-2" />
                            </Link>
                            <Link
                                to="/login"
                                className="bg-transparent border-2 border-white hover:bg-white/10 text-white font-semibold py-3 px-8 rounded-lg transition duration-200 inline-flex items-center justify-center"
                            >
                                Login
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-12 bg-white shadow-sm">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                        <div>
                            <div className="text-3xl font-bold text-blue-600">500+</div>
                            <div className="text-gray-600">Startups Funded</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-green-600">1200+</div>
                            <div className="text-gray-600">Mentors Available</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-purple-600">300+</div>
                            <div className="text-gray-600">Investors</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-orange-600">₹50Cr+</div>
                            <div className="text-gray-600">Total Investment</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-800 mb-4">
                            Why Choose StartupHub?
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Everything you need to take your startup from idea to success
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div key={index} className="card hover:shadow-xl transition-shadow">
                                <div className="mb-4">{feature.icon}</div>
                                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-800 mb-4">
                            How It Works
                        </h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl font-bold text-blue-600">1</span>
                            </div>
                            <h3 className="font-semibold text-lg">Upload Your Proposal</h3>
                            <p className="text-gray-600 text-sm">Share your startup idea and documents</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl font-bold text-purple-600">2</span>
                            </div>
                            <h3 className="font-semibold text-lg">AI Analysis & Recommendations</h3>
                            <p className="text-gray-600 text-sm">Get matched with the right mentors and investors</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl font-bold text-green-600">3</span>
                            </div>
                            <h3 className="font-semibold text-lg">Connect & Grow</h3>
                            <p className="text-gray-600 text-sm">Collaborate securely and take your startup forward</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-16">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold mb-4">
                        Ready to Launch Your Startup?
                    </h2>
                    <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                        Join thousands of founders who are building their dreams with StartupHub
                    </p>
                    <Link
                        to="/register"
                        className="bg-white text-blue-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition duration-200 inline-flex items-center"
                    >
                        Get Started Now
                        <FiArrowRight className="ml-2" />
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;