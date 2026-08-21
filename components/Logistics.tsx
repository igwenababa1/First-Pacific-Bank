
import React, { useState, useEffect } from 'react';
import { Shipment, ShipmentStatus, StatusHealth } from '../types';
import ShipmentMap from './ShipmentMap';
import { searchAirCargoRoutes, CargoRoute } from '../services/logisticsService';
import { 
  Package, MapPin, Clock, CheckCircle2, Truck, Plane, Info, Calendar, 
  ClipboardList, Timer, Activity, User, Bell, Mail, Phone, ShieldCheck, 
  Loader2, Shield, Zap, AlertCircle, MessageSquareQuote, Scale, Maximize, 
  History, Lock, RefreshCw, Warehouse, Globe, X, ChevronRight, FileSignature, 
  QrCode, HardHat, ExternalLink, Download, UserCheck, CreditCard,
  Droplets, ArrowRightLeft, Snowflake, Skull, Flame, ShieldAlert, ChevronLeft, 
  Award, Hash, Building2, Route, Terminal, SearchCode
} from 'lucide-react';

interface ShipmentDetailsProps {
  shipment: Shipment;
  onUpdateShipment: (updates: Partial<Shipment>) => void;
  onOpenChat?: () => void;
}

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-50 dark:bg-slate-800 " onClick={onClose}></div>
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-in fade-in zoom-in duration-300 border border-slate-200 dark:bg-slate-800">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
          <h3 className="text-xl font-black text-[#0F172A] tracking-tight flex items-center gap-3">
            <div className="w-2 h-8 primary- rounded-full"></div>
            {title}
          </h3>
          <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-2xl transition-colors">
            <X className="w-5 h-5 text-[#0F172A] dark:text-white" />
          </button>
        </div>
        <div className="p-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

