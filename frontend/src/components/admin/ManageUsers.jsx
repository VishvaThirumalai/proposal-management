import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { 
    FiUsers, FiSearch, FiFilter, FiRefreshCw, FiArrowLeft,
    FiUser, FiCheckCircle, FiXCircle, FiClock,
    FiEdit, FiTrash2, FiEye, FiMail, FiShield
} from 'react-icons/fi';

const ManageUsers = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        loadUsers();
    }, []);

    useEffect(() => {
        filterUsers();
    }, [users, searchTerm, roleFilter, statusFilter]);

    const loadUsers = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await adminService.getAllUsers();
            setUsers(data || []);
        } catch (err) {
            setError('Failed to load users: ' + err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadUsers();
    };

    const filterUsers = () => {
        let filtered = users;

        // Search filter
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase().trim();
            filtered = filtered.filter(user => 
                user.name?.toLowerCase().includes(term) ||
                user.email?.toLowerCase().includes(term)
            );
        }

        // Role filter
        if (roleFilter !== 'ALL') {
            filtered = filtered.filter(user => user.role === roleFilter);
        }

        // Status filter
        if (statusFilter !== 'ALL') {
            filtered = filtered.filter(user => user.status === statusFilter);
        }

        setFilteredUsers(filtered);
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

    const handleResendVerification = (user) => {
        // Placeholder - implement if needed
        alert(`Resend verification email to ${user.email}`);
    };

    const handleDeleteUser = (user) => {
        if (window.confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) {
            // Placeholder - implement if needed
            alert(`Delete user ${user.name}`);
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div>
                    <button 
                        onClick={() => navigate('/dashboard/admin')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-2"
                    >
                        <FiArrowLeft /> Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                        <FiUsers className="text-green-600" />
                        Manage Users
                    </h1>
                    <p className="text-gray-600">View and manage all platform users</p>
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

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                        <option value="ALL">All Roles</option>
                        <option value="FOUNDER">Founder</option>
                        <option value="MENTOR">Mentor</option>
                        <option value="INVESTOR">Investor</option>
                        <option value="ADMIN">Admin</option>
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                        <option value="ALL">All Status</option>
                        <option value="APPROVED">Approved</option>
                        <option value="PENDING">Pending</option>
                        <option value="REJECTED">Rejected</option>
                    </select>
                    <span className="text-sm text-gray-500 self-center">
                        {filteredUsers.length} user(s) found
                    </span>
                </div>
            </div>

            {/* Users Table */}
            {loading ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-gray-600 mt-2">Loading users...</p>
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <FiUsers className="mx-auto text-gray-300 text-5xl mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No Users Found</h3>
                    <p className="text-gray-500">Try adjusting your filters</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wallet</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredUsers.map((user) => (
                                    <tr key={user.userId} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                                                    user.role === 'ADMIN' ? 'bg-purple-500' :
                                                    user.role === 'FOUNDER' ? 'bg-blue-500' :
                                                    user.role === 'MENTOR' ? 'bg-green-500' :
                                                    'bg-orange-500'
                                                }`}>
                                                    {user.name?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-800">{user.name}</p>
                                                    <p className="text-xs text-gray-400 flex items-center gap-1">
                                                        <FiMail className="text-gray-300" size={12} />
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                                        <td className="px-6 py-4">{getStatusBadge(user.status)}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{formatDate(user.createdAt)}</td>
                                        <td className="px-6 py-4 text-xs text-gray-500 font-mono truncate max-w-[120px]">
                                            {user.walletAddress || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setSelectedUser(selectedUser === user.userId ? null : user.userId)}
                                                    className="text-blue-600 hover:text-blue-800"
                                                    title="View Details"
                                                >
                                                    <FiEye />
                                                </button>
                                                {user.role !== 'ADMIN' && user.status === 'PENDING' && (
                                                    <>
                                                        <button
                                                            onClick={() => adminService.verifyUser(user.userId, true).then(() => loadUsers())}
                                                            className="text-green-600 hover:text-green-800"
                                                            title="Approve"
                                                        >
                                                            <FiCheckCircle />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const reason = prompt('Enter rejection reason:');
                                                                if (reason !== null) {
                                                                    adminService.verifyUser(user.userId, false, reason).then(() => loadUsers());
                                                                }
                                                            }}
                                                            className="text-red-600 hover:text-red-800"
                                                            title="Reject"
                                                        >
                                                            <FiXCircle />
                                                        </button>
                                                    </>
                                                )}
                                                {user.role !== 'ADMIN' && (
                                                    <button
                                                        onClick={() => handleResendVerification(user)}
                                                        className="text-blue-600 hover:text-blue-800"
                                                        title="Resend Verification"
                                                    >
                                                        <FiMail />
                                                    </button>
                                                )}
                                                {user.role !== 'ADMIN' && (
                                                    <button
                                                        onClick={() => handleDeleteUser(user)}
                                                        className="text-red-600 hover:text-red-800"
                                                        title="Delete User"
                                                    >
                                                        <FiTrash2 />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageUsers;