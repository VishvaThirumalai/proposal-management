import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { escrowService } from '../../services/escrowService';
import EscrowCard from './EscrowCard';
import { FiDollarSign, FiRefreshCw, FiPlus } from 'react-icons/fi';

const EscrowDashboard = () => {
    const { getUserRole } = useAuth();
    const role = getUserRole();
    const [escrows, setEscrows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const loadEscrows = async () => {
        setLoading(true);
        setError('');
        try {
            let data;
            if (role === 'INVESTOR') {
                data = await escrowService.getMyEscrowsAsInvestor();
            } else if (role === 'FOUNDER') {
                data = await escrowService.getMyEscrowsAsFounder();
            } else {
                data = [];
            }
            setEscrows(Array.isArray(data) ? data : []);
        } catch (err) {
            setError('Failed to load escrows: ' + err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadEscrows();
    }, []);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadEscrows();
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FiDollarSign className="text-green-600" />
                        My Escrows
                    </h1>
                    <p className="text-gray-600">
                        {role === 'INVESTOR' 
                            ? 'Escrows you have created for startups'
                            : 'Escrows funded by investors for your startups'}
                    </p>
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

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-red-700">
                    {error}
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <p className="text-sm text-gray-500">Total Escrows</p>
                    <p className="text-2xl font-bold text-gray-800">{escrows.length}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <p className="text-sm text-gray-500">Funds Locked</p>
                    <p className="text-2xl font-bold text-yellow-600">
                        ₹{escrows.filter(e => e.status === 'FUNDS_LOCKED')
                            .reduce((sum, e) => sum + (e.totalAmount || 0), 0)
                            .toLocaleString()}
                    </p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <p className="text-sm text-gray-500">Active</p>
                    <p className="text-2xl font-bold text-blue-600">
                        {escrows.filter(e => e.status === 'PARTIAL_RELEASED').length}
                    </p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <p className="text-sm text-gray-500">Completed</p>
                    <p className="text-2xl font-bold text-green-600">
                        {escrows.filter(e => e.status === 'COMPLETED').length}
                    </p>
                </div>
            </div>

            {/* Escrow List */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-gray-600 mt-2">Loading escrows...</p>
                </div>
            ) : escrows.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <FiDollarSign className="mx-auto text-gray-300 text-5xl mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No Escrows Yet</h3>
                    <p className="text-gray-500">
                        {role === 'INVESTOR' 
                            ? 'Create an escrow from a startup proposal'
                            : 'You will see escrows when investors fund your startups'}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {escrows.map((escrow) => (
                        <EscrowCard
                            key={escrow.escrowId}
                            escrow={escrow}
                            userRole={role}
                            onUpdate={loadEscrows}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default EscrowDashboard;