export const Logistics: React.FC<ShipmentDetailsProps> = ({ shipment, onUpdateShipment, onOpenChat }) => {
  const [activeModal, setActiveModal] = useState<'manage' | 'redirect' | 'manifest' | null>(null);
  const [activeVisualIndex, setActiveVisualIndex] = useState(0);
  const [redirectStep, setRedirectStep] = useState(1);
  const [isVerifying, setIsVerifying] = useState(false);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [isManifestVerifying, setIsManifestVerifying] = useState(false);
  const [manifestVerified, setManifestVerified] = useState(false);
  const [showFullLog, setShowFullLog] = useState(false);
  
  // Cargo Search State
  const [searchParams, setSearchParams] = useState({ origin: 'CDG', destination: 'JFK', date: new Date().toISOString().split('T')[0] });
  const [cargoRoutes, setCargoRoutes] = useState<CargoRoute[]>([]);
  const [isSearchingRoutes, setIsSearchingRoutes] = useState(false);

  const steps = [
    ShipmentStatus.PICKED_UP,
    ShipmentStatus.IN_TRANSIT,
    ShipmentStatus.OUT_FOR_DELIVERY,
    ShipmentStatus.DELIVERED
  ];
  const currentIdx = steps.indexOf(shipment.currentStatus);

  useEffect(() => {
    if (!shipment.assetVisuals || shipment.assetVisuals.length <= 1) return;
    const interval = setInterval(() => {
      setActiveVisualIndex(prev => (prev + 1) % shipment.assetVisuals!.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [shipment.assetVisuals]);

  const handleRouteSearch = async () => {
      setIsSearchingRoutes(true);
      const routes = await searchAirCargoRoutes(searchParams.origin, searchParams.destination, searchParams.date);
      setCargoRoutes(routes);
      setIsSearchingRoutes(false);
  };
  
  const handleConfirmRedirect = () => {
      onUpdateShipment({
          deliveryInstructions: `REROUTED TO: ${searchParams.destination} via ${cargoRoutes[0]?.carrier || 'Air Freight'}. Priority handling active.`,
          events: [
              { status: 'Route Modified', location: `Hub ${searchParams.origin}`, timestamp: 'Just now', type: 'flight' },
              ...shipment.events
          ]
      });
      setActiveModal(null);
      setRedirectStep(1);
      setCargoRoutes([]);
  };

  const HealthBadge = ({ health }: { health: StatusHealth }) => {
    const config = {
      'on-time': { color: 'text-emerald-500', bg: 'bg-emerald-500', label: 'OPTIMAL' },
      'delayed': { color: 'text-rose-500', bg: 'bg-rose-500', label: 'DELAYED' },
      'early': { color: 'primary-', bg: 'primary-', label: 'AHEAD' },
    }[health];
    return (
      <div className={`px-3 py-1 rounded-lg ${config.bg} flex items-center gap-2 border border-current opacity-80`}>
        <div className={`w-1.5 h-1.5 rounded-full ${config.color.replace('text', 'bg')} animate-pulse`}></div>
        <span className={`text-[9px] font-black ${config.color} tracking-widest uppercase`}>{config.label}</span>
      </div>
    );
  };

  const TelemetryCard = ({ label, val, sub, icon: Icon, color = "blue" }: any) => {
    const colorClasses: Record<string, string> = {
      blue: "primary- primary-",
      indigo: "bg-indigo-50 text-indigo-600",
      emerald: "bg-emerald-50 text-emerald-600",
      amber: "bg-amber-50 text-amber-600",
      slate: "bg-slate-50 text-[#0F172A]",
    };

    return (
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:primary- transition-all group flex flex-col justify-between h-full dark:bg-slate-800">
        <div className="flex justify-between items-start mb-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner ${colorClasses[color] || colorClasses.blue}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-black text-[#0F172A] dark:text-white uppercase tracking-[0.2em]">{label}</span>
            <div className="h-0.5 w-4 bg-slate-100 mt-1"></div>
          </div>
        </div>
        <div>
          <p className="text-xl md:text-2xl font-black text-[#0F172A] tracking-tighter leading-none mb-2">{val}</p>
          {sub && <p className="text-[10px] font-bold text-[#0F172A] uppercase tracking-wider line-clamp-1">{sub}</p>}
        </div>
      </div>
    );
  };

  const getEventIcon = (status: ShipmentStatus | string, type?: string) => {
    if (status === ShipmentStatus.DELIVERED) return <CheckCircle2 className="w-full h-full" />;
    if (type === 'flight') return <Plane className="w-full h-full" />;
    if (type === 'warehouse') return <Warehouse className="w-full h-full" />;
    if (status === ShipmentStatus.OUT_FOR_DELIVERY) return <Truck className="w-full h-full" />;
    return <Package className="w-full h-full" />;
  };

  const handleSimulatedAction = (actionTitle: string) => {
    setProcessingAction(actionTitle);
    setTimeout(() => {
        let newStatus = shipment.currentStatus;
        let newEvents = [...shipment.events];
        
        if (actionTitle === 'Authorized Release') {
            newStatus = ShipmentStatus.OUT_FOR_DELIVERY;
            newEvents.unshift({ status: 'Release Authorized', location: 'Secure Hub', timestamp: 'Just now', type: 'warehouse' });
        } else if (actionTitle === 'Hold at Hub') {
             newEvents.unshift({ status: 'Exception: Held', location: 'Secure Hub', timestamp: 'Just now', type: 'warehouse' });
        }

        onUpdateShipment({ 
            currentStatus: newStatus,
            events: newEvents
        });

        setProcessingAction(null);
        setActiveModal(null);
    }, 2000);
  };

  const handleManifestVerify = () => {
    setIsManifestVerifying(true);
    setTimeout(() => {
        setIsManifestVerifying(false);
        setManifestVerified(true);
        setTimeout(() => setManifestVerified(false), 3000);
    }, 2500);
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 max-w-7xl mx-auto px-4 py-8">
      <ShipmentMap shipment={shipment} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <div className="lg:col-span-8 space-y-8">
          
          <div className="bg-slate-50 dark:bg-slate-900 rounded-[3rem] p-10 text-[#0F172A] dark:text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 primary- rounded-full blur-[100px] -mr-32 -mt-32"></div>
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <HealthBadge health={shipment.statusHealth} />
                  <span className="text-[10px] font-black primary- uppercase tracking-[0.3em]">Operational Phase {currentIdx + 1}/4</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-black tracking-tighter mb-2">{shipment.trackingId}</h1>
                <p className="text-[#0F172A] dark:text-white font-bold text-lg flex items-center gap-3">
                  <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                  {shipment.serviceType} <span className="text-[#0F172A]">|</span> 
                  <span className="primary-">{shipment.weight} NET</span>
                </p>
              </div>
              <div className="flex flex-col gap-3 w-full md:w-auto">
                <button 
                  onClick={() => setActiveModal('manifest')}
                  className="px-8 py-4 bg-white  border border-slate-200 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-[#0F172A] transition-all flex items-center justify-center gap-3 group dark:bg-slate-800"
                >
                  <Award className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  System Manifest
                </button>
                <button 
                  onClick={() => setActiveModal('manage')}
                  className="px-8 py-4 primary- rounded-2xl text-[10px] font-black uppercase tracking-widest hover:primary- hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3 shadow-lg primary-"
                >
                  <RefreshCw className="w-5 h-5" />
                  Manage Delivery
                </button>
              </div>
            </div>

            <div className="mt-12 relative px-4">
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-white -translate-y-1/2 rounded-full dark:bg-slate-800">
                <div 
                  className="h-full primary- shadow-[0_0_20px_rgba(59,130,246,0.8)] transition-all duration-[2000ms] rounded-full" 
                  style={{ width: `${(Math.max(0, currentIdx) / (steps.length - 1)) * 100}%` }}
                ></div>
              </div>
              <div className="relative flex justify-between items-center">
                {steps.map((s, i) => (
                  <div key={s} className="flex flex-col items-center group">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all duration-700 ${
                      i <= currentIdx ? 'primary- primary- text-[#0F172A] dark:text-white scale-110' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-[#0F172A]'
                    }`}>
                      {i < currentIdx ? <CheckCircle2 className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                    </div>
                    <span className={`mt-3 text-[8px] font-black uppercase tracking-widest ${i <= currentIdx ? 'text-[#0F172A] dark:text-white' : 'text-[#0F172A]'}`}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
             <TelemetryCard label="Global ETA" val={shipment.estimatedTime} sub={shipment.estimatedDate} icon={Timer} />
             {shipment.deliveryWindow && (
               <TelemetryCard label="Time Window" val={shipment.deliveryWindow} sub="Operational Target" icon={Clock} color="amber" />
             )}
             <TelemetryCard label="Dimensions" val={shipment.dimensions} sub="Volumetric L/W/H" icon={Maximize} />
             <TelemetryCard label="Hand-off" val={shipment.signatureRequired ? "Required" : "Contactless"} sub={shipment.signatureRequired ? "Identity Audit Active" : "Drop-off Enabled"} icon={shipment.signatureRequired ? FileSignature : UserCheck} color="indigo" />
             <TelemetryCard label="Valuation" val={shipment.insuranceValue} sub="Total Asset Cover" icon={Shield} color="emerald" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-[2.5rem] p-4 border border-slate-100 shadow-xl space-y-4 dark:bg-slate-800">
               <div className="flex items-center justify-between px-4 py-2 border-b border-slate-50">
                  <h3 className="text-[10px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-500" /> Unit Visual Proof
                  </h3>
                  <span className="text-[9px] font-black text-[#0F172A] dark:text-white">SEAL: {shipment.sealNumber}</span>
               </div>
               <div className="relative aspect-square rounded-[2rem] overflow-hidden group bg-white dark:bg-slate-900">
                  {shipment.assetVisuals?.map((img, i) => (
                    <div 
                      key={i} 
                      className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ${i === activeVisualIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`}
                      style={{ backgroundImage: `url("${img}")` }}
                    ></div>
                  ))}
                  <div className="absolute inset-x-4 bottom-4 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setActiveVisualIndex(prev => (prev - 1 + shipment.assetVisuals!.length) % shipment.assetVisuals!.length)} className="p-3 bg-slate-100  rounded-xl text-[#0F172A] dark:text-white hover:primary- transition-colors">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={() => setActiveVisualIndex(prev => (prev + 1) % shipment.assetVisuals!.length)} className="p-3 bg-slate-100  rounded-xl text-[#0F172A] dark:text-white hover:primary- transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="absolute top-4 left-4 primary- px-3 py-1 rounded-lg z-10">
                    <span className="text-[8px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest">Live Node Feed</span>
                  </div>
               </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl dark:bg-slate-800">
               <h3 className="text-[10px] font-black text-[#0F172A] dark:text-white uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                 <History className="w-4 h-4 primary-" /> Sequential Audit Trail
               </h3>
               <div className="space-y-8 relative">
                 <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-slate-100"></div>
                 {shipment.events.slice(0, showFullLog ? undefined : 3).map((e, i) => (
                   <div key={i} className="relative flex gap-6 group">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center relative z-10 border-4 ${i === 0 ? 'primary- primary- text-[#0F172A] dark:text-white shadow-lg' : 'bg-white border-slate-50 text-[#0F172A] dark:text-white'}`}>
                        <div className="w-5 h-5">{getEventIcon(e.status, e.type)}</div>
                      </div>
                      <div>
                        <p className={`text-xs font-black uppercase tracking-tight ${i === 0 ? 'primary-' : 'text-[#0F172A]'}`}>{e.status}</p>
                        <p className="text-[10px] font-bold text-[#0F172A] dark:text-white mt-0.5">{e.location} • {e.timestamp}</p>
                      </div>
                   </div>
                 ))}
               </div>
               <button 
                onClick={() => setShowFullLog(!showFullLog)}
                className="w-full mt-8 py-4 bg-slate-50 rounded-2xl text-[9px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 group dark:bg-slate-900"
               >
                 {showFullLog ? 'Condense History' : 'Review Full Log'} <ChevronRight className={`w-3 h-3 group-hover:translate-x-1 transition-transform ${showFullLog ? 'rotate-90' : ''}`} />
               </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden group dark:bg-slate-800">
            <div className="p-10 text-center space-y-6">
               <div className="relative inline-block">
                 <div 
                    className="w-32 h-32 rounded-[2.5rem] p-1 bg-gradient-to-br primary- to-indigo-600 shadow-2xl group-hover:rotate-3 transition-transform duration-500 overflow-hidden bg-cover bg-center bg-slate-200" 
                    style={{ backgroundImage: `url("${shipment.recipientPhoto}")` }}
                 >
                 </div>
                 <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-2xl shadow-xl flex items-center justify-center primary- border border-slate-100 dark:bg-slate-800">
                    <ShieldCheck className="w-6 h-6" />
                 </div>
               </div>
               <div>
                  <h3 className="text-3xl font-black text-[#0F172A] tracking-tighter">{shipment.recipient}</h3>
                  <p className="text-[10px] font-black text-[#0F172A] dark:text-white uppercase tracking-[0.4em] mt-1">Verified End-Recipient</p>
               </div>
               <div className="bg-slate-50 p-6 rounded-[2rem] text-left border border-slate-100 space-y-4 dark:bg-slate-900">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-[#0F172A] dark:text-white dark:bg-slate-800"><MapPin className="w-5 h-5" /></div>
                    <div>
                      <p className="text-[8px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest mb-1">Target Terminal</p>
                      <p className="text-sm font-bold text-[#0F172A] leading-tight">{shipment.recipientAddress.street}, {shipment.recipientAddress.city}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                     <button className="flex-1 py-3 bg-white border border-slate-200 rounded-xl text-[9px] font-black text-[#0F172A] uppercase tracking-widest hover:primary- hover:text-[#0F172A] dark:text-white transition-all dark:bg-slate-800">Directions</button>
                     <button className="flex-1 py-3 bg-white border border-slate-200 rounded-xl text-[9px] font-black text-[#0F172A] uppercase tracking-widest hover:primary- hover:text-[#0F172A] dark:text-white transition-all dark:bg-slate-800">Contact</button>
                  </div>
               </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 rounded-[3rem] p-10 text-[#0F172A] dark:text-white shadow-2xl relative overflow-hidden">
             <div className="absolute -right-12 -bottom-12 opacity-5 pointer-events-none">
                <MessageSquareQuote className="w-64 h-64" />
             </div>
             <div className="relative z-10">
               <h3 className="text-[10px] font-black primary- uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                 <ClipboardList className="w-4 h-4" /> Transit Directives
               </h3>
               <p className="text-2xl font-black italic tracking-tight leading-tight text-slate-100 mb-8 border-l-4 primary- pl-6">
                 "{shipment.deliveryInstructions}"
               </p>
               <div className="flex flex-wrap gap-2">
                 {shipment.handlingProtocols.map(p => (
                   <span key={p} className="px-3 py-1.5 bg-white rounded-xl border border-slate-100 dark:border-white/10 text-[8px] font-black uppercase tracking-widest flex items-center gap-2 dark:bg-slate-800">
                      <div className="w-1 h-1 rounded-full primary-"></div> {p}
                   </span>
                 ))}
               </div>
             </div>
          </div>

          <div className="bg-white p-8 rounded-[3rem] border-2 border-slate-100 flex items-center justify-between group cursor-pointer hover:primary- transition-colors dark:bg-slate-800">
             <div>
               <p className="text-[10px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest mb-1">Node Validation</p>
               <p className="text-lg font-black text-[#0F172A]">Scan for Verification</p>
             </div>
             <div className="p-3 bg-slate-50 rounded-2xl group-hover:primary- transition-colors dark:bg-slate-900">
               <QrCode className="w-12 h-12 text-[#0F172A] group-hover:primary-" />
             </div>
          </div>

        </div>
      </div>

      <Modal isOpen={activeModal === 'manifest'} onClose={() => setActiveModal(null)} title="System Manifest - High Intensity">
         <div className="space-y-8">
            <div className="grid grid-cols-2 gap-4">
               <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 dark:bg-slate-900">
                  <p className="text-[9px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest mb-1">Certified Official</p>
                  <p className="text-lg font-black text-[#0F172A]">{shipment.certifiedBy}</p>
               </div>
               <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 dark:bg-slate-900">
                  <p className="text-[9px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest mb-1">Blockchain ID</p>
                  <p className="text-xs font-mono font-bold primary- break-all">{shipment.blockchainHash}</p>
               </div>
            </div>
            <div className="p-8 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] text-[#0F172A] dark:text-white space-y-4">
               <h4 className="text-[10px] font-black primary- uppercase tracking-[0.4em]">Inventory Classification</h4>
               <div className="grid grid-cols-2 gap-y-4">
                  <div>
                    <span className="text-[9px] font-bold text-[#0F172A] block">CATEGORY</span>
                    <span className="text-sm font-black uppercase">Industrial Asset</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-[#0F172A] block">CLEARANCE</span>
                    <span className="text-sm font-black uppercase">Level 4 Verified</span>
                  </div>
               </div>
            </div>
            <button 
                onClick={handleManifestVerify}
                disabled={isManifestVerifying || manifestVerified}
                className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl transition-all flex items-center justify-center gap-3 ${manifestVerified ? 'bg-emerald-500 text-[#0F172A] dark:text-white' : 'primary- text-[#0F172A] dark:text-white primary-'}`}
            >
                {isManifestVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : manifestVerified ? <CheckCircle2 className="w-5 h-5" /> : null}
                {isManifestVerifying ? 'Synchronizing Node...' : manifestVerified ? 'Node Verified' : 'Verify Identity Node'}
            </button>
         </div>
      </Modal>

      <Modal isOpen={activeModal === 'manage'} onClose={() => setActiveModal(null)} title="Operational Controls">
         <div className="grid grid-cols-1 gap-4">
           {[
             { id: 'reroute', title: "Reroute Asset", icon: Route, action: () => { setActiveModal('redirect'); setRedirectStep(1); } },
             { id: 'hold', title: "Hold at Hub", icon: Warehouse, action: () => handleSimulatedAction('Hold at Hub') },
             { id: 'release', title: "Authorized Release", icon: UserCheck, action: () => handleSimulatedAction('Authorized Release') }
           ].map(opt => (
             <button 
                key={opt.id} 
                onClick={opt.action} 
                disabled={processingAction !== null}
                className="p-6 bg-slate-50 border border-slate-200 rounded-3xl flex items-center justify-between group hover:primary- hover:bg-white transition-all disabled:opacity-70 dark:bg-slate-800"
             >
               <div className="flex items-center gap-6">
                 <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#0F172A] dark:text-white group-hover:primary- group-hover:text-[#0F172A] dark:text-white transition-all shadow-sm dark:bg-slate-800">
                   {processingAction === opt.title ? <Loader2 className="w-7 h-7 animate-spin" /> : <opt.icon className="w-7 h-7" />}
                 </div>
                 <span className="text-lg font-black text-[#0F172A]">
                    {processingAction === opt.title ? 'Processing Request...' : opt.title}
                 </span>
               </div>
               <ChevronRight className="w-5 h-5 text-[#0F172A] dark:text-white group-hover:primary- transition-colors" />
             </button>
           ))}
         </div>
      </Modal>

      <Modal isOpen={activeModal === 'redirect'} onClose={() => { setActiveModal(null); setRedirectStep(1); }} title="Active Trajectory Shift">
         {redirectStep === 1 && (
           <div className="space-y-8">
              <div className="space-y-4">
                <p className="text-sm text-[#0F172A] font-bold">Input new terminal coordinates for Asset <span className="text-[#0F172A]">{shipment.trackingId}</span>:</p>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">Origin Code</label>
                      <input 
                        type="text" 
                        value={searchParams.origin}
                        onChange={e => setSearchParams(p => ({...p, origin: e.target.value.toUpperCase()}))}
                        placeholder="e.g. CDG" 
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 font-bold outline-none focus:primary- transition-all text-center dark:bg-slate-900" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">Dest Code</label>
                      <input 
                        type="text" 
                        value={searchParams.destination}
                        onChange={e => setSearchParams(p => ({...p, destination: e.target.value.toUpperCase()}))}
                        placeholder="e.g. JFK" 
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 font-bold outline-none focus:primary- transition-all text-center dark:bg-slate-900" 
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">Flight Date</label>
                    <input 
                        type="date" 
                        value={searchParams.date}
                        onChange={e => setSearchParams(p => ({...p, date: e.target.value}))}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 font-bold outline-none focus:primary- transition-all dark:bg-slate-900" 
                    />
                  </div>
                  
                  <button 
                    onClick={handleRouteSearch}
                    disabled={isSearchingRoutes}
                    className="w-full py-4 bg-white border-2 border-slate-200 text-[#0F172A] rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:primary- hover:primary- transition-all dark:bg-slate-800"
                  >
                    {isSearchingRoutes ? <Loader2 className="w-4 h-4 animate-spin"/> : <SearchCode className="w-4 h-4"/>}
                    Search Air Routes
                  </button>

                  {cargoRoutes.length > 0 && (
                      <div className="mt-4 space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
                        {cargoRoutes.map((route, idx) => (
                            <div key={idx} className="p-3 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer flex justify-between items-center group dark:bg-slate-900">
                                <div>
                                    <p className="text-xs font-black text-[#0F172A]">{route.carrier} <span className="text-[#0F172A] dark:text-white font-normal">({route.flightNumber})</span></p>
                                    <p className="text-[10px] font-bold text-[#0F172A]">{route.origin} &rarr; {route.destination} • {route.aircraftType}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-[#0F172A]">{route.arrivalDate}</p>
                                    <ChevronRight className="w-4 h-4 text-[#0F172A] dark:text-white group-hover:primary-" />
                                </div>
                            </div>
                        ))}
                      </div>
                  )}

                  <div className="relative pt-4">
                    <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0F172A] dark:text-white" />
                    <input type="text" placeholder="Final Delivery Address" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-5 pl-14 pr-8 font-bold outline-none focus:primary- transition-all dark:bg-slate-900" />
                  </div>
                </div>
              </div>
              <button 
                onClick={() => { setIsVerifying(true); setTimeout(() => { setIsVerifying(false); setRedirectStep(2); }, 1500); }} 
                className="w-full py-6 bg-slate-50 dark:bg-slate-900 text-[#0F172A] dark:text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3"
              >
                {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Node Trajectory"}
              </button>
           </div>
         )}
         {redirectStep === 2 && (
           <div className="text-center space-y-8 py-10">
              <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600 border-2 border-emerald-100 shadow-xl shadow-emerald-100"><CheckCircle2 className="w-12 h-12" /></div>
              <div className="space-y-2">
                <h4 className="text-3xl font-black text-[#0F172A]">Path Recalculated</h4>
                <p className="text-[#0F172A] font-bold max-w-xs mx-auto">Asset re-routing directives have been transmitted to local regional couriers.</p>
              </div>
              <button onClick={handleConfirmRedirect} className="w-full py-6 bg-slate-50 dark:bg-slate-900 text-[#0F172A] dark:text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em]">Confirm and Synchronize</button>
           </div>
         )}
      </Modal>

    </div>
  );
};
