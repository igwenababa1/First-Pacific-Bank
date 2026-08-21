
import React from 'react';
import { LEADERSHIP_TEAM } from './constants';
import { ShieldCheckIcon, SparklesIcon, GlobeAmericasIcon, UserGroupIcon, TrophyIcon, StarIcon, PremiumReservedBankLogo } from './Icons';

const ValueCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
    <div className="bg-slate-200 p-6 rounded-2xl shadow-digital text-center">
        <div className="flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4 mx-auto shadow-digital">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-[#1E293B]">{title}</h3>
        <p className="text-sm text-[#0F172A] mt-2">{description}</p>
    </div>
);

const AwardCard: React.FC<{ icon: React.ReactNode; title: string; issuer: string; }> = ({ icon, title, issuer }) => (
    <div className="bg-slate-100 p-6 rounded-2xl shadow-digital text-center">
        <div className="flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4 mx-auto shadow-digital dark:bg-slate-800">
            {icon}
        </div>
        <h3 className="text-lg font-bold text-[#1E293B]">{title}</h3>
        <p className="text-sm text-[#0F172A]">{issuer}</p>
    </div>
);


export const About: React.FC = () => {
    return (
        <div className="space-y-12">
            {/* Hero Section */}
            <div className="relative rounded-2xl p-8 md:p-16 bg-white dark:bg-slate-900 text-center overflow-hidden">
                <div 
                    className="absolute inset-0 z-0 bg-cover bg-center opacity-20 animate-ken-burns" 
                    style={{ backgroundImage: "url('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2940&auto=format&fit=crop')" }}
                ></div>
                <div className="relative z-10">
                    <PremiumReservedBankLogo className="w-16 h-16 mx-auto" />
                    <h1 className="text-4xl md:text-6xl font-extrabold text-[#0F172A] dark:text-white tracking-tight mt-4">Our Mission</h1>
                    <p className="mt-6 text-xl text-[#0F172A] dark:text-white max-w-3xl mx-auto">
                        To build the world's most customer-centric financial platform, empowering individuals and businesses to move money securely, instantly, and without borders.
                    </p>
                </div>
            </div>

            {/* Our Values */}
            <div>
                <h2 className="text-3xl font-bold text-[#1E293B] text-center mb-8">The Values That Drive Us</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <ValueCard icon={<ShieldCheckIcon className="w-8 h-8 text-primary" />} title="Uncompromising Security" description="Your trust is our foundation. We employ multi-layered security protocols to protect every transaction." />
                    <ValueCard icon={<SparklesIcon className="w-8 h-8 text-primary" />} title="Relentless Innovation" description="We are constantly pushing the boundaries of technology to create a faster, smarter, and more intuitive banking experience." />
                    <ValueCard icon={<GlobeAmericasIcon className="w-8 h-8 text-primary" />} title="Global Accessibility" description="Finance should be borderless. Our platform is designed for a global audience, connecting economies and people." />
                    <ValueCard icon={<UserGroupIcon className="w-8 h-8 text-primary" />} title="Customer-Centricity" description="Every feature we build, every decision we make, starts and ends with you, our customer." />
                </div>
            </div>

            {/* Leadership */}
            <div>
                <h2 className="text-3xl font-bold text-[#1E293B] text-center mb-8">Meet Our Leadership</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {LEADERSHIP_TEAM.map(member => (
                        <div key={member.name} className="bg-slate-200 rounded-2xl shadow-digital p-6 text-center">
                            <img src={member.imageUrl} alt={member.name} className="w-24 h-24 rounded-full mx-auto mb-4 shadow-lg object-cover" />
                            <h4 className="font-bold text-lg text-[#1E293B]">{member.name}</h4>
                            <p className="text-sm font-semibold text-primary">{member.title}</p>
                            <p className="text-xs text-[#0F172A] mt-2">{member.bio}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Global Presence */}
            <div className="bg-slate-200 rounded-2xl shadow-digital p-6 md:p-8">
                 <h2 className="text-3xl font-bold text-[#1E293B] text-center mb-8">Our Global Presence</h2>
                 <div className="relative h-64 md:h-96 w-full rounded-lg overflow-hidden shadow-inner bg-white dark:bg-slate-900">
                    <div 
                        className="w-full h-full bg-cover bg-center opacity-60 grayscale brightness-50"
                        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')" }}
                    ></div>
                    {/* Office dots */}
                    <div className="absolute w-4 h-4 bg-primary border-2 border-white rounded-full animate-pulse z-10 shadow-[0_0_10px_#0EA5E9]" style={{ top: '32%', left: '26%' }} title="New York (HQ)"></div>
                    <div className="absolute w-3 h-3 bg-primary border-2 border-white rounded-full animate-pulse z-10 shadow-[0_0_10px_#0EA5E9]" style={{ top: '26%', left: '48%' }} title="London"></div>
                    <div className="absolute w-3 h-3 bg-primary border-2 border-white rounded-full animate-pulse z-10 shadow-[0_0_10px_#0EA5E9]" style={{ top: '55%', left: '76%' }} title="Singapore"></div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 text-center text-sm">
                    <div><h5 className="font-bold text-[#0F172A]">New York (HQ)</h5><p className="text-[#0F172A]">45 Rockefeller Plaza</p></div>
                    <div><h5 className="font-bold text-[#0F172A]">London</h5><p className="text-[#0F172A]">789 Canary Wharf</p></div>
                    <div><h5 className="font-bold text-[#0F172A]">Singapore</h5><p className="text-[#0F172A]">456 Marina Bay</p></div>
                 </div>
            </div>

             {/* Awards */}
            <div>
                <h2 className="text-3xl font-bold text-[#1E293B] text-center mb-8">Awards & Recognition</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <AwardCard icon={<TrophyIcon className="w-8 h-8 text-yellow-500" />} title="Best Digital Bank 2024" issuer="Global Finance Magazine" />
                    <AwardCard icon={<StarIcon className="w-8 h-8 primary-" />} title="Innovation in Fintech Award" issuer="Fintech Innovators Forum" />
                    <AwardCard icon={<ShieldCheckIcon className="w-8 h-8 text-green-500" />} title="Most Secure Banking App" issuer="Cybersecurity Excellence Awards" />
                </div>
            </div>

        </div>
    );
};
