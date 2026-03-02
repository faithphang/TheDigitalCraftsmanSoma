import { useState } from 'react';
import { SomaLogo } from './SomaLogo';
import { User, Sparkles, Image, Palette, Check } from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

export interface UserProfile {
  name: string;
  avatar?: string;
  enabledTools: {
    graphicDesigner: boolean;
    photoEditor: boolean;
  };
}

type OnboardingStep = 'welcome' | 'profile' | 'tools' | 'confirm';

const AVATAR_OPTIONS = [
  '👤', '🎨', '✨', '🚀', '💎', '🌙', '⚡', '🔥', '💫', '🎯'
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  const [enabledTools, setEnabledTools] = useState({
    graphicDesigner: true,
    photoEditor: true,
  });

  const handleContinue = () => {
    if (step === 'welcome') {
      setStep('profile');
    } else if (step === 'profile') {
      if (name.trim()) {
        setStep('tools');
      }
    } else if (step === 'tools') {
      if (enabledTools.graphicDesigner || enabledTools.photoEditor) {
        setStep('confirm');
      }
    }
  };

  const handleComplete = () => {
    onComplete({
      name: name.trim(),
      avatar: selectedAvatar,
      enabledTools,
    });
  };

  return (
    <div 
      className="w-full h-full bg-black flex items-center justify-center overflow-hidden relative"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Progress indicator */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 flex gap-2">
        {['welcome', 'profile', 'tools', 'confirm'].map((s, i) => (
          <div
            key={s}
            className={`h-[2px] transition-all duration-300 ${
              s === step ? 'w-16 bg-white' : 
              ['welcome', 'profile', 'tools', 'confirm'].indexOf(s) < ['welcome', 'profile', 'tools', 'confirm'].indexOf(step) 
                ? 'w-8 bg-white/40' 
                : 'w-8 bg-white/10'
            }`}
          />
        ))}
      </div>

      {/* Main content area */}
      <div className="max-w-2xl w-full px-8">
        
        {/* WELCOME STEP */}
        {step === 'welcome' && (
          <div className="flex flex-col items-center text-center animate-in fade-in duration-500">
            <SomaLogo className="w-32 h-32 mb-8 opacity-80 mix-blend-luminosity" />
            
            <h1 
              className="text-white text-[72px] leading-[0.85] tracking-[-3px] mb-6"
              style={{ fontWeight: 500 }}
            >
              WELCOME TO SOMA
            </h1>
            
            <p 
              className="text-white/60 text-[20px] tracking-[-0.4px] mb-16 max-w-lg leading-[1.6]"
              style={{ fontWeight: 300 }}
            >
              Your personal creative workspace. Let's customize your experience.
            </p>

            <button
              onClick={handleContinue}
              className="px-12 py-4 bg-white text-black hover:bg-white/90 transition-all duration-200 text-[16px] tracking-[-0.32px]"
              style={{ fontWeight: 400 }}
            >
              Get Started
            </button>
          </div>
        )}

        {/* PROFILE STEP */}
        {step === 'profile' && (
          <div className="flex flex-col items-center animate-in fade-in duration-500">
            <div className="mb-12 text-center">
              <h2 
                className="text-white text-[48px] leading-[0.85] tracking-[-2px] mb-4"
                style={{ fontWeight: 500 }}
              >
                CREATE PROFILE
              </h2>
              <p 
                className="text-white/60 text-[16px] tracking-[-0.32px] leading-[1.6]"
                style={{ fontWeight: 300 }}
              >
                Tell us about yourself
              </p>
            </div>

            {/* Avatar selection */}
            <div className="mb-8">
              <label 
                className="block text-white/80 text-[14px] tracking-[-0.28px] mb-4 text-center leading-[1.5]"
                style={{ fontWeight: 300 }}
              >
                Choose Avatar
              </label>
              <div className="flex gap-3 flex-wrap justify-center max-w-md">
                {AVATAR_OPTIONS.map((avatar) => (
                  <button
                    key={avatar}
                    onClick={() => setSelectedAvatar(avatar)}
                    className={`w-12 h-12 flex items-center justify-center text-[24px] border transition-all duration-200 ${
                      selectedAvatar === avatar 
                        ? 'border-white bg-white/10' 
                        : 'border-white/20 hover:border-white/40'
                    }`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>

            {/* Name input */}
            <div className="w-full max-w-md mb-12">
              <label 
                className="block text-white/80 text-[14px] tracking-[-0.28px] mb-3 leading-[1.5]"
                style={{ fontWeight: 300 }}
              >
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-transparent border border-white/20 text-white px-6 py-4 focus:outline-none focus:border-white/60 transition-colors text-[16px] tracking-[-0.32px] leading-[1.5]"
                style={{ fontWeight: 300 }}
                autoFocus
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep('welcome')}
                className="px-8 py-3 border border-white/20 text-white hover:border-white/40 transition-all duration-200 text-[14px] tracking-[-0.28px]"
                style={{ fontWeight: 300 }}
              >
                Back
              </button>
              <button
                onClick={handleContinue}
                disabled={!name.trim()}
                className="px-12 py-3 bg-white text-black hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 text-[14px] tracking-[-0.28px]"
                style={{ fontWeight: 400 }}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* TOOLS STEP */}
        {step === 'tools' && (
          <div className="flex flex-col items-center animate-in fade-in duration-500">
            <div className="mb-12 text-center">
              <h2 
                className="text-white text-[48px] leading-[0.85] tracking-[-2px] mb-4"
                style={{ fontWeight: 500 }}
              >
                SELECT TOOLS
              </h2>
              <p 
                className="text-white/60 text-[16px] tracking-[-0.32px] leading-[1.6]"
                style={{ fontWeight: 300 }}
              >
                Choose which creative tools to enable
              </p>
            </div>

            <div className="w-full max-w-2xl grid grid-cols-2 gap-6 mb-12">
              {/* Graphic Designer */}
              <button
                onClick={() => setEnabledTools(prev => ({ 
                  ...prev, 
                  graphicDesigner: !prev.graphicDesigner 
                }))}
                className={`relative p-8 border transition-all duration-300 group ${
                  enabledTools.graphicDesigner 
                    ? 'border-white bg-white/5' 
                    : 'border-white/20 hover:border-white/40'
                }`}
              >
                {enabledTools.graphicDesigner && (
                  <div className="absolute top-4 right-4 w-6 h-6 bg-white flex items-center justify-center">
                    <Check className="w-4 h-4 text-black" />
                  </div>
                )}
                
                <Palette className="w-12 h-12 text-white mb-6 mx-auto" strokeWidth={1} />
                
                <h3 
                  className="text-white text-[24px] tracking-[-0.48px] mb-3 leading-[1.3]"
                  style={{ fontWeight: 400 }}
                >
                  Graphic Designer
                </h3>
                
                <p 
                  className="text-white/60 text-[14px] tracking-[-0.28px] leading-[1.6]"
                  style={{ fontWeight: 300 }}
                >
                  Vector editing, brush tools, layers, and custom node-based brushes
                </p>
              </button>

              {/* Photo Editor */}
              <button
                onClick={() => setEnabledTools(prev => ({ 
                  ...prev, 
                  photoEditor: !prev.photoEditor 
                }))}
                className={`relative p-8 border transition-all duration-300 group ${
                  enabledTools.photoEditor 
                    ? 'border-white bg-white/5' 
                    : 'border-white/20 hover:border-white/40'
                }`}
              >
                {enabledTools.photoEditor && (
                  <div className="absolute top-4 right-4 w-6 h-6 bg-white flex items-center justify-center">
                    <Check className="w-4 h-4 text-black" />
                  </div>
                )}
                
                <Image className="w-12 h-12 text-white mb-6 mx-auto" strokeWidth={1} />
                
                <h3 
                  className="text-white text-[24px] tracking-[-0.48px] mb-3 leading-[1.3]"
                  style={{ fontWeight: 400 }}
                >
                  Photo Editor
                </h3>
                
                <p 
                  className="text-white/60 text-[14px] tracking-[-0.28px] leading-[1.6]"
                  style={{ fontWeight: 300 }}
                >
                  Professional photo editing with adjustments, filters, and selection tools
                </p>
              </button>
            </div>

            {!enabledTools.graphicDesigner && !enabledTools.photoEditor && (
              <p 
                className="text-white/40 text-[12px] tracking-[-0.24px] mb-6 leading-[1.5]"
                style={{ fontWeight: 300 }}
              >
                Select at least one tool to continue
              </p>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setStep('profile')}
                className="px-8 py-3 border border-white/20 text-white hover:border-white/40 transition-all duration-200 text-[14px] tracking-[-0.28px]"
                style={{ fontWeight: 300 }}
              >
                Back
              </button>
              <button
                onClick={handleContinue}
                disabled={!enabledTools.graphicDesigner && !enabledTools.photoEditor}
                className="px-12 py-3 bg-white text-black hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 text-[14px] tracking-[-0.28px]"
                style={{ fontWeight: 400 }}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* CONFIRM STEP */}
        {step === 'confirm' && (
          <div className="flex flex-col items-center animate-in fade-in duration-500">
            <div className="mb-12 text-center">
              <h2 
                className="text-white text-[48px] leading-[0.85] tracking-[-2px] mb-4"
                style={{ fontWeight: 500 }}
              >
                ALL SET
              </h2>
              <p 
                className="text-white/60 text-[16px] tracking-[-0.32px] leading-[1.6]"
                style={{ fontWeight: 300 }}
              >
                Review your setup
              </p>
            </div>

            {/* Summary card */}
            <div className="w-full max-w-md border border-white/20 p-8 mb-12">
              {/* Profile summary */}
              <div className="flex items-center gap-4 mb-8 pb-8 border-b border-white/10">
                <div className="w-16 h-16 flex items-center justify-center border border-white/20 text-[32px]">
                  {selectedAvatar}
                </div>
                <div>
                  <div 
                    className="text-white text-[20px] tracking-[-0.4px] mb-1 leading-[1.4]"
                    style={{ fontWeight: 400 }}
                  >
                    {name}
                  </div>
                  <div 
                    className="text-white/60 text-[14px] tracking-[-0.28px] leading-[1.5]"
                    style={{ fontWeight: 300 }}
                  >
                    Creative Professional
                  </div>
                </div>
              </div>

              {/* Enabled tools */}
              <div>
                <div 
                  className="text-white/80 text-[14px] tracking-[-0.28px] mb-4 leading-[1.5]"
                  style={{ fontWeight: 300 }}
                >
                  Enabled Tools
                </div>
                <div className="space-y-3">
                  {enabledTools.graphicDesigner && (
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-white" />
                      <span 
                        className="text-white text-[14px] tracking-[-0.28px] leading-[1.5]"
                        style={{ fontWeight: 300 }}
                      >
                        Graphic Designer
                      </span>
                    </div>
                  )}
                  {enabledTools.photoEditor && (
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-white" />
                      <span 
                        className="text-white text-[14px] tracking-[-0.28px] leading-[1.5]"
                        style={{ fontWeight: 300 }}
                      >
                        Photo Editor
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep('tools')}
                className="px-8 py-3 border border-white/20 text-white hover:border-white/40 transition-all duration-200 text-[14px] tracking-[-0.28px]"
                style={{ fontWeight: 300 }}
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                className="px-12 py-3 bg-white text-black hover:bg-white/90 transition-all duration-200 text-[14px] tracking-[-0.28px] flex items-center gap-2"
                style={{ fontWeight: 400 }}
              >
                <Sparkles className="w-4 h-4" />
                Start Creating
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Skip button - top right */}
      {step !== 'confirm' && (
        <button
          onClick={() => {
            onComplete({
              name: name.trim() || 'Creator',
              avatar: selectedAvatar,
              enabledTools: {
                graphicDesigner: true,
                photoEditor: true,
              },
            });
          }}
          className="absolute top-12 right-12 text-white/40 hover:text-white/80 text-[14px] tracking-[-0.28px] transition-colors leading-[1.5]"
          style={{ fontWeight: 300 }}
        >
          Skip Setup
        </button>
      )}

      {/* Version indicator */}
      <div 
        className="absolute bottom-8 right-8 text-white/20 text-[12px] tracking-[-0.24px] leading-[1.5]" 
        style={{ fontWeight: 300 }}
      >
        First Time Setup
      </div>
    </div>
  );
}