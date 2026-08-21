
import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';
import { ATM_LOCATIONS } from './constants';
import { MapPinIcon, CrosshairsIcon, SpinnerIcon, SearchIcon, BuildingOfficeIcon, BrandLogo, ClockIcon, ShieldCheckIcon } from './Icons';

// Fix Leaflet's default icon path issues
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Enhanced Data for Visualization
const ENRICHED_LOCATIONS = ATM_LOCATIONS.map(loc => {
    let domain = "premiumreserved.com"; // Default to PRB branding

    // Simulate different networks
    if (loc.network === 'Visa Plus') domain = "visa.com";
    if (loc.network === 'Cirrus') domain = "mastercard.com";
    if (loc.network === 'Allpoint') domain = "allpointnetwork.com";
    
    return {
        ...loc,
        domain,
        isOpen: true,
        features: ["24/7 Access", "Touchless NFC", "USD/EUR/GBP"],
        signalStrength: Math.floor(Math.random() * 20) + 80 // 80-100%
    };
});

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return (R * c) * 0.621371; 
};

// Component to update map view when selected ATM changes
const MapUpdater = ({ center, zoom }: { center: [number, number], zoom: number }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
};

const RoutingMachine = ({ start, end }: { start: [number, number], end: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
        if (!map || !start || !end) return;

        const routingControl = L.Routing.control({
            waypoints: [
                L.latLng(start[0], start[1]),
                L.latLng(end[0], end[1])
            ],
            routeWhileDragging: false,
            addWaypoints: false,
            show: false, // hide the panel
        }).addTo(map);

        return () => {
            map.removeControl(routingControl);
        };
    }, [map, start, end]);

    return null;
};

