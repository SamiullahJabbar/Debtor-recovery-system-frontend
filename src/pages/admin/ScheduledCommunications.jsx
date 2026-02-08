import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import Modal from '../../components/common/Modal';
import scheduledCommunicationService from '../../services/scheduledCommunicationService';
import { userService } from '../../services/userService';
import { FiPlus, FiSend, FiClock, FiRepeat, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import { toast } from 'react-toastify';

const ScheduledCommunications = () => {
    const [communications, setCommunications] = useState([]);
    const [users, setUsers] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({
        template: '',
        recipients: [],
        send_date: '',
        is_recurring: false,
        frequency: 'daily',
        custom_subject: '',
        custom_content: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [commsData, usersData] = await Promise.all([
                scheduledCommunicationService.getScheduledCommunications(),
                userService.getUsers({ page_size: 100 })
            ]);
            setCommunications(commsData.results || commsData || []);
            setUsers(usersData.results || []);
        } catch (error) {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editItem) {
                await scheduledCommunicationService.updateScheduledCommunication(editItem.id, form);
                toast.success('Updated successfully!');
            } else {
                await scheduledCommunicationService.createScheduledCommunication(form);
                toast.success('Scheduled successfully!');
            }
            setShowModal(false);
            setEditItem(null);
            resetForm();
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Cancel this scheduled communication?')) return;
        try {
            await scheduledCommunicationService.deleteScheduledCommunication(id);
            toast.success('Cancelled successfully');
            fetchData();
        } catch (error) {
            toast.error('Failed to cancel');
        }
    };

    const handleToggleRecurring = async (id) => {
        try {
            await scheduledCommunicationService.toggleRecurring(id);
            toast.success('Updated successfully');
            fetchData();
        } catch (error) {
            toast.error('Failed to update');
        }
    };

    const handleSendNow = async (id) => {
        try {
            await scheduledCommunicationService.sendNow(id);
            toast.success('Queued for sending');
        } catch (error) {
            toast.error('Failed to send');
        }
    };

    const openAdd = () => {
        setEditItem(null);
        resetForm();
        setShowModal(true);
    };

    const openEdit = (item) => {
        setEditItem(item);
        setForm({
            template: item.template,
            recipients: item.recipients.map(r => r.id),
            send_date: item.send_date,
            is_recurring: item.is_recurring,
            frequency: item.frequency || 'daily',
            custom_subject: item.custom_subject || '',
            custom_content: item.custom_content || ''
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setForm({
            template: '',
            recipients: [],
            send_date: '',
            is_recurring: false,
            frequency: 'daily',
            custom_subject: '',
            custom_content: ''
        });
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: 'badge-orange',
            sent: 'badge-green',
            failed: 'badge-red',
            cancelled: 'badge-gray'
        };
        return badges[status] || 'badge-gray';
    };

    return (
        <Layout>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between page-header">
                <div>
                    <h1 className="page-title">Scheduled Communications</h1>
                    <p className="page-subtitle">{communications.length} scheduled messages</p>
                </div>
                <button onClick={openAdd} className="btn-primary btn-sm mt-4 sm:mt-0">
                    <FiPlus size={14} /> Schedule Message
                </button>
            </div>

            {/* Communications List */}
            {loading ? (
                <div className="grid grid-cols-1 gap-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="skeleton h-32 rounded-2xl" />
                    ))}
                </div>
            ) : communications.length === 0 ? (
                <div className="card p-12 text-center">
                    <FiClock className="mx-auto text-gray-300 mb-4" size={48} />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Scheduled Communications</h3>
                    <p className="text-gray-500 text-sm mb-4">Schedule your first automated message</p>
                    <button onClick={openAdd} className="btn-primary btn-sm">
                        <FiPlus size={14} /> Schedule Message
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {communications.map((comm) => (
                        <div key={comm.id} className="card-hover p-5">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="font-bold text-gray-900">{comm.template_name}</h3>
                                        <span className={`badge ${getStatusBadge(comm.status)} capitalize`}>
                                            {comm.status}
                                        </span>
                                        {comm.is_recurring && (
                                            <span className="badge badge-blue">
                                                <FiRepeat size={12} /> {comm.frequency}
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                                        <div className="flex items-center gap-2">
                                            <FiClock size={14} className="text-gray-400" />
                                            <span>Send: {new Date(comm.send_date).toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <FiSend size={14} className="text-gray-400" />
                                            <span>Recipients: {comm.recipients_data?.length || 0} users</span>
                                        </div>
                                        {comm.send_count > 0 && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-green-600">Sent {comm.send_count} times</span>
                                            </div>
                                        )}
                                        {comm.next_send_date && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-blue-600">Next: {new Date(comm.next_send_date).toLocaleString()}</span>
                                            </div>
                                        )}
                                    </div>

                                    {comm.custom_subject && (
                                        <p className="text-xs text-gray-500 mb-1">
                                            <strong>Subject:</strong> {comm.custom_subject}
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-2 flex-shrink-0">
                                    {comm.status === 'pending' && (
                                        <button
                                            onClick={() => handleSendNow(comm.id)}
                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                            title="Send Now"
                                        >
                                            <FiSend size={16} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleToggleRecurring(comm.id)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                        title="Toggle Recurring"
                                    >
                                        {comm.is_recurring ? <FiToggleRight size={16} /> : <FiToggleLeft size={16} />}
                                    </button>
                                    <button
                                        onClick={() => openEdit(comm)}
                                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                                    >
                                        <FiEdit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(comm.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                    >
                                        <FiTrash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Scheduled Communication' : 'Schedule New Communication'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="label">Template</label>
                        <select
                            value={form.template}
                            onChange={(e) => setForm({ ...form, template: e.target.value })}
                            className="input-field"
                            required
                        >
                            <option value="">Select template...</option>
                            {/* Add template options here */}
                        </select>
                    </div>

                    <div>
                        <label className="label">Recipients</label>
                        <select
                            multiple
                            value={form.recipients}
                            onChange={(e) => setForm({ ...form, recipients: Array.from(e.target.selectedOptions, option => option.value) })}
                            className="input-field h-32"
                            required
                        >
                            {users.map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.full_name} ({user.email})
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
                    </div>

                    <div>
                        <label className="label">Send Date & Time</label>
                        <input
                            type="datetime-local"
                            value={form.send_date}
                            onChange={(e) => setForm({ ...form, send_date: e.target.value })}
                            className="input-field"
                            required
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={form.is_recurring}
                            onChange={(e) => setForm({ ...form, is_recurring: e.target.checked })}
                            className="w-4 h-4"
                        />
                        <label className="text-sm font-medium text-gray-700">Recurring Message</label>
                    </div>

                    {form.is_recurring && (
                        <div>
                            <label className="label">Frequency</label>
                            <select
                                value={form.frequency}
                                onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                                className="input-field"
                            >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="label">Custom Subject (Optional)</label>
                        <input
                            type="text"
                            value={form.custom_subject}
                            onChange={(e) => setForm({ ...form, custom_subject: e.target.value })}
                            className="input-field"
                            placeholder="Override template subject..."
                        />
                    </div>

                    <div>
                        <label className="label">Custom Content (Optional)</label>
                        <textarea
                            value={form.custom_content}
                            onChange={(e) => setForm({ ...form, custom_content: e.target.value })}
                            className="input-field"
                            rows="3"
                            placeholder="Additional content to append..."
                        />
                    </div>

                    <div className="flex gap-2 justify-end pt-4">
                        <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary">
                            {editItem ? 'Update' : 'Schedule'}
                        </button>
                    </div>
                </form>
            </Modal>
        </Layout>
    );
};

export default ScheduledCommunications;
