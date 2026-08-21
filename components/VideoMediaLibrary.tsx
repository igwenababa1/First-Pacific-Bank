import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    PlayCircle, 
    X,
    Menu,
    Wifi,
    Film,
    GraduationCap,
    Subtitles,
    Languages
} from 'lucide-react';
import { DEFAULT_BANNERS } from './DashboardBanners';
import { useLanguage } from '../contexts/LanguageContext';

import { EXTENDED_LANGUAGES } from './constants';

const SUPPORTED_LANGUAGES = EXTENDED_LANGUAGES.map(lang => ({
    code: lang.code,
    name: `${lang.nativeName} (${lang.countryCode})`
}));

// We will map our promotional banners which have mp4 video into the Media Library
const PROMOTIONAL_VIDEOS = DEFAULT_BANNERS.filter(b => b.bgImage && (b.bgImage.includes('mp4') || b.bgImage.includes('video'))).map(b => ({
    id: b.id,
    title: b.title,
    description: b.description,
    url: b.bgImage,
    thumbnail: b.bgImage.replace('large.mp4', 'large.jpg'), // Best effort dummy thumbnail or reuse
    category: 'Promotional',
    badge: b.badge
}));

const TUTORIAL_VIDEOS = [
    {
        id: 'tut-1',
        title: 'Mastering Wealth Strategies',
        description: 'Learn how to construct a resilient, multi-generational portfolio using our premier private banking tools.',
        url: 'https://assets.mixkit.co/videos/preview/mixkit-business-people-meeting-in-a-corporate-environment-42862-large.mp4',
        category: 'Tutorial',
        badge: 'Wealth Management'
    },
    {
        id: 'tut-2',
        title: 'Offshore Holding Dynamics',
        description: 'A deep dive into navigating tax-optimized jurisdictions and establishing holding companies safely.',
        url: 'https://assets.mixkit.co/videos/preview/mixkit-financial-trading-graphs-and-reports-in-a-smartphone-42646-large.mp4',
        category: 'Tutorial',
        badge: 'International Strategy'
    },
    {
        id: 'tut-3',
        title: 'Digital Vault Protection',
        description: 'How to utilize HSM security modules for military-grade protection of your digital assets.',
        url: 'https://assets.mixkit.co/videos/preview/mixkit-hacker-working-on-a-secret-computer-42022-large.mp4',
        category: 'Tutorial',
        badge: 'Cyber Security'
    }
];

const ALL_VIDEOS = [...PROMOTIONAL_VIDEOS, ...TUTORIAL_VIDEOS];

