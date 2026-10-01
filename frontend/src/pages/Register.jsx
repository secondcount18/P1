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