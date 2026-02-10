import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiHome, FiUsers, FiUserCheck, FiBriefcase, FiDollarSign, FiBarChart2, FiLogOut, FiMenu, FiX, FiChevronRight, FiMail, FiLink } from 'react-icons/fi';

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = async () => { await logout(); navigate('/login'); };

    const menus = {
        admin: [
            { path: '/admin/dashboard', icon: FiHome, label: 'Dashboard' },
            { path: '/admin/clients', icon: FiBriefcase, label: 'Clients' },
            { path: '/admin/debtors', icon: FiUsers, label: 'Debtors' },
            { path: '/admin/users', icon: FiUserCheck, label: 'Team' },
            { path: '/admin/payments', icon: FiDollarSign, label: 'Payments' },
            { path: '/admin/payment-links', icon: FiMail, label: 'Payment Links' },
            { path: '/admin/templates', icon: FiMail, label: 'Templates' },
            { path: '/admin/scheduled-communications', icon: FiMail, label: 'Scheduled' },
            { path: '/admin/reports', icon: FiBarChart2, label: 'Reports' },
        ],
        team_member: [
            { path: '/team/dashboard', icon: FiHome, label: 'Dashboard' },
            { path: '/team/debtors', icon: FiUsers, label: 'My Debtors' },
            { path: '/team/global-debtors', icon: FiUserCheck, label: 'All Debtors' },
            { path: '/team/payments', icon: FiDollarSign, label: 'Payments' },
            { path: '/team/payment-links', icon: FiLink, label: 'Payment Links' },
        ],
        accountant: [
            { path: '/accountant/dashboard', icon: FiHome, label: 'Dashboard' },
            { path: '/accountant/payments', icon: FiDollarSign, label: 'Payments' },
            { path: '/accountant/reports', icon: FiBarChart2, label: 'Reports' },
        ],
    };

    const items = menus[user?.role] || menus.team_member;

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-white border-r border-gray-100">
            {/* Logo */}
            <div className="p-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-200 flex-shrink-0">
                        <img src="/src/assets/images/logo.png" alt="Aussie Recoveries" className="w-8 h-8 object-contain" />
                    </div>
                    {!collapsed && <div className="animate-slideIn"><h1 className="font-bold text-gray-900 text-sm">AUSSIE RECOVERIES</h1><p className="text-[10px] text-gray-400 font-medium">Debt Recovery Solutions</p></div>}
                </div>
            </div>

            {/* User */}
            {!collapsed && <div className="p-4 mx-3 mt-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center shadow-sm"><span className="text-white font-bold text-sm">{user?.full_name?.charAt(0) || 'U'}</span></div>
                    <div className="min-w-0"><p className="text-sm font-semibold text-gray-800 truncate">{user?.full_name}</p><p className="text-[10px] text-orange-600 font-medium capitalize">{user?.role?.replace('_', ' ')}</p></div>
                </div>
            </div>}

            {/* Nav */}
            <nav className="flex-1 p-3 mt-2 space-y-1 overflow-y-auto">
                {items.map((item) => {
                    const Icon = item.icon;
                    const active = location.pathname === item.path;
                    return (<Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group ${active
                            ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25'
                            : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}>
                        <Icon size={18} className={active ? 'text-white' : 'text-gray-400 group-hover:text-orange-500'} />
                        {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
                        {!collapsed && active && <FiChevronRight className="ml-auto" size={14} />}
                    </Link>);
                })}
            </nav>

            {/* Logout */}
            <div className="p-3 border-t border-gray-100">
                <button onClick={handleLogout} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all w-full">
                    <FiLogOut size={18} />{!collapsed && <span className="font-medium text-sm">Logout</span>}
                </button>
            </div>
        </div>
    );

    return (<>
        {/* Mobile toggle */}
        <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white rounded-xl shadow-lg border border-gray-100">
            {mobileOpen ? <FiX size={20} /> : <FiMenu size={20} />}
        </button>

        {/* Desktop */}
        <aside className={`hidden lg:block fixed top-0 left-0 h-screen z-40 transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-64'}`}>
            <SidebarContent />
            <button onClick={() => setCollapsed(!collapsed)} className="absolute -right-3 top-8 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-orange-50 hover:border-orange-200 transition-all">
                <FiChevronRight size={12} className={`text-gray-400 transition-transform ${collapsed ? '' : 'rotate-180'}`} />
            </button>
        </aside>

        {/* Mobile */}
        {mobileOpen && <><div className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={() => setMobileOpen(false)} /><aside className="lg:hidden fixed top-0 left-0 h-screen w-64 z-50 animate-slideIn"><SidebarContent /></aside></>}
    </>);
};

export default Sidebar;
