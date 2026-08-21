import React from 'react';
import { useBackgroundAsset } from '../hooks/useBackgroundAsset';
import { AppSection } from '../config/backgroundConfig';

interface BackgroundManagerProps {
  section: AppSection;
  overlayType?: 'subtle' | 'medium' | 'deep' | 'gradient' | 'glass';
  rotationIntervalMs?: number;
}

export const BackgroundManager: React.FC<BackgroundManagerProps> = ({ 
  section, 
  overlayType = 'subtle',
  rotationIntervalMs
}) => {
  const currentBgUrl = useBackgroundAsset(section, rotationIntervalMs);

  const getOverlayClass = () => {
    switch (overlayType) {
      case 'glass':
        return 'bg-slate-950/40 backdrop-blur-sm';
      case 'medium':
        return 'bg-slate-950/60 backdrop-blur-[2px]';
      case 'deep':
        return 'bg-slate-950/75 backdrop-blur-[3px]';
      case 'gradient':
        return 'bg-gradient-to-b from-slate-950/85 via-slate-900/50 to-slate-950/90';
      case 'subtle':
      default:
        return 'bg-slate-950/35 backdrop-blur-[1px]';
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-[-2] bg-cover bg-center bg-no-repeat transition-all duration-1000 ease-in-out scale-105"
        style={{ backgroundImage: `url(${currentBgUrl})` }}
      />
      <div className={`fixed inset-0 z-[-1] transition-colors duration-1000 ${getOverlayClass()}`} />
    </>
  );
};
