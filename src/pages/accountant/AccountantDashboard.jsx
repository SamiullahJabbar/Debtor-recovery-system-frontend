import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { paymentService } from '../../services/paymentService';
import { FiDollarSign, FiCheckCircle, FiClock, FiTrendingUp, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AccountantDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total_payments: 0,
        verified_payments: 0,
        pending_payments: 0,
        total_amount: 0,
        verified_amount: 0,
        pending_amount: 0
    });
    const [recentPayments, setRecentPayments] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const paymentsData = await paymentService.getPayments({ page_size: 100 });
            const payments = paymentsData.results || [];

            // Calculate stats
            const verified = payments.filter(p => p.status === 'verified');
            const pending = payments.filter(p => p.status === 'pending');

            setStats({
                total_payments: payments.length,
                verified_payments: verified.length,
                pending_payments: pending.length,
                total_amount: payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0),
                verified_amount: verified.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0),
                pending_amount: pending.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
            });

            setRecentPayments(payments.slice(0, 10));
        } catch (error) {
            toast.error('Failed to load dashboard data');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

    const statusData = [
        { name: 'Verified', value: stats.verified_payments },
        { name: 'Pending', value: stats.pending_payments },
    ];

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            {/* Header */}
            <div className="page-header mb-6">
                <div>
                    <h1 className="page-title">Accountant Dashboard</h1>
                    <p className="page-subtitle">Payment verification and financial overview</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="card-hover p-5 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                        <FiDollarSign className="text-blue-600" size={24} />
                        <span className="text-xs font-semibold text-blue-600 bg-blue-200 px-2 py-1 rounded-full">Total</span>
                    </div>
                    <h3 className="text-3xl font-bold text-blue-900">{stats.total_payments}</h3>
                    <p className="text-sm text-blue-700 mt-1">Total Payments</p>
                    <p className="text-xs text-blue-600 mt-2">${stats.total_amount.toLocaleString()}</p>
                </div>

                <div className="card-hover p-5 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <div className="flex items-center justify-between mb-2">
                        <FiCheckCircle className="text-green-600" size={24} />
                        <span className="text-xs font-semibold text-green-600 bg-green-200 px-2 py-1 rounded-full">Verified</span>
                    </div>
                    <h3 className="text-3xl font-bold text-green-900">{stats.verified_payments}</h3>
                    <p className="text-sm text-green-700 mt-1">Verified Payments</p>
                    <p className="text-xs text-green-600 mt-2">${stats.verified_amount.toLocaleString()}</p>
                </div>

                <div className="card-hover p-5 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                    <div className="flex items-center justify-between mb-2">
                        <FiClock className="text-orange-600" size={24} />
                        <span className="text-xs font-semibold text-orange-600 bg-orange-200 px-2 py-1 rounded-full">Pending</span>
                    </div>
                    <h3 className="text-3xl font-bold text-orange-900">{stats.pending_payments}</h3>
                    <p className="text-sm text-orange-700 mt-1">Pending Verification</p>
                    <p className="text-xs text-orange-600 mt-2">${stats.pending_amount.toLocaleString()}</p>
                </div>

                <div className="card-hover p-5 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                        <FiTrendingUp className="text-purple-600" size={24} />
                        <span className="text-xs font-semibold text-purple-600 bg-purple-200 px-2 py-1 rounded-full">Rate</span>
                    </div>
                    <h3 className="text-3xl font-bold text-purple-900">
                        {stats.total_payments > 0 ? ((stats.verified_payments / stats.total_payments) * 100).toFixed(1) : 0}%
                    </h3>
                    <p className="text-sm text-purple-700 mt-1">Verification Rate</p>
                    <p className="text-xs text-purple-600 mt-2">Of all payments</p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Payment Status Distribution */}
                <div className="card p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Status Distribution</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={statusData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                label
                            >
                                {statusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Amount Breakdown */}
                <div className="card p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Amount Breakdown</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={[
                            { name: 'Verified', amount: stats.verified_amount },
                            { name: 'Pending', amount: stats.pending_amount }
                        ]}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                            <Bar dataKey="amount" fill="#f97316" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent Payments */}
            <div className="card p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Payments</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Debtor</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Method</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentPayments.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-8 text-gray-500">
                                        No payments found
                                    </td>
                                </tr>
                            ) : (
                                recentPayments.map((payment) => (
                                    <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4 text-sm text-gray-900">
                                            {payment.debtor?.full_name || 'N/A'}
                                        </td>
                                        <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                                            ${parseFloat(payment.amount || 0).toLocaleString()}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-600 capitalize">
                                            {payment.payment_method}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`badge ${payment.status === 'verified' ? 'badge-green' : 'badge-orange'} capitalize`}>
                                                {payment.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-600">
                                            {new Date(payment.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
};

export default AccountantDashboard;
