import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children }) => (
    <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 lg:ml-64 min-h-screen">
            <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">{children}</div>
        </main>
    </div>
);

export default Layout;
