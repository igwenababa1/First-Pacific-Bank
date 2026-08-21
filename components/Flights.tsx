
// ... existing imports ...
import React, { useState, useMemo, useEffect } from 'react';
import { Flight, FlightBooking, Airport, Account, CarRentalOffer } from '../types';
import { AIRPORTS, USER_PIN } from './constants';
import { db } from '../services/database';
import { searchCarRentals } from '../services/travelService';
import { 
    AirplaneTicketIcon, 
    ArrowLongRightIcon, 
    UsersIcon, 
    CalendarDaysIcon, 
    SpinnerIcon, 
    ShieldCheckIcon, 
    QuestionMarkCircleIcon, 
    InfoIcon, 
    XIcon, 
    GlobeAmericasIcon, 
    MapPinIcon, 
    StarIcon, 
    ShoppingBagIcon,
    HomeIcon,
    PlusCircleIcon,
    ArrowsRightLeftIcon,
    TrendingUpIcon,
    CheckCircleIcon,
    ClockIcon,
    LockClosedIcon,
    QrCodeIcon,
    PremiumReservedBankLogo,
    BrandLogo as AirlineLogo,
    Truck,
    BriefcaseIcon,
    User,
    CloudArrowUpIcon,
    SunIcon,
    SparklesIcon,
    SearchCode,
    BuildingOfficeIcon,
    ChevronRightIcon,
    ChevronLeftIcon
} from './Icons';
import { ComplianceHaltModal } from './ComplianceHaltModal';
import { getCityWeatherData, WeatherData } from '../services/weatherService';
import { useCurrency } from '../contexts/CurrencyContext';

// ... existing types and mock data ...
type TravelCategory = 'aviation' | 'stays' | 'expeditions' | 'mobility' | 'elite';

interface Hotel {
    id: string;
    name: string;
    location: string;
    rating: number;
    pricePerNight: number;
    image: string;
    amenities: string[];
}

interface Tour {
    id: string;
    title: string;
    location: string;
    duration: string;
    price: number;
    image: string;
}

interface EliteEvent {
    id: string;
    title: string;
    venue: string;
    date: string;
    price: number;
    category: 'Football' | 'Gala' | 'Concert';
    image: string;
}

interface FlightsProps {
    bookings: FlightBooking[];
    onBookFlight: (booking: Omit<FlightBooking, 'id' | 'bookingDate' | 'status'>, sourceAccountId: string) => boolean;
    accounts: Account[];
    onContactSupport: () => void;
}

