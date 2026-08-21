import React, { useState } from 'react';
import { CheckCircleIcon, DocumentCheckIcon, IdentificationIcon, ArrowRightIcon, XIcon, SpinnerIcon, CameraIcon } from './Icons';
import { db } from '../services/database';
import { socket } from '../services/socket';
import { SmartInput } from './SmartInput';

interface KYCFormProps {
    onComplete: () => void;
    onCancel: () => void;
    userEmail?: string;
}

export const KYCForm: React.FC<KYCFormProps> = ({ onComplete, onCancel, userEmail }) => {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        dob: '',
        ssn: '',
        street: '',
        city: '',
        state: '',
        zip: '',
        country: 'US',
    });
    const [documents, setDocuments] = useState({
        identity: null as File | null,
        address: null as File | null,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'identity' | 'address') => {
        if (e.target.files && e.target.files[0]) {
            setDocuments({ ...documents, [type]: e.target.files[0] });
        }
    };

    const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (step < 3) {
            setStep(step + 1);
            return;
        }

        setIsSubmitting(true);
        
        try {
            let identityUrl = '';
            let addressUrl = '';
            
            if (documents.identity) {
                const b64 = await fileToBase64(documents.identity);
                identityUrl = await db.uploadFile(b64, 'kyc', 'identity');
            }
            if (documents.address) {
                const b64 = await fileToBase64(documents.address);
                addressUrl = await db.uploadFile(b64, 'kyc', 'address');
            }
            
            // Automatically approve KYC in mock mode
            if (userEmail) {
                await db.updateUserKycStatus(userEmail, 'verified');
            }
            
            // Notify Admin
            socket.emit('admin:push_alert', { 
                message: `New Document Verification (KYC) completed for ${userEmail || 'a user'}. Identity and Address documents attached. Status: Auto-Verified.`, 
                severity: 'high' 
            });
            
            // Mocking local delay to simulate the DB updates completing cleanly
            await new Promise(r => setTimeout(r, 600));
            onComplete();
        } catch(error) {
            console.error('Failed to submit KYC:', error);
            // Optionally could show error to user
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-4 animate-fade-in">
                        <div className="text-center mb-6">
                            <IdentificationIcon className="w-12 h-12 text-primary mx-auto mb-2" />
                            <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Personal Information</h3>
                            <p className="text-sm text-[#0F172A] dark:text-white">Please provide your legal identity details.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <SmartInput required type="text" name="firstName" value={formData.firstName} onChange={handleChange} label="First Name" typeType="name" />
                            </div>
                            <div>
                                <SmartInput required type="text" name="lastName" value={formData.lastName} onChange={handleChange} label="Last Name" typeType="name" />
                            </div>
                        </div>
                        <div>
                            <SmartInput required type="date" name="dob" value={formData.dob} onChange={handleChange} label="Date of Birth" />
                        </div>
                        <div>
                            <SmartInput required type="password" name="ssn" value={formData.ssn} onChange={handleChange} placeholder="XXX-XX-XXXX" label="SSN / National ID" typeType="ssn" />
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-4 animate-fade-in">
                        <div className="text-center mb-6">
                            <DocumentCheckIcon className="w-12 h-12 text-primary mx-auto mb-2" />
                            <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Residential Address</h3>
                            <p className="text-sm text-[#0F172A] dark:text-white">Where do you currently live?</p>
                        </div>
                        <div>
                            <SmartInput required type="text" name="street" value={formData.street} onChange={handleChange} label="Street Address" typeType="address" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <SmartInput required type="text" name="city" value={formData.city} onChange={handleChange} label="City" />
                            </div>
                            <div>
                                <SmartInput required type="text" name="state" value={formData.state} onChange={handleChange} label="State / Province" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <SmartInput required type="text" name="zip" value={formData.zip} onChange={handleChange} label="Postal Code" typeType="zip" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-1.5 transition-colors">Country</label>
                                <select required name="country" value={formData.country} onChange={handleChange} className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm font-bold text-[#0F172A] dark:text-white outline-none focus:ring-4 focus:ring-emerald-500/10 font-sans">
                                    <option value="US">United States</option>
                                    <option value="UK">United Kingdom</option>
                                    <option value="CA">Canada</option>
                                    <option value="AU">Australia</option>
                                </select>
                            </div>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-4 animate-fade-in">
                        <div className="text-center mb-6">
                            <CameraIcon className="w-12 h-12 text-primary mx-auto mb-2" />
                            <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Document Upload</h3>
                            <p className="text-sm text-[#0F172A] dark:text-white">Please provide proof of identity and address.</p>
                        </div>
                        
                        <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 text-center hover:border-primary transition-colors cursor-pointer relative">
                            <input type="file" required onChange={(e) => handleFileChange(e, 'identity')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*,.pdf" />
                            <IdentificationIcon className="w-8 h-8 text-[#0F172A] dark:text-white mx-auto mb-2" />
                            <p className="text-sm font-bold text-[#0F172A] dark:text-white">Proof of Identity</p>
                            <p className="text-xs text-[#0F172A] mt-1">{documents.identity ? documents.identity.name : 'Upload Passport or Driver\'s License'}</p>
                        </div>

                        <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 text-center hover:border-primary transition-colors cursor-pointer relative">
                            <input type="file" required onChange={(e) => handleFileChange(e, 'address')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*,.pdf" />
                            <DocumentCheckIcon className="w-8 h-8 text-[#0F172A] dark:text-white mx-auto mb-2" />
                            <p className="text-sm font-bold text-[#0F172A] dark:text-white">Proof of Address</p>
                            <p className="text-xs text-[#0F172A] mt-1">{documents.address ? documents.address.name : 'Upload Utility Bill or Bank Statement'}</p>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-100  flex items-center justify-center z-[100] p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative animate-fade-in-up">
                <button onClick={onCancel} className="absolute top-4 right-4 text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:hover:text-[#0F172A] dark:text-white z-10">
                    <XIcon className="w-5 h-5" />
                </button>
                
                <div className="p-6">
                    <div className="flex items-center justify-between mb-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                                    step >= i ? 'bg-primary text-[#0F172A] dark:text-white' : 'bg-slate-100 dark:bg-slate-700 text-[#0F172A] dark:text-white'
                                }`}>
                                    {step > i ? <CheckCircleIcon className="w-5 h-5" /> : i}
                                </div>
                                {i < 3 && (
                                    <div className={`w-12 h-1 mx-2 rounded-full transition-colors ${
                                        step > i ? 'bg-primary' : 'bg-slate-100 dark:bg-slate-700'
                                    }`} />
                                )}
                            </div>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit}>
                        {renderStepContent()}
                        
                        <div className="mt-8 flex gap-3">
                            {step > 1 && (
                                <button type="button" onClick={() => setStep(step - 1)} className="px-4 py-3 rounded-xl font-bold text-[#0F172A] dark:text-white bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                                    Back
                                </button>
                            )}
                            <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-3 rounded-xl font-bold text-[#0F172A] dark:text-white bg-primary hover:bg-primary-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-70">
                                {isSubmitting ? (
                                    <><SpinnerIcon className="w-5 h-5 animate-spin" /> Processing...</>
                                ) : (
                                    <>{step === 3 ? 'Submit Application' : 'Continue'} <ArrowRightIcon className="w-4 h-4" /></>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
