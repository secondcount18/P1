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
                                    <span className={`px-2 py-1 rounded text-xs ${p.status?.toLowerCase() === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
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