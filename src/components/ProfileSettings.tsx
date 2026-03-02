import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { UserProfile } from './Onboarding';

interface ProfileSettingsProps {
  userProfile: UserProfile;
  onSave: (profile: UserProfile) => void;
  onClose: () => void;
}

const AVATAR_OPTIONS = [
  '👤', '🎨', '✨', '🚀', '💎', '🌙', '⚡', '🔥', '💫', '🎯'
];

export function ProfileSettings({ userProfile, onSave, onClose }: ProfileSettingsProps) {
  const [name, setName] = useState(userProfile.name);
  const [selectedAvatar, setSelectedAvatar] = useState(userProfile.avatar || AVATAR_OPTIONS[0]);
  const [enabledTools, setEnabledTools] = useState(userProfile.enabledTools);

  const handleSave = () => {
    if (!name.trim()) return;
    if (!enabledTools.graphicDesigner && !enabledTools.photoEditor) return;
    
    onSave({
      name: name.trim(),
      avatar: selectedAvatar,
      enabledTools,
    });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="w-full max-w-2xl bg-black border border-white/20 p-8 relative animate-in fade-in duration-300">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="mb-8">
          <h2 
            className="text-white text-[36px] leading-[0.85] tracking-[-1.5px] mb-3"
            style={{ fontWeight: 500 }}
          >
            PROFILE SETTINGS
          </h2>
          <p 
            className="text-white/60 text-[14px] tracking-[-0.28px] leading-[1.6]"
            style={{ fontWeight: 300 }}
          >
            Customize your SOMA experience
          </p>
        </div>

        {/* Avatar selection */}
        <div className="mb-8">
          <label 
            className="block text-white/80 text-[14px] tracking-[-0.28px] mb-4 leading-[1.5]"
            style={{ fontWeight: 300 }}
          >
            Avatar
          </label>
          <div className="flex gap-3 flex-wrap">
            {AVATAR_OPTIONS.map((avatar) => (
              <button
                key={avatar}
                onClick={() => setSelectedAvatar(avatar)}
                className={`w-14 h-14 flex items-center justify-center text-[28px] border transition-all duration-200 ${
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
        <div className="mb-8">
          <label 
            className="block text-white/80 text-[14px] tracking-[-0.28px] mb-3 leading-[1.5]"
            style={{ fontWeight: 300 }}
          >
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="w-full bg-transparent border border-white/20 text-white px-6 py-4 focus:outline-none focus:border-white/60 transition-colors text-[16px] tracking-[-0.32px] leading-[1.5]"
            style={{ fontWeight: 300 }}
          />
        </div>

        {/* Tool selection */}
        <div className="mb-8">
          <label 
            className="block text-white/80 text-[14px] tracking-[-0.28px] mb-4 leading-[1.5]"
            style={{ fontWeight: 300 }}
          >
            Enabled Tools
          </label>
          <div className="space-y-3">
            <button
              onClick={() => setEnabledTools(prev => ({ 
                ...prev, 
                graphicDesigner: !prev.graphicDesigner 
              }))}
              className={`w-full flex items-center justify-between p-4 border transition-all duration-200 ${
                enabledTools.graphicDesigner 
                  ? 'border-white bg-white/5' 
                  : 'border-white/20 hover:border-white/40'
              }`}
            >
              <span 
                className="text-white text-[16px] tracking-[-0.32px] leading-[1.5]"
                style={{ fontWeight: 300 }}
              >
                Graphic Designer
              </span>
              {enabledTools.graphicDesigner && (
                <Check className="w-5 h-5 text-white" />
              )}
            </button>

            <button
              onClick={() => setEnabledTools(prev => ({ 
                ...prev, 
                photoEditor: !prev.photoEditor 
              }))}
              className={`w-full flex items-center justify-between p-4 border transition-all duration-200 ${
                enabledTools.photoEditor 
                  ? 'border-white bg-white/5' 
                  : 'border-white/20 hover:border-white/40'
              }`}
            >
              <span 
                className="text-white text-[16px] tracking-[-0.32px] leading-[1.5]"
                style={{ fontWeight: 300 }}
              >
                Photo Editor
              </span>
              {enabledTools.photoEditor && (
                <Check className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
          
          {!enabledTools.graphicDesigner && !enabledTools.photoEditor && (
            <p 
              className="text-white/40 text-[12px] tracking-[-0.24px] mt-3 leading-[1.5]"
              style={{ fontWeight: 300 }}
            >
              Select at least one tool
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-end">
          <button
            onClick={onClose}
            className="px-8 py-3 border border-white/20 text-white hover:border-white/40 transition-all duration-200 text-[14px] tracking-[-0.28px]"
            style={{ fontWeight: 300 }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || (!enabledTools.graphicDesigner && !enabledTools.photoEditor)}
            className="px-12 py-3 bg-white text-black hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 text-[14px] tracking-[-0.28px]"
            style={{ fontWeight: 400 }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}