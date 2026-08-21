import React, { useState, useEffect } from 'react';
import { ServerIcon, CloudArrowUpIcon, ShieldCheckIcon, WifiIcon, LockClosedIcon, PlusCircleIcon, XIcon, CheckCircleIcon } from './Icons';

interface Device {
    id: string;
    name: string;
    lastActive: string;
}

export const DigitalHub: React.FC = () => {
    const [devices, setDevices] = useState<Device[]>([]);
    
    useEffect(() => {
        const stored = localStorage.getItem('fpb_devices');
        if (stored) {
            setDevices(JSON.parse(stored));
        } else {
            const initial = [
                { id: '1', name: 'MacBook Pro M3 Max', lastActive: 'Active Now' },
                { id: '2', name: 'iPhone 15 Pro Titanium', lastActive: '2h ago' }
            ];
            setDevices(initial);
            localStorage.setItem('fpb_devices', JSON.stringify(initial));
        }
    }, []);

    const verifyNewDevice = () => {
        const newDevice = { id: Date.now().toString(), name: 'Authorized iPad Pro', lastActive: 'Active Now' };
        const updated = [...devices, newDevice];
        setDevices(updated);
        localStorage.setItem('fpb_devices', JSON.stringify(updated));
    };

    const revokeDevice = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = devices.filter(d => d.id !== id);
        setDevices(updated);
        localStorage.setItem('fpb_devices', JSON.stringify(updated));
    };

    return (
        <div className="bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 shadow-xl dark:shadow-black/40 hover:shadow-2xl hover:border-slate-300 dark:hover:border-slate-200 dark:border-black/10 relative overflow-hidden h-full flex flex-col group transition-all duration-500">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                <ServerIcon className="w-32 h-32 text-primary" />
            </div>
            
            <div className="relative z-10 flex-grow flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-primary/20 rounded-lg border border-primary/30 text-primary">
                            <ServerIcon className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-black text-[#0F172A] dark:text-white uppercase tracking-tight">Security Hub</h3>
                    </div>
                </div>

                <p className="text-sm text-[#0F172A] dark:text-white font-bold mb-6">
                    Manage active sessions and authorized hardware tokens directly from your hub.
                </p>

                <div className="space-y-3 flex-grow">
                    <div className="flex justify-between items-end mb-2 border-b border-slate-200 dark:border-white/10 pb-2">
                        <div className="text-xs font-bold text-[#0F172A] uppercase tracking-widest">Active Devices</div>
                        <button onClick={verifyNewDevice} className="text-[10px] text-primary hover:text-[#0F172A] dark:text-white uppercase font-bold tracking-widest flex items-center gap-1 transition-colors">
                            <PlusCircleIcon className="w-3 h-3" /> Authorize
                        </button>
                    </div>
                    
                    <div className="space-y-2 mb-6">
                        {devices.length === 0 && (
                            <div className="text-xs font-bold text-amber-500 uppercase tracking-widest p-3 bg-amber-500 rounded-xl text-center border border-amber-500/20">
                                No Devices Authorized
                            </div>
                        )}
                        {devices.map(d => (
                            <div key={d.id} className="flex justify-between items-center p-3 rounded-xl bg-white border border-slate-100 dark:border-white/10 hover:border-red-500/30 transition-all group/device dark:bg-slate-800">
                                <div className="flex items-center gap-3">
                                    <WifiIcon className="w-4 h-4 text-emerald-400" />
                                    <div>
                                        <div className="text-xs font-bold text-[#0F172A] dark:text-white tracking-wide">{d.name}</div>
                                        <div className="text-[9px] text-[#0F172A] uppercase font-mono">{d.lastActive}</div>
                                    </div>
                                </div>
                                <button onClick={(e) => revokeDevice(d.id, e)} className="opacity-0 group-hover/device:opacity-100 p-1.5 rounded bg-red-500 text-red-500 hover:bg-red-500 hover:text-[#0F172A] dark:text-white transition-all" title="Revoke Device">
                                    <XIcon className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-2 mt-auto">
                        <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-100 dark:border-white/10 hover:bg-white transition-colors cursor-default dark:bg-slate-800">
                            <div className="flex items-center gap-3">
                                <CloudArrowUpIcon className="w-4 h-4 primary-" />
                                <span className="text-xs font-bold text-[#0F172A] dark:text-white uppercase tracking-wider">Cloud Ledger</span>
                            </div>
                            <span className="text-[10px] font-bold primary- flex items-center gap-1"><CheckCircleIcon className="w-3 h-3"/> Synced</span>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-100 dark:border-white/10 hover:bg-white transition-colors cursor-default dark:bg-slate-800">
                            <div className="flex items-center gap-3">
                                <LockClosedIcon className="w-4 h-4 text-amber-400" />
                                <span className="text-xs font-bold text-[#0F172A] dark:text-white uppercase tracking-wider">Storage Vault</span>
                            </div>
                            <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1"><ShieldCheckIcon className="w-3 h-3"/> Encrypted</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
