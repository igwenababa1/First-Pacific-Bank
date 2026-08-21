import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserProfile, View } from '../types';
import { UserCircleIcon, CogIcon, QuestionMarkCircleIcon, LogoutIcon, CameraIcon, SpinnerIcon, ShieldCheckIcon } from './Icons';

interface ProfileDropdownProps {
  userProfile: UserProfile;
  onClose: () => void;
  onOpenLogoutConfirm: () => void;
  onUpdateProfilePicture: (url: string) => void;
  isUploading: boolean;
  handlePictureClick: () => void;
  onOpenAdminDashboard?: () => void;
}

const MenuItem: React.FC<{ icon: React.ReactNode; label: string; to?: `/${View}`; onClick: () => void; }> = ({ icon, label, to, onClick }) => (
    <li>
        {to ? (
            <Link
                to={to}
                onClick={onClick}
                className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-[#0F172A] dark:text-white hover:bg-slate-200 dark:hover:bg-white hover:text-[#0F172A] dark:hover:text-white rounded-lg transition-colors dark:bg-slate-800"
            >
                {icon}
                <span>{label}</span>
            </Link>
        ) : (
            <button
                onClick={onClick}
                className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-[#0F172A] dark:text-white hover:bg-slate-200 dark:hover:bg-white hover:text-[#0F172A] dark:hover:text-white rounded-lg transition-colors dark:bg-slate-800"
            >
                {icon}
                <span>{label}</span>
            </button>
        )}
    </li>
);

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ 
  userProfile, 
  onClose, 
  onOpenLogoutConfirm, 
  isUploading, 
  handlePictureClick, 
  onOpenAdminDashboard 
}) => {
    const [imgError, setImgError] = useState(false);

    const getInitials = (name?: string) => {
      if (!name) return 'FP';
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    };

    return (
        <div
            className="absolute top-full right-0 mt-2.5 w-72 bg-white dark:bg-[#0e1626]/95  rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 z-50 animate-slide-in-panel overflow-hidden"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="user-menu-button"
        >
            <div className="p-5 border-b border-slate-200 dark:border-white/10 text-center bg-slate-50 dark:bg-slate-900[0.02]">
                <button
                    onClick={handlePictureClick}
                    disabled={isUploading}
                    className="relative group w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden ring-4 ring-emerald-500/30 hover:ring-emerald-400 shadow-lg transition-all duration-300 block"
                    aria-label="Change profile picture"
                >
                    {userProfile.profilePictureUrl && !imgError ? (
                      <img 
                        src={userProfile.profilePictureUrl} 
                        alt="User Profile" 
                        onError={() => setImgError(true)}
                        className="w-full h-full rounded-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 text-white font-black text-xl flex items-center justify-center tracking-widest shadow-inner">
                        {getInitials(userProfile.name)}
                      </div>
                    )}

                    <div className="absolute inset-0 bg-slate-100 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer [2px]">
                        {isUploading ? (
                          <SpinnerIcon className="w-6 h-6 animate-spin text-emerald-400" />
                        ) : (
                          <>
                            <CameraIcon className="w-6 h-6 text-emerald-400 mb-0.5" />
                            <span className="text-[9px] font-bold uppercase tracking-wider">Change</span>
                          </>
                        )}
                    </div>
                </button>
                
                <h4 className="text-sm font-bold text-[#0F172A] dark:text-white truncate">
                  {userProfile.name}
                </h4>
                <p className="text-xs text-[#0F172A] dark:text-white truncate mt-0.5">
                  {userProfile.email}
                </p>
                <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  {userProfile.role === 'super_admin' ? 'Super Admin' : userProfile.position || 'Verified Customer'}
                </div>
            </div>

            <ul className="p-2 space-y-0.5" role="none">
                {userProfile.role === 'super_admin' && onOpenAdminDashboard && (
                    <MenuItem
                        icon={<ShieldCheckIcon className="w-5 h-5 text-emerald-500" />}
                        label="Admin Dashboard"
                        onClick={() => { onOpenAdminDashboard(); onClose(); }}
                    />
                )}
                <MenuItem
                    icon={<UserCircleIcon className="w-5 h-5 text-[#0F172A]" />}
                    label="My Profile"
                    to="/profile"
                    onClick={onClose}
                />
                <MenuItem
                    icon={<CogIcon className="w-5 h-5 text-[#0F172A]" />}
                    label="Settings & Security"
                    to="/security"
                    onClick={onClose}
                />
                <MenuItem
                    icon={<QuestionMarkCircleIcon className="w-5 h-5 text-[#0F172A]" />}
                    label="Help Center"
                    to="/support"
                    onClick={onClose}
                />
            </ul>

            <div className="p-2 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800">
                <MenuItem
                    icon={<LogoutIcon className="w-5 h-5 text-rose-500" />}
                    label="Logout"
                    onClick={() => { onOpenLogoutConfirm(); onClose(); }}
                />
            </div>

            <style>{`
              @keyframes slideInPanel {
                0% {
                  opacity: 0;
                  transform: translateY(-16px) translateX(12px) scale(0.95);
                  filter: blur(4px);
                }
                100% {
                  opacity: 1;
                  transform: translateY(0) translateX(0) scale(1);
                  filter: blur(0);
                }
              }
              .animate-slide-in-panel {
                animation: slideInPanel 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
              }
            `}</style>
        </div>
    );
};
