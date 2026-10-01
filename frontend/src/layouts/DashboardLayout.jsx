import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, List, Upload, Clock, LogOut } from 'lucide-react';

const DashboardLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r flex flex-col">
                <div className="p-4 border-b">
                    <h1 className="text-xl font-bold text-gray-800">Broker Platform</h1>
                    <p className="text-sm text-gray-500">{user?.name}</p>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <Link to="/" className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded text-gray-700">
                        <Home size={18} /> Dashboard
                    </Link>
                    <Link to="/inventory" className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded text-gray-700">
                        <List size={18} /> Inventory
                    </Link>
                    <Link to="/upload" className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded text-gray-700">
                        <Upload size={18} /> Upload Excel
                    </Link>
                    <Link to="/history" className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded text-gray-700">
                        <Clock size={18} /> History
                    </Link>
                </nav>
                <div className="p-4 border-t">
                    <button onClick={handleLogout} className="flex items-center gap-2 p-2 w-full text-left hover:bg-gray-50 rounded text-red-600">
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </aside>
            {/* Main Content */}
            <main className="flex-1 p-8">
                <Outlet />
            </main>
        </div>
    );
};
export default DashboardLayout;