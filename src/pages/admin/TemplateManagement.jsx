import React, { useState, useEffect, useRef } from 'react';
import Layout from '../../components/common/Layout';
import Modal from '../../components/common/Modal';
import { communicationService } from '../../services/communicationService';
import { FiPlus, FiEdit2, FiTrash2, FiMail, FiMessageSquare, FiFileText, FiImage, FiFile, FiEye, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';

const TemplateManagement = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [previewTemplate, setPreviewTemplate] = useState(null);
    const [edit, setEdit] = useState(null);
    const [form, setForm] = useState({ name: '', type: 'email', subject: '', content_type: 'text', content: '', template_image: null });
    const [imagePreview, setImagePreview] = useState(null);
    const fileRef = useRef(null);

    useEffect(() => { fetch(); }, []);
    const fetch = async () => { try { const r = await communicationService.getTemplates(); setTemplates(r.results || r || []); } catch { toast.error('Failed'); } finally { setLoading(false); } };

    const openAdd = () => {
        setEdit(null);
        setForm({ name: '', type: 'email', subject: '', content_type: 'text', content: '', template_image: null });
        setImagePreview(null);
        setShowModal(true);
    };

    const openEdit = t => {
        setEdit(t);
        setForm({ name: t.name, type: t.type, subject: t.subject || '', content_type: t.content_type || 'text', content: t.content || '', template_image: null });
        setImagePreview(t.image_url || null);
        setShowModal(true);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setForm({ ...form, template_image: file });
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async e => {
        e.preventDefault();

        try {
            if (edit) {
                // For update, send as FormData if image is being uploaded
                if (form.template_image) {
                    const fd = new FormData();
                    fd.append('name', form.name);
                    fd.append('type', form.type);
                    fd.append('content_type', form.content_type);
                    if (form.subject) fd.append('subject', form.subject);
                    if (form.content) fd.append('content', form.content);
                    fd.append('template_image', form.template_image);
                    await communicationService.updateTemplate(edit.id, fd);
                } else {
                    // Send as JSON if no image
                    const data = {
                        name: form.name,
                        type: form.type,
                        content_type: form.content_type,
                        subject: form.subject || '',
                        content: form.content || ''
                    };
                    await communicationService.updateTemplate(edit.id, data);
                }
                toast.success('Updated!');
            } else {
                // For create, always use FormData
                const fd = new FormData();
                fd.append('name', form.name);
                fd.append('type', form.type);
                fd.append('content_type', form.content_type);
                if (form.subject) fd.append('subject', form.subject);
                if (form.content) fd.append('content', form.content);
                if (form.template_image) fd.append('template_image', form.template_image);
                await communicationService.createTemplate(fd);
                toast.success('Created!');
            }
            setShowModal(false);
            fetch();
        } catch (err) {
            console.error('Template error:', err);
            const errorMsg = err.response?.data?.errors?.template_image?.[0] ||
                err.response?.data?.message ||
                'Failed to save template';
            toast.error(errorMsg);
        }
    };


    const handleDelete = async id => { if (!confirm('Delete template?')) return; try { await communicationService.deleteTemplate(id); toast.success('Deleted'); fetch(); } catch { toast.error('Failed'); } };

    const openPreview = (t) => { setPreviewTemplate(t); setShowPreview(true); };

    const icon = t => ({ email: <FiMail className="text-blue-500" />, sms: <FiMessageSquare className="text-green-500" />, letter: <FiFileText className="text-purple-500" /> }[t] || <FiMail />);

    return (
        <Layout>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between page-header">
                <div><h1 className="page-title">Communication Templates</h1><p className="page-subtitle">{templates.length} templates</p></div>
                <button onClick={openAdd} className="btn-primary btn-sm mt-4 sm:mt-0"><FiPlus size={14} />Add Template</button>
            </div>

            <div className="p-3 bg-orange-50 rounded-xl border border-orange-100 mb-6 text-xs text-orange-700">
                <strong>Variables:</strong> {'{{debtor_name}}'}, {'{{debtor_id}}'}, {'{{amount}}'}, {'{{loan_amount}}'}, {'{{due_date}}'}, {'{{email}}'}
            </div>

            {loading ? <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-32 rounded-xl" />)}</div>
                : templates.length === 0 ? <div className="empty-state"><FiMail size={40} /><p className="mt-3 text-sm">No templates yet</p><button onClick={openAdd} className="btn-primary btn-sm mt-4"><FiPlus size={14} />Add First Template</button></div>
                    : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{templates.map((t, i) => (
                        <div key={t.id} className="card-hover overflow-hidden animate-slideUp" style={{ animationDelay: `${i * 30}ms` }}>
                            {/* Template Preview Area - Letter Style */}
                            <div className="bg-gray-50 p-4 border-b border-gray-100">
                                {t.content_type === 'image' && t.image_url ? (
                                    <div className="relative group cursor-pointer" onClick={() => openPreview(t)}>
                                        <img 
                                            src={t.image_url} 
                                            alt={t.name} 
                                            className="w-full h-48 object-cover rounded-lg shadow-sm"
                                        />
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
                                            <FiEye className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={24} />
                                        </div>
                                    </div>
                                ) : (
                                    <div 
                                        className="bg-white p-4 rounded-lg shadow-sm min-h-[180px] cursor-pointer border border-gray-200 hover:border-orange-300 transition-colors"
                                        onClick={() => openPreview(t)}
                                    >
                                        {/* Letter Header */}
                                        <div className="border-b border-gray-200 pb-2 mb-3">
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Template Preview</p>
                                        </div>
                                        
                                        {/* Subject Line */}
                                        {t.subject && (
                                            <div className="mb-2">
                                                <p className="text-[10px] text-gray-400">Subject:</p>
                                                <p className="text-xs font-semibold text-gray-700 line-clamp-1">{t.subject}</p>
                                            </div>
                                        )}
                                        
                                        {/* Content Preview */}
                                        <div className="prose prose-xs max-w-none">
                                            <p className="text-xs text-gray-600 whitespace-pre-wrap line-clamp-6 font-serif leading-relaxed">
                                                {t.content || 'No content'}
                                            </p>
                                        </div>
                                        
                                        {/* Fade effect for long content */}
                                        {t.content && t.content.length > 200 && (
                                            <div className="h-8 bg-gradient-to-t from-white to-transparent mt-2"></div>
                                        )}
                                    </div>
                                )}
                            </div>
                            
                            {/* Template Info */}
                            <div className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                            t.type === 'email' ? 'bg-blue-100 text-blue-600' : 
                                            t.type === 'sms' ? 'bg-green-100 text-green-600' : 
                                            'bg-purple-100 text-purple-600'
                                        }`}>
                                            {icon(t.type)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-sm">{t.name}</h3>
                                            <p className="text-[10px] text-gray-500">{t.type.toUpperCase()} Template</p>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Badges */}
                                <div className="flex items-center gap-2 mb-3">
                                    <span className={`badge ${t.type === 'email' ? 'badge-blue' : t.type === 'sms' ? 'badge-green' : 'badge-purple'} text-[10px]`}>
                                        {t.type}
                                    </span>
                                    <span className="badge badge-gray text-[10px]">
                                        {t.content_type === 'image' ? '🖼️ Image' : '📝 Text'}
                                    </span>
                                </div>
                                
                                {/* Action Buttons */}
                                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                    <button 
                                        onClick={() => openPreview(t)} 
                                        className="flex items-center gap-1 text-xs text-gray-600 hover:text-blue-600 transition-colors"
                                    >
                                        <FiEye size={14} /> Preview
                                    </button>
                                    <div className="flex gap-1">
                                        <button onClick={() => openEdit(t)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                            <FiEdit2 size={14} />
                                        </button>
                                        <button onClick={() => handleDelete(t.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                            <FiTrash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}</div>}

            {/* Add/Edit Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={edit ? 'Edit Template' : 'Create Template'} maxWidth="max-w-2xl">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Name *</label><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" /></div>
                        <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Type *</label><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="select-field"><option value="email">Email</option><option value="sms">SMS</option><option value="letter">Letter</option></select></div>
                    </div>

                    <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Content Type *</label><select value={form.content_type} onChange={e => setForm({ ...form, content_type: e.target.value })} className="select-field"><option value="text">Text</option><option value="image">Image</option></select></div>

                    {form.type === 'email' && <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Subject</label><input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="input-field" placeholder="Payment Reminder" /></div>}

                    {form.content_type === 'text' ? (
                        <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Content *</label><textarea required value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} className="textarea-field" rows="6" placeholder="Dear {{debtor_name}}, your outstanding balance is..." /></div>
                    ) : (
                        <div>
                            <label className="text-xs font-semibold text-gray-500 mb-2 block">Template Image *</label>
                            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                                <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                {imagePreview ? (
                                    <div className="relative">
                                        <img src={imagePreview} alt="Preview" className="max-w-full h-auto max-h-64 mx-auto rounded-lg shadow-sm" />
                                        <button type="button" onClick={() => { setImagePreview(null); setForm({ ...form, template_image: null }); }} className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"><FiX size={16} /></button>
                                    </div>
                                ) : (
                                    <div onClick={() => fileRef.current?.click()} className="cursor-pointer">
                                        <FiImage size={40} className="mx-auto text-gray-400 mb-2" />
                                        <p className="text-sm text-gray-600 font-medium">Click to upload image</p>
                                        <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3"><button type="submit" className="btn-primary flex-1">{edit ? 'Update' : 'Create'}</button><button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button></div>
                </form>
            </Modal>

            {/* Preview Modal */}
            {showPreview && previewTemplate && (
                <div className="modal-overlay" onClick={() => setShowPreview(false)}>
                    <div className="modal-content max-w-3xl" onClick={e => e.stopPropagation()}>
                        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between z-10">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">{previewTemplate.name}</h2>
                                <p className="text-xs text-gray-500">{previewTemplate.type} · {previewTemplate.content_type}</p>
                            </div>
                            <button onClick={() => setShowPreview(false)} className="btn-ghost btn-xs"><FiX size={18} /></button>
                        </div>
                        <div className="p-6">
                            {previewTemplate.subject && <div className="mb-4"><p className="text-xs text-gray-400 uppercase mb-1">Subject</p><p className="text-sm font-semibold text-gray-900">{previewTemplate.subject}</p></div>}
                            <div className="mb-4"><p className="text-xs text-gray-400 uppercase mb-2">Content</p>
                                {previewTemplate.content_type === 'image' && previewTemplate.image_url ? (
                                    <div className="bg-gray-50 p-4 rounded-xl">
                                        <img src={previewTemplate.image_url} alt={previewTemplate.name} className="max-w-full h-auto rounded-lg shadow-md" />
                                        <a href={previewTemplate.image_url} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm mt-3 inline-flex"><FiEye size={14} />Open Full Image</a>
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 p-4 rounded-xl"><p className="text-sm text-gray-700 whitespace-pre-wrap">{previewTemplate.content}</p></div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default TemplateManagement;
