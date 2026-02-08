import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { FiUsers, FiDollarSign, FiTrendingUp, FiClock, FiBriefcase, FiCheckCircle, FiAlertCircle, FiActivity } from 'react-icons/fi';
import { reportService } from '../../services/reportService';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title);

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try { const r = await reportService.getDashboardStats(); setStats(r.data || r); }
            catch (e) { console.error('Dashboard error:', e); }
            finally { setLoading(false); }
        })();
    }, []);

    const cards = stats ? [
        { label: 'Total Debtors', value: stats.total_debtors, icon: FiUsers, color: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/20' },
        { label: 'Active Debtors', value: stats.active_debtors, icon: FiActivity, color: 'from-orange-500 to-orange-600', shadow: 'shadow-orange-500/20' },
        { label: 'Total Recovered', value: `$${(stats.total_amount_recovered || 0).toLocaleString()}`, icon: FiDollarSign, color: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-500/20' },
        { label: 'Pending Amount', value: `$${(stats.total_pending_amount || 0).toLocaleString()}`, icon: FiTrendingUp, color: 'from-amber-500 to-amber-600', shadow: 'shadow-amber-500/20' },
        { label: 'Recovery Rate', value: `${stats.recovery_rate || 0}%`, icon: FiCheckCircle, color: 'from-violet-500 to-violet-600', shadow: 'shadow-violet-500/20' },
        { label: 'Total Clients', value: stats.total_clients, icon: FiBriefcase, color: 'from-cyan-500 to-cyan-600', shadow: 'shadow-cyan-500/20' },
        { label: 'Monthly Recovery', value: `$${(stats.monthly_recovery || 0).toLocaleString()}`, icon: FiDollarSign, color: 'from-teal-500 to-teal-600', shadow: 'shadow-teal-500/20' },
        { label: 'Pending Payments', value: stats.pending_payments || 0, icon: FiAlertCircle, color: 'from-red-500 to-red-600', shadow: 'shadow-red-500/20' },
    ] : [];

    const donutData = stats?.status_breakdown ? {
        labels: ['New', 'In Progress', 'Settled', 'Closed'],
        datasets: [{
            data: [stats.status_breakdown.new || 0, stats.status_breakdown.in_progress || 0, stats.status_breakdown.settled || 0, stats.status_breakdown.closed || 0],
            backgroundColor: ['#3B82F6', '#F97316', '#10B981', '#6B7280'], borderWidth: 0, borderRadius: 4
        }]
    } : null;

    const barData = stats ? {
        labels: ['Loan Amount', 'Recovered', 'Pending'],
        datasets: [{
            data: [stats.total_loan_amount || 0, stats.total_amount_recovered || 0, stats.total_pending_amount || 0],
            backgroundColor: ['#3B82F6', '#10B981', '#F97316'], borderRadius: 8, borderSkipped: false
        }]
    } : null;

    // Recovery trends line chart
    const recoveryTrendData = stats?.recovery_trends ? {
        labels: stats.recovery_trends.map(t => t.month),
        datasets: [{
            label: 'Recovery Amount',
            data: stats.recovery_trends.map(t => t.amount),
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#10B981',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
        }]
    } : null;

    if (loading) return <Layout><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">{[...Array(8)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}</div></Layout>;

    return (
        <Layout>
            <div className="page-header"><h1 className="page-title">Dashboard</h1><p className="page-subtitle">Overview of your debt recovery operations</p></div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {cards.map((c, i) => {
                    const Icon = c.icon;
                    return (<div key={i} className="card-hover p-5 animate-slideUp" style={{ animationDelay: `${i * 50}ms` }}>
                        <div className="flex items-start justify-between">
                            <div><p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{c.label}</p><p className="text-2xl font-bold text-gray-900 mt-1">{c.value}</p></div>
                            <div className={`p-2.5 bg-gradient-to-br ${c.color} rounded-xl shadow-lg ${c.shadow}`}><Icon size={18} className="text-white" /></div>
                        </div>
                    </div>);
                })}
            </div>

            {/* Status Breakdown and Financial Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {donutData && <div className="card p-6"><h3 className="text-sm font-bold text-gray-900 mb-4">Status Breakdown</h3><div className="max-w-[240px] mx-auto"><Doughnut data={donutData} options={{ cutout: '65%', plugins: { legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyle: 'circle', font: { size: 11, family: 'Plus Jakarta Sans' } } } } }} /></div></div>}
                {barData && <div className="card p-6"><h3 className="text-sm font-bold text-gray-900 mb-4">Financial Overview</h3><Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: '#f3f4f6' }, ticks: { callback: (value) => `$${value.toLocaleString()}` } }, x: { grid: { display: false } } } }} /></div>}
            </div>

            {/* Recovery Trends */}
            {recoveryTrendData && <div className="card p-6 mb-8">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Recovery Trends (Last 6 Months)</h3>
                <Line data={recoveryTrendData} options={{
                    responsive: true,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            padding: 12,
                            titleFont: { size: 13 },
                            bodyFont: { size: 12 },
                            callbacks: {
                                label: (context) => `Amount: $${context.parsed.y.toLocaleString()}`
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: '#f3f4f6' },
                            ticks: {
                                callback: (value) => `$${value.toLocaleString()}`
                            }
                        },
                        x: { grid: { display: false } }
                    }
                }} />
            </div>}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { to: '/admin/clients', title: 'Manage Clients', desc: 'Add, edit or view clients', icon: FiBriefcase },
                    { to: '/admin/debtors', title: 'Manage Debtors', desc: 'Track debtor accounts', icon: FiUsers },
                    { to: '/admin/payments', title: 'Payments', desc: 'Review payment requests', icon: FiDollarSign },
                ].map((q, i) => (
                    <Link key={i} to={q.to} className="card-hover p-5 group">
                        <div className="flex items-center gap-4"><div className="p-3 bg-orange-50 rounded-xl group-hover:bg-orange-100 transition-colors"><q.icon size={20} className="text-orange-500" /></div>
                            <div><h3 className="font-semibold text-gray-900 text-sm">{q.title}</h3><p className="text-xs text-gray-400">{q.desc}</p></div></div>
                    </Link>
                ))}
            </div>
        </Layout>
    );
};

export default Dashboard;
