import { useState, useEffect } from 'react';
import { CATEGORIZED_BACKGROUNDS, AppSection, DEFAULT_ROTATION_INTERVAL_MS } from '../config/backgroundConfig';

const RELIABLE_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1920&auto=format&fit=crop';

export const useBackgroundAsset = (section: AppSection, rotationIntervalMs = DEFAULT_ROTATION_INTERVAL_MS) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const images = CATEGORIZED_BACKGROUNDS[section]?.length 
    ? CATEGORIZED_BACKGROUNDS[section] 
    : CATEGORIZED_BACKGROUNDS['WelcomePage'];

  useEffect(() => {
    // Preload next image and handle error recovery
    if (images.length > 1) {
      const nextIndex = (currentIndex + 1) % images.length;
      const img = new Image();
      img.onerror = () => {
        // Skip ahead if image fails to load
        setCurrentIndex((prev) => (prev + 1) % images.length);
      };
      img.src = images[nextIndex];
    }
  }, [currentIndex, images]);

  useEffect(() => {
    if (images.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, rotationIntervalMs);

    return () => clearInterval(timer);
  }, [images.length, rotationIntervalMs]);

  return images[currentIndex] || RELIABLE_FALLBACK_IMAGE;
};
