
import React from 'react';
import { Shipment } from '../types';

interface ShipmentMapProps {
    shipment: Shipment;
}

const ShipmentMap: React.FC<ShipmentMapProps> = ({ shipment }) => {
    return (
        <div className="w-full h-64 md:h-96 bg-white dark:bg-slate-900 rounded-[3rem] overflow-hidden relative border border-slate-100 dark:border-white/10 shadow-2xl">
            <div 
                className="absolute inset-0 bg-cover bg-center opacity-30 grayscale brightness-50"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')" }}
            ></div>
            
            {/* Pulsing Target Node */}
            <div className="absolute top-1/3 left-1/4">
                <div className="relative">
                    <div className="absolute inset-0 w-8 h-8 primary- rounded-full animate-ping opacity-30"></div>
                    <div className="w-4 h-4 primary- rounded-full border-2 border-white shadow-lg"></div>
                </div>
            </div>

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-slate-50 dark:bg-slate-900  px-6 py-3 rounded-full border border-slate-200 dark:border-white/10">
                    <p className="text-xs font-black text-[#0F172A] dark:text-white uppercase tracking-widest">Global Asset Tracking Active</p>
                </div>
            </div>
            
            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end pointer-events-none">
                <div className="bg-slate-50 dark:bg-slate-900  p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl">
                    <p className="text-[10px] font-black primary- uppercase tracking-widest mb-1">Live Node</p>
                    <p className="text-sm font-bold text-[#0F172A] dark:text-white">NYC_TERMINAL_7</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900  p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl text-right">
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Status</p>
                    <p className="text-sm font-bold text-[#0F172A] dark:text-white">AUTHENTICATED</p>
                </div>
            </div>
        </div>
    );
};

export default ShipmentMap;
