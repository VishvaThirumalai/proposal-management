import React, { useState, useEffect } from 'react';
import { investorService } from '../../services/investorService';
import { FiDollarSign, FiTrendingUp, FiRefreshCw, FiEye, FiBarChart2 } from 'react-icons/fi';

const Portfolio = () => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [portfolio, setPortfolio] = useState(null);
    const [investedProposals, setInvestedProposals] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        loadPortfolio();
    }, []);

    const loadPortfolio = async () => {
        setLoading(true);
        setError('');
        try {
            const [portfolioData, investedData] = await Promise.all([
                investorService.getPortfolio(),
                investorService.getInvestedProposals()
            ]);
            setPortfolio(portfolioData || { totalInvested: 0, startups: 0, totalReturns: 0 });
            setInvestedProposals(Array.isArray(investedData) ? investedData : []);
        } catch (err) {
            setError('Failed to load portfolio: ' + err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadPortfolio();
    };

    const totalInvested = portfolio?.totalInvested || 0;
    const totalStartups = portfolio?.startups || 0;
    const totalReturns = portfolio?.totalReturns || 0;

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <h1 className="text-2xl font-bold text-gray-800">📊 Portfolio</h1>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
                >
                    <FiRefreshCw className={refreshing ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-red-700">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-gray-600 mt-2">Loading portfolio...</p>
                </div>
            ) : (
                <>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                                    <FiDollarSign className="text-2xl" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Total Invested</p>
                                    <p className="text-2xl font-bold text-gray-800">₹{totalInvested.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                                    <FiBarChart2 className="text-2xl" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Startups</p>
                                    <p className="text-2xl font-bold text-gray-800">{totalStartups}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                                    <FiTrendingUp className="text-2xl" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Total Returns</p>
                                    <p className="text-2xl font-bold text-green-600">₹{totalReturns.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Investments List */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">📈 Your Investments</h2>
                        {investedProposals.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-gray-500">No investments yet</p>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {investedProposals.map((inv, index) => (
                                    <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                                        <div>
                                            <p className="font-medium text-gray-800">{inv.title}</p>
                                            <p className="text-sm text-gray-500">{inv.domain} • {inv.stage}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm font-medium text-green-600">
                                                ₹{inv.amount?.toLocaleString() || 'N/A'}
                                            </span>
                                            <span className="text-xs text-gray-400">{new Date(inv.grantedAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default Portfolio;