import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { 
    FiUsers, FiUserCheck, FiUserX, FiClock, FiShield, 
    FiCheckCircle, FiXCircle, FiRefreshCw, FiAlertCircle,
    FiUser, FiBriefcase, FiTrendingUp, FiActivity,
    FiArrowRight, FiUserPlus, FiUserMinus
} from 'react-icons/fi';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [pendingMentors, setPendingMentors] = useState([]);
    const [pendingInvestors, setPendingInvestors] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            const [mentors, investors, users] = await Promise.all([
                adminService.getPendingMentors(),
                adminService.getPendingInvestors(),
                adminService.getAllUsers()
            ]);
            setPendingMentors(mentors || []);
            setPendingInvestors(investors || []);
            setAllUsers(users || []);
        } catch (err) {
            setError('Failed to load data: ' + err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadData();
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'APPROVED':
                return <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2.5 py-1 rounded-full text-xs font-medium"><FiCheckCircle /> Approved</span>;
            case 'PENDING':
                return <span className="inline-flex items-center gap-1 text-yellow-600 bg-yellow-50 px-2.5 py-1 rounded-full text-xs font-medium"><FiClock /> Pending</span>;
            case 'REJECTED':
                return <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2.5 py-1 rounded-full text-xs font-medium"><FiXCircle /> Rejected</span>;
            default:
                return <span className="text-xs text-gray-500">{status}</span>;
        }
    };

    const getRoleBadge = (role) => {
        const styles = {
            ADMIN: 'bg-purple-100 text-purple-700',
            FOUNDER: 'bg-blue-100 text-blue-700',
            MENTOR: 'bg-green-100 text-green-700',
            INVESTOR: 'bg-orange-100 text-orange-700'
        };
        return <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${styles[role] || 'bg-gray-100 text-gray-700'}`}>{role}</span>;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                        <FiShield className="text-purple-600" />
                        Admin Dashboard
                    </h1>
                    <p className="text-gray-600">Overview of platform activities</p>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
                >
                    <FiRefreshCw className={refreshing ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Messages */}
            {success && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 text-green-700">
                    {success}
                </div>
            )}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-red-700">
                    {error}
                </div>
            )}

            {/* Quick Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div 
                    onClick={() => navigate('/dashboard/admin/verify-mentors')}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition cursor-pointer"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center text-yellow-600">
                            <FiUser className="text-2xl" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Pending Mentors</p>
                            <p className="text-2xl font-bold text-gray-800">{pendingMentors.length}</p>
                        </div>
                        <FiArrowRight className="ml-auto text-gray-400" />
                    </div>
                </div>

                <div 
                    onClick={() => navigate('/dashboard/admin/verify-investors')}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition cursor-pointer"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                            <FiBriefcase className="text-2xl" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Pending Investors</p>
                            <p className="text-2xl font-bold text-gray-800">{pendingInvestors.length}</p>
                        </div>
                        <FiArrowRight className="ml-auto text-gray-400" />
                    </div>
                </div>

                <div 
                    onClick={() => navigate('/dashboard/admin/manage-users')}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition cursor-pointer"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                            <FiUsers className="text-2xl" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Users</p>
                            <p className="text-2xl font-bold text-gray-800">{allUsers.length}</p>
                        </div>
                        <FiArrowRight className="ml-auto text-gray-400" />
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">📊 Recent Users</h2>
                {loading ? (
                    <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <p className="text-gray-500 mt-2 text-sm">Loading...</p>
                    </div>
                ) : allUsers.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No users registered yet</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allUsers.slice(0, 5).map((user) => (
                                    <tr key={user.userId} className="border-b border-gray-50 hover:bg-gray-50 transition">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-semibold text-sm">
                                                    {user.name?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-800">{user.name}</p>
                                                    <p className="text-xs text-gray-400">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">{getRoleBadge(user.role)}</td>
                                        <td className="px-4 py-3">{getStatusBadge(user.status)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{formatDate(user.createdAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {allUsers.length > 5 && (
                    <button 
                        onClick={() => navigate('/dashboard/admin/manage-users')}
                        className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                        View all users →
                    </button>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;