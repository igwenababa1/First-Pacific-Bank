
import React, { useState } from 'react';
import { TravelPlan, TravelPlanStatus, Country, Card, Account } from '../types';
import { CalendarDaysIcon, GlobeAmericasIcon, CheckCircleIcon, PlusCircleIcon, MapPinIcon, ShieldCheckIcon, CreditCardIcon, InfoIcon, PhoneIcon, SendIcon, LockClosedIcon } from './Icons';
import { CountrySelector } from './CountrySelector';
import { getFlagUrl } from '../utils/flags';

interface TravelCheckInProps {
    travelPlans: TravelPlan[];
    addTravelPlan: (plan: Omit<TravelPlan, 'id' | 'status'>) => void;
    cards: Card[];
    account: Account;
}

const TravelPlanCard: React.FC<{ plan: TravelPlan, cards: Card[] }> = ({ plan, cards }) => {
    const getStatusInfo = () => {
        switch (plan.status) {
            case TravelPlanStatus.ACTIVE:
                return {
                    icon: <GlobeAmericasIcon className="w-5 h-5 text-emerald-500" />,
                    style: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                    label: "Active Now"
                };
            case TravelPlanStatus.UPCOMING:
                return {
                    icon: <CalendarDaysIcon className="w-5 h-5 text-primary" />,
                    style: "bg-primary/10 text-primary border-primary/20",
                    label: "Upcoming"
                };
            case TravelPlanStatus.COMPLETED:
                return {
                    icon: <CheckCircleIcon className="w-5 h-5 text-[#0F172A]" />,
                    style: "bg-white text-[#0F172A] dark:text-white border-slate-100 dark:border-white/10",
                    label: "Completed"
                };
        }
    };
    const { icon, style, label } = getStatusInfo();
    
    return (
        <div className="bg-slate-50 dark:bg-slate-900  rounded-2xl border border-slate-100 dark:border-white/10 p-5 relative overflow-hidden group hover:border-primary/30 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[50px] -mr-10 -mt-10 pointer-events-none"></div>
            
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center border border-slate-200 dark:border-white/10 overflow-hidden relative shadow-lg">
                        <img src={getFlagUrl(plan.country.code)} alt={plan.country.name} className="w-full h-full object-cover opacity-80" />
                    </div>
                    <div>
                        <h4 className="font-black text-xl text-[#0F172A] dark:text-white tracking-tight leading-none mb-1">{plan.country.name}</h4>
                        <p className="text-xs font-bold text-[#0F172A] dark:text-white uppercase tracking-widest">
                            {plan.startDate.toLocaleDateString()} - {plan.endDate.toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <div className={`flex items-center space-x-2 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg border ${style}`}>
                    {icon}
                    <span>{label}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 border-t border-slate-100 dark:border-white/10 pt-4">
                <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#0F172A] block mb-1">Flight Data</span>
                    {plan.flightNumber ? (
                        <div className="flex items-center gap-2 text-[#0F172A] dark:text-white text-sm font-bold">
                            <SendIcon className="w-4 h-4 text-primary" /> {plan.airline} {plan.flightNumber}
                        </div>
                    ) : (
                        <span className="text-[#0F172A] text-xs font-bold">No flight provided</span>
                    )}
                </div>
                <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#0F172A] block mb-1">Secured Cards</span>
                    <div className="flex -space-x-2">
                        {plan.selectedCardIds && plan.selectedCardIds.length > 0 ? (
                            plan.selectedCardIds.map(id => {
                                const card = cards.find(c => c.id === id);
                                if (!card) return null;
                                return (
                                    <div key={id} className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-300 flex items-center justify-center text-[10px] font-bold text-[#0F172A] dark:text-white z-10 hover:z-20 transform hover:scale-110 transition-transform">
                                        {card.lastFour}
                                    </div>
                                )
                            })
                        ) : (
                            <span className="text-[#0F172A] text-xs font-bold">All active cards</span>
                        )}
                    </div>
                </div>
            </div>
            
            {plan.autoCurrencyConversion && (
                <div className="mt-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-start gap-3">
                    <ShieldCheckIcon className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block mb-0.5">FX Protection Active</span>
                        <p className="text-xs text-emerald-400/70 font-bold">Auto-conversion enabled for local transactions using market rates.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export const TravelCheckIn: React.FC<TravelCheckInProps> = ({ travelPlans, addTravelPlan, cards, account }) => {
    const [step, setStep] = useState(1);
    const [country, setCountry] = useState<Country | null>(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [travelReason, setTravelReason] = useState<'business' | 'leisure' | 'relocation' | 'other'>('leisure');
    
    const [flightNumber, setFlightNumber] = useState('');
    const [airline, setAirline] = useState('');
    
    const [emergencyContactName, setEmergencyContactName] = useState('');
    const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
    
    const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
    const [autoCurrencyConversion, setAutoCurrencyConversion] = useState(true);

    const [error, setError] = useState('');
    
    const handleNext = () => {
        setError('');
        if (step === 1) {
            if (!country || !startDate || !endDate) {
                setError('Core details are required.');
                return;
            }
            if (new Date(endDate) <= new Date(startDate)) {
                setError('End date must be after start date.');
                return;
            }
            setStep(2);
        } else if (step === 2) {
            setStep(3);
        } else if (step === 3) {
            setStep(4);
        }
    };

    const handleBack = () => setStep(prev => prev - 1);

    const handleSubmit = () => {
        setError('');
        addTravelPlan({
            country: country!,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            travelReason,
            flightNumber,
            airline,
            emergencyContactName,
            emergencyContactPhone,
            selectedCardIds,
            autoCurrencyConversion
        });
        
        // Reset form
        setStep(1);
        setCountry(null);
        setStartDate('');
        setEndDate('');
        setTravelReason('leisure');
        setFlightNumber('');
        setAirline('');
        setEmergencyContactName('');
        setEmergencyContactPhone('');
        setSelectedCardIds([]);
        setAutoCurrencyConversion(true);
    };

    const toggleCardSelection = (id: string) => {
        setSelectedCardIds(prev => 
            prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
        );
    };

    const upcomingPlans = travelPlans.filter(p => p.status === TravelPlanStatus.UPCOMING);
    const activePlans = travelPlans.filter(p => p.status === TravelPlanStatus.ACTIVE);
    const completedPlans = travelPlans.filter(p => p.status === TravelPlanStatus.COMPLETED);
    
    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div className="flex items-center gap-4 border-b border-slate-100 dark:border-white/10 pb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shadow-[0_0_30px_rgba(var(--primary),0.2)]">
                    <GlobeAmericasIcon className="w-8 h-8 text-primary" />
                </div>
                <div>
                    <h2 className="text-3xl font-black text-[#0F172A] dark:text-white tracking-tighter uppercase leading-none">Border Transit</h2>
                    <p className="text-xs font-bold text-[#0F172A] uppercase tracking-widest mt-2">ITCC Travel Declaration & Fraud Prevention</p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                {/* Form Module */}
                <div className="xl:col-span-5 bg-[#0c121e] rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-2xl relative overflow-hidden flex flex-col h-[700px]">
                    
                    {/* Header */}
                    <div className="p-6 border-b border-slate-100 dark:border-white/10 bg-white flex justify-between items-center z-10 shrink-0 dark:bg-slate-800">
                        <div>
                            <h3 className="text-lg font-black text-[#0F172A] dark:text-white uppercase tracking-wider">New Itinerary</h3>
                            <p className="text-[10px] text-[#0F172A] dark:text-white uppercase tracking-widest font-bold">Step {step} of 4</p>
                        </div>
                        <div className="flex gap-1">
                            {[1,2,3,4].map(i => (
                                <div key={i} className={`w-8 h-1.5 rounded-full transition-colors ${step >= i ? 'bg-primary' : 'bg-white dark:bg-slate-900'}`}></div>
                            ))}
                        </div>
                    </div>

                    {/* Content Scrollable */}
                    <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar relative z-10 min-h-0">
                        {step === 1 && (
                            <div className="space-y-6 animate-fade-in text-left">
                                <div className="primary- border primary- p-4 rounded-xl flex gap-3">
                                    <InfoIcon className="w-5 h-5 primary- shrink-0 mt-0.5" />
                                    <p className="text-[10px] primary- font-bold leading-relaxed uppercase tracking-widest font-bold">
                                        Declaring travel prevents false fraud blocks on your secure cards while abroad.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-2 ml-1">Destination Region</label>
                                    <CountrySelector 
                                        selectedCountry={country || { name: 'Select Jurisdiction', code: '', currency: '', symbol: ''}}
                                        onSelect={setCountry}
                                        className="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 hover:border-primary/50 transition-colors p-4 rounded-xl text-left text-sm font-bold text-[#0F172A] dark:text-white shadow-inner"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-2 ml-1">Entry Date</label>
                                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 text-[#0F172A] dark:text-white p-4 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none placeholder-slate-700 text-sm font-bold [color-scheme:dark]" required />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-2 ml-1">Exit Date</label>
                                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 text-[#0F172A] dark:text-white p-4 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none placeholder-slate-700 text-sm font-bold [color-scheme:dark]" required />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-2 ml-1">Purpose of Transit</label>
                                    <select value={travelReason} onChange={(e) => setTravelReason(e.target.value as any)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 text-[#0F172A] dark:text-white p-4 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm font-bold appearance-none">
                                        <option value="leisure">Leisure / Vacation</option>
                                        <option value="business">Business / Corporate</option>
                                        <option value="relocation">Relocation</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6 animate-fade-in text-left">
                                <div className="text-center mb-8">
                                    <div className="w-16 h-16 mx-auto bg-white dark:bg-slate-900 rounded-full flex items-center justify-center border border-slate-200 dark:border-white/10 mb-4">
                                        <SendIcon className="w-8 h-8 text-[#0F172A] dark:text-white" />
                                    </div>
                                    <h4 className="text-lg font-black text-[#0F172A] dark:text-white uppercase tracking-wider">Flight Manifest</h4>
                                    <p className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest mt-1">Optional • Aids in insurance claims</p>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-2 ml-1">Operating Airline</label>
                                    <input type="text" value={airline} onChange={e => setAirline(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 text-[#0F172A] dark:text-white p-4 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none placeholder-slate-700 text-sm font-bold" placeholder="e.g. Emirates, Delta" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-2 ml-1">Flight Number</label>
                                    <input type="text" value={flightNumber} onChange={e => setFlightNumber(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 text-[#0F172A] dark:text-white p-4 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none placeholder-slate-700 text-sm font-bold uppercase" placeholder="e.g. EK202" />
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6 animate-fade-in text-left">
                                 <div className="text-center mb-8">
                                    <div className="w-16 h-16 mx-auto bg-white dark:bg-slate-900 rounded-full flex items-center justify-center border border-slate-200 dark:border-white/10 mb-4">
                                        <PhoneIcon className="w-8 h-8 text-[#0F172A] dark:text-white" />
                                    </div>
                                    <h4 className="text-lg font-black text-[#0F172A] dark:text-white uppercase tracking-wider">Emergency Line</h4>
                                    <p className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest mt-1">Authorized contact abroad</p>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-2 ml-1">Contact Name</label>
                                    <input type="text" value={emergencyContactName} onChange={e => setEmergencyContactName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 text-[#0F172A] dark:text-white p-4 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none placeholder-slate-700 text-sm font-bold" placeholder="Full Name" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-2 ml-1">Contact Phone</label>
                                    <input type="tel" value={emergencyContactPhone} onChange={e => setEmergencyContactPhone(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/10 text-[#0F172A] dark:text-white p-4 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none placeholder-slate-700 text-sm font-bold font-mono tracking-widest" placeholder="+1 (000) 000-0000" />
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="space-y-6 animate-fade-in text-left">
                                 <div className="text-center mb-8">
                                    <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 shadow-[0_0_30px_rgba(var(--primary),0.2)] mb-4">
                                        <LockClosedIcon className="w-8 h-8 text-primary" />
                                    </div>
                                    <h4 className="text-lg font-black text-[#0F172A] dark:text-white uppercase tracking-wider">Asset Clearances</h4>
                                    <p className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest mt-1">Select cards to unblock at destination</p>
                                </div>

                                <div className="space-y-3">
                                    {cards.map(card => (
                                        <button 
                                            key={card.id}
                                            onClick={() => toggleCardSelection(card.id)}
                                            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${selectedCardIds.includes(card.id) ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(var(--primary),0.1)]' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-white/10 hover:bg-white dark:bg-slate-900'}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200 dark:border-white/10">
                                                    <CreditCardIcon className={`w-5 h-5 ${selectedCardIds.includes(card.id) ? 'text-primary' : 'text-[#0F172A]'}`} />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-black text-[#0F172A] dark:text-white uppercase tracking-widest">{card.network} •••• {card.lastFour}</p>
                                                    <p className="text-[10px] font-bold text-[#0F172A] uppercase tracking-widest mt-0.5">Physical Card</p>
                                                </div>
                                            </div>
                                            {selectedCardIds.includes(card.id) && (
                                                <CheckCircleIcon className="w-5 h-5 text-primary" />
                                            )}
                                        </button>
                                    ))}
                                </div>

                                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/10">
                                    <label className="flex items-start gap-4 cursor-pointer group">
                                        <div className={`w-6 h-6 rounded flex items-center justify-center border transition-all mt-0.5 ${autoCurrencyConversion ? 'bg-primary border-primary' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-300 group-hover:border-slate-500'}`}>
                                            {autoCurrencyConversion && <CheckCircleIcon className="w-4 h-4 text-[#0F172A] dark:text-white" />}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-[#0F172A] dark:text-white uppercase tracking-wider">Zero-Fee FX Auto-Conversion</p>
                                            <p className="text-[10px] font-bold text-[#0F172A] tracking-widest uppercase mt-2 leading-relaxed">
                                                Automatically settle foreign transactions at interbank exchange rates without foreign transaction fees. 
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        )}
                        
                        {error && <p className="text-xs font-bold text-red-500 uppercase tracking-widest text-center py-2 bg-red-500/10 rounded-lg">{error}</p>}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-slate-100 dark:border-white/10 bg-slate-100 flex gap-4 shrink-0">
                        {step > 1 && (
                            <button onClick={handleBack} className="px-6 py-4 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white font-bold text-xs uppercase tracking-widest transition-colors border border-slate-100 dark:border-white/10">
                                Back
                            </button>
                        )}
                        {step < 4 ? (
                            <button onClick={handleNext} className="flex-1 py-4 bg-primary hover:bg-primary-600 text-[#0F172A] dark:text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-primary/20 transition-all active:scale-[0.98]">
                                Continue
                            </button>
                        ) : (
                            <button onClick={handleSubmit} className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-[#0F172A] dark:text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
                                <ShieldCheckIcon className="w-5 h-5" /> Issue Clearance
                            </button>
                        )}
                    </div>
                </div>
                
                {/* Visualizer / List */}
                <div className="xl:col-span-7 space-y-6">
                     <div className="bg-[#0c121e] rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-2xl p-8">
                         <h3 className="text-xl font-black text-[#0F172A] dark:text-white uppercase tracking-wider mb-8 flex items-center gap-3">
                             <GlobeAmericasIcon className="w-6 h-6 text-primary" /> Active Itineraries
                         </h3>
                         
                         {activePlans.length > 0 || upcomingPlans.length > 0 ? (
                             <div className="space-y-6">
                                 {activePlans.length > 0 && (
                                     <div className="space-y-4">
                                         {activePlans.map(p => <TravelPlanCard key={p.id} plan={p} cards={cards} />)}
                                     </div>
                                 )}
                                 {upcomingPlans.length > 0 && (
                                     <div className="space-y-4">
                                         {upcomingPlans.map(p => <TravelPlanCard key={p.id} plan={p} cards={cards} />)}
                                     </div>
                                 )}
                             </div>
                         ) : (
                             <div className="text-center py-16 border-2 border-dashed border-slate-100 dark:border-white/10 rounded-2xl">
                                 <MapPinIcon className="w-16 h-16 mx-auto text-[#1E293B] mb-6"/>
                                 <p className="font-black text-[#0F172A] dark:text-white text-lg uppercase tracking-widest">No Active Clearances</p>
                                 <p className="text-[10px] font-bold text-[#0F172A] tracking-widest uppercase mt-3">Register your transit above to prevent card locks.</p>
                             </div>
                         )}
                     </div>

                     {completedPlans.length > 0 && (
                         <div className="bg-slate-50 dark:bg-slate-900  rounded-[2rem] border border-slate-100 dark:border-white/10 p-8">
                             <h3 className="text-sm font-black text-[#0F172A] uppercase tracking-widest mb-6">Historical Logs</h3>
                             <div className="space-y-4">
                                 {completedPlans.map(p => <TravelPlanCard key={p.id} plan={p} cards={cards} />)}
                             </div>
                         </div>
                     )}
                </div>
            </div>
        </div>
    );
};

