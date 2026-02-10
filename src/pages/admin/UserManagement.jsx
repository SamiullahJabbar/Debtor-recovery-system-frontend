import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import Modal from '../../components/common/Modal';
import { userService } from '../../services/userService';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiUserCheck } from 'react-icons/fi';
import { toast } from 'react-toastify';

const UserManagement = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [form, setForm] = useState({ full_name: '', email: '', phone_number: '', role: 'team_member', job_title: '', password: '' });

    useEffect(() => { fetch(); }, []);
    const fetch = async () => { try { const r = await userService.getUsers({ page_size: 100 }); setUsers(r.results || []); } catch { /* Hide API errors */ } finally { setLoading(false); } };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editUser) { await userService.updateUser(editUser.id, form); toast.success('Updated!'); }
            else { await userService.createUser(form); toast.success('Created!'); }
            setShowModal(false); setEditUser(null); fetch();
        } catch (err) { /* Hide API errors */ }
    };

    const openEdit = u => { setEditUser(u); setForm({ full_name: u.full_name, email: u.email, phone_number: u.phone_number || '', role: u.role, job_title: u.job_title || '', password: '' }); setShowModal(true); };
    const openAdd = () => { setEditUser(null); setForm({ full_name: '', email: '', phone_number: '', role: 'team_member', job_title: '', password: '' }); setShowModal(true); };
    const handleDelete = async id => { if (!confirm('Delete?')) return; try { await userService.deleteUser(id); toast.success('Deleted'); fetch(); } catch { /* Hide API errors */ } };

    const handleCardClick = (user) => {
        if (user.role === 'team_member') {
            navigate(`/admin/team/${user.id}/performance`);
        }
    };

    const filtered = users.filter(u => u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
    const roleColor = r => ({ admin: 'badge-purple', team_member: 'badge-orange', accountant: 'badge-blue' }[r] || 'badge-gray');

    return (
        <Layout>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between page-header">
                <div><h1 className="page-title">Team Members</h1><p className="page-subtitle">{users.length} users</p></div>
                <button onClick={openAdd} className="btn-primary btn-sm mt-4 sm:mt-0"><FiPlus size={14} />Add User</button>
            </div>

            <div className="relative max-w-md mb-6"><FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} /><input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9 text-sm" /></div>

            {loading ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-36 rounded-2xl" />)}</div>
                : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{filtered.map((u, i) => (
                    <div
                        key={u.id}
                        className={`card-hover p-5 animate-slideUp ${u.role === 'team_member' ? 'cursor-pointer' : ''}`}
                        style={{ animationDelay: `${i * 40}ms` }}
                        onClick={() => handleCardClick(u)}
                    >
                        <div className="flex items-start gap-3">
                            <div className="w-11 h-11 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-sm shadow-orange-500/20"><span className="text-white font-bold">{u.full_name.charAt(0)}</span></div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between"><h3 className="font-bold text-gray-900 text-sm truncate">{u.full_name}</h3>
                                    <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                        <button onClick={() => openEdit(u)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg"><FiEdit2 size={12} /></button>
                                        <button onClick={() => handleDelete(u.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><FiTrash2 size={12} /></button>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 truncate">{u.email}</p>
                                <div className="flex gap-2 mt-2"><span className={`badge ${roleColor(u.role)} capitalize`}>{u.role.replace('_', ' ')}</span>{!u.is_active && <span className="badge badge-red">Inactive</span>}</div>
                                {u.job_title && <p className="text-xs text-gray-400 mt-2">{u.job_title}</p>}
                            </div>
                        </div>
                    </div>
                ))}</div>}

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editUser ? 'Edit User' : 'Add New User'} maxWidth="max-w-lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Full Name *</label><input required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="input-field" /></div>
                    <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Email *</label><input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-field" disabled={!!editUser} /></div>
                    <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Phone</label><input value={form.phone_number} onChange={e => setForm({ ...form, phone_number: e.target.value })} className="input-field" /></div>
                    <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Role *</label><select required value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="select-field"><option value="team_member">Team Member</option><option value="accountant">Accountant</option><option value="admin">Admin</option></select></div>
                    <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Job Title</label><input value={form.job_title} onChange={e => setForm({ ...form, job_title: e.target.value })} className="input-field" /></div>
                    {!editUser && <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Password *</label><input type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="input-field" /></div>}
                    <div className="flex gap-3 pt-2"><button type="submit" className="btn-primary flex-1">{editUser ? 'Update' : 'Create'}</button><button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button></div>
                </form>
            </Modal>
        </Layout>
    );
};

export default UserManagement;