// ... mock data (MOCK_HOTELS, MOCK_TOURS, MOCK_EVENTS) ...
const MOCK_HOTELS: Hotel[] = [
    { id: 'h1', name: 'The Obsidian Grand', location: 'Dubai, UAE', rating: 5, pricePerNight: 1200, image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=1920&auto=format&fit=crop&ixlib=rb-4.0.3', amenities: ['Private Pool', 'Butler Service', 'Helipad'] },
    { id: 'h2', name: 'Azure Bay Resort', location: 'Maldives', rating: 5, pricePerNight: 2500, image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=1920&auto=format&fit=crop&ixlib=rb-4.0.3', amenities: ['Overwater Villa', 'Spa', 'Underwater Dining'] },
    { id: 'h3', name: 'Chateau de Lumière', location: 'Paris, France', rating: 5, pricePerNight: 1800, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1920&auto=format&fit=crop&ixlib=rb-4.0.3', amenities: ['Eiffel View', 'Michelin Star', 'Historic'] }
];

const MOCK_TOURS: Tour[] = [
    { id: 't1', title: 'Private Alps Helicopter Expedition', location: 'Zermatt, Switzerland', duration: '4 Hours', price: 3500, image: 'https://images.unsplash.com/photo-1531310197839-ccf54634509e?q=80&w=1920&auto=format&fit=crop&ixlib=rb-4.0.3' },
    { id: 't2', title: 'Savannah Private Safari', location: 'Maasai Mara, Kenya', duration: '3 Days', price: 5000, image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?q=80&w=1920&auto=format&fit=crop&ixlib=rb-4.0.3' }
];

const MOCK_EVENTS: EliteEvent[] = [
    { id: 'e1', title: 'Champions League Final - VIP Box', venue: 'Wembley Stadium, London', date: 'Jun 01, 2025', price: 12500, category: 'Football', image: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=1920&auto=format&fit=crop&ixlib=rb-4.0.3' },
    { id: 'e2', title: 'Monaco Grand Prix Terrace Access', venue: 'Monte Carlo', date: 'May 25, 2025', price: 9500, category: 'Gala', image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=1920&auto=format&fit=crop&ixlib=rb-4.0.3' }
];

// ... sub-components (CategoryButton, ServiceCard, BookingSuccessView) ...
const CategoryButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
    <button 
        onClick={onClick}
        className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all duration-500 whitespace-nowrap group ${active ? 'bg-primary text-[#0F172A] dark:text-white shadow-[0_0_20px_rgba(14,197,242,0.4)] scale-105' : 'bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white hover:bg-white dark:bg-slate-900 hover:text-[#0F172A] dark:text-[#1E293B]'}`}
    >
        <span className={`transition-transform duration-500 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</span>
        <span className="text-sm font-bold uppercase tracking-wider">{label}</span>
    </button>
);

const ServiceCard: React.FC<{ title: string; subtitle: string; price: number; image: string; badges?: string[]; onClick: () => void; priceLabel?: string }> = ({ title, subtitle, price, image, badges, onClick, priceLabel = "from" }) => {
    const { formatCurrency } = useCurrency();
    return (
    <div className="group bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-2xl transition-all hover:border-primary/50 hover:-translate-y-2">
        <div className="relative h-56 overflow-hidden bg-white dark:bg-slate-900">
            <div 
                className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{ backgroundImage: `url('${image}')` }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
            <div className="absolute top-4 left-4 flex gap-2">
                {badges?.map(b => (
                    <span key={b} className="px-2 py-1 bg-slate-100  border border-slate-300 dark:border-black/10 rounded-lg text-[9px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest">{b}</span>
                ))}
            </div>
        </div>
        <div className="p-6">
            <h3 className="text-xl font-bold text-[#0F172A] dark:text-white mb-1 group-hover:text-primary transition-colors">{title}</h3>
            <p className="text-sm text-[#0F172A] dark:text-white mb-6 flex items-center gap-2">
                <MapPinIcon className="w-3 h-3" /> {subtitle}
            </p>
            <div className="flex items-end justify-between">
                <div>
                    <p className="text-[10px] text-[#0F172A] uppercase font-black tracking-widest leading-none">{priceLabel}</p>
                    <p className="text-2xl font-mono font-bold text-[#0F172A] dark:text-white">{formatCurrency(price)}</p>
                </div>
                <button 
                    onClick={onClick}
                    className="px-6 py-2.5 bg-white text-[#0F172A] font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-primary hover:text-[#0F172A] dark:text-white transition-all shadow-lg dark:bg-slate-800"
                >
                    Book
                </button>
            </div>
        </div>
    </div>
    );
};

const BookingSuccessView: React.FC<{ 
    type: string; 
    item: any; 
    passengers: number; 
    totalPrice: number;
    onClose: () => void;
}> = ({ type, item, passengers, totalPrice, onClose }) => {
    // ... logic same as before ...
    const { formatCurrency } = useCurrency();
    const bookingRef = useMemo(() => `PRB-TRVL-${Math.random().toString(36).substring(7).toUpperCase()}`, []);
    const terminal = useMemo(() => Math.floor(Math.random() * 5) + 1, []);
    const gate = useMemo(() => String.fromCharCode(65 + Math.floor(Math.random() * 6)) + (Math.floor(Math.random() * 30) + 1), []);
    const [weather, setWeather] = useState<WeatherData | null>(null);

    useEffect(() => {
        const fetchWeather = async () => {
            const destCity = item.to?.city || item.location?.split(',')[0];
            if (destCity) {
                const data = await getCityWeatherData(destCity);
                setWeather(data);
            }
        };
        fetchWeather();
    }, [item]);

    const weatherIcon = useMemo(() => {
        if (!weather) return <GlobeAmericasIcon className="w-6 h-6 text-primary" />;
        const cond = weather.condition.toLowerCase();
        if (cond.includes('rain')) return <CloudArrowUpIcon className="w-6 h-6 primary-" />;
        if (cond.includes('sun') || cond.includes('clear')) return <SunIcon className="w-6 h-6 text-yellow-400" />;
        return <SparklesIcon className="w-6 h-6 text-purple-400" />;
    }, [weather]);
    
    return (
        <div className="space-y-6 animate-fade-in-up pb-8">
            <div className="text-center py-6">
                <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                    <CheckCircleIcon className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-3xl font-black text-[#0F172A] dark:text-white tracking-tighter">Booking Verified</h3>
                <p className="text-[#0F172A] dark:text-white text-sm mt-1 uppercase font-bold tracking-widest">Digital Itinerary Reference: {bookingRef}</p>
            </div>

            <div className="bg-white rounded-[3rem] overflow-hidden shadow-2xl text-[#0F172A] border border-slate-200 dark:bg-slate-800">
                {/* Boarding Pass Header */}
                <div className="bg-slate-50 dark:bg-slate-900 p-8 flex justify-between items-center text-[#0F172A] dark:text-white">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-white rounded-xl dark:bg-slate-800">
                            <PremiumReservedBankLogo className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0F172A] dark:text-white">Premium Reserved</p>
                            <h4 className="text-xl font-black tracking-tight">Platinum Aviation</h4>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0F172A] dark:text-white">Class</p>
                        <h4 className="text-lg font-black text-primary">FIRST / SUITE</h4>
                    </div>
                </div>
                
                {/* Flight Path Strip */}
                <div className="p-8 border-b border-dashed border-slate-200 bg-slate-50 dark:bg-slate-900">
                    {type === 'flight' ? (
                        <div className="space-y-8">
                            <div className="flex justify-between items-center">
                                <div className="text-left">
                                    <p className="text-[10px] font-black text-[#0F172A] dark:text-white uppercase mb-1">Departure</p>
                                    <p className="text-5xl font-black">{item.from.code}</p>
                                    <p className="text-sm font-bold text-[#0F172A] mt-1 uppercase">{item.from.city}</p>
                                    <p className="text-lg font-black text-primary mt-2">
                                        {new Date(item.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                <div className="flex-1 px-8 relative flex flex-col items-center">
                                    <div className="w-full h-px bg-slate-300 border-dashed border-t relative">
                                        <AirplaneTicketIcon className="w-8 h-8 text-primary absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-50 px-2 dark:bg-slate-900" />
                                    </div>
                                    <span className="mt-6 text-[10px] font-black text-[#0F172A] uppercase tracking-widest">{item.duration} Non-stop</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-[#0F172A] dark:text-white uppercase mb-1">Arrival</p>
                                    <p className="text-5xl font-black">{item.to.code}</p>
                                    <p className="text-sm font-bold text-[#0F172A] mt-1 uppercase">{item.to.city}</p>
                                    <p className="text-lg font-black text-primary mt-2">
                                        {new Date(item.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 border-t border-slate-200">
                                <div>
                                    <p className="text-[10px] text-[#0F172A] dark:text-white uppercase font-black mb-1 tracking-widest">Passenger</p>
                                    <p className="text-sm font-black uppercase">Jenny B Garcia (+{passengers - 1})</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-[#0F172A] dark:text-white uppercase font-black mb-1 tracking-widest">Terminal</p>
                                    <p className="text-sm font-black">{terminal}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-[#0F172A] dark:text-white uppercase font-black mb-1 tracking-widest">Gate</p>
                                    <p className="text-sm font-black uppercase">{gate}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-[#0F172A] dark:text-white uppercase font-black mb-1 tracking-widest">Boarding</p>
                                    <p className="text-sm font-black text-emerald-600">ZONE 1</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-8 items-center">
                            <div className="w-32 h-32 rounded-[2rem] overflow-hidden border-4 border-white shadow-xl shrink-0">
                                <img src={item.image || item.imageUrl} className="w-full h-full object-cover" alt="" />
                            </div>
                            <div className="flex-1">
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2 block">{type} Reserved</span>
                                <h4 className="text-3xl font-black text-[#0F172A] tracking-tighter leading-none mb-3">{item.name || item.title || item.vehicleName}</h4>
                                <p className="text-[#0F172A] text-sm flex items-center gap-2 mb-4 font-bold uppercase tracking-wider">
                                    <MapPinIcon className="w-4 h-4 text-[#0F172A] dark:text-white" /> {item.location || item.venue || 'Global Access Point'}
                                </p>
                                <div className="flex gap-6">
                                     <div>
                                        <p className="text-[9px] text-[#0F172A] dark:text-white uppercase font-black tracking-widest">Reference</p>
                                        <p className="text-sm font-mono font-bold">PRB-{(Math.random() * 1000000).toFixed(0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-[#0F172A] dark:text-white uppercase font-black tracking-widest">Settlement</p>
                                        <p className="text-sm font-bold text-emerald-600">COMPLETED</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Additional Modern Features Strip */}
                <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="p-8 border-r border-slate-100 bg-slate-50 dark:bg-slate-900">
                        <h5 className="text-[10px] font-black uppercase tracking-widest text-[#0F172A] dark:text-white mb-4 flex items-center gap-2">
                            <ShieldCheckIcon className="w-4 h-4 text-emerald-500" /> Platinum Services Included
                        </h5>
                        <ul className="grid grid-cols-1 gap-2">
                            <li className="flex items-center gap-3 text-xs font-bold text-[#0F172A]">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div> Exclusive Lounge Access (Gate {gate})
                            </li>
                            <li className="flex items-center gap-3 text-xs font-bold text-[#0F172A]">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div> Chauffeur Pickup at Destination
                            </li>
                            <li className="flex items-center gap-3 text-xs font-bold text-[#0F172A]">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div> Fast-Track Immigration Clearance
                            </li>
                        </ul>
                    </div>
                    <div className="p-8 flex flex-col justify-center bg-primary/5">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md dark:bg-slate-800">
                                {weatherIcon}
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest">Local Insight</p>
                                <p className="text-sm font-black text-[#1E293B]">
                                    {weather 
                                      ? `${weather.condition}, ${Math.round(weather.temp)}°C in ${item.to?.city || item.location?.split(',')[0]}` 
                                      : 'Fetching live conditions...'}
                                </p>
                            </div>
                        </div>
                        <p className="text-[10px] text-[#0F172A] leading-relaxed italic">"Premium Reserved local concierge is on standby for your arrival. Your luggage is tagged for Priority 1 handling."</p>
                    </div>
                </div>

                <div className="p-8 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-8 dark:bg-slate-900">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-white rounded-2xl shadow-xl border border-slate-100 dark:bg-slate-800">
                            <QrCodeIcon className="w-16 h-16 text-[#0F172A]" />
                        </div>
                        <div>
                            <p className="text-xs font-black text-[#0F172A] uppercase tracking-widest">Node Authentication Token</p>
                            <p className="text-[10px] text-[#0F172A] max-w-[200px] mt-2 leading-relaxed font-bold">Scan at any PRB Global Lounge or Airport Terminal for immediate Priority boarding and biometric clearance.</p>
                        </div>
                    </div>
                    <div className="text-center sm:text-right">
                        <p className="text-[10px] text-[#0F172A] dark:text-white uppercase font-black mb-1 tracking-[0.2em]">Transaction Total</p>
                        <p className="text-4xl font-mono font-bold text-[#0F172A]">{formatCurrency(totalPrice)}</p>
                        <div className="mt-1 flex items-center justify-end gap-1 text-[9px] font-bold text-emerald-600 uppercase">
                            <CheckCircleIcon className="w-3 h-3" /> Fully Settled
                        </div>
                    </div>
                </div>
            </div>

            <button onClick={onClose} className="w-full py-5 bg-primary hover:bg-primary-600 text-[#0F172A] dark:text-white font-black uppercase tracking-[0.3em] rounded-3xl shadow-2xl transition-all flex items-center justify-center gap-3">
                <ShieldCheckIcon className="w-5 h-5" /> Acknowledge Reservation
            </button>
        </div>
    );
};

export const Flights: React.FC<FlightsProps> = ({ bookings, onBookFlight, accounts, onContactSupport }) => {
    const { formatCurrency } = useCurrency();
    const [activeCategory, setActiveCategory] = useState<TravelCategory>('aviation');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<Flight[]>([]);
    const [rentalResults, setRentalResults] = useState<CarRentalOffer[]>([]);
    const [bookingDetails, setBookingDetails] = useState<{ type: string; item: any } | null>(null);
    const [searchParams, setSearchParams] = useState({ from: 'JFK', to: 'LHR', date: '', guests: 1 });
    const [rentalParams, setRentalParams] = useState({
        location: 'JFK',
        pickupDate: new Date().toISOString().split('T')[0],
        dropoffDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    });
    
    // --- Booking Lifecycle States ---
    const [bookingStep, setBookingStep] = useState<'details' | 'pin' | 'halt' | 'processing' | 'success'>('details');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSearching(true);
        setSearchResults([]);
        setRentalResults([]);

        if (activeCategory === 'mobility') {
             const pickupAirport = AIRPORTS.find(a => a.code === rentalParams.location);
             // Use same location for dropoff for MVP
             if (pickupAirport && pickupAirport.lat && pickupAirport.lng) {
                 const results = await searchCarRentals(
                     pickupAirport.lat,
                     pickupAirport.lng,
                     pickupAirport.lat,
                     pickupAirport.lng,
                     rentalParams.pickupDate,
                     rentalParams.dropoffDate
                 );
                 setRentalResults(results);
             } else {
                 console.warn("Airport coordinates not found");
             }
             setIsSearching(false);
             return;
        }

        setTimeout(() => {
            const from = AIRPORTS.find(a => a.code === searchParams.from);
            const to = AIRPORTS.find(a => a.code === searchParams.to);
            if(from && to) {
                const results: Flight[] = Array.from({ length: 4 }).map((_, i) => ({
                    id: `fl_${Date.now()}_${i}`,
                    airline: ['Emirates Skywards', 'Qatar Privilege', 'Singapore Suites', 'Lufthansa First'][i],
                    // Use simple domain string instead of full URL for BrandLogo compatibility
                    airlineLogo: ['emirates.com', 'qatarairways.com', 'singaporeair.com', 'lufthansa.com'][i],
                    flightNumber: `PRB${100+i}`,
                    from,
                    to,
                    departureTime: new Date(Date.now() + 86400000 * (2 + i)),
                    arrivalTime: new Date(Date.now() + 86400000 * (2 + i) + 3600000 * 8.5),
                    duration: '8h 30m',
                    price: 2400 + (i * 1200),
                    stops: 0
                }));
                setSearchResults(results);
            }
            setIsSearching(false);
        }, 1500);
    };

    const handleFinalBooking = async (sourceAccountId: string) => {
        const email = db.getCurrentUserEmail();
        const isValid = await db.verifyPin(email, pin);
        if (!isValid) {
            setError("Incorrect Secure PIN.");
            return;
        }
        setError('');
        setBookingStep('halt');
    };

    const handleComplianceVerified = () => {
        setBookingStep('processing');
        setTimeout(() => {
            if (bookingDetails?.type === 'flight') {
                onBookFlight({ 
                    flight: bookingDetails.item, 
                    passengers: searchParams.guests, 
                    totalPrice: bookingDetails.item.price * searchParams.guests 
                }, accounts[0].id);
            }
            // For rentals and other services, we just simulate success for now as logic is similar
            setBookingStep('success');
        }, 2000);
    };

    const handleOpenBooking = (type: string, item: any) => {
        setBookingDetails({ type, item });
        setBookingStep('details');
        setPin('');
        setError('');
    };

    const handleCloseBooking = () => {
        setBookingDetails(null);
        setBookingStep('details');
    };

    const getHeaderImage = () => {
        switch(activeCategory) {
            case 'aviation': return 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=1920&auto=format&fit=crop&ixlib=rb-4.0.3';
            case 'stays': return 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=1920&auto=format&fit=crop&ixlib=rb-4.0.3';
            case 'expeditions': return 'https://images.unsplash.com/photo-1531310197839-ccf54634509e?q=80&w=1920&auto=format&fit=crop&ixlib=rb-4.0.3';
            case 'mobility': return 'https://images.unsplash.com/photo-1567899378494-47b22a2bb96a?q=80&w=1920&auto=format&fit=crop&ixlib=rb-4.0.3';
            default: return 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=1920&auto=format&fit=crop&ixlib=rb-4.0.3';
        }
    };

    return (
        <div className="space-y-10 animate-fade-in-up pb-12">
            
            <div className="relative rounded-[3rem] overflow-hidden bg-slate-100 min-h-[450px] flex items-center p-8 md:p-16 border border-slate-100 dark:border-white/10 shadow-2xl">
                <div className="absolute inset-0 z-0 bg-slate-50 dark:bg-slate-900">
                    <div 
                        className="w-full h-full bg-cover bg-center opacity-40 transition-all duration-1000" 
                        style={{ backgroundImage: `url('${getHeaderImage()}')` }}
                    >
                        <div className="absolute inset-0 w-full h-full animate-ken-burns bg-inherit"></div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/60 to-transparent"></div>
                </div>

                <div className="relative z-10 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-black uppercase tracking-widest mb-6">
                        <ShieldCheckIcon className="w-4 h-4" /> Concierge Elite Series
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-[#0F172A] dark:text-white tracking-tighter leading-none mb-6">
                        Luxury Travel<br/>Without Limits.
                    </h1>
                    <p className="text-lg text-[#0F172A] dark:text-white leading-relaxed mb-10 max-w-lg">
                        Exclusive arrangements for the global citizen. Private aviation, bespoke villas, and priority access to world-class events.
                    </p>
                    
                    <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                        <CategoryButton active={activeCategory === 'aviation'} onClick={() => setActiveCategory('aviation')} icon={<AirplaneTicketIcon className="w-5 h-5"/>} label="Aviation" />
                        <CategoryButton active={activeCategory === 'mobility'} onClick={() => setActiveCategory('mobility')} icon={<ArrowsRightLeftIcon className="w-5 h-5"/>} label="Mobility" />
                        <CategoryButton active={activeCategory === 'stays'} onClick={() => setActiveCategory('stays')} icon={<HomeIcon className="w-5 h-5"/>} label="Stays" />
                        <CategoryButton active={activeCategory === 'expeditions'} onClick={() => setActiveCategory('expeditions')} icon={<GlobeAmericasIcon className="w-5 h-5"/>} label="Expeditions" />
                        <CategoryButton active={activeCategory === 'elite'} onClick={() => setActiveCategory('elite')} icon={<StarIcon className="w-5 h-5"/>} label="Elite Access" />
                    </div>
                </div>
            </div>

            {/* Private Hangar - Active Bookings */}
            {bookings.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative z-20 -mt-16 mx-4 md:mx-16 mb-8">
                     <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-white/10 pb-4">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <AirplaneTicketIcon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">Private Hangar</h3>
                            <p className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">Active Itineraries</p>
                        </div>
                     </div>
                     <div className="space-y-4">
                        {bookings.map(booking => (
                            <div key={booking.id} className="bg-slate-100 border border-slate-100 dark:border-white/10 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-2 dark:bg-slate-800">
                                         <AirlineLogo domain={booking.flight.airlineLogo} name={booking.flight.airline} fallback={AirplaneTicketIcon} className="w-full h-full object-contain" />
                                    </div>
                                    <div>
                                        <p className="text-[#0F172A] dark:text-white font-bold text-lg">{booking.flight.from.code} &rarr; {booking.flight.to.code}</p>
                                        <p className="text-xs text-[#0F172A] dark:text-white font-bold">{new Date(booking.flight.departureTime).toLocaleDateString()} • {booking.flight.airline}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                     <div className="text-right hidden md:block">
                                        <p className="text-[10px] text-[#0F172A] uppercase font-black tracking-widest">Status</p>
                                        <p className="text-emerald-400 font-bold text-sm">CONFIRMED</p>
                                     </div>
                                     <button className="px-5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-700 rounded-xl text-[#0F172A] dark:text-white text-xs font-bold uppercase tracking-wider transition-all border border-slate-200 dark:border-white/10">
                                        View Pass
                                     </button>
                                </div>
                            </div>
                        ))}
                     </div>
                </div>
            )}

            <div className={`bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-2 rounded-[2.5rem] shadow-2xl relative z-20 ${bookings.length === 0 ? '-mt-16' : ''} mx-4 md:mx-16`}>
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-center gap-2">
                    <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-2 p-2">
                        {activeCategory === 'aviation' ? (
                            <>
                                <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-100 dark:border-white/10">
                                    <label className="block text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-1">Departure</label>
                                    <select value={searchParams.from} onChange={e => setSearchParams(p => ({...p, from: e.target.value}))} className="bg-transparent text-[#0F172A] dark:text-white font-bold w-full outline-none">
                                        {AIRPORTS.map(a => <option key={a.code} value={a.code} className="bg-slate-50 dark:bg-slate-900">{a.city} ({a.code})</option>)}
                                    </select>
                                </div>
                                <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-100 dark:border-white/10">
                                    <label className="block text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-1">Destination</label>
                                    <select value={searchParams.to} onChange={e => setSearchParams(p => ({...p, to: e.target.value}))} className="bg-transparent text-[#0F172A] dark:text-white font-bold w-full outline-none">
                                        {AIRPORTS.map(a => <option key={a.code} value={a.code} className="bg-slate-50 dark:bg-slate-900">{a.city} ({a.code})</option>)}
                                    </select>
                                </div>
                                <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-100 dark:border-white/10">
                                    <label className="block text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-1">Passengers</label>
                                    <select value={searchParams.guests} onChange={e => setSearchParams(p => ({...p, guests: parseInt(e.target.value)}))} className="bg-transparent text-[#0F172A] dark:text-white font-bold w-full outline-none">
                                        {[1, 2, 4, 6].map(n => <option key={n} value={n} className="bg-slate-50 dark:bg-slate-900">{n} Person{n > 1 ? 's' : ''}</option>)}
                                    </select>
                                </div>
                            </>
                        ) : activeCategory === 'mobility' ? (
                            <>
                                <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-100 dark:border-white/10">
                                    <label className="block text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-1">Pick-up Location</label>
                                    <select value={rentalParams.location} onChange={e => setRentalParams(p => ({...p, location: e.target.value}))} className="bg-transparent text-[#0F172A] dark:text-white font-bold w-full outline-none">
                                        {AIRPORTS.map(a => <option key={a.code} value={a.code} className="bg-slate-50 dark:bg-slate-900">{a.city} ({a.code})</option>)}
                                    </select>
                                </div>
                                <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-100 dark:border-white/10">
                                    <label className="block text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-1">Pick-up Date</label>
                                    <input 
                                        type="date" 
                                        value={rentalParams.pickupDate}
                                        onChange={e => setRentalParams(p => ({...p, pickupDate: e.target.value}))}
                                        className="bg-transparent text-[#0F172A] dark:text-white font-bold w-full outline-none text-xs" 
                                    />
                                </div>
                                <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-100 dark:border-white/10">
                                    <label className="block text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-1">Drop-off Date</label>
                                    <input 
                                        type="date" 
                                        value={rentalParams.dropoffDate}
                                        onChange={e => setRentalParams(p => ({...p, dropoffDate: e.target.value}))}
                                        className="bg-transparent text-[#0F172A] dark:text-white font-bold w-full outline-none text-xs" 
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="md:col-span-3 bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-100 dark:border-white/10 flex items-center gap-4">
                                <div className="flex-1">
                                    <label className="block text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-1">Search Concierge Hub</label>
                                    <input type="text" placeholder={`Global search for ${activeCategory}...`} className="bg-transparent text-[#0F172A] dark:text-white font-bold w-full outline-none" />
                                </div>
                                <div className="h-10 w-px bg-white dark:bg-slate-800"></div>
                                <div className="w-48">
                                    <label className="block text-[10px] font-black text-[#0F172A] uppercase tracking-widest mb-1">Preferred Date</label>
                                    <input type="date" className="bg-transparent text-[#0F172A] dark:text-white font-bold w-full outline-none text-xs" />
                                </div>
                            </div>
                        )}
                    </div>
                    <button 
                        type="submit" 
                        disabled={isSearching} 
                        className="w-full md:w-56 h-full min-h-[72px] bg-primary hover:bg-primary-600 text-[#0F172A] dark:text-white font-black uppercase tracking-widest rounded-3xl transition-all shadow-xl flex items-center justify-center gap-3 group"
                    >
                        {isSearching ? <SpinnerIcon className="w-6 h-6 animate-spin" /> : (
                            <>
                                <span>Find Options</span>
                                <ArrowLongRightIcon className="w-6 h-6 transition-transform group-hover:translate-x-2" />
                            </>
                        )}
                    </button>
                </form>
            </div>

            <div className="px-4 md:px-0">
                {activeCategory === 'aviation' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-end">
                            <h2 className="text-2xl font-bold text-[#0F172A] dark:text-white">Platinum Aviation Search</h2>
                            <p className="text-sm text-[#0F172A] dark:text-white font-bold">Available Private Routes: {searchResults.length || 0}</p>
                        </div>
                        {searchResults.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {searchResults.map(flight => (
                                    <div key={flight.id} className="group bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 transition-all hover:border-primary/50 relative overflow-hidden shadow-xl">
                                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                                            <AirplaneTicketIcon className="w-48 h-48 text-[#0F172A] dark:text-white" />
                                        </div>
                                        <div className="relative z-10">
                                            <div className="flex justify-between items-center mb-10">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-white p-2 flex items-center justify-center shadow-lg dark:bg-slate-800">
                                                        <AirlineLogo domain={flight.airlineLogo} name={flight.airline} fallback={AirplaneTicketIcon} className="w-full h-full object-contain" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xl font-black text-[#0F172A] dark:text-white">{flight.airline}</p>
                                                        <p className="text-[10px] text-[#0F172A] uppercase font-black tracking-widest">Global Executive Jet</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-3xl font-mono font-bold text-[#0F172A] dark:text-white">{formatCurrency(flight.price)}</p>
                                                    <p className="text-[9px] text-primary font-black uppercase tracking-wider">All-Inclusive Portfolio Charge</p>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center bg-slate-100 rounded-3xl p-8 border border-slate-100 dark:border-white/10 shadow-inner">
                                                <div className="text-center">
                                                    <p className="text-4xl font-black text-[#0F172A] dark:text-white leading-none">{flight.from.code}</p>
                                                    <p className="text-[11px] text-[#0F172A] mt-2 uppercase font-black tracking-widest">{flight.from.city}</p>
                                                    <p className="text-xs text-primary font-bold mt-1">{new Date(flight.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                                <div className="flex-1 px-10 relative">
                                                    <div className="h-px bg-slate-100 dark:bg-slate-700 w-full border-dashed border-t"></div>
                                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-3 bg-slate-50 dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-300 group-hover:border-primary transition-colors shadow-2xl">
                                                        <AirplaneTicketIcon className="w-5 h-5 text-primary" />
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-4xl font-black text-[#0F172A] dark:text-white leading-none">{flight.to.code}</p>
                                                    <p className="text--[11px] text-[#0F172A] mt-2 uppercase font-black tracking-widest">{flight.to.city}</p>
                                                    <p className="text-xs text-primary font-bold mt-1">{new Date(flight.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleOpenBooking('flight', flight)}
                                                className="w-full mt-8 py-5 bg-white hover:bg-primary text-[#0F172A] dark:text-white font-black rounded-2xl text-xs uppercase tracking-[0.2em] transition-all border border-slate-200 dark:border-white/10 hover:border-primary hover:shadow-2xl active:scale-[0.99] dark:bg-slate-800"
                                            >
                                                Reserve Platinum Seat
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-32 text-center bg-slate-50 dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-700">
                                <AirplaneTicketIcon className="w-20 h-20 text-[#1E293B] mx-auto mb-6" />
                                <p className="text-[#0F172A] font-black uppercase tracking-widest">Execute search to view elite aviation routes.</p>
                            </div>
                        )}
                    </div>
                )}
                
                {activeCategory === 'mobility' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-end">
                            <h2 className="text-2xl font-bold text-[#0F172A] dark:text-white">Elite Mobility Options</h2>
                            <p className="text-sm text-[#0F172A] dark:text-white font-bold">Available Units: {rentalResults.length}</p>
                        </div>
                        {rentalResults.length > 0 ? (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {rentalResults.map(rental => (
                                    <ServiceCard 
                                        key={rental.id}
                                        title={rental.vehicleName}
                                        subtitle={`${rental.supplierName} • ${rental.seats} Seats • ${rental.transmission}`}
                                        price={rental.price}
                                        priceLabel={`total (${rental.currency})`}
                                        image={rental.imageUrl}
                                        badges={[`${rental.baggage} Bags`]}
                                        onClick={() => handleOpenBooking('vehicle', rental)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="py-32 text-center bg-slate-50 dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-700">
                                <Truck className="w-20 h-20 text-[#1E293B] mx-auto mb-6" />
                                <p className="text-[#0F172A] font-black uppercase tracking-widest">Execute search to view vehicle availability.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeCategory === 'stays' && (
                    <div className="space-y-8">
                        <div className="flex justify-between items-end">
                            <h2 className="text-2xl font-bold text-[#0F172A] dark:text-white">Platinum Estates</h2>
                            <button className="text-sm font-bold text-primary hover:text-[#0F172A] dark:text-white transition-colors">Global Portfolio &rarr;</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {MOCK_HOTELS.map(hotel => (
                                <ServiceCard 
                                    key={hotel.id}
                                    title={hotel.name}
                                    subtitle={hotel.location}
                                    price={hotel.pricePerNight}
                                    priceLabel="per night"
                                    image={hotel.image}
                                    badges={hotel.amenities}
                                    onClick={() => handleOpenBooking('hotel', hotel)}
                                />
                            ))}
                        </div>
                    </div>
                )}
                
                {activeCategory === 'expeditions' && (
                    <div className="space-y-8">
                        <div className="flex justify-between items-end">
                            <h2 className="text-2xl font-bold text-[#0F172A] dark:text-white">Private Immersions</h2>
                            <p className="text-sm text-[#0F172A] dark:text-white">Hand-curated global experiences</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {MOCK_TOURS.map(tour => (
                                <div key={tour.id} className="group relative rounded-[2.5rem] overflow-hidden h-[450px] shadow-2xl cursor-pointer" onClick={() => handleOpenBooking('tour', tour)}>
                                    <div 
                                        className="w-full h-full bg-cover bg-center bg-white dark:bg-slate-900 transition-transform duration-1000 group-hover:scale-110" 
                                        style={{ backgroundImage: `url('${tour.image}')` }}
                                    ></div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
                                    <div className="absolute bottom-0 left-0 right-0 p-10">
                                        <span className="px-3 py-1 bg-primary text-[#0F172A] dark:text-white text-[10px] font-black uppercase tracking-widest rounded-lg mb-4 inline-block shadow-lg">{tour.duration}</span>
                                        <h3 className="text-4xl font-black text-[#0F172A] dark:text-white mb-3 tracking-tighter">{tour.title}</h3>
                                        <p className="text-[#0F172A] dark:text-white flex items-center gap-2 text-lg font-bold"><MapPinIcon className="w-5 h-5 text-primary" /> {tour.location}</p>
                                        <div className="mt-8 flex justify-between items-center">
                                            <p className="text-3xl font-mono font-bold text-[#0F172A] dark:text-white">{formatCurrency(tour.price)}</p>
                                            <button className="px-10 py-4 bg-white text-[#0F172A] font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-primary hover:text-[#0F172A] dark:text-white transition-all shadow-xl dark:bg-slate-800">Explore Expedition</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeCategory === 'elite' && (
                    <div className="space-y-8">
                        <div className="flex justify-between items-end">
                            <h2 className="text-2xl font-bold text-[#0F172A] dark:text-white">Signature Events</h2>
                            <span className="flex items-center gap-2 px-4 py-1.5 bg-yellow-500 border border-yellow-500/30 rounded-full text-yellow-500 text-[10px] font-black uppercase tracking-widest">
                                <StarIcon className="w-4 h-4" /> Global Access Only
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {MOCK_EVENTS.map(ev => (
                                <div key={ev.id} className="group flex bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2rem] overflow-hidden h-56 transition-all hover:border-primary/50 hover:shadow-2xl">
                                    <div className="w-2/5 h-full overflow-hidden bg-white dark:bg-slate-900">
                                        <div 
                                            className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                                            style={{ backgroundImage: `url('${ev.image}')` }}
                                        ></div>
                                    </div>
                                    <div className="w-3/5 p-8 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start">
                                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2">{ev.category}</span>
                                                <span className="text-[11px] text-[#0F172A] font-bold uppercase tracking-widest">{ev.date}</span>
                                            </div>
                                            <h3 className="text-xl font-bold text-[#0F172A] dark:text-white group-hover:text-primary-100 transition-colors line-clamp-1 tracking-tight">{ev.title}</h3>
                                            <p className="text-sm text-[#0F172A] mt-1 line-clamp-1">{ev.venue}</p>
                                        </div>
                                        <div className="flex items-center justify-between mt-4">
                                            <p className="text-2xl font-mono font-bold text-[#0F172A] dark:text-white">{formatCurrency(ev.price)}</p>
                                            <button onClick={() => handleOpenBooking('event', ev)} className="px-6 py-3 bg-white hover:bg-white text-[#0F172A] dark:text-white hover:text-[#0F172A] border border-slate-200 dark:border-white/10 font-bold rounded-2xl text-[10px] uppercase tracking-widest transition-all dark:bg-slate-800">Secure Box</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* --- Unified Secure Booking Portal --- */}
            {bookingDetails && (
                <div className="fixed inset-0 bg-slate-100  z-[100] flex items-center justify-center p-4 animate-fade-in">
                    
                    {/* IMF Compliance Halt - Ensuring maximum z-index visibility */}
                    {bookingStep === 'halt' && (
                        <div className="fixed inset-0 z-[110]">
                            <ComplianceHaltModal 
                                isOpen={true} 
                                amount={(bookingDetails.type === 'flight' ? bookingDetails.item.price * searchParams.guests : bookingDetails.item.price || bookingDetails.item.pricePerDay || bookingDetails.item.pricePerNight)} 
                                onVerified={handleComplianceVerified} 
                                onCancel={() => setBookingStep('details')} 
                                onContactSupport={onContactSupport}
                            />
                        </div>
                    )}

                    <div className={`bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col animate-fade-in-up ${bookingStep === 'halt' ? 'hidden' : ''}`}>
                        
                        {/* Modal Header */}
                        <div className="p-8 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-white dark:bg-slate-800">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-primary/20 rounded-xl border border-primary/30">
                                    <LockClosedIcon className="w-5 h-5 text-primary" />
                                </div>
                                <h2 className="text-2xl font-black text-[#0F172A] dark:text-white tracking-tight">
                                    {bookingStep === 'success' ? 'Official Itinerary' : 'Secure Authorization'}
                                </h2>
                            </div>
                            <button onClick={handleCloseBooking} className="p-3 text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white transition-colors bg-white rounded-2xl dark:bg-slate-800"><XIcon className="w-6 h-6" /></button>
                        </div>
                        
                        <div className="p-10 overflow-y-auto max-h-[80vh] custom-scrollbar">
                            {bookingStep === 'details' && (
                                <div className="space-y-8">
                                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-200 dark:border-white/10 shadow-inner">
                                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-6">Reservation Detail</p>
                                        <div className="space-y-6">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <p className="text-2xl font-black text-[#0F172A] dark:text-white leading-tight">{bookingDetails.item.name || bookingDetails.item.title || bookingDetails.item.airline || bookingDetails.item.vehicleName}</p>
                                                    <p className="text-sm font-bold text-[#0F172A] dark:text-white uppercase tracking-widest mt-2">{bookingDetails.item.location || bookingDetails.item.venue || (bookingDetails.item.from ? `${bookingDetails.item.from?.code} to ${bookingDetails.item.to?.code}` : 'Rental')}</p>
                                                </div>
                                                {bookingDetails.item.airlineLogo && (
                                                    <div className="w-14 h-14 rounded-2xl bg-white p-2 shadow-xl shrink-0 dark:bg-slate-800">
                                                        <AirlineLogo domain={bookingDetails.item.airlineLogo} name={bookingDetails.item.airline} fallback={AirplaneTicketIcon} className="w-full h-full object-contain" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="h-px bg-white w-full dark:bg-slate-800"></div>
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <p className="text-[10px] text-[#0F172A] uppercase font-black tracking-widest">Portfolio Deduction</p>
                                                    <p className="text-4xl font-mono font-bold text-[#0F172A] dark:text-white mt-1">
                                                        {formatCurrency((bookingDetails.type === 'flight' ? bookingDetails.item.price * searchParams.guests : bookingDetails.item.price || bookingDetails.item.pricePerDay || bookingDetails.item.pricePerNight))}
                                                    </p>
                                                </div>
                                                <div className="text-right text-[10px] text-[#0F172A] uppercase font-black tracking-widest leading-relaxed">
                                                    <p>Settlement: Global Wire</p>
                                                    <p>Currency: {bookingDetails.item.currency || 'USD'}</p>
                                                    <p className="text-primary">Status: Pre-Authorized</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-[0.3em] mb-3 block pl-2">Select Account</label>
                                            <select className="w-full bg-slate-100 border border-slate-200 dark:border-slate-300 text-[#0F172A] dark:text-white p-5 rounded-2xl outline-none focus:ring-2 focus:ring-primary font-bold appearance-none shadow-inner">
                                                {accounts.filter(a => a.balance > 0).map(acc => (
                                                    <option key={acc.id} value={acc.id}>{acc.nickname || acc.type} Portfolio ({formatCurrency(acc.balance)})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-[0.3em] mb-3 block pl-2">Secure PIN</label>
                                            <input 
                                                type="password" 
                                                value={pin}
                                                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                                maxLength={4} 
                                                className="w-full bg-slate-100 border border-slate-200 dark:border-slate-300 text-[#0F172A] dark:text-white p-5 rounded-2xl outline-none focus:ring-2 focus:ring-primary font-bold text-center tracking-[1.5em] text-4xl placeholder-slate-900 shadow-inner" 
                                                placeholder="••••" 
                                            />
                                        </div>
                                        {error && <div className="bg-red-500 border border-red-500/30 p-3 rounded-xl text-red-400 text-[10px] font-black uppercase text-center tracking-widest animate-pulse">{error}</div>}
                                    </div>
                                    
                                    <button 
                                        onClick={() => handleFinalBooking(accounts[0].id)}
                                        disabled={pin.length < 4}
                                        className="w-full py-5 bg-primary hover:bg-primary-600 text-[#0F172A] dark:text-white font-black uppercase tracking-[0.3em] rounded-3xl shadow-2xl transition-all transform active:scale-[0.98] disabled:opacity-30 flex items-center justify-center gap-3"
                                    >
                                        <LockClosedIcon className="w-5 h-5" />
                                        Authorize & Settle
                                    </button>
                                </div>
                            )}

                            {bookingStep === 'processing' && (
                                <div className="py-20 text-center space-y-8">
                                    <div className="relative w-32 h-32 mx-auto">
                                        <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-700 rounded-full"></div>
                                        <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin [animation-duration:1s]"></div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <ShieldCheckIcon className="w-12 h-12 text-primary animate-pulse" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black text-[#0F172A] dark:text-white tracking-tighter mb-2">Finalizing Settlement</h3>
                                        <p className="text-[#0F172A] dark:text-white font-bold text-sm uppercase tracking-widest">Transmitting travel node data...</p>
                                    </div>
                                </div>
                            )}

                            {bookingStep === 'success' && (
                                <BookingSuccessView 
                                    type={bookingDetails.type} 
                                    item={bookingDetails.item} 
                                    passengers={searchParams.guests} 
                                    totalPrice={(bookingDetails.type === 'flight' ? bookingDetails.item.price * searchParams.guests : bookingDetails.item.price || bookingDetails.item.pricePerDay || bookingDetails.item.pricePerNight)}
                                    onClose={handleCloseBooking}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

export default Flights;
