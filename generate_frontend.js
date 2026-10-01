const fs = require('fs');
const path = require('path');

const files = {
  'tailwind.config.js': `
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
  `,
  'postcss.config.js': `
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
  `,
  'src/index.css': `
@tailwind base;
@tailwind components;
@tailwind utilities;
  `,
  'src/App.jsx': `
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardLayout from './layouts/DashboardLayout';
import Home from './pages/Home';
import Inventory from './pages/Inventory';
import Upload from './pages/Upload';
import History from './pages/History';

const ProtectedRoute = ({ children }) => {
    const { token, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    return token ? children : <Navigate to="/login" />;
};

const App = () => {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    
                    <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                        <Route index element={<Home />} />
                        <Route path="inventory" element={<Inventory />} />
                        <Route path="upload" element={<Upload />} />
                        <Route path="history" element={<History />} />
                    </Route>
                </Routes>
            </Router>
        </AuthProvider>
    );
};
export default App;
  `,
  'src/context/AuthContext.jsx': `
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            api.defaults.headers.common['Authorization'] = \`Bearer \${token}\`;
            api.get('/auth/me')
                .then(res => setUser(res.data))
                .catch(() => {
                    setToken(null);
                    localStorage.removeItem('token');
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [token]);

    const login = (newToken, userData) => {
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('token', newToken);
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
    };

    return (
        <AuthContext.Provider value={{ token, user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
  `,
  'src/services/api.js': `
import axios from 'axios';
const api = axios.create({
    baseURL: 'http://localhost:5000/api'
});
export default api;
  `,
  'src/layouts/DashboardLayout.jsx': `
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
  `,
  'src/pages/Login.jsx': `
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/login', { email, password });
            login(res.data.token, res.data.user);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-96">
                <h2 className="text-2xl font-bold mb-6 text-center">Broker Login</h2>
                {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border p-2 rounded" required />
                </div>
                <div className="mb-6">
                    <label className="block text-sm font-medium mb-1">Password</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border p-2 rounded" required />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Login</button>
                <p className="mt-4 text-sm text-center">
                    No account? <Link to="/register" className="text-blue-600">Register</Link>
                </p>
            </form>
        </div>
    );
};
export default Login;
  `,
  'src/pages/Register.jsx': `
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const Register = () => {
    const [form, setForm] = useState({ name: '', company: '', email: '', password: '', whatsappNumber: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/auth/register', form);
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
        }
    };

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-96">
                <h2 className="text-2xl font-bold mb-6 text-center">Broker Registration</h2>
                {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
                {['name', 'company', 'email', 'password', 'whatsappNumber'].map(field => (
                    <div key={field} className="mb-4">
                        <label className="block text-sm font-medium mb-1 capitalize">{field.replace('Number', ' Number')}</label>
                        <input type={field === 'password' || field === 'email' ? field : 'text'} name={field} value={form[field]} onChange={handleChange} className="w-full border p-2 rounded" required />
                    </div>
                ))}
                <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Register</button>
                <p className="mt-4 text-sm text-center">
                    Already registered? <Link to="/login" className="text-blue-600">Login</Link>
                </p>
            </form>
        </div>
    );
};
export default Register;
  `,
  'src/pages/Home.jsx': `
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
  `,
  'src/pages/Inventory.jsx': `
import React, { useEffect, useState } from 'react';
import api from '../services/api';

const Inventory = () => {
    const [properties, setProperties] = useState([]);

    useEffect(() => {
        api.get('/inventory').then(res => setProperties(res.data)).catch(console.error);
    }, []);

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Your Inventory</h2>
            <div className="bg-white rounded shadow overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b">
                            <th className="p-4 font-medium text-gray-600">ID</th>
                            <th className="p-4 font-medium text-gray-600">Project</th>
                            <th className="p-4 font-medium text-gray-600">Location</th>
                            <th className="p-4 font-medium text-gray-600">BHK</th>
                            <th className="p-4 font-medium text-gray-600">Price</th>
                            <th className="p-4 font-medium text-gray-600">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {properties.map(p => (
                            <tr key={p._id} className="border-b hover:bg-gray-50">
                                <td className="p-4">{p.propertyId}</td>
                                <td className="p-4">{p.projectName}</td>
                                <td className="p-4">{p.location?.locality}, {p.location?.city}</td>
                                <td className="p-4">{p.bhk}</td>
                                <td className="p-4">₹{(p.price/100000).toFixed(2)} L</td>
                                <td className="p-4">
                                    <span className={\`px-2 py-1 rounded text-xs \${p.status?.toLowerCase() === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}\`}>
                                        {p.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {properties.length === 0 && (
                            <tr><td colSpan="6" className="p-4 text-center text-gray-500">No properties found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
export default Inventory;
  `,
  'src/pages/History.jsx': `
import React, { useEffect, useState } from 'react';
import api from '../services/api';

const History = () => {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        api.get('/inventory/uploads').then(res => setHistory(res.data)).catch(console.error);
    }, []);

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Upload History</h2>
            <div className="bg-white rounded shadow overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b">
                            <th className="p-4 font-medium text-gray-600">Date</th>
                            <th className="p-4 font-medium text-gray-600">File</th>
                            <th className="p-4 font-medium text-gray-600">Total</th>
                            <th className="p-4 font-medium text-gray-600">Added</th>
                            <th className="p-4 font-medium text-gray-600">Updated</th>
                            <th className="p-4 font-medium text-gray-600">Errors</th>
                            <th className="p-4 font-medium text-gray-600">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.map(h => (
                            <tr key={h._id} className="border-b hover:bg-gray-50">
                                <td className="p-4">{new Date(h.uploadedAt).toLocaleString()}</td>
                                <td className="p-4">{h.fileName}</td>
                                <td className="p-4">{h.totalRows}</td>
                                <td className="p-4 text-green-600">{h.added}</td>
                                <td className="p-4 text-blue-600">{h.updated}</td>
                                <td className="p-4 text-red-600">{h.errors}</td>
                                <td className="p-4">{h.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
export default History;
  `,
  'src/pages/Upload.jsx': `
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Upload = () => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [previewId, setPreviewId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleFileChange = (e) => setFile(e.target.files[0]);

    const handlePreview = async (e) => {
        e.preventDefault();
        if (!file) return;
        setLoading(true);
        setError('');
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await api.post('/inventory/upload/preview', formData);
            setPreview(res.data.result);
            setPreviewId(res.data.previewId);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to generate preview');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await api.post('/inventory/upload/confirm', { previewId });
            navigate('/history');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to upload inventory');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Upload Inventory</h2>
                <a href="http://localhost:5000/api/inventory/template" className="text-blue-600 hover:underline" download>
                    Download Template
                </a>
            </div>
            
            {!preview ? (
                <div className="bg-white p-6 rounded shadow">
                    <form onSubmit={handlePreview} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Select Excel File (.xlsx)</label>
                            <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} className="border p-2 w-full rounded" required />
                        </div>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
                            {loading ? 'Processing...' : 'Upload & Preview'}
                        </button>
                    </form>
                </div>
            ) : (
                <div className="bg-white p-6 rounded shadow space-y-6">
                    <h3 className="text-lg font-medium border-b pb-2">Upload Preview</h3>
                    
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="p-4 bg-gray-50 rounded">Total Rows: <strong>{preview.total}</strong></div>
                        <div className="p-4 bg-green-50 rounded">Valid Rows: <strong>{preview.validRows.length}</strong></div>
                        <div className="p-4 bg-red-50 rounded">Errors: <strong>{preview.errors.length}</strong></div>
                    </div>
                    
                    {preview.errors.length > 0 && (
                        <div className="mb-6">
                            <h4 className="font-medium text-red-600 mb-2">Errors Found:</h4>
                            <ul className="list-disc pl-5 text-sm space-y-1">
                                {preview.errors.map((e, idx) => (
                                    <li key={idx}>Row {e.row}: {e.issues.join(', ')}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    
                    <div className="flex gap-4">
                        <button onClick={handleConfirm} disabled={loading || preview.validRows.length === 0} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50">
                            {loading ? 'Confirming...' : 'CONFIRM UPLOAD'}
                        </button>
                        <button onClick={() => setPreview(null)} disabled={loading} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:opacity-50">
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
export default Upload;
  `
};

for (const [filepath, content] of Object.entries(files)) {
  const fullPath = path.join(__dirname, 'frontend', filepath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content.trim());
}
console.log("Frontend scaffolding complete.");
