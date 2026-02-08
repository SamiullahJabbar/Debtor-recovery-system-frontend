import React, { useState } from 'react';
import Layout from '../../components/common/Layout';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { FiUser, FiMail, FiPhone, FiTrendingUp, FiCheckCircle, FiUsers, FiDollarSign, FiActivity } from 'react-icons/fi';
import { toast } from 'react-toastify';

const TeamProfile = () => {
    const { user, updateUser } = useAuth();
    const [editMode, setEditMode] = useState(false);
    const [form, setForm] = useState({
        full_name: user?.full_name || '',
        phone_number: user?.phone_number || ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await userService.updateProfile(form);
            updateUser({ ...user, ...form });
            toast.success('Profile updated successfully!');
            setEditMode(false);
        } catch (error) {
            toast.error('Failed to update profile');
        }
    };

    const StatCard = ({ icon: Icon, label, value, color, prefix = '' }) => (
        <div className="card p-5">
            <div className="flex items-center gap-3 mb-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${color} shadow-sm`}>
                    <Icon size={20} className="text-white" />
                </div>
                <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
                    <p className="text-2xl font-bold text-gray-900">{prefix}{typeof value === 'number' ? value.toLocaleString() : value}</p>
                </div>
            </div>
        </div>
    );

    return (
        <Layout>
            <div className="page-header">
                <div>
                    <h1 className="page-title">My Profile</h1>
                    <p className="page-subtitle">Manage your account and view performance</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Information */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="card p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-bold text-gray-900">Personal Information</h3>
                            {!editMode && (
                                <button onClick={() => setEditMode(true)} className="btn-secondary btn-sm">
                                    Edit Profile
                                </button>
                            )}
                        </div>

                        {editMode ? (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 mb-2 block">Full Name</label>
                                    <input
                                        type="text"
                                        value={form.full_name}
                                        onChange={e => setForm({ ...form, full_name: e.target.value })}
                                        className="input-field"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 mb-2 block">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={form.phone_number}
                                        onChange={e => setForm({ ...form, phone_number: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button type="submit" className="btn-primary flex-1">Save Changes</button>
                                    <button type="button" onClick={() => setEditMode(false)} className="btn-secondary flex-1">Cancel</button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                                    <FiUser className="text-gray-400" size={18} />
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase">Full Name</p>
                                        <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                                    <FiMail className="text-gray-400" size={18} />
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase">Email</p>
                                        <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                                    </div>
                                </div>
                                {user?.phone_number && (
                                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                                        <FiPhone className="text-gray-400" size={18} />
                                        <div>
                                            <p className="text-xs text-gray-400 uppercase">Phone</p>
                                            <p className="text-sm font-medium text-gray-900">{user.phone_number}</p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-xl">
                                    <FiCheckCircle className="text-orange-500" size={18} />
                                    <div>
                                        <p className="text-xs text-orange-600 uppercase font-semibold">Role</p>
                                        <p className="text-sm font-bold text-orange-700">Team Member</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Performance Overview */}
                <div className="space-y-6">
                    <div className="card p-6">
                        <h3 className="text-sm font-bold text-gray-900 mb-4">Performance Overview</h3>
                        <div className="space-y-3">
                            <StatCard
                                icon={FiUsers}
                                label="Total Debtors"
                                value={user?.total_debtors_count || 0}
                                color="from-blue-400 to-blue-600"
                            />
                            <StatCard
                                icon={FiActivity}
                                label="Active Debtors"
                                value={user?.active_debtors_count || 0}
                                color="from-emerald-400 to-emerald-600"
                            />
                            <StatCard
                                icon={FiCheckCircle}
                                label="Recovered"
                                value={user?.total_recovered_amount || 0}
                                color="from-green-400 to-green-600"
                                prefix="$"
                            />
                            <StatCard
                                icon={FiDollarSign}
                                label="Pending"
                                value={user?.total_pending_amount || 0}
                                color="from-orange-400 to-orange-600"
                                prefix="$"
                            />
                        </div>
                    </div>

                    <div className="card p-6">
                        <h3 className="text-sm font-bold text-gray-900 mb-4">Recovery Rate</h3>
                        <div className="text-center mb-4">
                            <p className="text-4xl font-bold text-orange-600">
                                {user?.total_recovered_amount && user?.total_pending_amount
                                    ? `${((user.total_recovered_amount / (user.total_recovered_amount + user.total_pending_amount)) * 100).toFixed(1)}%`
                                    : '0%'}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">of total amount</p>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-3">
                            <div
                                className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all"
                                style={{
                                    width: user?.total_recovered_amount && user?.total_pending_amount
                                        ? `${((user.total_recovered_amount / (user.total_recovered_amount + user.total_pending_amount)) * 100)}%`
                                        : '0%'
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default TeamProfile;
