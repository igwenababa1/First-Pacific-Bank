import React, { useState, useEffect } from 'react';
import { useBranding } from '../contexts/BrandingContext';
import { BRANDING_CONFIG } from './constants';
import { db } from '../services/database';
import { 
  CloudUpload, 
  Link2, 
  Sparkles, 
  ShieldCheck, 
  Palette, 
  CheckCircle, 
  RotateCcw, 
  Crown,
  Maximize2,
  Trash2,
  Plus,
  Minus,
  Sliders,
  FolderLock,
  Search,
  Image as ImageIcon,
  Video as VideoIcon,
  Copy,
  Check
} from 'lucide-react';

import { DEFAULT_BANNERS } from './DashboardBanners';
import { BANKING_MEDIA_CATALOG, MediaAsset } from './BrandingMediaCatalog';

export const BrandingCenter: React.FC = () => {
  const { 
    logoUrl, 
    bannerUrl, 
    logoStyle, 
    primaryColor, 
    customIssuer, 
    galleryBanners = [],
    addGalleryBanner,
    deleteGalleryBanner,
    updateBranding 
  } = useBranding();

  const [inputLogo, setInputLogo] = useState('');
  const [inputBanner, setInputBanner] = useState('');
  const [inputIssuer, setInputIssuer] = useState('');
  const [inputColor, setInputColor] = useState('');
  const [inputStyle, setInputStyle] = useState<'classic' | 'modern' | 'minimal'>('classic');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // NEW DYNAMIC GALLERY STATES
  const [newBannerTitle, setNewBannerTitle] = useState('');
  const [newBannerSubtitle, setNewBannerSubtitle] = useState('');
  const [newBannerBadge, setNewBannerBadge] = useState('');
  const [newBannerDesc, setNewBannerDesc] = useState('');
  const [newBannerLink, setNewBannerLink] = useState('/cards');
  const [newBannerColor, setNewBannerColor] = useState('#D4AF37');
  const [newBannerMediaUrl, setNewBannerMediaUrl] = useState('');
  const [galleryIsUploading, setGalleryIsUploading] = useState(false);

  // 100-ASSET GALLERY PRESET STATES
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<'all' | 'wealth' | 'support' | 'corporate' | 'security' | 'offices' | 'videos'>('all');
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  const [copiedUnderId, setCopiedUnderId] = useState<string | null>(null);
  const [selectedPreviewAsset, setSelectedPreviewAsset] = useState<MediaAsset | null>(null);
  const [catalogNotification, setCatalogNotification] = useState<string | null>(null);

  const handleQuickApplyAsBanner = (asset: MediaAsset) => {
    setInputBanner(asset.bgImage);
    setCatalogNotification(`Successfully pre-loaded asset "${asset.title}" as main brand banner! Click "Publish Unified Branding" at the top to save.`);
    setTimeout(() => setCatalogNotification(null), 8000);
    // Scroll smoothly to preview section
    const element = document.getElementById('unified-banner-input-target');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      window.scrollTo({ top: 300, behavior: 'smooth' });
    }
  };

  const handleQuickLoadAsSlide = (asset: MediaAsset) => {
    setNewBannerTitle(asset.title);
    setNewBannerSubtitle(asset.subTitle);
    setNewBannerBadge(asset.badge);
    setNewBannerDesc(asset.description);
    setNewBannerColor(asset.hexColor);
    setNewBannerMediaUrl(asset.bgImage);
    setCatalogNotification(`Successfully loaded preset "${asset.title}"! Review fields and click "Launch Dynamic Slideshow Banner" below.`);
    setTimeout(() => setCatalogNotification(null), 8000);
    // Scroll smoothly to slide form
    const element = document.getElementById('slide-form-architect');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleCopyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUnderId(id);
    setTimeout(() => setCopiedUnderId(null), 2000);
  };

  const handleGalleryMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setGalleryIsUploading(true);
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setNewBannerMediaUrl(event.target.result as string);
          setGalleryIsUploading(false);
        }
      };
      reader.onerror = () => {
        setGalleryIsUploading(false);
        alert('File upload failed.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddGalleryBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBannerTitle || !newBannerDesc) {
      alert('Title and Description are required metrics.');
      return;
    }
    const cleanMediaUrl = newBannerMediaUrl || 'https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=1200&auto=format&fit=crop';
    try {
      await addGalleryBanner({
        id: 'gallery-' + Date.now(),
        title: newBannerTitle,
        subTitle: newBannerSubtitle,
        badge: newBannerBadge,
        description: newBannerDesc,
        cta: 'Explore Offer',
        link: newBannerLink,
        bgImage: cleanMediaUrl,
        hexColor: newBannerColor || primaryColor
      });
      // Reset inputs
      setNewBannerTitle('');
      setNewBannerSubtitle('');
      setNewBannerBadge('');
      setNewBannerDesc('');
      setNewBannerLink('/cards');
      setNewBannerColor('#D4AF37');
      setNewBannerMediaUrl('');
    } catch (err: any) {
      alert('Failed to save slideshow card into database options.');
    }
  };

  // BANNER GENERATOR & STORAGE BOX STATE
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserEmail, setSelectedUserEmail] = useState('');
  const [selectedArchetype, setSelectedArchetype] = useState<'esg' | 'sovereign' | 'cyber'>('sovereign');
  const [customBannersList, setCustomBannersList] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewSvg, setPreviewSvg] = useState('');
  const [zoomScale, setZoomScale] = useState(1);
  const [zoomedBannerUser, setZoomedBannerUser] = useState<any | null>(null);

  const loadUsersAndBanners = async () => {
    try {
      const allUsers = await db.getAllUsers();
      setUsers(allUsers);
      if (allUsers.length > 0 && !selectedUserEmail) {
        setSelectedUserEmail(allUsers[0].email);
      }
      // Populate Storage Boxes with users who have a custom banner
      const bannerUsers = allUsers.filter(u => u.profile?.customBanner);
      setCustomBannersList(bannerUsers);
    } catch (err) {
      console.error('[BRANDING] Failed to resolve users ledger:', err);
    }
  };

  // Settle inputs with current values
  useEffect(() => {
    setInputLogo(logoUrl);
    setInputBanner(bannerUrl);
    setInputIssuer(customIssuer);
    setInputColor(primaryColor);
    setInputStyle(logoStyle);
    loadUsersAndBanners();
  }, [logoUrl, bannerUrl, customIssuer, primaryColor, logoStyle]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setInputLogo(event.target.result as string);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setInputBanner(event.target.result as string);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleResetToDefault = () => {
    setInputLogo(BRANDING_CONFIG.logoUrl);
    setInputBanner('https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=1200&auto=format&fit=crop');
    setInputIssuer('Private Wealth Enclave');
    setInputColor('#D4AF37');
    setInputStyle('classic');
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError('');
    try {
      await updateBranding({
        logoUrl: inputLogo,
        bannerUrl: inputBanner,
        customIssuer: inputIssuer,
        primaryColor: inputColor,
        logoStyle: inputStyle
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save branding preferences.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Visual Hub Banner */}
      <div className="bg-slate-50 dark:bg-slate-900  border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/10 to-transparent blur-3xl pointer-events-none rounded-full" style={{ background: `radial-gradient(circle, ${inputColor}11 0%, transparent 70%)` }}></div>
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-primary/10 text-primary uppercase text-[9px] font-black tracking-widest flex items-center gap-1" style={{ color: inputColor, backgroundColor: `${inputColor}15` }}>
              <Crown className="w-3.5 h-3.5" />
              Institutional Branding Center
            </span>
          </div>
          <h2 className="text-2xl font-black text-[#0F172A] dark:text-white uppercase tracking-tight">Active Identity Control Node</h2>
          <p className="text-[#0F172A] dark:text-white text-xs font-semibold uppercase tracking-wider">Configure high-fidelity assets consumed consistently across dashboard banners and email dispatches.</p>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={handleResetToDefault}
            className="px-5 py-3 bg-white hover:bg-white active:scale-95 text-[#0F172A] rounded-xl font-bold text-[10px] uppercase tracking-widest border border-slate-200 dark:border-white/10 transition-all flex items-center gap-1.5 dark:bg-slate-800"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restore Standard Values
          </button>
          <button
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="px-6 py-3 text-[#0F172A] dark:text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-70"
            style={{ backgroundColor: inputColor }}
          >
            {isSaving ? 'Synchronizing Databases...' : 'Publish Unified Branding'}
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-500 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-500" /> Identity configuration updated and live across application dashboards and transactional notifications.
        </div>
      )}

      {saveError && (
        <div className="p-4 bg-rose-500 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider rounded-xl animate-fade-in">
          ✖ {saveError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Input form panels */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 p-6 md:p-8 space-y-6 shadow-xl">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#0F172A] flex items-center gap-2">
              <Palette className="w-4 h-4" /> Aesthetic Matrices
            </h3>

            {/* Logo field */}
            <div className="space-y-2">
              <label className="text-[9px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest">Unified Core Logo</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputLogo}
                  onChange={(e) => setInputLogo(e.target.value)}
                  placeholder="Paste direct logo image URL..."
                  className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white p-3 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-xs"
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('logo-upload-input')?.click()}
                  className="px-3 bg-white hover:bg-white text-[#0F172A] border border-slate-200 dark:border-white/10 rounded-xl transition-all flex items-center justify-center dark:bg-slate-800"
                  title="Upload vector/bitmap"
                >
                  <CloudUpload className="w-4 h-4" />
                </button>
                <input
                  type="file"
                  id="logo-upload-input"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
              </div>
            </div>

            {/* Banner field */}
            <div id="unified-banner-input-target" className="space-y-4">
              <label className="text-[9px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest">Unified Core Banner Design</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputBanner}
                  onChange={(e) => setInputBanner(e.target.value)}
                  placeholder="Paste direct banner image URL..."
                  className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white p-3 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-xs"
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('banner-upload-input')?.click()}
                  className="px-3 bg-white hover:bg-white text-[#0F172A] border border-slate-200 dark:border-white/10 rounded-xl transition-all flex items-center justify-center dark:bg-slate-800"
                  title="Upload brand landscape"
                >
                  <CloudUpload className="w-4 h-4" />
                </button>
                <input
                  type="file"
                  id="banner-upload-input"
                  accept="image/*"
                  className="hidden"
                  onChange={handleBannerUpload}
                />
              </div>

              {/* Banner Presets */}
              <div className="space-y-2">
                 <label className="text-[8px] font-black text-[#0F172A] uppercase tracking-widest">Premium Presets</label>
                 <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {DEFAULT_BANNERS.map((banner, idx) => (
                        <div 
                          key={idx}
                          role="button"
                          onClick={() => setInputBanner(banner.bgImage)}
                          className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all cursor-pointer group ${inputBanner === banner.bgImage ? 'border-primary shadow-lg shadow-primary/20 scale-105 z-10' : 'border-transparent hover:border-slate-200 dark:border-black/10'}`}
                          title={`${banner.title} - ${banner.subTitle}`}
                        >
                            {banner.bgImage.includes('mp4') ? (
                                <video src={banner.bgImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" autoPlay loop muted playsInline />
                            ) : (
                                <img src={banner.bgImage} alt={banner.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                            )}
                        </div>
                    ))}
                 </div>
              </div>
            </div>

            {/* Custom Issuer Signature */}
            <div className="space-y-2">
              <label className="text-[9px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest">Seal / Custom Issuer Designation</label>
              <input
                type="text"
                value={inputIssuer}
                onChange={(e) => setInputIssuer(e.target.value)}
                placeholder="Private Wealth Enclave"
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white p-3 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-xs"
              />
            </div>

            {/* Logo Crest Style Selection */}
            <div className="space-y-2">
              <label className="text-[9px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest">Logo Crest Aspect Model</label>
              <div className="grid grid-cols-3 gap-2">
                {(['classic', 'modern', 'minimal'] as const).map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setInputStyle(style)}
                    className={`py-3 rounded-xl font-bold text-[9px] uppercase tracking-wider border transition-all ${
                      inputStyle === style
                        ? 'bg-primary/10 text-white border-primary'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-100 text-[#0F172A] border-slate-200 dark:border-white/10'
                    }`}
                    style={inputStyle === style ? { borderColor: inputColor, color: inputColor } : {}}
                  >
                    {style === 'classic' ? 'Royal Crest' : style === 'modern' ? 'Apex Hex' : 'Minimal Node'}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Accent Settings */}
            <div className="space-y-3">
              <label className="text-[9px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest">Signature Color Theme</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputColor}
                  onChange={(e) => setInputColor(e.target.value)}
                  placeholder="#D4AF37"
                  className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white p-3 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-xs"
                />
                <input
                  type="color"
                  value={inputColor.startsWith('#') && inputColor.length === 7 ? inputColor : '#D4AF37'}
                  onChange={(e) => setInputColor(e.target.value)}
                  className="w-12 h-10 border-0 bg-transparent cursor-pointer rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Dashboard Previews */}
        <div className="lg:col-span-7 space-y-6">
          {/* Dashboard Banner Preview */}
          <div className="bg-slate-100 rounded-3xl border border-slate-200 dark:border-white/10 p-6 space-y-4 shadow-xl">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#0F172A] flex items-center gap-2 pl-1">
              <Sparkles className="w-4 h-4" style={{ color: inputColor }} /> Real-Time App Dashboard Banner Preview
            </h3>

            {/* Simulated Banner Container */}
            <div className="w-full relative bg-slate-100 overflow-hidden h-[180px] rounded-2xl group select-none border border-slate-200 dark:border-white/10">
              <img 
                src={inputBanner || 'https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=1200&auto=format&fit=crop'} 
                alt="Banner Design" 
                className="w-full h-full object-cover object-center opacity-40"
                referrerPolicy="no-referrer"
              />
              
              {/* Dynamic Overlay design with client colors */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent z-10 p-5 flex flex-col justify-between">
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900  px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 shadow-lg">
                    <div className="w-8 h-8 rounded-full bg-[#050810] border-2 flex items-center justify-center overflow-hidden" style={{ borderColor: inputColor }}>
                      <img src={inputLogo || BRANDING_CONFIG.logoUrl} alt="Logo" className="w-full h-full object-contain scale-[0.8]" referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <p className="text-[9.5px] font-black tracking-[0.14em] text-white uppercase leading-none">{BRANDING_CONFIG.shortName}</p>
                      <p className="text-[6.5px] font-extrabold tracking-[0.2em] uppercase mt-1" style={{ color: inputColor }}>{inputIssuer || 'Private Wealth Enclave'}</p>
                    </div>
                  </div>
                  
                  <div className="bg-emerald-950  text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-lg text-[6px] font-black tracking-widest uppercase flex items-center gap-1.5 shadow-md">
                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>
                    🏛️ US Account Security Standards
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-200 dark:border-white/10 pt-2 text-[#0F172A] text-[7px] font-black uppercase tracking-widest">
                  <span>SOVEREIGN DISPATCH PORTID: FPB-OP-8829</span>
                  <div className="bg-[#0b1122]/90 border border-slate-200 dark:border-white/10 px-2 py-0.5 rounded text-[6px] text-amber-100/90 shadow">
                    MEMBER OCC &bull; FDIC INSURED EQUIV
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Email Preview */}
          <div className="bg-slate-100 rounded-3xl border border-slate-200 dark:border-white/10 p-6 space-y-4 shadow-xl">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#0F172A] flex items-center gap-2 pl-1">
              <ShieldCheck className="w-4 h-4" /> Dispatch Notification Email Preview
            </h3>

            <div className="w-full max-w-md mx-auto bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-200 text-[#1E293B] dark:bg-slate-800">
              {/* Utility strip */}
              <div className="bg-slate-100 px-4 py-2 text-[#0F172A] text-[6px] font-bold uppercase tracking-widest flex justify-between">
                <span>Secure Dispatch // FPB-OP-8829</span>
                <span style={{ color: inputColor }}>🛡️ OCC Cert &bull; FDIC Insured</span>
              </div>
              
              {/* Banner Area */}
              <div 
                className="relative h-[110px] bg-slate-50 bg-cover bg-center flex items-center justify-start p-5 dark:bg-slate-900"
                style={{ backgroundImage: `url(${inputBanner})` }}
              >
                <div className="absolute inset-0 bg-slate-50 dark:bg-slate-800"></div>
                <div className="relative z-10 flex items-center gap-3 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10">
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border" style={{ borderColor: inputColor }}>
                    <img src={inputLogo || BRANDING_CONFIG.logoUrl} alt="Logo" className="w-full h-full object-contain scale-[0.8]" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black tracking-wider text-white uppercase leading-none">{BRANDING_CONFIG.shortName}</p>
                    <p className="text-[5.5px] font-black tracking-widest uppercase mt-1" style={{ color: inputColor }}>{inputIssuer || 'Private Wealth Enclave'}</p>
                  </div>
                </div>
              </div>

              {/* Email Content */}
              <div className="p-5 text-[#1E293B] font-sans">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#0F172A] mb-1">Instant Settlement Alert</h4>
                <p className="text-[11px] text-[#0F172A] leading-relaxed">
                  First Pacific Group core ledger dispatch cleared high-volume transactional settlement.
                </p>
                <div className="my-3 p-3 bg-slate-50 border-l-4 rounded-r-lg dark:bg-slate-900" style={{ borderLeftColor: inputColor }}>
                  <p className="text-[11px] font-black text-[#1E293B] leading-tight">
                    Direct Credit Transfer: $240,000.00 Cleared successfully
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NEW FEATURE: Real-Time App Dashboard Banner Generator by Gemini AI */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl space-y-8">
        <div>
          <span className="px-3 py-1 bg-violet-950 text-violet-400 border border-violet-500/20 text-[9px] font-black uppercase tracking-widest rounded-full font-mono">
            Active Identity Node &bull; Auto Generator
          </span>
          <h3 className="text-xl font-black text-[#0F172A] dark:text-white uppercase tracking-tight mt-3">
            Real-Time App Dashboard Banner Generator <span className="text-primary font-light" style={{ color: inputColor }}>via Gemini AI</span>
          </h3>
          <p className="text-xs text-[#0F172A] dark:text-white mt-1 max-w-4xl">
            Synthesize bespoke SVG vector banners custom-aligned to individual corporate email nodes. Select an active client email record and authorize the system-level Gemini 3.5 engine to run instant graphic overlays.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Generator Controls left */}
          <div className="space-y-6 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/10 p-6 rounded-2xl">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#0F172A] flex items-center gap-2 font-mono">
              <Sliders className="w-4 h-4 text-primary" style={{ color: inputColor }} /> Asset Synthesis Matrices
            </h4>

            {/* User drop selection field */}
            <div className="space-y-2">
              <label className="text-[9.5px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest font-mono">Select Active Capital Email</label>
              <select
                value={selectedUserEmail}
                onChange={(e) => setSelectedUserEmail(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white text-xs border border-slate-200 dark:border-white/10 p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary font-bold animate-pulse-slow"
              >
                {users.length === 0 ? (
                  <option value="">No Active accounts registered</option>
                ) : (
                  users.map(u => (
                    <option key={u.email} value={u.email}>
                      {u.profile?.name || 'Customer'} ({u.email})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Archetype visual choices */}
            <div className="space-y-2">
              <label className="text-[9.5px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest font-mono">Design Archetype Direction</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'esg', name: 'Eco Carbon Neutral' },
                  { id: 'sovereign', name: 'Golden Sovereign' },
                  { id: 'cyber', name: 'Cybernetic HUD' }
                ].map((arch) => (
                  <button
                    key={arch.id}
                    type="button"
                    onClick={() => setSelectedArchetype(arch.id as any)}
                    className={`p-3 rounded-xl text-center text-[10px] font-black uppercase tracking-wider border transition-all flex flex-col items-center justify-center gap-1.5 ${
                      selectedArchetype === arch.id
                        ? 'bg-primary/10 border-primary text-white'
                        : 'bg-white dark:bg-slate-900 text-[#0F172A] border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:bg-slate-900'
                    }`}
                    style={selectedArchetype === arch.id ? { borderColor: inputColor, color: inputColor } : {}}
                  >
                    <span>{arch.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Authorize launch button */}
            <button
              onClick={async () => {
                setIsGenerating(true);
                try {
                  const targetUsr = users.find(u => u.email === selectedUserEmail);
                  const targetName = targetUsr?.profile?.name || 'Sovereign Client';
                  
                  const res = await fetch('/api/admin/generate-user-banner', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      email: selectedUserEmail,
                      name: targetName,
                      themeColor: inputColor,
                      archetype: selectedArchetype
                    })
                  });
                  const data = await res.json();
                  if (data && data.svg) {
                    setPreviewSvg(data.svg);
                    // Update user profile locally & Firestore
                    await db.updateUserProfile(selectedUserEmail, { customBanner: data.svg });
                    await loadUsersAndBanners();
                  } else {
                    throw new Error(data.error || 'Server returned invalid response');
                  }
                } catch (err: any) {
                  setSaveError(err.message || 'Error occurred during generation cycles.');
                } finally {
                  setIsGenerating(false);
                }
              }}
              disabled={isGenerating || !selectedUserEmail}
              className="w-full py-4 text-[#0F172A] dark:text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
              style={{ backgroundColor: inputColor }}
            >
              {isGenerating ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                  Compiling Ultra-Tier Vector Matrix...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-[#0F172A]" />
                  Generate Bespoke Account Banner
                </>
              )}
            </button>
          </div>

          {/* Generated Banner Result Right panel */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#0F172A] pl-1 font-mono">Bespoke Vector Feed (Active Canvas)</h4>
            <div className="w-full relative bg-slate-100 overflow-hidden h-[240px] rounded-2xl flex items-center justify-center border border-slate-200 dark:border-white/10 shadow-inner">
              {previewSvg ? (
                <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: previewSvg }}></div>
              ) : (
                <div className="text-center p-6 text-[#0F172A] space-y-2">
                  <Sparkles className="w-8 h-8 mx-auto text-[#0F172A] animate-pulse" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No Bespoke Vector Active</p>
                  <p className="text-[9px] max-w-sm">Launch the generator module above to compile high-contrast real-time client vectors.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* VAULT STORAGE BOXES GALLERY */}
        <div className="space-y-6 pt-4 border-t border-slate-200 dark:border-white/10">
          <div>
            <span className="px-3 py-1 bg-emerald-950 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest rounded-full font-mono">
              Secure Ledger StorageBoxes
            </span>
            <h4 className="text-lg font-black text-[#0F172A] dark:text-white uppercase tracking-tight mt-3">Institutional Banner Storage Boxes</h4>
            <p className="text-xs text-[#0F172A] dark:text-white mt-1">
              Active ledger storage vaults displaying custom customer banners. Click any vault module to inspect high-fidelity vectors smoothly with dynamic zoom settings.
            </p>
          </div>

          {customBannersList.length === 0 ? (
            <div className="bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl py-12 text-center text-[#0F172A] space-y-2">
              <FolderLock className="w-8 h-8 mx-auto text-[#0F172A]" />
              <p className="text-[10px] font-black uppercase tracking-widest">Storage Boxes Vacant</p>
              <p className="text-[9px] max-w-sm mx-auto font-sans">No custom user-specific banners have been saved to the secure database nodes yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {customBannersList.map((userWithBanner) => (
                <div 
                  key={userWithBanner.email}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl p-5 space-y-4 hover:shadow-xl transition-all group flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-startPlus flex-wrap gap-2">
                      <div>
                        <p className="text-[11px] font-black text-[#0F172A] dark:text-white tracking-tight">{userWithBanner.profile?.name || 'Elite Partner'}</p>
                        <p className="text-[9px] text-[#0F172A] font-mono">{userWithBanner.email}</p>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-500/25 rounded text-[8px] font-bold uppercase tracking-wider font-mono">
                        SECURED
                      </span>
                    </div>
                    {/* Tiny visual representation */}
                    <div 
                      className="w-full h-24 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 cursor-pointer hover:border-emerald-500/30 transition-all scale-100 hover:scale-[1.01]"
                      onClick={() => {
                        setZoomedBannerUser(userWithBanner);
                        setZoomScale(1.0);
                      }}
                      dangerouslySetInnerHTML={{ __html: userWithBanner.profile.customBanner }}
                    ></div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
                    <button
                      onClick={() => {
                        setZoomedBannerUser(userWithBanner);
                        setZoomScale(1.0);
                      }}
                      className="flex-1 bg-white border border-slate-200 dark:border-white/10 hover:bg-white text-[#0F172A] py-2.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 dark:bg-slate-800"
                    >
                      <Maximize2 className="w-3 h-3" />
                      Audience Zoom Inspect
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm(`Do you wish to delete and purge custom banner credentials for ${userWithBanner.email}?`)) {
                          try {
                            await db.updateUserProfile(userWithBanner.email, { customBanner: '' });
                            await loadUsersAndBanners();
                          } catch (err: any) {
                            alert('Failed to erase secure credentials.');
                          }
                        }
                      }}
                      className="bg-rose-500 hover:bg-rose-600 text-rose-400 p-2.5 rounded-lg border border-rose-500/25 transition-all cursor-pointer flex items-center justify-center bg-transparent shrink-0"
                      title="Erase credentials"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* NEW FEATURE: INSTITUTIONAL PUBLIC SLIDESHOW / BANNER MATRIX GALLERY */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl space-y-8">
        <div>
          <span className="px-3 py-1 bg-amber-950 text-amber-500 border border-amber-500/20 text-[9px] font-black uppercase tracking-widest rounded-full font-mono">
            System Slide Hub &bull; Live Dashboard Banners
          </span>
          <h3 className="text-xl font-black text-[#0F172A] dark:text-white uppercase tracking-tight mt-3">
            Dashboard Banners & Videos Gallery Manager
          </h3>
          <p className="text-xs text-[#0F172A] dark:text-white mt-1 max-w-4xl">
            Empower the administrative console to customize the primary user dashboard slideshow. Create dynamic banner entries with direct support for high-definition video loops (such as MP4 tracks) or premium marketing graphics.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add slide form panel */}
          <form id="slide-form-architect" onSubmit={handleAddGalleryBanner} className="space-y-4 bg-slate-50 dark:bg-slate-955 border border-slate-100 dark:border-white/10 p-6 rounded-2xl">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#0F172A] flex items-center gap-2 font-mono pb-2 border-b border-slate-200 dark:border-white/10">
              <span>➕ Add Custom Slide/Video to Slideshow</span>
            </h4>

            <div className="grid grid-cols-2 gap-4 font-sans">
              <div className="space-y-1.5">
                <label className="text-[9.5px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest font-mono">Slide Title</label>
                <input 
                  type="text" 
                  value={newBannerTitle} 
                  onChange={(e) => setNewBannerTitle(e.target.value)} 
                  placeholder="e.g. Sovereign Black Card" 
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white p-2.5 rounded-xl text-xs font-bold outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9.5px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest font-mono font-mono">Slide Subtitle / Slogan</label>
                <input 
                  type="text" 
                  value={newBannerSubtitle} 
                  onChange={(e) => setNewBannerSubtitle(e.target.value)} 
                  placeholder="e.g. Infinite spending privilege" 
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white p-2.5 rounded-xl text-xs font-bold outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 font-sans">
              <div className="space-y-1.5">
                <label className="text-[9.5px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest font-mono">Badge Label</label>
                <input 
                  type="text" 
                  value={newBannerBadge} 
                  onChange={(e) => setNewBannerBadge(e.target.value)} 
                  placeholder="e.g. VIP TIER" 
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white p-2.5 rounded-xl text-xs font-bold outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9.5px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest font-mono">Target Route / Link</label>
                <input 
                  type="text" 
                  value={newBannerLink} 
                  onChange={(e) => setNewBannerLink(e.target.value)} 
                  placeholder="e.g. /cards" 
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white p-2.5 rounded-xl text-xs font-bold outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5 font-sans">
              <label className="text-[9.5px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest font-mono font-mono">Pitch/Description Text</label>
              <textarea 
                value={newBannerDesc} 
                onChange={(e) => setNewBannerDesc(e.target.value)} 
                placeholder="High-fidelity marketing pitch..." 
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white p-2.5 rounded-xl text-xs font-bold outline-none h-16 resize-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4 font-sans">
              <div className="space-y-1.5">
                <label className="text-[9.5px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest font-mono">Theme Accent Color</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newBannerColor} 
                    onChange={(e) => setNewBannerColor(e.target.value)} 
                    placeholder="#D4AF37" 
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white p-2 rounded-xl text-xs font-bold outline-none"
                  />
                  <input 
                    type="color" 
                    value={newBannerColor.startsWith('#') && newBannerColor.length === 7 ? newBannerColor : '#D4AF37'} 
                    onChange={(e) => setNewBannerColor(e.target.value)} 
                    className="w-10 h-9 border-0 bg-transparent cursor-pointer rounded-xl shrink-0"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9.5px] font-black text-[#0F172A] dark:text-white uppercase tracking-widest font-mono">Upload Image/Video Link</label>
                <input 
                  type="text" 
                  value={newBannerMediaUrl} 
                  onChange={(e) => setNewBannerMediaUrl(e.target.value)} 
                  placeholder="Paste URL or use upload below" 
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white p-2 rounded-xl text-xs font-bold outline-none"
                />
              </div>
            </div>

            {/* Media Upload (Images & Videos) File Selection wrapper */}
            <div className="p-4 border border-dashed border-slate-300 dark:border-white/10 rounded-xl bg-white dark:bg-slate-800 flex flex-col items-center justify-center gap-2">
              <CloudUpload className="w-6 h-6 text-[#0F172A]" />
              <p className="text-[10px] uppercase font-black tracking-wider text-[#0F172A] font-mono">
                {galleryIsUploading ? "Uploading custom track..." : "Direct Upload Media File"}
              </p>
              <p className="text-[8px] text-[#0F172A] font-sans text-center">Supports MP4, WebM, PNG, JPG, or SVG vectors</p>
              <input 
                type="file" 
                accept="video/*,image/*" 
                onChange={handleGalleryMediaUpload}
                className="hidden" 
                id="gallery-file-uploader" 
              />
              <label 
                htmlFor="gallery-file-uploader"
                className="px-3.5 py-1.5 hover:bg-white dark:text-white rounded border border-slate-200 dark:border-white/10 text-[9px] uppercase font-mono font-bold tracking-widest transition-all cursor-pointer dark:bg-slate-800"
              >
                Choose file
              </label>
            </div>

            <button 
              type="submit"
              disabled={galleryIsUploading}
              className="w-full py-3 text-slate-950 font-black uppercase text-[10px] tracking-widest rounded-xl transition-all cursor-pointer select-none active:scale-95 disabled:opacity-40"
              style={{ backgroundColor: primaryColor }}
            >
              🚀 Launch Dynamic Slideshow Banner
            </button>
          </form>

          {/* Banner Slideshow List Gallery Panel */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#0F172A] pl-1 font-mono">
              🖼️ Active Dynamic Slide Gallery ({galleryBanners.length} Custom Slides)
            </h4>

            {galleryBanners.length === 0 ? (
              <div className="h-full min-h-[350px] bg-slate-50 dark:bg-slate-955 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl flex flex-col items-center justify-center text-[#0F172A] p-6 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest font-mono">No Custom Slides Enrolled</p>
                <p className="text-[9px] text-center max-w-sm">Use the slide architect panel on the left to add dynamic content cards. They will slide automatically on user home boards.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1 select-none custom-scrollbar pb-6">
                {galleryBanners.map((slide: any) => (
                  <div 
                    key={slide.id} 
                    className="relative bg-slate-100 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-lg p-4 flex flex-col justify-between h-[150px]"
                  >
                    {/* Background slide preview */}
                    <div className="absolute inset-0 z-0 opacity-25">
                      {slide.bgImage.includes('mp4') || slide.bgImage.includes('data:video') ? (
                        <video src={slide.bgImage} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                      ) : (
                        <img src={slide.bgImage} alt={slide.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      )}
                    </div>

                    <div className="relative z-10 flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="text-[7.5px] font-black px-2 py-0.5 rounded uppercase tracking-wider font-mono text-white inline-block" style={{ backgroundColor: slide.hexColor }}>
                          {slide.badge || 'GALLERY'}
                        </span>
                        <h5 className="text-xs font-black text-white uppercase leading-tight">{slide.title}</h5>
                        <p className="text-[9px] text-[#0F172A] font-bold font-mono leading-none">{slide.subTitle}</p>
                      </div>

                      <button 
                        onClick={async () => {
                          if (confirm(`Do you wish to delete and purge this custom slide: "${slide.title}" from the main slideshow?`)) {
                            await deleteGalleryBanner(slide.id);
                          }
                        }}
                        className="bg-rose-500 hover:bg-rose-500 border border-rose-500/30 text-rose-400 p-2 rounded-lg transition-colors cursor-pointer"
                        title="Delete dynamic slideshow card"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="relative z-10 flex justify-between items-center pt-2 border-t border-black/5 text-[8.5px] font-mono text-[#0F172A]">
                      <span>accent: <span className="font-bold uppercase" style={{ color: slide.hexColor }}>{slide.hexColor}</span></span>
                      <span>Target: <span className="font-semibold text-[#0F172A]">{slide.link}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* REALISTIC BANKING MEDIA EMBASSY CATALOG (100+ HIGH-END ASSETS) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-8 space-y-8 shadow-2xl relative select-none">
        
        {/* Section Header */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500 text-emerald-400 uppercase text-[9px] font-black tracking-widest font-mono flex items-center gap-1 border border-emerald-500/20">
                <Crown className="w-3.5 h-3.5 animate-pulse" />
                100 High-Fidelity Presets Live
              </span>
              <span className="p-1.5 rounded-lg bg-amber-500 text-amber-400 uppercase text-[9px] font-black tracking-widest font-mono flex items-center gap-1 border border-amber-500/20">
                <Sliders className="w-3.5 h-3.5" />
                Fully Functional
              </span>
            </div>
            
            {/* Display status counts */}
            <p className="text-[10px] text-[#0F172A] dark:text-white font-mono font-black uppercase tracking-widest">
              ACTIVE CUSTODY NODE: ONLINE &bull; SECURED SYNDICATES
            </p>
          </div>
          
          <h3 className="text-xl md:text-2xl font-black text-[#0F172A] dark:text-white uppercase tracking-tight">
            🏛️ Global Institutional Media Embassy
          </h3>
          <p className="text-[#0F172A] dark:text-white text-xs font-semibold uppercase tracking-wider max-w-4xl leading-relaxed">
            A vetted elite directory of exactly 100 highly realistic financial images and high-definition video loops curated to attract global accounts. Browse, filter, search, and instantly deploy assets as Core App Banners or pre-fill active Slideshow Cards in real-time.
          </p>
        </div>

        {/* Dynamic Catalog Notification Toast */}
        {catalogNotification && (
          <div className="p-4 bg-emerald-500 border border-emerald-500/20 text-emerald-300 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-3 animate-bounce shadow-xl">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{catalogNotification}</span>
          </div>
        )}

        {/* Search & Categories tab filter menu */}
        <div className="flex flex-col gap-4 border-b border-slate-200 dark:border-white/10 pb-6">
          
          {/* Search bar inside catalog */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0F172A]" />
            <input 
              type="text"
              value={catalogSearchQuery}
              onChange={(e) => setCatalogSearchQuery(e.target.value)}
              placeholder="Search assets by keywords... (e.g. Zurich, Gold, Support, Vault, Risk, Ledger, MP4, etc.)"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white pl-12 pr-4 py-3.5 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold text-xs"
            />
          </div>

          {/* Categories Tab Lists with Badge counts */}
          <div className="flex flex-wrap gap-2.5 pt-1">
            {[
              { id: 'all', label: 'All Library Assets', icon: FolderLock, count: 100 },
              { id: 'wealth', label: '🏆 Private Wealth & Trusts', icon: Crown, count: 18 },
              { id: 'support', label: '👥 Support Desks & Care', icon: Sliders, count: 17 },
              { id: 'offices', label: '🏢 Skyscraper HQ Offices', icon: FolderLock, count: 16 },
              { id: 'security', label: '🛡️ Risk & Protection', icon: ShieldCheck, count: 16 },
              { id: 'corporate', label: '📈 Trading & Finance Ledgers', icon: Palette, count: 17 },
              { id: 'videos', label: '🎥 High-Definition loops', icon: VideoIcon, count: 16 },
            ].map((tab) => {
              const isActive = catalogCategoryFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCatalogCategoryFilter(tab.id as any)}
                  className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 cursor-pointer ${
                    isActive 
                      ? 'bg-slate-50 dark:bg-slate-800 text-white dark:text-white border-transparent shadow' 
                      : 'bg-slate-50 dark:bg-slate-900 text-[#0F172A] hover:text-slate-950 dark:text-white dark:hover:text-white border-slate-200 dark:border-white/10'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold font-mono ${
                    isActive ? 'bg-white text-white dark:bg-slate-200 dark:text-white' : 'bg-slate-200 dark:bg-slate-800'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* GRID OF PRESET CARDS */}
        {(() => {
          const filteredCatalog = BANKING_MEDIA_CATALOG.filter(asset => {
            const matchesCategory = catalogCategoryFilter === 'all' || asset.category === catalogCategoryFilter;
            const matchesSearch = asset.title.toLowerCase().includes(catalogSearchQuery.toLowerCase()) ||
                                  asset.subTitle.toLowerCase().includes(catalogSearchQuery.toLowerCase()) ||
                                  asset.description.toLowerCase().includes(catalogSearchQuery.toLowerCase()) ||
                                  asset.badge.toLowerCase().includes(catalogSearchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
          });

          if (filteredCatalog.length === 0) {
            return (
              <div className="py-16 text-center text-[#0F172A] bg-slate-50 dark:bg-slate-955 border border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center space-y-2 rounded-2xl">
                <Search className="w-10 h-10 text-slate-550 animate-pulse" />
                <p className="text-[11px] font-black uppercase tracking-widest font-mono mt-2 text-[#0F172A]">No Presets Match Query Criteria</p>
                <p className="text-[10px] max-w-sm text-[#0F172A]">We couldn't find any matches. Try typing simpler search parameters (e.g. "swiss" or "loop").</p>
              </div>
            );
          }

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 select-none">
              {filteredCatalog.map((asset) => {
                const isVideo = asset.bgImage.includes('mp4') || asset.bgImage.includes('video');
                return (
                  <div 
                    key={asset.id} 
                    className="group relative bg-slate-100 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-lg transition-all duration-300 hover:scale-[1.02] hover:border-slate-400 hover:shadow-2xl flex flex-col justify-between h-[280px]"
                  >
                    {/* Media Layer */}
                    <div className="absolute inset-0 z-0 opacity-40 group-hover:opacity-30 transition-opacity">
                      {isVideo ? (
                        <video 
                          src={asset.bgImage} 
                          className="w-full h-full object-cover" 
                          autoPlay 
                          loop 
                          muted 
                          playsInline 
                        />
                      ) : (
                        <img 
                          src={asset.bgImage} 
                          alt={asset.title} 
                          className="w-full h-full object-cover object-center" 
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>

                    {/* Badge Category overlay top right */}
                    <div className="relative z-10 p-4 flex justify-between items-start gap-4">
                      <span className="text-[7.5px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest text-slate-950 bg-white shadow-sm border font-mono dark:bg-slate-800">
                        {asset.category === 'videos' ? '🎥 live loop' : `🏛️ ${asset.category}`}
                      </span>

                      <span 
                        className="text-[7.5px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider text-white shadow-sm font-mono border"
                        style={{ backgroundColor: asset.hexColor, borderColor: `${asset.hexColor}40` }}
                      >
                        {asset.badge}
                      </span>
                    </div>

                    {/* Metadata Layer */}
                    <div className="relative z-10 p-3 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent pt-12">
                      <p className="text-[8.5px] text-slate-450 font-bold font-mono uppercase tracking-widest mb-0.5">
                        {asset.subTitle}
                      </p>
                      <h4 className="text-xs font-black text-white uppercase tracking-tight leading-tight group-hover:text-amber-400 transition-colors">
                        {asset.title}
                      </h4>
                      <p className="text-[9.5px] text-slate-450 font-bold leading-relaxed mt-1.5 line-clamp-2 h-7 overflow-hidden">
                        {asset.description}
                      </p>

                      {/* Fully Functional Core Utility Toggles */}
                      <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-black/5">
                        <button
                          type="button"
                          onClick={() => handleQuickApplyAsBanner(asset)}
                          className="py-2 px-2 bg-slate-50 hover:bg-white text-white text-[8px] font-black uppercase tracking-wider rounded-lg transition-colors border border-black/5 hover:border-white/30 flex items-center justify-center gap-1 cursor-pointer dark:bg-slate-800"
                          title="Apply this exact image/video as your active core top-page banner"
                        >
                          <ImageIcon className="w-3 h-3 text-emerald-400 font-bold" />
                          <span>Apply Banner</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleQuickLoadAsSlide(asset)}
                          className="py-2 px-2 bg-slate-100 hover:bg-[#0c112b] text-white text-[8px] font-black uppercase tracking-wider rounded-lg transition-colors border border-black/5 hover:border-white/30 flex items-center justify-center gap-1 cursor-pointer"
                          title="Pre-fill dynamic slide metadata options on left"
                        >
                          <Plus className="w-3 h-3 text-amber-400 font-bold" />
                          <span>Load Preset</span>
                        </button>
                      </div>

                      {/* Copy direct URL & Zoom features */}
                      <div className="flex justify-between items-center text-[7.5px] text-[#0F172A] font-mono mt-2.5">
                        <span>ACCENT: <span className="font-extrabold" style={{ color: asset.hexColor }}>{asset.hexColor}</span></span>
                        
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopyUrl(asset.id, asset.bgImage)}
                            className="p-1 text-[#0F172A] hover:text-white transition-colors cursor-pointer flex items-center gap-0.5"
                            title="Copy image direct source URL to clipboard"
                          >
                            {copiedUnderId === asset.id ? (
                              <Check className="w-2.5 h-2.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-2.5 h-2.5" />
                            )}
                            <span>Copy link</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedPreviewAsset(asset)}
                            className="p-1 text-[#0F172A] hover:text-white transition-colors cursor-pointer"
                            title="Inspect high fidelity preview modal"
                          >
                            👁️ Preview
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* FULL-SCREEN ASSET PREVIEW MODAL */}
      {selectedPreviewAsset && (
        <div className="fixed inset-0 z-[999] bg-slate-955  flex items-center justify-center p-6 select-none animate-fade-in text-white">
          <div className="max-w-4xl w-full bg-slate-50 border border-black/5 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between h-[80vh] dark:bg-slate-900">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-black/5 flex justify-between items-center bg-slate-100">
              <div className="flex items-center gap-3">
                <span className="text-[8px] font-black px-2 py-0.5 rounded text-white font-mono uppercase bg-emerald-600">
                  {selectedPreviewAsset.category} Presets
                </span>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wider">{selectedPreviewAsset.title}</h4>
                  <p className="text-[9px] text-slate-450 font-mono">ASSET PRESENTS: ID {selectedPreviewAsset.id.toUpperCase()}</p>
                </div>
              </div>

              <button 
                onClick={() => setSelectedPreviewAsset(null)}
                className="bg-white hover:bg-white text-[#0F172A] hover:text-white transition-colors text-xs p-2 rounded-full font-mono cursor-pointer dark:bg-slate-800"
              >
                ✕ CLOSE
              </button>
            </div>

            {/* Modal Content Media Box */}
            <div className="flex-1 overflow-hidden bg-slate-100 flex items-center justify-center relative p-8">
              {selectedPreviewAsset.bgImage.includes('mp4') || selectedPreviewAsset.bgImage.includes('video') ? (
                <video 
                  src={selectedPreviewAsset.bgImage} 
                  className="w-full h-full max-h-[50vh] object-contain rounded-xl shadow-2xl" 
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  controls 
                />
              ) : (
                <img 
                  src={selectedPreviewAsset.bgImage} 
                  alt={selectedPreviewAsset.title} 
                  className="w-full h-full max-h-[50vh] object-contain rounded-xl shadow-2xl" 
                  referrerPolicy="no-referrer"
                />
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="p-6 border-t border-black/5 bg-slate-100 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5 max-w-lg">
                  <p className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-black leading-none">{selectedPreviewAsset.subTitle}</p>
                  <p className="text-xs text-[#0F172A] font-bold leading-relaxed">{selectedPreviewAsset.description}</p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      handleCopyUrl(selectedPreviewAsset.id, selectedPreviewAsset.bgImage);
                      alert('Direct Asset Source URL copied to clipboard!');
                    }}
                    className="px-4 py-2.5 bg-slate-50 hover:bg-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all border border-black/5 cursor-pointer dark:bg-slate-800"
                  >
                    Copy Direct URL
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-black/5 text-[9px] font-mono text-[#0F172A]">
                <span>ACCENT INTEGRATION: <span className="font-extrabold uppercase" style={{ color: selectedPreviewAsset.hexColor }}>{selectedPreviewAsset.hexColor}</span></span>
                <span>CTA: <span className="text-[#0F172A]">{selectedPreviewAsset.cta} &bull; {selectedPreviewAsset.link}</span></span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* DYNAMIC ZOOM OVERLAY MODAL */}
      {zoomedBannerUser && (
        <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-800  flex items-center justify-center p-4">
          <div className="bg-slate-50 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-6 md:p-8 max-w-5xl w-full flex flex-col h-[85vh] justify-between shadow-2xl relative dark:bg-slate-900">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500 text-emerald-400 border border-emerald-500/20 rounded-xl">
                  <Maximize2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">{zoomedBannerUser.profile?.name || 'Sovereign Account'}</h4>
                  <p className="text-[9.5px] text-[#0F172A] font-mono uppercase tracking-widest">Active Storage Box: {zoomedBannerUser.email}</p>
                </div>
              </div>
              <button 
                onClick={() => setZoomedBannerUser(null)}
                className="p-2 hover:bg-white rounded-full text-[#0F172A] hover:text-white transition-colors text-sm cursor-pointer dark:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Modal Scrollable Canvas Zoom Container */}
            <div className="flex-1 overflow-auto my-6 bg-slate-100 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center justify-center p-8 select-none shadow-inner relative custom-scrollbar">
              <div 
                className="w-full max-w-[1200px] aspect-[1200/260] transition-all duration-200 ease-out origin-center shrink-0"
                style={{ transform: `scale(${zoomScale})` }}
                dangerouslySetInnerHTML={{ __html: zoomedBannerUser.profile.customBanner }}
              ></div>
            </div>

            {/* Modal Controls Footer */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-955 p-3 px-4 rounded-2xl border border-slate-200 dark:border-white/10">
              
              {/* SLIDER SYSTEM */}
              <div className="flex items-center gap-3 w-full sm:w-1/2">
                <Minus className="w-4 h-4 text-[#0F172A]" />
                <input 
                  type="range" 
                  min="0.4" 
                  max="3.0" 
                  step="0.1"
                  value={zoomScale} 
                  onChange={(e) => setZoomScale(Number(e.target.value))}
                  className="w-full h-1 bg-white rounded-lg appearance-none cursor-pointer accent-emerald-500 dark:bg-slate-800"
                />
                <Plus className="w-4 h-4 text-[#0F172A]" />
                <span className="text-[10px] text-[#0F172A] font-black font-mono w-12 text-right">
                  {Math.round(zoomScale * 100)}%
                </span>
              </div>

              {/* ACTION TOGGLES */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                <button
                  onClick={() => setZoomScale(prev => Math.max(0.4, prev - 0.2))}
                  className="px-3.5 py-2.5 bg-white hover:bg-slate-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1 dark:bg-slate-800"
                >
                  <Minus className="w-3 h-3" /> Zoom Out
                </button>
                <button
                  onClick={() => setZoomScale(prev => Math.min(3.0, prev + 0.2))}
                  className="px-3.5 py-2.5 bg-white hover:bg-slate-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1 dark:bg-slate-800"
                >
                  <Plus className="w-3 h-3" /> Zoom In
                </button>
                <button
                  onClick={() => setZoomScale(1.0)}
                  className="px-4 py-2.5 bg-white hover:bg-slate-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg border border-slate-300 transition-all cursor-pointer dark:bg-slate-800"
                >
                  Reset Fit
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([zoomedBannerUser.profile.customBanner], { type: 'image/svg+xml' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `FPB_Header_${zoomedBannerUser.email.replace(/[@.]/g, '_')}.svg`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                  }}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest rounded-lg transition-all cursor-pointer shadow"
                >
                  Acquire Vector File
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
