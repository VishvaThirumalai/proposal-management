import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiMenu, FiX, FiUser, FiLogOut, FiHome, FiUpload, FiList, FiBriefcase, FiUsers, FiShield } from 'react-icons/fi';

const Navbar = () => {
    const { user, logout, isAuthenticated, getUserRole, getUserName } = useAuth();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const getDashboardLink = () => {
        const role = getUserRole();
        if (!role) return '/';
        return `/dashboard/${role.toLowerCase()}`;
    };

    const getRoleLabel = (role) => {
        if (!role) return '';
        return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
    };

    const getRoleIcon = () => {
        const role = getUserRole();
        switch (role) {
            case 'FOUNDER': return <FiBriefcase className="inline mr-1" />;
            case 'MENTOR': return <FiUsers className="inline mr-1" />;
            case 'INVESTOR': return <FiShield className="inline mr-1" />;
            case 'ADMIN': return <FiShield className="inline mr-1" />;
            default: return <FiUser className="inline mr-1" />;
        }
    };

    return (
        <nav className="bg-white shadow-md sticky top-0 z-50">
            <div className="container mx-auto px-4 py-3">
                <div className="flex justify-between items-center">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-md">
                            <span className="text-white font-bold text-xl">SH</span>
                        </div>
                        <span className="text-xl font-bold text-gray-800">StartupHub</span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-6">
                        <Link to="/" className="text-gray-600 hover:text-blue-600 transition duration-200">
                            <FiHome className="inline mr-1" /> Home
                        </Link>

                        {isAuthenticated() ? (
                            <>
                                <Link 
                                    to={getDashboardLink()} 
                                    className="text-gray-600 hover:text-blue-600 transition duration-200"
                                >
                                    {getRoleIcon()} Dashboard
                                </Link>
                                
                                {/* Role-specific quick links */}
                                {getUserRole() === 'FOUNDER' && (
                                    <>
                                        <Link 
                                            to="/dashboard/founder/upload" 
                                            className="text-gray-600 hover:text-blue-600 transition duration-200"
                                        >
                                            <FiUpload className="inline mr-1" /> Upload
                                        </Link>
                                    </>
                                )}
                                
                                <span className="text-gray-300">|</span>
                                
                                <div className="flex items-center space-x-3">
                                    <span className="text-sm text-gray-700 font-medium">
                                        👋 {getUserName() || 'User'}
                                    </span>
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                        {getRoleLabel(getUserRole())}
                                    </span>
                                </div>
                                
                                <button
                                    onClick={handleLogout}
                                    className="bg-red-600 hover:bg-red-700 text-white font-semibold text-sm px-4 py-2 rounded-lg transition duration-200"
                                >
                                    <FiLogOut className="inline mr-1" /> Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link 
                                    to="/login" 
                                    className="text-gray-600 hover:text-blue-600 transition duration-200"
                                >
                                    Login
                                </Link>
                                <Link 
                                    to="/register" 
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2 rounded-lg transition duration-200"
                                >
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden mt-4 pt-4 border-t border-gray-200 space-y-3">
                        <Link
                            to="/"
                            className="block text-gray-600 hover:text-blue-600 transition px-2 py-1"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            <FiHome className="inline mr-2" /> Home
                        </Link>

                        {isAuthenticated() ? (
                            <>
                                <Link
                                    to={getDashboardLink()}
                                    className="block text-gray-600 hover:text-blue-600 transition px-2 py-1"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {getRoleIcon()} Dashboard
                                </Link>

                                {getUserRole() === 'FOUNDER' && (
                                    <Link
                                        to="/dashboard/founder/upload"
                                        className="block text-gray-600 hover:text-blue-600 transition px-2 py-1"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <FiUpload className="inline mr-2" /> Upload Proposal
                                    </Link>
                                )}

                                <div className="px-2 py-1">
                                    <div className="text-sm text-gray-500">
                                        👋 {getUserName()}
                                    </div>
                                    <div className="text-xs text-blue-600 font-medium">
                                        {getRoleLabel(getUserRole())}
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        handleLogout();
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition text-center"
                                >
                                    <FiLogOut className="inline mr-2" /> Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="block text-gray-600 hover:text-blue-600 transition px-2 py-1"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition text-center"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;