export const AtmLocator: React.FC = () => {
    const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
    const [searchTerm, setSearchTerm] = useState('');
    const [isLocating, setIsLocating] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [selectedAtm, setSelectedAtm] = useState<typeof ENRICHED_LOCATIONS[0] | null>(ENRICHED_LOCATIONS[0]);
    const [mapCenter, setMapCenter] = useState<[number, number]>([40.7128, -74.0060]); // Default NY
    const [mapZoom, setMapZoom] = useState(13);

    const filteredLocations = useMemo(() => {
        const term = searchTerm.toLowerCase();
        let result = ENRICHED_LOCATIONS.filter(loc => 
            loc.name.toLowerCase().includes(term) ||
            loc.address.toLowerCase().includes(term) ||
            loc.city.toLowerCase().includes(term)
        );

        if (userLocation) {
            result.sort((a, b) => {
                const distA = getDistance(userLocation.lat, userLocation.lng, a.lat, a.lng);
                const distB = getDistance(userLocation.lat, userLocation.lng, b.lat, b.lng);
                return distA - distB;
            });
        }
        return result;
    }, [searchTerm, userLocation]);

    const handleUseLocation = () => {
        setIsLocating(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setUserLocation({ lat: latitude, lng: longitude });
                    setMapCenter([latitude, longitude]);
                    setMapZoom(14);
                    setIsLocating(false);
                },
                () => {
                    setIsLocating(false);
                    alert("Location access denied.");
                }
            );
        } else {
            setIsLocating(false);
            alert("Geolocation is not supported by this browser.");
        }
    };

    const handleSelectAtm = (atm: typeof ENRICHED_LOCATIONS[0]) => {
        setSelectedAtm(atm);
        setMapCenter([atm.lat, atm.lng]);
        setMapZoom(16);
        if (window.innerWidth < 1024) {
            setViewMode('map'); // Switch to map on mobile when selecting from list
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-20 flex flex-col">
            {/* ATM Safety & Network Featured Banner */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10 group">
                <div 
                    className="h-44 md:h-52 w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{ backgroundImage: `url('https://www.housingfinance.co.ug/wp-content/uploads/2022/11/hfb-Safety-precautions-at-the-ATM-1024x768.jpg')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/80 to-transparent p-6 md:p-8 flex flex-col justify-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-widest w-fit mb-2 ">
                        <ShieldCheckIcon className="w-3.5 h-3.5" /> 24/7 Verified Surcharge-Free Network
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">ATM & Point-of-Sale Global Terminals</h2>
                    <p className="text-slate-300 text-xs md:text-sm max-w-xl mt-1 font-medium">
                        Access over 85,000+ zero-fee ATMs globally with contactless NFC tap, cardless emergency PIN dispatch, and encrypted cash dispensing.
                    </p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 dark:border-white/10 pb-4 shrink-0">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 bg-primary/20 rounded-lg border border-primary/30">
                            <MapPinIcon className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="text-2xl font-black text-[#0F172A] dark:text-white tracking-tight">Global Asset Positioning</h3>
                    </div>
                    <p className="text-[#0F172A] dark:text-white text-xs max-w-lg">Locate secure Premium Reserved access points and partner networks with street-level environmental analysis.</p>
                </div>
                <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-100 dark:border-white/10 ">
                    <button onClick={() => setViewMode('map')} className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${viewMode === 'map' ? 'bg-primary text-[#0F172A] dark:text-white shadow-lg' : 'text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white'}`}>Orbital View</button>
                    <button onClick={() => setViewMode('list')} className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-primary text-[#0F172A] dark:text-white shadow-lg' : 'text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white'}`}>Terminal List</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-grow h-[600px] overflow-hidden">
                
                {/* Search & Results Column */}
                <div className={`lg:col-span-4 space-y-6 flex flex-col h-full ${viewMode === 'map' ? 'hidden lg:flex' : 'flex'}`}>
                    <div className="relative group shrink-0">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0F172A] group-focus-within:text-primary transition-colors" />
                        <input 
                            type="text" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white pl-12 pr-4 py-4 rounded-2xl focus:ring-2 focus:ring-primary outline-none shadow-inner"
                            placeholder="Find secure node..."
                        />
                        <button onClick={handleUseLocation} disabled={isLocating} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-white rounded-xl transition-colors dark:bg-slate-800">
                            {isLocating ? <SpinnerIcon className="w-5 h-5 text-primary animate-spin" /> : <CrosshairsIcon className="w-5 h-5 text-primary" />}
                        </button>
                    </div>

                    <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2 flex-grow">
                        {filteredLocations.map(loc => (
                            <button 
                                key={loc.id}
                                onClick={() => handleSelectAtm(loc)}
                                className={`w-full p-5 rounded-2xl border text-left transition-all duration-300 group relative overflow-hidden ${selectedAtm?.id === loc.id ? 'bg-primary/10 border-primary shadow-[0_0_30px_rgba(0,82,255,0.15)]' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-white/10 hover:bg-white dark:bg-slate-900 hover:border-slate-200 dark:border-white/10'}`}
                            >
                                {selectedAtm?.id === loc.id && (
                                    <div className="absolute top-0 right-0 p-3">
                                        <div className="w-2 h-2 bg-primary rounded-full animate-ping"></div>
                                    </div>
                                )}
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                         <div className="w-8 h-8 rounded-lg bg-white p-1 shadow-sm flex items-center justify-center dark:bg-slate-800">
                                            <BrandLogo domain={loc.domain} name={loc.network} fallback={BuildingOfficeIcon} className="w-full h-full object-contain" />
                                         </div>
                                         <div>
                                            <p className="font-black text-[#0F172A] dark:text-white group-hover:text-primary-300 transition-colors">{loc.name}</p>
                                            <p className="text-xs text-[#0F172A] mt-0.5 uppercase font-bold tracking-widest">{loc.network}</p>
                                         </div>
                                    </div>
                                    {userLocation && (
                                        <span className="text-xs font-mono font-bold text-primary">
                                            {getDistance(userLocation.lat, userLocation.lng, loc.lat, loc.lng).toFixed(2)} mi
                                        </span>
                                    )}
                                </div>
                                <div className="space-y-1 pl-11">
                                    <p className="text-xs text-[#0F172A] dark:text-white flex items-center gap-2">
                                        <MapPinIcon className="w-3 h-3" /> {loc.address}
                                    </p>
                                    <p className="text-xs text-[#0F172A] dark:text-white flex items-center gap-2">
                                        <ClockIcon className="w-3 h-3" /> {loc.isOpen ? 'Open 24/7' : 'Closed'}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Map Column */}
                <div className={`lg:col-span-8 h-full rounded-[3rem] overflow-hidden border border-slate-200 dark:border-white/10 shadow-2xl relative ${viewMode === 'list' ? 'hidden lg:block' : 'block'}`}>
                     <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: '100%', width: '100%' }} className="z-0">
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <MapUpdater center={mapCenter} zoom={mapZoom} />
                        {filteredLocations.map(loc => (
                            <Marker 
                                key={loc.id} 
                                position={[loc.lat, loc.lng]}
                                eventHandlers={{
                                    click: () => handleSelectAtm(loc),
                                }}
                            >
                                <Popup>
                                    <div className="text-[#0F172A] font-sans">
                                        <h3 className="font-bold text-sm">{loc.name}</h3>
                                        <p className="text-xs">{loc.address}</p>
                                        <p className="text-[10px] uppercase font-bold text-primary mt-1">{loc.network}</p>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                        {userLocation && (
                            <Marker position={[userLocation.lat, userLocation.lng]}>
                                <Popup>You are here</Popup>
                            </Marker>
                        )}
                        {userLocation && selectedAtm && (
                            <RoutingMachine 
                                start={[userLocation.lat, userLocation.lng]} 
                                end={[selectedAtm.lat, selectedAtm.lng]} 
                            />
                        )}
                    </MapContainer>
                    
                    {/* Overlay Info Card */}
                    {selectedAtm && (
                        <div className="absolute bottom-6 left-6 right-6 bg-slate-50 dark:bg-slate-900  p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl z-[1000] flex justify-between items-center animate-fade-in-up">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-white p-2 shadow-lg flex items-center justify-center dark:bg-slate-800">
                                    <BrandLogo domain={selectedAtm.domain} name={selectedAtm.network} fallback={BuildingOfficeIcon} className="w-full h-full object-contain" />
                                </div>
                                <div>
                                    <h3 className="font-black text-[#0F172A] dark:text-white text-lg">{selectedAtm.name}</h3>
                                    <p className="text-xs text-[#0F172A] dark:text-white font-bold">{selectedAtm.address}</p>
                                </div>
                            </div>
                            <div className="hidden md:flex gap-2">
                                {selectedAtm.features.map((f, i) => (
                                    <span key={i} className="px-2 py-1 bg-white rounded-lg text-[10px] font-bold text-[#0F172A] dark:text-white uppercase tracking-wider border border-slate-100 dark:border-white/10 dark:bg-slate-800">
                                        {f}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
