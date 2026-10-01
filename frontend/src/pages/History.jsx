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