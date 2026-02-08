import React from 'react';
import { FiX } from 'react-icons/fi';

const Modal = ({ isOpen, onClose, title, subtitle, maxWidth = 'max-w-2xl', children }) => {
    if (!isOpen) return null;
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className={`modal-content ${maxWidth} w-full`} onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between z-10">
                    <div><h2 className="text-lg font-bold text-gray-900">{title}</h2>{subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}</div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><FiX size={18} className="text-gray-400" /></button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
};

export default Modal;
