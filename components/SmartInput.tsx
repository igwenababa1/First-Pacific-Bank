import React, { useState, useEffect, useRef } from 'react';

interface SmartInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    typeType?: 'text' | 'phone' | 'ssn' | 'zip' | 'amount' | 'name' | 'address';
    onValueChange?: (val: string) => void;
    error?: string;
}

export const SmartInput: React.FC<SmartInputProps> = ({ label, typeType = 'text', onValueChange, error, value, className, onChange, ...props }) => {
    const [localValue, setLocalValue] = useState(value as string || '');
    const [isValid, setIsValid] = useState<boolean | null>(null);
    const [suggestion, setSuggestion] = useState<string>('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Provide real-time auto-formatting and validation
    useEffect(() => {
        let val = value as string || '';
        
        if (typeType === 'phone') {
            const numbers = val.replace(/\D/g, '');
            if (numbers.length > 0) {
                val = `(${numbers.slice(0,3)}`;
                if (numbers.length > 3) val += `) ${numbers.slice(3,6)}`;
                if (numbers.length > 6) val += `-${numbers.slice(6,10)}`;
            }
            setIsValid(numbers.length === 10);
        } else if (typeType === 'ssn') {
            const numbers = val.replace(/\D/g, '');
            if (numbers.length > 0) {
                val = numbers.slice(0,3);
                if (numbers.length > 3) val += `-${numbers.slice(3,5)}`;
                if (numbers.length > 5) val += `-${numbers.slice(5,9)}`;
            }
            setIsValid(numbers.length === 9);
        } else if (typeType === 'zip') {
            const numbers = val.replace(/\D/g, '');
            val = numbers.slice(0, 5);
            setIsValid(numbers.length === 5);
            
            // For premium feel: fetch city/state via zip
            if (numbers.length === 5 && localValue !== val) {
                fetch(`https://api.zippopotam.us/us/${numbers}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data.places && data.places.length > 0) {
                            setSuggestion(`${data.places[0]['place name']}, ${data.places[0]['state abbreviation']}`);
                        }
                    }).catch(() => setSuggestion(''));
            } else if (numbers.length < 5) {
                setSuggestion('');
            }
        } else if (typeType === 'amount') {
            const match = val.replace(/[^\d.]/g, '').match(/^\d*\.?\d{0,2}/);
            val = match ? match[0] : '';
            if (val) {
                const parts = val.split('.');
                parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                val = parts.join('.');
            }
            setIsValid(parseFloat(val) > 0);
        } else if (typeType === 'name') {
            // Auto capitalize words
            val = val.replace(/\b\w/g, l => l.toUpperCase());
            setIsValid(val.trim().includes(' '));
        } else {
            setIsValid(val.length > 0);
        }

        if (val !== localValue) {
            setLocalValue(val);
        }
    }, [value, typeType]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value;
        if (typeType === 'phone' || typeType === 'ssn' || typeType === 'zip') {
            // Prevent length over max on these if needed, though handled by regex above
        }
        setLocalValue(val);
        if (onValueChange) onValueChange(val);
        
        // Ensure standard onChange passes the correctly formatted string through the synthetic event!
        if (onChange) {
            e.target.value = val;
            onChange(e);
        }
    };

    return (
        <div className={`relative group w-full ${label ? 'mb-4' : 'mb-2'} ${className || ''}`}>
            {label && <label className="block text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-1.5 transition-colors group-focus-within:text-emerald-500">{label}</label>}
            <div className="relative">
                {typeType === 'amount' && (
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0F172A] font-bold">$</span>
                )}
                <input
                    ref={inputRef}
                    type={props.type || "text"}
                    value={localValue}
                    onChange={handleChange}
                    className={`w-full bg-slate-100 dark:bg-slate-900 border 
                        ${isValid === true ? 'border-emerald-500/50 focus:border-emerald-500' : isValid === false && localValue.length > 2 ? 'border-amber-500/50' : 'border-slate-200 dark:border-slate-700'} 
                        rounded-xl p-4 text-sm font-bold text-[#0F172A] dark:text-white outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-sans
                        ${typeType === 'amount' ? 'pl-8' : ''}`}
                    {...props}
                />
                
                {/* Premium validation indicator */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {isValid === true && (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center animate-fade-in">
                            <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Realtime Suggestion / Subtext */}
            {suggestion && typeType === 'zip' && (
                <p className="absolute -bottom-5 right-0 text-[10px] font-bold text-emerald-500 text-right animate-fade-in tracking-wider uppercase">
                    📍 {suggestion}
                </p>
            )}
            {error && (
                <p className="absolute -bottom-5 left-0 text-[10px] font-bold text-amber-500 text-left animate-fade-in tracking-wider uppercase">
                    {error}
                </p>
            )}
        </div>
    );
};
