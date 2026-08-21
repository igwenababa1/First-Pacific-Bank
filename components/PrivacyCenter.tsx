
import React, { useState } from 'react';
import { ShieldCheckIcon, EnvelopeIcon, PhoneIcon, ArrowDownTrayIcon, XCircleIcon, SpinnerIcon } from './Icons';

interface PrivacySettings {
    ads: boolean;
    sharing: boolean;
    email: {
        transactions: boolean;
        security: boolean;
        promotions: boolean;
    };
    sms: {
        transactions: boolean;
        security: boolean;
        promotions: boolean;
    };
}

interface PrivacyCenterProps {
    settings: PrivacySettings;
    onUpdateSettings: (update: Partial<PrivacySettings>) => void;
}

const ToggleSwitch: React.FC<{
    label: string;
    description: string;
    enabled: boolean;
    onChange: (enabled: boolean) => void;
}> = ({ label, description, enabled, onChange }) => (
    <div className="flex justify-between items-center py-4 first:pt-0 last:pb-0">
        <div>
            <h4 className="font-semibold text-[#0F172A]">{label}</h4>
            <p className="text-sm text-[#0F172A]">{description}</p>
        </div>
        <label htmlFor={`toggle-${label}`} className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" id={`toggle-${label}`} className="sr-only peer" checked={enabled} onChange={(e) => onChange(e.target.checked)} />
            <div className="w-11 h-6 bg-slate-200 rounded-full peer shadow-digital-inset peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-digital peer-checked:bg-primary dark:bg-slate-800"></div>
        </label>
    </div>
);

const DataActionButton: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    buttonText: string;
    onAction: () => void;
    isLoading: boolean;
}> = ({ icon, title, description, buttonText, onAction, isLoading }) => (
    <div className="bg-slate-200 p-4 rounded-lg shadow-digital-inset flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 text-[#0F172A] mt-1">{icon}</div>
            <div>
                <h4 className="font-bold text-[#1E293B]">{title}</h4>
                <p className="text-sm text-[#0F172A]">{description}</p>
            </div>
        </div>
        <button
            onClick={onAction}
            disabled={isLoading}
            className="w-full sm:w-auto flex-shrink-0 px-4 py-2 text-sm font-bold text-primary bg-slate-200 rounded-lg shadow-digital active:shadow-digital-inset transition-shadow flex items-center justify-center"
        >
            {isLoading && <SpinnerIcon className="w-5 h-5 mr-2"/>}
            {isLoading ? 'Processing...' : buttonText}
        </button>
    </div>
);


export const PrivacyCenter: React.FC<PrivacyCenterProps> = ({ settings, onUpdateSettings }) => {
    const [downloading, setDownloading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    
    const handleDownload = () => {
        setDownloading(true);
        setTimeout(() => setDownloading(false), 3000);
    };

    const handleDelete = () => {
        setDeleting(true);
        setTimeout(() => setDeleting(false), 3000);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-[#1E293B]">Privacy Center</h2>
                <p className="text-sm text-[#0F172A] mt-1">Manage your data, communication preferences, and how we use your information.</p>
            </div>

            <div className="bg-slate-200 rounded-2xl shadow-digital">
                <div className="p-6 border-b border-slate-300"><h3 className="text-xl font-bold text-[#1E293B]">Data Sharing Preferences</h3></div>
                <div className="p-6 divide-y divide-slate-300">
                    <ToggleSwitch
                        label="Personalized Advertising"
                        description="Allow us to use your activity to show you more relevant ads and offers."
                        enabled={settings.ads}
                        onChange={(val) => onUpdateSettings({ ads: val })}
                    />
                    <ToggleSwitch
                        label="Data Sharing with Partners"
                        description="Permit sharing of anonymized data with trusted partners for research and product improvement."
                        enabled={settings.sharing}
                        onChange={(val) => onUpdateSettings({ sharing: val })}
                    />
                </div>
            </div>

            <div className="bg-slate-200 rounded-2xl shadow-digital">
                <div className="p-6 border-b border-slate-300"><h3 className="text-xl font-bold text-[#1E293B]">Communication Preferences</h3></div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h4 className="font-bold text-[#1E293B] flex items-center mb-2"><EnvelopeIcon className="w-5 h-5 mr-2 text-primary"/> Email Notifications</h4>
                        <div className="space-y-2 divide-y divide-slate-300">
                             <ToggleSwitch label="Transactions" description="Receipts & transfer updates." enabled={settings.email.transactions} onChange={val => onUpdateSettings({ email: {...settings.email, transactions: val} })}/>
                             <ToggleSwitch label="Security Alerts" description="New logins, password changes." enabled={settings.email.security} onChange={val => onUpdateSettings({ email: {...settings.email, security: val} })}/>
                             <ToggleSwitch label="Promotions" description="Offers & new features." enabled={settings.email.promotions} onChange={val => onUpdateSettings({ email: {...settings.email, promotions: val} })}/>
                        </div>
                    </div>
                     <div>
                        <h4 className="font-bold text-[#1E293B] flex items-center mb-2"><PhoneIcon className="w-5 h-5 mr-2 text-primary"/> SMS Notifications</h4>
                         <div className="space-y-2 divide-y divide-slate-300">
                             <ToggleSwitch label="Transactions" description="Real-time transfer alerts." enabled={settings.sms.transactions} onChange={val => onUpdateSettings({ sms: {...settings.sms, transactions: val} })}/>
                             <ToggleSwitch label="Security Alerts" description="Urgent security notifications." enabled={settings.sms.security} onChange={val => onUpdateSettings({ sms: {...settings.sms, security: val} })}/>
                             <ToggleSwitch label="Promotions" description="Offers & new features." enabled={settings.sms.promotions} onChange={val => onUpdateSettings({ sms: {...settings.sms, promotions: val} })}/>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="bg-slate-200 rounded-2xl shadow-digital">
                <div className="p-6 border-b border-slate-300"><h3 className="text-xl font-bold text-[#1E293B]">Manage Your Data</h3></div>
                <div className="p-6 space-y-4">
                    <DataActionButton
                        icon={<ArrowDownTrayIcon className="w-6 h-6" />}
                        title="Download Your Data"
                        description="Request a copy of your personal data, including profile information and transaction history."
                        buttonText="Request Download"
                        onAction={handleDownload}
                        isLoading={downloading}
                    />
                    <DataActionButton
                        icon={<XCircleIcon className="w-6 h-6" />}
                        title="Delete Your Account"
                        description="Request the permanent deletion of your account and all associated data. This action cannot be undone."
                        buttonText="Request Deletion"
                        onAction={handleDelete}
                        isLoading={deleting}
                    />
                </div>
            </div>
        </div>
    );
};
