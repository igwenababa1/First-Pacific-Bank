import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '../services/database';
import { socket } from '../services/socket';
import { BRANDING_CONFIG } from '../components/constants';

interface BrandingContextType {
  logoUrl: string;
  bannerUrl: string;
  logoStyle: 'classic' | 'modern' | 'minimal';
  primaryColor: string;
  customIssuer: string;
  galleryBanners: any[];
  refreshBranding: () => Promise<void>;
  updateBranding: (newBranding: { logoUrl?: string; bannerUrl?: string; logoStyle?: 'classic' | 'modern' | 'minimal'; primaryColor?: string; customIssuer?: string }) => Promise<void>;
  addGalleryBanner: (banner: any) => Promise<void>;
  deleteGalleryBanner: (id: string) => Promise<void>;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const BrandingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [logoUrl, setLogoUrl] = useState<string>(BRANDING_CONFIG.logoUrl);
  const [bannerUrl, setBannerUrl] = useState<string>('https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?q=80&w=1200&auto=format&fit=crop');
  const [logoStyle, setLogoStyle] = useState<'classic' | 'modern' | 'minimal'>('classic');
  const [primaryColor, setPrimaryColor] = useState<string>('#D4AF37');
  const [customIssuer, setCustomIssuer] = useState<string>('Sovereign Elite Portfolios');
  const [galleryBanners, setGalleryBanners] = useState<any[]>([]);

  const fetchBranding = async () => {
    try {
      const options = await db.getSystemOptions();
      if (options) {
        if (options.logoUrl) setLogoUrl(options.logoUrl);
        if (options.bannerUrl) setBannerUrl(options.bannerUrl);
        else if (options.emailBannerUrl) setBannerUrl(options.emailBannerUrl);
        
        if (options.logoStyle) setLogoStyle(options.logoStyle);
        if (options.primaryColor) setPrimaryColor(options.primaryColor);
        if (options.customIssuer) setCustomIssuer(options.customIssuer);
        
        if (options.galleryBanners) {
          setGalleryBanners(options.galleryBanners);
        } else {
          setGalleryBanners([]);
        }
      }
    } catch (error) {
      console.warn('[BRANDING] Failed to load branding options:', error);
    }
  };

  const updateBranding = async (newBranding: { logoUrl?: string; bannerUrl?: string; logoStyle?: 'classic' | 'modern' | 'minimal'; primaryColor?: string; customIssuer?: string }) => {
    try {
      const currentOptions = await db.getSystemOptions();
      const updatedOptions = {
        ...currentOptions,
        ...newBranding,
        // Sync them to legacy keys where necessary
        ...(newBranding.bannerUrl ? { emailBannerUrl: newBranding.bannerUrl } : {}),
      };
      
      await db.saveSystemOptions(updatedOptions);
      
      // Update local state immediately
      if (newBranding.logoUrl !== undefined) setLogoUrl(newBranding.logoUrl);
      if (newBranding.bannerUrl !== undefined) setBannerUrl(newBranding.bannerUrl);
      if (newBranding.logoStyle !== undefined) setLogoStyle(newBranding.logoStyle);
      if (newBranding.primaryColor !== undefined) setPrimaryColor(newBranding.primaryColor);
      if (newBranding.customIssuer !== undefined) setCustomIssuer(newBranding.customIssuer);
    } catch (error) {
      console.error('[BRANDING] Failed to save updated branding:', error);
      throw error;
    }
  };

  const addGalleryBanner = async (newBanner: any) => {
    try {
      const currentOptions = await db.getSystemOptions();
      const updatedBanners = [...(currentOptions.galleryBanners || []), newBanner];
      const updatedOptions = {
        ...currentOptions,
        galleryBanners: updatedBanners
      };
      await db.saveSystemOptions(updatedOptions);
      setGalleryBanners(updatedBanners);
    } catch (error) {
      console.error('[BRANDING] Failed to add gallery banner:', error);
      throw error;
    }
  };

  const deleteGalleryBanner = async (id: string) => {
    try {
      const currentOptions = await db.getSystemOptions();
      const updatedBanners = (currentOptions.galleryBanners || []).filter((b: any) => b.id !== id);
      const updatedOptions = {
        ...currentOptions,
        galleryBanners: updatedBanners
      };
      await db.saveSystemOptions(updatedOptions);
      setGalleryBanners(updatedBanners);
    } catch (error) {
      console.error('[BRANDING] Failed to delete gallery banner:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchBranding();

    // Listen to real-time updates from socket
    const handleUpdate = (updatedConfig: any) => {
      if (updatedConfig) {
        if (updatedConfig.logoUrl) setLogoUrl(updatedConfig.logoUrl);
        if (updatedConfig.bannerUrl) setBannerUrl(updatedConfig.bannerUrl);
        else if (updatedConfig.emailBannerUrl) setBannerUrl(updatedConfig.emailBannerUrl);
        
        if (updatedConfig.logoStyle) setLogoStyle(updatedConfig.logoStyle);
        if (updatedConfig.primaryColor) setPrimaryColor(updatedConfig.primaryColor);
        if (updatedConfig.customIssuer) setCustomIssuer(updatedConfig.customIssuer);
        
        if (updatedConfig.galleryBanners) {
          setGalleryBanners(updatedConfig.galleryBanners);
        } else {
          setGalleryBanners([]);
        }
      } else {
        fetchBranding();
      }
    };

    socket.on('admin:system_options_updated', handleUpdate);

    return () => {
      socket.off('admin:system_options_updated', handleUpdate);
    };
  }, []);

  return (
    <BrandingContext.Provider value={{ logoUrl, bannerUrl, logoStyle, primaryColor, customIssuer, galleryBanners, addGalleryBanner, deleteGalleryBanner, refreshBranding: fetchBranding, updateBranding }}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};
