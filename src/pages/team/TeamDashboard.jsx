import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import performanceService from '../../services/performanceService';
import { debtorService } from '../../services/debtorService';
import { FiDollarSign, FiUsers, FiTrendingUp, FiActivity, FiMail, FiMessageSquare, FiFileText } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TeamDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [performance, setPerformance] = useState(null);
    const [debtors, setDebtors] = useState([]);
    const [activities, setActivities] = useState([]);

    useEffect(() => {
        fetchData();
        
        // Auto-refresh every 10 seconds to show quicker payment updates
        const interval = setInterval(() => {
            fetchData();
        }, 10000);
        
        // Also refresh when tab becomes visible again
        const handleVisibility = () => { if (!document.hidden) fetchData(); };
        document.addEventListener('visibilitychange', handleVisibility);
        
        return () => { clearInterval(interval); document.removeEventListener('visibilitychange', handleVisibility); };
    }, []);

    const fetchData = async () => {
        try {
            const [perfData, debtorsData, activitiesData] = await Promise.all([
                performanceService.getMyPerformance(),
                debtorService.getMyAssignedDebtors({ page_size: 5 }),
                performanceService.getRecentActivities()
            ]);

            setPerformance(perfData);
            setDebtors(debtorsData.results || []);
            setActivities(activitiesData.slice(0, 10));
        } catch (error) {
            // Hide API errors
            // Hide console errors
        } finally {
            setLoading(false);
        }
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

    const COLORS = ['#f97316', '#3b82f6', '#10b981', '#ef4444'];

    return (
        <Layout>
            {/* Header */}
            <div className="page-header mb-6 flex items-center justify-between">
                <div>
                    <h1 className="page-title">My Dashboard</h1>
                    <p className="page-subtitle">Welcome back! Here's your performance overview</p>
                </div>
                <button onClick={fetchData} className="btn-ghost btn-sm">Refresh Now</button>
            </div>

            {/* Stats Cards - Admin Dashboard Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                    { 
                        label: 'Total Debtors', 
                        value: performance?.performance?.total_debtors || 0, 
                        icon: FiUsers, 
                        bgColor: 'bg-blue-50', 
                        textColor: 'text-blue-600', 
                        valueColor: 'text-blue-900',
                        shadow: 'shadow-blue-500/20',
                        subtitle: `${performance?.performance?.active_debtors || 0} active, ${performance?.performance?.settled_debtors || 0} settled`
                    },
                    { 
                        label: 'Total Recovered', 
                        value: `$${(performance?.performance?.total_recovered_amount || 0).toLocaleString()}`, 
                        icon: FiDollarSign, 
                        bgColor: 'bg-green-50', 
                        textColor: 'text-green-600', 
                        valueColor: 'text-green-900',
                        shadow: 'shadow-green-500/20',
                        subtitle: `${(performance?.performance?.recovery_rate || 0).toFixed(1)}% recovery rate`
                    },
                    { 
                        label: 'Pending Amount', 
                        value: `$${(performance?.performance?.total_pending_amount || 0).toLocaleString()}`, 
                        icon: FiTrendingUp, 
                        bgColor: 'bg-orange-50', 
                        textColor: 'text-orange-600', 
                        valueColor: 'text-orange-900',
                        shadow: 'shadow-orange-500/20',
                        subtitle: `From ${performance?.performance?.active_debtors || 0} active debtors`
                    },
                    { 
                        label: 'Communications', 
                        value: performance?.communications?.total || 0, 
                        icon: FiActivity, 
                        bgColor: 'bg-purple-50', 
                        textColor: 'text-purple-600', 
                        valueColor: 'text-purple-900',
                        shadow: 'shadow-purple-500/20',
                        subtitle: `${performance?.communications?.emails_sent || 0} emails, ${performance?.communications?.sms_sent || 0} SMS`
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

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Monthly Recovery */}
                {performance?.charts?.monthly_recovery && (
                    <div className="card p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Monthly Recovery Trend</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={performance.charts.monthly_recovery}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                                <Bar dataKey="amount" fill="#f97316" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Debtor Status */}
                {performance?.charts?.debtor_status && (
                    <div className="card p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Debtor Status Distribution</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={performance.charts.debtor_status}
                                    dataKey="count"
                                    nameKey="status"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    label
                                >
                                    {performance.charts.debtor_status.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* Communication Stats */}
            <div className="card p-6 mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Communication Breakdown</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                        <FiMail className="text-blue-600" size={20} />
                        <div>
                            <p className="text-2xl font-bold text-blue-900">{performance?.communications?.emails_sent || 0}</p>
                            <p className="text-xs text-blue-600">Emails</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                        <FiMessageSquare className="text-green-600" size={20} />
                        <div>
                            <p className="text-2xl font-bold text-green-900">{performance?.communications?.sms_sent || 0}</p>
                            <p className="text-xs text-green-600">SMS</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                        <FiFileText className="text-orange-600" size={20} />
                        <div>
                            <p className="text-2xl font-bold text-orange-900">{performance?.communications?.notes_added || 0}</p>
                            <p className="text-xs text-orange-600">Notes</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                        <FiDollarSign className="text-purple-600" size={20} />
                        <div>
                            <p className="text-2xl font-bold text-purple-900">{performance?.activities?.payments_recorded || 0}</p>
                            <p className="text-xs text-purple-600">Payments</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activities */}
            <div className="card p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activities</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {activities.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No recent activities</p>
                    ) : (
                        activities.map((activity) => (
                            <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                                    {activity.debtor && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            Debtor: {activity.debtor.full_name} ({activity.debtor.debtor_id})
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-400 mt-1">
                                        {new Date(activity.created_at).toLocaleString()}
                                    </p>
                                </div>
                                <span className="text-xs px-2 py-1 bg-orange-100 text-orange-600 rounded-full">
                                    {activity.activity_type.replace('_', ' ')}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default TeamDashboard;
