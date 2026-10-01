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