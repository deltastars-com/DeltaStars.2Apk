import React from 'react';
import { Log } from '../types';

interface ServerManagementSectionProps {
    logs: Log[];
}

export const ServerManagementSection: React.FC<ServerManagementSectionProps> = ({ logs }) => {
    return (
        <div className="flex flex-col h-full animate-fade-in">
            <h2 className="text-3xl font-black text-slate-800 mb-8 uppercase">Live Rocket Node Radar</h2>
            <div className="bg-slate-950 rounded-3xl p-8 font-mono text-sm overflow-y-auto flex-1 h-[500px] border-4 border-slate-900 shadow-inner">
                {logs.length === 0 ? (
                    <p className="text-slate-600 italic">Listening for requests...</p>
                ) : (
                    logs.map((log) => (
                        <div key={log.id} className="mb-4 border-b border-slate-900 pb-4">
                            <div className="flex justify-between mb-2">
                                <span className="text-green-400 font-black">
                                    [{log.level}] {log.action}
                                </span>
                                <span className="text-slate-500">{log.timestamp}</span>
                            </div>
                            <p className="text-blue-300">{log.detail}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
