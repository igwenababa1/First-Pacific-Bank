
import React, { useState, useCallback, useEffect } from 'react';
import { generateStrongPassword } from '../utils/security';
import { ClipboardDocumentIcon, CheckCircleIcon, ArrowPathIcon } from './Icons';

interface PasswordGeneratorProps {
    onPasswordGenerated: (password: string) => void;
}

export const PasswordGenerator: React.FC<PasswordGeneratorProps> = ({ onPasswordGenerated }) => {
    const [password, setPassword] = useState('');
    const [options, setOptions] = useState({
        length: 16,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSpecial: true,
    });
    const [copied, setCopied] = useState(false);

    const generate = useCallback(() => {
        const newPassword = generateStrongPassword(options);
        setPassword(newPassword);
        onPasswordGenerated(newPassword);
    }, [options, onPasswordGenerated]);

    useEffect(() => {
        generate();
    }, [generate]);

    const handleCopy = () => {
        navigator.clipboard.writeText(password);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    
    const handleOptionChange = (option: keyof typeof options, value: boolean | number) => {
        setOptions(prev => ({...prev, [option]: value }));
    }

    const CheckboxOption: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void; }> = ({ label, checked, onChange }) => (
        <label className="flex items-center space-x-2 text-sm text-[#0F172A] dark:text-white">
            <input 
                type="checkbox" 
                checked={checked} 
                onChange={e => onChange(e.target.checked)}
                className="h-4 w-4 rounded bg-slate-600 border-slate-500 text-primary focus:ring-primary"
            />
            <span>{label}</span>
        </label>
    );

    return (
        <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-4 space-y-4 my-4 animate-fade-in-up">
            <div className="relative">
                <input
                    type="text"
                    readOnly
                    value={password}
                    className="w-full bg-slate-50 dark:bg-slate-900 p-3 pr-24 rounded-md font-mono text-slate-100"
                    aria-label="Generated Password"
                />
                <div className="absolute inset-y-0 right-0 flex items-center">
                     <button type="button" onClick={generate} className="p-2 text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white" aria-label="Generate new password">
                        <ArrowPathIcon className="w-5 h-5" />
                    </button>
                    <button type="button" onClick={handleCopy} className="p-2 text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white" aria-label="Copy password">
                        {copied ? <CheckCircleIcon className="w-5 h-5 text-green-400" /> : <ClipboardDocumentIcon className="w-5 h-5" />}
                    </button>
                </div>
            </div>
            
            <div className="space-y-3">
                 <div>
                    <label className="flex justify-between text-sm text-[#0F172A] dark:text-white">
                        <span>Length:</span>
                        <span className="font-bold">{options.length}</span>
                    </label>
                    <input
                        type="range"
                        min="8"
                        max="32"
                        value={options.length}
                        onChange={e => handleOptionChange('length', Number(e.target.value))}
                        className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <CheckboxOption label="Uppercase (A-Z)" checked={options.includeUppercase} onChange={v => handleOptionChange('includeUppercase', v)} />
                    <CheckboxOption label="Lowercase (a-z)" checked={options.includeLowercase} onChange={v => handleOptionChange('includeLowercase', v)} />
                    <CheckboxOption label="Numbers (0-9)" checked={options.includeNumbers} onChange={v => handleOptionChange('includeNumbers', v)} />
                    <CheckboxOption label="Special (!@#..)" checked={options.includeSpecial} onChange={v => handleOptionChange('includeSpecial', v)} />
                </div>
            </div>
        </div>
    );
};
