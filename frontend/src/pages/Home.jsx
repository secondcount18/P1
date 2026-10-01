import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Home = () => {
    const [stats, setStats] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        api.get('/inventory/stats').then(res => setStats(res.data)).catch(console.error);
    }, []);

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Welcome, {user?.name?.split(' ')[0] || 'Broker'}</h2>
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded shadow">
                        <h3 className="text-gray-500 text-sm">Total Properties</h3>
                        <p className="text-3xl font-bold">{stats.total}</p>
                    </div>
                    <div className="bg-white p-6 rounded shadow">
                        <h3 className="text-gray-500 text-sm">Available</h3>
                        <p className="text-3xl font-bold text-green-600">{stats.available}</p>
                    </div>
                    <div className="bg-white p-6 rounded shadow">
                        <h3 className="text-gray-500 text-sm">Unavailable</h3>
                        <p className="text-3xl font-bold text-red-600">{stats.unavailable}</p>
                    </div>
                </div>
            )}
            <div className="bg-white p-6 rounded shadow max-w-md">
                <h3 className="font-medium mb-2">Last Inventory Update</h3>
                <p className="text-gray-600 mb-6">{stats?.lastUpdate ? new Date(stats.lastUpdate).toLocaleString() : 'Never'}</p>
                <Link to="/upload" className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    Upload Excel
                </Link>
            </div>
        </div>
    );
};
export default Home;