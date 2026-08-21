import React, { useState, useEffect, useRef } from 'react';

interface AnimatedCounterProps {
  value: number;
  formatCurrency: (v: number) => string;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ value, formatCurrency, className = "" }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [animKey, setAnimKey] = useState(0);
  const prevValueRef = useRef<number>(value);

  useEffect(() => {
    if (prevValueRef.current !== value) {
      setAnimKey(prev => prev + 1);
      prevValueRef.current = value;
    }

    let startTimestamp: number | null = null;
    let animationFrameId: number;
    const duration = 1000; // 1s smooth easing
    const startValue = displayValue;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);

      // easeOutExpo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      setDisplayValue(startValue + (value - startValue) * easeProgress);

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      }
    };

    animationFrameId = window.requestAnimationFrame(step);

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [value]);

  return (
    <span
      key={animKey}
      className={`inline-block transition-all transform-gpu duration-700 ease-out animate-balance-fade-up animate-in fade-in slide-in-from-bottom-2 ${className}`}
    >
      {formatCurrency(displayValue)}
    </span>
  );
};
