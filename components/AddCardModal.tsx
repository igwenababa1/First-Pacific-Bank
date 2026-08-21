
import React, { useState, useEffect } from 'react';
import { SpinnerIcon, VisaIcon, MastercardIcon, AmexIcon, BankIcon, GlobeAmericasIcon } from './Icons';
import { Card } from '../types';
import { luhnCheck, validateExpiryDate, validateCvc } from '../utils/validation';
import { fetchBinInfo } from '../services/binService';

interface AddCardModalProps {
    onClose: () => void;
    onAddCard: (cardData: Omit<Card, 'id' | 'controls'>) => void;
}

type CardNetwork = 'Visa' | 'Mastercard' | 'Amex' | 'unknown';

export const AddCardModal: React.FC<AddCardModalProps> = ({ onClose, onAddCard }) => {
    const [cardData, setCardData] = useState({
        number: '',
        expiry: '',
        cvc: '',
        name: 'Johnson Ferdinand', 
        type: 'DEBIT' as 'DEBIT' | 'CREDIT'
    });
    const [cardNetwork, setCardNetwork] = useState<CardNetwork>('unknown');
    const [detectedBank, setDetectedBank] = useState<string | null>(null);
    const [detectedCountry, setDetectedCountry] = useState<string | null>(null);
    const [isCheckingBin, setIsCheckingBin] = useState(false);
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const cleanNum = cardData.number.replace(/\D/g, '');
        
        // Immediate visual feedback based on first digit
        if (cleanNum.startsWith('4')) {
            setCardNetwork('Visa');
        } else if (cleanNum.startsWith('5')) {
            setCardNetwork('Mastercard');
        } else if (cleanNum.startsWith('34') || cleanNum.startsWith('37')) {
            setCardNetwork('Amex');
        } else {
            setCardNetwork('unknown');
        }

        // BIN Lookup logic
        const performLookup = async () => {
            if (cleanNum.length >= 6) {
                setIsCheckingBin(true);
                const info = await fetchBinInfo(cleanNum);
                setIsCheckingBin(false);

                if (info) {
                    if (info.bank) setDetectedBank(info.bank);
                    if (info.country) setDetectedCountry(info.country);
                    
                    if (info.scheme) {
                        const scheme = info.scheme.toLowerCase();
                        if (scheme.includes('visa')) setCardNetwork('Visa');
                        if (scheme.includes('master')) setCardNetwork('Mastercard');
                        if (scheme.includes('amex') || scheme.includes('american express')) setCardNetwork('Amex');
                    }
                    
                    if (info.type) {
                        const type = info.type.toUpperCase();
                        if (type === 'DEBIT' || type === 'CREDIT') {
                            setCardData(prev => ({ ...prev, type: type as 'DEBIT' | 'CREDIT' }));
                        }
                    }
                }
            } else {
                setDetectedBank(null);
                setDetectedCountry(null);
            }
        };

        const timer = setTimeout(performLookup, 500); // Debounce API calls
        return () => clearTimeout(timer);

    }, [cardData.number]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        let formattedValue = value;
        if (name === 'number') {
            formattedValue = value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})/g, '$1 ').trim();
        } else if (name === 'expiry') {
            formattedValue = value.replace(/\D/g, '');
            if (formattedValue.length > 2) {
                formattedValue = formattedValue.slice(0, 2) + '/' + formattedValue.slice(2, 4);
            }
        } else if (name === 'cvc') {
            formattedValue = value.replace(/\D/g, '').slice(0, 4);
        }
        setCardData(prev => ({ ...prev, [name]: formattedValue }));
        if (error) setError('');
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const rawCardNumber = cardData.number.replace(/\s/g, '');
        if (!luhnCheck(rawCardNumber)) {
            return setError('Please enter a valid card number.');
        }
        const expiryError = validateExpiryDate(cardData.expiry);
        if (expiryError) {
            return setError(expiryError);
        }
        const cvcError = validateCvc(cardData.cvc);
        if (cvcError) {
            return setError(cvcError);
        }
        if (!cardData.name.trim()) {
            return setError('Please enter the cardholder name.');
        }

        setIsProcessing(true);
        setTimeout(() => {
            const newCardData: Omit<Card, 'id' | 'controls'> = {
                lastFour: rawCardNumber.slice(-4),
                cardholderName: cardData.name,
                expiryDate: cardData.expiry,
                fullNumber: rawCardNumber,
                cvc: cardData.cvc,
                network: cardNetwork as 'Visa' | 'Mastercard' | 'Amex',
                cardType: cardData.type,
            };
            
            if(newCardData.cardType === 'CREDIT') {
                 newCardData.creditDetails = {
                    creditLimit: 10000,
                    currentBalance: 0,
                    statementBalance: 0,
                    minimumPayment: 0,
                    paymentDueDate: new Date(),
                    apr: 21.99
                 }
            }
            
            onAddCard(newCardData);
            onClose();
        }, 1500);
    };

    return (
        <div className="fixed inset-0 bg-slate-100 bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-slate-200 rounded-2xl shadow-digital p-8 w-full max-w-md m-4">
                 <h2 className="text-2xl font-bold text-[#1E293B] mb-6">Add New Card</h2>
                 <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="cardNumber" className="block text-sm font-bold text-[#0F172A]">Card Number</label>
                        <div className="mt-1 relative rounded-md shadow-digital-inset">
                            <input type="text" id="cardNumber" name="number" value={cardData.number} onChange={handleChange} className="w-full bg-transparent border-0 p-3" maxLength={19} required/>
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
                                {isCheckingBin && <SpinnerIcon className="w-4 h-4 text-primary animate-spin" />}
                                {cardNetwork === 'Visa' && <VisaIcon className="w-8 h-auto" />}
                                {cardNetwork === 'Mastercard' && <MastercardIcon className="w-8 h-auto" />}
                                {cardNetwork === 'Amex' && <AmexIcon className="w-9 h-auto" />}
                            </div>
                        </div>
                        {detectedBank && (
                            <div className="mt-2 flex items-center gap-4 text-xs font-semibold text-[#0F172A] animate-fade-in">
                                <span className="flex items-center gap-1"><BankIcon className="w-3 h-3 text-primary" /> {detectedBank}</span>
                                {detectedCountry && <span className="flex items-center gap-1"><GlobeAmericasIcon className="w-3 h-3 text-[#0F172A] dark:text-white" /> {detectedCountry}</span>}
                            </div>
                        )}
                    </div>
                    <div>
                        <label htmlFor="card-type" className="block text-sm font-bold text-[#0F172A]">Card Type</label>
                        <div className="relative">
                             <select id="card-type" name="type" value={cardData.type} onChange={handleChange} className="mt-1 w-full p-3 rounded-md shadow-digital-inset bg-slate-200 appearance-none">
                                <option value="DEBIT">Debit Card</option>
                                <option value="CREDIT">Credit Card</option>
                            </select>
                            {detectedBank && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-600 font-bold">Auto-detected</div>}
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="expiry" className="block text-sm font-bold text-[#0F172A]">Expiry Date</label>
                            <input type="text" id="expiry" name="expiry" value={cardData.expiry} onChange={handleChange} className="mt-1 block w-full bg-slate-200 border-0 p-3 rounded-md shadow-digital-inset" placeholder="MM/YY" required/>
                        </div>
                        <div>
                            <label htmlFor="cvc" className="block text-sm font-bold text-[#0F172A]">CVC</label>
                            <input type="text" id="cvc" name="cvc" value={cardData.cvc} onChange={handleChange} className="mt-1 block w-full bg-slate-200 border-0 p-3 rounded-md shadow-digital-inset" placeholder="123" required/>
                        </div>
                    </div>
                     <div>
                        <label htmlFor="name" className="block text-sm font-bold text-[#0F172A]">Cardholder Name</label>
                        <input type="text" id="name" name="name" value={cardData.name} onChange={handleChange} className="mt-1 w-full bg-slate-200 border-0 p-3 rounded-md shadow-digital-inset" required/>
                    </div>
                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                    <div className="pt-4 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} disabled={isProcessing} className="px-4 py-2 text-sm font-bold text-[#0F172A] bg-slate-200 rounded-lg shadow-digital active:shadow-digital-inset transition-shadow">Cancel</button>
                        <button 
                            type="submit" 
                            disabled={isProcessing} 
                            className="px-6 py-3 text-sm font-bold text-[#0F172A] dark:text-white bg-gradient-to-r from-primary to-primary-600 rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center"
                        >
                            {isProcessing && <SpinnerIcon className="w-5 h-5 mr-2 animate-spin" />}
                            {isProcessing ? 'Adding...' : 'Add Card'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
