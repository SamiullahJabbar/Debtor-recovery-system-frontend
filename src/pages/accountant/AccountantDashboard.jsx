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
            // Hide API errors
            // Hide console errors
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        
        // Auto-refresh every 10 seconds
        const interval = setInterval(fetchData, 10000);
        
        // Also refresh when tab becomes visible again
        const handleVisibility = () => { if (!document.hidden) fetchData(); };
        document.addEventListener('visibilitychange', handleVisibility);
        
        return () => { clearInterval(interval); document.removeEventListener('visibilitychange', handleVisibility); };
    }, []);

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
            <div className="page-header mb-6 flex items-center justify-between">
                <div>
                    <h1 className="page-title">Accountant Dashboard</h1>
                    <p className="page-subtitle">Payment verification and financial overview</p>
                </div>
                <button onClick={fetchData} className="btn-ghost btn-sm">Refresh Now</button>
            </div>

            {/* Stats Cards - Admin Dashboard Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                    { 
                        label: 'Total Payments', 
                        value: stats.total_payments, 
                        icon: FiDollarSign, 
                        bgColor: 'bg-blue-50', 
                        textColor: 'text-blue-600', 
                        valueColor: 'text-blue-900',
                        shadow: 'shadow-blue-500/20',
                        subtitle: `$${stats.total_amount.toLocaleString()}`
                    },
                    { 
                        label: 'Verified Payments', 
                        value: stats.verified_payments, 
                        icon: FiCheckCircle, 
                        bgColor: 'bg-green-50', 
                        textColor: 'text-green-600', 
                        valueColor: 'text-green-900',
                        shadow: 'shadow-green-500/20',
                        subtitle: `$${stats.verified_amount.toLocaleString()}`
                    },
                    { 
                        label: 'Pending Verification', 
                        value: stats.pending_payments, 
                        icon: FiClock, 
                        bgColor: 'bg-orange-50', 
                        textColor: 'text-orange-600', 
                        valueColor: 'text-orange-900',
                        shadow: 'shadow-orange-500/20',
                        subtitle: `$${stats.pending_amount.toLocaleString()}`
                    },
                    { 
                        label: 'Verification Rate', 
                        value: `${stats.total_payments > 0 ? ((stats.verified_payments / stats.total_payments) * 100).toFixed(1) : 0}%`, 
                        icon: FiTrendingUp, 
                        bgColor: 'bg-purple-50', 
                        textColor: 'text-purple-600', 
                        valueColor: 'text-purple-900',
                        shadow: 'shadow-purple-500/20',
                        subtitle: 'Of all payments'
                    }
                ].map((stat, i) => {
                    const IconComponent = stat.icon;
                    return (
                        <div key={i} className={`bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-200 hover:border-gray-200 animate-slideUp`} style={{ animationDelay: `${i * 100}ms` }}>
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-14 h-14 ${stat.bgColor} rounded-2xl flex items-center justify-center ${stat.shadow}`}>
                                    <IconComponent size={24} className={stat.textColor} />
                                </div>
                                <div className={`px-3 py-1 ${stat.bgColor} rounded-full`}>
                                    <span className={`text-xs font-semibold ${stat.textColor}`}>Live</span>
                                </div>
                            </div>
                            <h3 className={`text-3xl font-bold mb-1 ${stat.valueColor}`}>{stat.value}</h3>
                            <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                            <p className={`text-xs mt-2 ${stat.textColor.replace('600', '500')}`}>{stat.subtitle}</p>
                            <div className="mt-3 flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 ${stat.bgColor} rounded-full`}></div>
                                <span className="text-xs text-gray-500">Updated now</span>
                            </div>
                        </div>
                    );
                })}
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
