import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import performanceService from '../../services/performanceService';
import { FiArrowLeft, FiDollarSign, FiUsers, FiTrendingUp, FiMail, FiMessageSquare, FiPhone, FiFileText } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TeamMemberPerformance = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        fetchPerformance();
    }, [id]);

    const fetchPerformance = async () => {
        try {
            const response = await performanceService.getTeamMemberPerformance(id);
            setData(response);
        } catch (error) {
            toast.error('Failed to load performance data');
            console.error(error);
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

    if (!data) {
        return (
            <Layout>
                <div className="text-center py-12">
                    <p className="text-gray-500">No data available</p>
                </div>
            </Layout>
        );
    }

    const COLORS = ['#f97316', '#3b82f6', '#10b981', '#ef4444'];

    return (
        <Layout>
            {/* Header */}
            <div className="mb-6">
                <button onClick={() => navigate('/admin/users')} className="flex items-center gap-2 text-gray-600 hover:text-orange-500 mb-4 transition-colors">
                    <FiArrowLeft /> Back to Team Members
                </button>
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-2xl">{data.user.full_name.charAt(0)}</span>
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{data.user.full_name}</h1>
                        <p className="text-gray-500">{data.user.email} • {data.user.job_title || 'Team Member'}</p>
                    </div>
                </div>
            </div>

            {/* Performance Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="card-hover p-5 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                        <FiUsers className="text-blue-600" size={24} />
                        <span className="text-xs font-semibold text-blue-600 bg-blue-200 px-2 py-1 rounded-full">Total</span>
                    </div>
                    <h3 className="text-3xl font-bold text-blue-900">{data.performance.total_debtors}</h3>
                    <p className="text-sm text-blue-700 mt-1">Total Debtors</p>
                    <p className="text-xs text-blue-600 mt-2">{data.performance.active_debtors} active, {data.performance.settled_debtors} settled</p>
                </div>

                <div className="card-hover p-5 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <div className="flex items-center justify-between mb-2">
                        <FiDollarSign className="text-green-600" size={24} />
                        <span className="text-xs font-semibold text-green-600 bg-green-200 px-2 py-1 rounded-full">Recovered</span>
                    </div>
                    <h3 className="text-3xl font-bold text-green-900">${data.performance.total_recovered_amount.toLocaleString()}</h3>
                    <p className="text-sm text-green-700 mt-1">Total Recovered</p>
                    <p className="text-xs text-green-600 mt-2">{data.performance.recovery_rate.toFixed(1)}% recovery rate</p>
                </div>

                <div className="card-hover p-5 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                    <div className="flex items-center justify-between mb-2">
                        <FiTrendingUp className="text-orange-600" size={24} />
                        <span className="text-xs font-semibold text-orange-600 bg-orange-200 px-2 py-1 rounded-full">Pending</span>
                    </div>
                    <h3 className="text-3xl font-bold text-orange-900">${data.performance.total_pending_amount.toLocaleString()}</h3>
                    <p className="text-sm text-orange-700 mt-1">Pending Amount</p>
                    <p className="text-xs text-orange-600 mt-2">From {data.performance.active_debtors} active debtors</p>
                </div>

                <div className="card-hover p-5 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                        <FiMail className="text-purple-600" size={24} />
                        <span className="text-xs font-semibold text-purple-600 bg-purple-200 px-2 py-1 rounded-full">Comms</span>
                    </div>
                    <h3 className="text-3xl font-bold text-purple-900">{data.communications.total}</h3>
                    <p className="text-sm text-purple-700 mt-1">Total Communications</p>
                    <p className="text-xs text-purple-600 mt-2">{data.communications.emails_sent} emails, {data.communications.sms_sent} SMS</p>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Monthly Recovery Chart */}
                <div className="card p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Monthly Recovery Trend</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data.charts.monthly_recovery}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                            <Bar dataKey="amount" fill="#f97316" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Debtor Status Distribution */}
                <div className="card p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Debtor Status Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={data.charts.debtor_status} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={100} label>
                                {data.charts.debtor_status.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Communication Stats */}
            <div className="card p-6 mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Communication Breakdown</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                        <FiMail className="text-blue-600" size={20} />
                        <div>
                            <p className="text-2xl font-bold text-blue-900">{data.communications.emails_sent}</p>
                            <p className="text-xs text-blue-600">Emails Sent</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                        <FiMessageSquare className="text-green-600" size={20} />
                        <div>
                            <p className="text-2xl font-bold text-green-900">{data.communications.sms_sent}</p>
                            <p className="text-xs text-green-600">SMS Sent</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                        <FiPhone className="text-orange-600" size={20} />
                        <div>
                            <p className="text-2xl font-bold text-orange-900">{data.communications.calls_made}</p>
                            <p className="text-xs text-orange-600">Calls Made</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                        <FiFileText className="text-purple-600" size={20} />
                        <div>
                            <p className="text-2xl font-bold text-purple-900">{data.communications.notes_added}</p>
                            <p className="text-xs text-purple-600">Notes Added</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activities */}
            <div className="card p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activities</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {data.recent_activities.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No recent activities</p>
                    ) : (
                        data.recent_activities.map((activity) => (
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

export default TeamMemberPerformance;
