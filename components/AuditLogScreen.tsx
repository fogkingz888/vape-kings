import React, { useState } from 'react';
import { AuditLog } from '../types';
import { CsvIcon } from './icons';

type AuditLogScreenProps = {
    logs: AuditLog[];
};

const AuditLogScreen: React.FC<AuditLogScreenProps> = ({ logs }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredLogs = logs.filter(log =>
        log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getActionColor = (action: string) => {
        switch (action.toLowerCase()) {
            case 'system login': return 'bg-hiphop-cyan text-hiphop-950';
            case 'add product': return 'bg-green-500 text-white';
            case 'sale': return 'bg-hiphop-magenta text-white';
            case 'manual update': return 'bg-hiphop-gold text-hiphop-950';
            case 'voice command update': return 'bg-blue-500 text-white';
            default: return 'bg-hiphop-700 text-hiphop-light';
        }
    };
    
    const downloadCSV = (data: any[], filename: string) => {
        if (data.length === 0) return;
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => JSON.stringify(row[header])).join(','))
        ].join('\n');
    
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleExportLogs = () => {
        const dataToExport = filteredLogs.map(log => ({
            Timestamp: new Date(log.created_at).toLocaleString(),
            User: log.user_name,
            Action: log.action,
            Details: log.details,
        }));
        downloadCSV(dataToExport, 'audit_log.csv');
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                 <h2 className="text-4xl font-marker text-hiphop-light">Audit Trail</h2>
                 <button 
                    onClick={handleExportLogs}
                    className="flex items-center space-x-2 bg-hiphop-800 hover:bg-hiphop-700 text-hiphop-light font-bold py-2 px-4 rounded-sm uppercase text-sm tracking-wider transition-colors"
                >
                    <CsvIcon className="w-5 h-5"/>
                    <span>Export CSV</span>
                </button>
            </div>
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search logs by user, action, or details..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-hiphop-950 border-2 border-hiphop-700 rounded-sm py-2 px-4 focus:outline-none focus:ring-2 focus:ring-hiphop-cyan"
                />
            </div>
            <div className="bg-hiphop-950 rounded-sm shadow-xl overflow-hidden border-2 border-hiphop-800">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-hiphop-800 uppercase text-xs text-hiphop-gray tracking-widest">
                            <tr>
                                <th className="p-4">Timestamp</th>
                                <th className="p-4">User</th>
                                <th className="p-4">Action</th>
                                <th className="p-4">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-hiphop-800">
                            {filteredLogs.map(log => (
                                <tr key={log.id} className="hover:bg-hiphop-800 transition-colors">
                                    <td className="p-4 text-hiphop-gray whitespace-nowrap">
                                        {new Date(log.created_at).toLocaleString()}
                                    </td>
                                    <td className="p-4 font-semibold">{log.user_name}</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-sm text-xs font-bold uppercase ${getActionColor(log.action)}`}>{log.action}</span>
                                    </td>
                                    <td className="p-4 text-hiphop-gray">{log.details}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AuditLogScreen;