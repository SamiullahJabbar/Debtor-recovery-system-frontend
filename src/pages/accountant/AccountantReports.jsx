import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { paymentService } from '../../services/paymentService';
import { debtorService } from '../../services/debtorService';
import { FiDownload, FiCalendar, FiDollarSign, FiTrendingUp } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AccountantReports = () => {
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [reportData, setReportData] = useState({
        total_recovered: 0,
        total_pending: 0,
        total_debtors: 0,
        settled_debtors: 0,
        monthly_data: []
    });

    useEffect(() => {
        // Set default date range (last 30 days)
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);

        setDateRange({
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
        });

        fetchReportData();
    }, []);

    const fetchReportData = async () => {
        try {
            setLoading(true);
            const [paymentsData, debtorsData] = await Promise.all([
                paymentService.getPayments({ page_size: 1000 }),
                debtorService.getDebtors({ page_size: 1000 })
            ]);

            const payments = paymentsData.results || [];
            const debtors = debtorsData.results || [];

            // Calculate totals
            const total_recovered = payments
                .filter(p => p.status === 'verified')
                .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

            const total_pending = debtors.reduce((sum, d) => sum + parseFloat(d.remaining_balance || 0), 0);
            const settled_debtors = debtors.filter(d => d.status === 'settled').length;

            // Monthly data (last 6 months)
            const monthlyData = [];
            for (let i = 5; i >= 0; i--) {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
                const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

                const monthPayments = payments.filter(p => {
                    const pDate = new Date(p.created_at);
                    return pDate >= monthStart && pDate <= monthEnd && p.status === 'verified';
                });

                const monthAmount = monthPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

                monthlyData.push({
                    month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                    amount: monthAmount,
                    count: monthPayments.length
                });
            }

            setReportData({
                total_recovered,
                total_pending,
                total_debtors: debtors.length,
                settled_debtors,
                monthly_data: monthlyData
            });
        } catch (error) {
            toast.error('Failed to load report data');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateReport = () => {
        toast.info('Report generation feature coming soon');
    };

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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between page-header">
                <div>
                    <h1 className="page-title">Financial Reports</h1>
                    <p className="page-subtitle">Comprehensive financial analytics and reports</p>
                </div>
                <button onClick={handleGenerateReport} className="btn-primary btn-sm mt-4 sm:mt-0">
                    <FiDownload size={14} /> Generate Report
                </button>
            </div>

            {/* Date Range Filter */}
            <div className="card p-4 mb-6">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <FiCalendar className="text-gray-400" size={20} />
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            className="input-field"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            className="input-field"
                        />
                    </div>
                    <button onClick={fetchReportData} className="btn-secondary btn-sm">
                        Apply Filter
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="card-hover p-5 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <FiDollarSign className="text-green-600 mb-2" size={24} />
                    <h3 className="text-3xl font-bold text-green-900">${reportData.total_recovered.toLocaleString()}</h3>
                    <p className="text-sm text-green-700 mt-1">Total Recovered</p>
                </div>

                <div className="card-hover p-5 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                    <FiTrendingUp className="text-orange-600 mb-2" size={24} />
                    <h3 className="text-3xl font-bold text-orange-900">${reportData.total_pending.toLocaleString()}</h3>
                    <p className="text-sm text-orange-700 mt-1">Total Pending</p>
                </div>

                <div className="card-hover p-5 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <FiDollarSign className="text-blue-600 mb-2" size={24} />
                    <h3 className="text-3xl font-bold text-blue-900">{reportData.total_debtors}</h3>
                    <p className="text-sm text-blue-700 mt-1">Total Debtors</p>
                </div>

                <div className="card-hover p-5 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <FiDollarSign className="text-purple-600 mb-2" size={24} />
                    <h3 className="text-3xl font-bold text-purple-900">{reportData.settled_debtors}</h3>
                    <p className="text-sm text-purple-700 mt-1">Settled Debtors</p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Monthly Recovery Trend */}
                <div className="card p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Monthly Recovery Trend</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={reportData.monthly_data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                            <Legend />
                            <Line type="monotone" dataKey="amount" stroke="#f97316" strokeWidth={2} name="Amount Recovered" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Payment Count Trend */}
                <div className="card p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Monthly Payment Count</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={reportData.monthly_data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Payment Count" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Report Summary */}
            <div className="card p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Report Summary</h3>
                <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Total Recovered Amount</span>
                        <span className="font-bold text-green-600">${reportData.total_recovered.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Total Pending Amount</span>
                        <span className="font-bold text-orange-600">${reportData.total_pending.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Recovery Rate</span>
                        <span className="font-bold text-blue-600">
                            {reportData.total_debtors > 0
                                ? ((reportData.settled_debtors / reportData.total_debtors) * 100).toFixed(1)
                                : 0}%
                        </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600">Average Recovery per Debtor</span>
                        <span className="font-bold text-purple-600">
                            ${reportData.total_debtors > 0
                                ? (reportData.total_recovered / reportData.total_debtors).toLocaleString()
                                : 0}
                        </span>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default AccountantReports;
