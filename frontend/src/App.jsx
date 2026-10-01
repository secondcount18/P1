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