export const VideoMediaLibrary: React.FC = () => {
    const [selectedVideo, setSelectedVideo] = useState<any>(null);
    const [currentCategory, setCurrentCategory] = useState<string>('All');
    const [bandwidthResolution, setBandwidthResolution] = useState<'4K' | '1080p' | '720p' | 'Auto'>('Auto');
    
    // Captions & Language
    const { language, setLanguage, t } = useLanguage();
    const [ccEnabled, setCcEnabled] = useState(false);
    const [showLangMenu, setShowLangMenu] = useState(false);
    const [currentCaption, setCurrentCaption] = useState("Welcome to your private financial dashboard. We appreciate your partnership.");
    const videoRef = useRef<HTMLVideoElement>(null);

    // Simulate captions changing
    useEffect(() => {
        if (!selectedVideo || !ccEnabled) return;
        const captions = [
            "Welcome to your private financial dashboard. We appreciate your partnership.",
            "Our multi-currency architecture secures your investments globally.",
            "Access instantaneous liquidity operations with zero added latency.",
            "We provide continuous, round-the-clock monitoring of your private vault.",
            "Thank you for entrusting us with your legacy and future growth."
        ];
        let idx = 0;
        const interval = setInterval(() => {
            idx = (idx + 1) % captions.length;
            setCurrentCaption(captions[idx]);
        }, 5000);
        return () => clearInterval(interval);
    }, [selectedVideo, ccEnabled]);

    // Simulate Network Bandwidth checking for Video Player
    useEffect(() => {
        const checkBandwidth = () => {
            const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
            let recommendedRes: '4K' | '1080p' | '720p' = '720p';
            if (connection) {
                if (connection.downlink >= 10) recommendedRes = '4K';
                else if (connection.downlink >= 5) recommendedRes = '1080p';
                else recommendedRes = '720p';
            } else {
                recommendedRes = '1080p'; // Fallback
            }
            if (bandwidthResolution === 'Auto' || bandwidthResolution !== recommendedRes) {
                 setBandwidthResolution(recommendedRes);
                 console.log(`[Video Player] Network adapted resolution selected: ${recommendedRes}`);
            }
        };

        checkBandwidth();
        const interval = setInterval(checkBandwidth, 10000); // Check every 10 Sec
        return () => clearInterval(interval);
    }, [bandwidthResolution]);

    const filteredVideos = currentCategory === 'All' ? ALL_VIDEOS : ALL_VIDEOS.filter(v => v.category === currentCategory);

    return (
        <div className="flex-1 w-full bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 flex flex-col h-screen overflow-hidden">
            <header className="px-8 py-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900  sticky top-0 z-20 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent flex items-center gap-3 tracking-tight">
                        <Film className="w-8 h-8 text-primary" />
                        Media & Tutorials Library
                    </h1>
                    <p className="text-[#0F172A] dark:text-white mt-1 font-bold tracking-wide">
                        Exclusive, curated video content matching your bandwidth profile.
                    </p>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="flex bg-slate-200 dark:bg-slate-900 p-1 rounded-xl">
                        {['All', 'Promotional', 'Tutorial'].map(cat => (
                            <button
                                key={cat}
                                onClick={() => setCurrentCategory(cat)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${currentCategory === cat ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:hover:text-[#1E293B]'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-500 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm font-bold border border-emerald-200 dark:border-emerald-500/20">
                        <Wifi className="w-4 h-4 animate-pulse" />
                        Optimal: {bandwidthResolution}
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {filteredVideos.map((video, idx) => (
                        <motion.div
                            key={video.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-300/50 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all cursor-pointer group"
                            onClick={() => setSelectedVideo(video)}
                        >
                            <div className="relative aspect-video bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
                                {/* Auto-playing muted preview inside the library grid */}
                                {video.url.includes('mp4') ? (
                                    <video 
                                        src={video.url}
                                        className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                                        autoPlay loop muted playsInline
                                    />
                                ) : (
                                     <div className="w-full h-full bg-slate-200 dark:bg-slate-900 relative z-10 flex items-center justify-center">
                                         <Film className="w-8 h-8 text-[#0F172A]" />
                                     </div>
                                )}
                                
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none z-10"></div>
                                
                                <div className="absolute bottom-4 left-4 right-4 z-20 flex justify-between items-end">
                                    <span className="px-2.5 py-1 bg-primary/90  rounded-md text-[10px] font-black text-white uppercase tracking-widest leading-none border border-slate-200 dark:border-black/10 shadow-sm">
                                        {video.category}
                                    </span>
                                    <PlayCircle className="w-10 h-10 text-white/80 group-hover:text-white group-hover:scale-110 transition-transform" />
                                </div>
                            </div>
                            
                            <div className="p-6">
                                <span className="block text-[10px] font-bold text-primary uppercase tracking-widest mb-2">{video.badge}</span>
                                <h3 className="text-lg font-bold text-[#0F172A] dark:text-white mb-2 leading-tight group-hover:text-primary transition-colors">{video.title}</h3>
                                <p className="text-sm text-[#0F172A] dark:text-white line-clamp-2 leading-relaxed">{video.description}</p>
                            </div>
                        </motion.div>
                    ))}
                    
                    {filteredVideos.length === 0 && (
                        <div className="col-span-full py-20 text-center">
                            <Film className="w-16 h-16 text-[#0F172A] dark:text-white mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">No videos found for this category.</h3>
                        </div>
                    )}
                </div>
            </main>

            {/* Video Player Modal */}
            <AnimatePresence>
                {selectedVideo && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-100  p-4 md:p-12"
                        onClick={() => setSelectedVideo(null)}
                    >
                         <button 
                            className="absolute top-8 right-8 text-white/50 hover:text-white bg-white hover:bg-white p-4 rounded-full transition-all z-[110] cursor-pointer dark:bg-slate-800"
                            onClick={() => setSelectedVideo(null)}
                        >
                            <X className="w-6 h-6" />
                        </button>
                        
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="w-full max-w-6xl bg-slate-50 rounded-[2rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col items-center dark:bg-slate-900"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="w-full relative aspect-video bg-slate-100 flex items-center justify-center rounded-t-[2rem] overflow-hidden group/player">
                                {selectedVideo.url.includes('mp4') ? (
                                    <video
                                        ref={videoRef}
                                        src={selectedVideo.url} // In a real app we'd load highly-compressed different DASH streams here based on bandwidthResolution
                                        className="w-full h-full"
                                        controls
                                        autoPlay
                                        playsInline
                                        crossOrigin="anonymous"
                                    />
                                ) : (
                                    <div className="text-white">Video format not supported.</div>
                                )}
                                
                                {/* Network Quality Indicator */}
                                <div className="absolute top-4 left-4 px-3 py-1.5 bg-slate-100  rounded-lg text-xs font-bold text-white/90 border border-slate-200 dark:border-white/10 shadow-lg flex items-center gap-2 opacity-0 group-hover/player:opacity-100 transition-opacity z-10">
                                    <Wifi className="w-4 h-4 text-emerald-400" />
                                    Stream Quality: {bandwidthResolution}
                                </div>
                                
                                {/* CC overlay text */}
                                <AnimatePresence>
                                    {ccEnabled && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute bottom-20 left-4 right-4 text-center pointer-events-none z-10"
                                        >
                                            <span className="inline-block bg-slate-100  text-white px-4 py-2 rounded-xl text-lg md:text-xl font-bold tracking-wide shadow-xl max-w-4xl border border-slate-200 dark:border-white/10">
                                                {/* In a real app with VTT, we would display the active track cue here. For this demo, we simulate translating CC. */}
                                                {currentCaption}
                                            </span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                
                                {/* Player Controls Overlay (CC / Language) */}
                                <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover/player:opacity-100 transition-opacity z-20">
                                    <div className="relative">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setShowLangMenu(!showLangMenu); }}
                                            className="p-2 bg-slate-100 hover:bg-slate-100  rounded-lg text-white border border-slate-200 dark:border-white/10 transition-colors"
                                            title="Audio/Subtitle Language"
                                        >
                                            <Languages className="w-5 h-5" />
                                        </button>
                                        
                                        <AnimatePresence>
                                            {showLangMenu && (
                                                <motion.div 
                                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                    className="absolute right-0 top-12 w-48 bg-slate-50 border border-slate-300 shadow-2xl rounded-xl overflow-hidden py-2 dark:bg-slate-900"
                                                >
                                                    <div className="px-3 pb-2 mb-2 border-b border-slate-300/50 text-[10px] font-black uppercase tracking-widest text-[#0F172A]">
                                                        Select Language / Real-Time CC
                                                    </div>
                                                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                                        {SUPPORTED_LANGUAGES.map(lang => (
                                                            <button 
                                                                key={lang.code}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setLanguage(lang.code);
                                                                    setShowLangMenu(false);
                                                                    setCcEnabled(true);
                                                                }}
                                                                className={`w-full text-left px-4 py-2 text-sm font-bold transition-colors ${language === lang.code ? 'bg-primary/20 text-primary' : 'text-[#0F172A] hover:bg-white hover:text-white'}`}
                                                            >
                                                                {lang.name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setCcEnabled(!ccEnabled); }}
                                        className={`p-2  rounded-lg border transition-colors ${ccEnabled ? 'bg-primary border-primary text-white' : 'bg-slate-100 hover:bg-slate-100 border-slate-200 dark:border-white/10 text-white/50 hover:text-white'}`}
                                        title="Toggle Closed Captions"
                                    >
                                        <Subtitles className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="p-8 md:p-12 w-full text-left bg-gradient-to-b from-slate-900 to-slate-950">
                                <div className="flex items-center gap-3 mb-4">
                                     <span className="px-3 py-1 bg-primary/20 text-primary rounded-lg text-xs font-bold uppercase tracking-widest">{selectedVideo.category}</span>
                                     <span className="px-3 py-1 bg-white text-[#0F172A] rounded-lg text-xs font-bold uppercase tracking-widest border border-slate-300 dark:bg-slate-800">{selectedVideo.badge}</span>
                                </div>
                                <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4">{selectedVideo.title}</h2>
                                <p className="text-lg text-[#0F172A] leading-relaxed max-w-4xl">{selectedVideo.description}</p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
