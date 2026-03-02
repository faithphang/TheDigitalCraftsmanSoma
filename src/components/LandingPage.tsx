import { useState, useEffect } from 'react';
import { SomaLogo } from './SomaLogo';
import { ChevronDown } from 'lucide-react';

interface LandingPageProps {
  onEnter: () => void;
}

export function LandingPage({ onEnter }: LandingPageProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('initializing');

  useEffect(() => {
    // Simulate loading sequence
    const loadingSteps = [
      { progress: 20, text: 'initializing', delay: 300 },
      { progress: 40, text: 'loading components', delay: 600 },
      { progress: 60, text: 'preparing workspace', delay: 900 },
      { progress: 80, text: 'configuring tools', delay: 1200 },
      { progress: 100, text: 'ready', delay: 1500 }
    ];

    loadingSteps.forEach(step => {
      setTimeout(() => {
        setLoadingProgress(step.progress);
        setLoadingText(step.text);
      }, step.delay);
    });

    // Auto-transition after loading completes
    const timer = setTimeout(() => {
      onEnter();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onEnter]);

  return (
    <div 
      className="w-full h-full bg-black flex items-center justify-center overflow-hidden relative"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full">
        {/* Logo container - minimal style */}
        <button
          onClick={onEnter}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="group relative transition-all duration-300 ease-out"
        >
          {/* Logo and text combined */}
          <div className="flex flex-col items-center">
            {/* Logo */}
            <div className="relative mb-4">
              <SomaLogo 
                className={`w-48 h-48 transition-all duration-500 mix-blend-luminosity ${
                  isHovered ? 'scale-105 opacity-80' : 'scale-100 opacity-100'
                }`}
              />
            </div>

            {/* Large typography - SOMA */}
            <h1 
              className="text-white text-[128px] leading-[0.75] tracking-[-4px] mb-0"
              style={{ fontWeight: 500 }}
            >
              SOMA
            </h1>
          </div>
        </button>

        {/* Subtitle */}
        <p 
          className="text-white/60 text-[24px] tracking-[-0.48px] mt-12 leading-[1.4]"
          style={{ fontWeight: 300 }}
        >
          Creative Build Tools
        </p>

        {/* Loading bar and text */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 w-64">
          {/* Loading text */}
          <div className="text-white/40 text-[14px] tracking-[-0.28px] leading-[1.5]" style={{ fontWeight: 300 }}>
            {loadingText}
          </div>
          
          {/* Progress bar */}
          <div className="w-full h-[1px] bg-white/10 relative overflow-hidden">
            <div 
              className="absolute left-0 top-0 h-full bg-white/40 transition-all duration-300 ease-out"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          
          {/* Percentage */}
          <div className="text-white/20 text-[12px] tracking-[-0.24px] leading-[1.5]" style={{ fontWeight: 300 }}>
            {loadingProgress}%
          </div>
        </div>
      </div>

      {/* Minimal corner navigation */}
      <div className="absolute top-8 left-8 space-y-1">
        <button 
          onClick={onEnter}
          className="block text-white/60 hover:text-white text-[18px] tracking-[-0.36px] leading-[1.5] transition-colors text-left"
          style={{ fontWeight: 300 }}
        >
          tools
        </button>
        <button 
          onClick={onEnter}
          className="block text-white/60 hover:text-white text-[18px] tracking-[-0.36px] leading-[1.5] transition-colors text-left"
          style={{ fontWeight: 300 }}
        >
          start creating
        </button>
      </div>

      {/* Version indicator bottom right */}
      <div className="absolute bottom-8 right-8 text-white/20 text-[12px] tracking-[-0.24px] leading-[1.5]" style={{ fontWeight: 300 }}>
        v1.0
      </div>
    </div>
  );
}