import React from 'react';
import { Volume2, VolumeX, Code2, ShieldCheck, Scissors } from 'lucide-react';
import { soundService } from '../utils/audioEffects';

interface HeaderProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenAndroidCode: () => void;
  onOpenPrivacyPolicy: () => void;
  onNavigateHome?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  soundEnabled,
  onToggleSound,
  onOpenAndroidCode,
  onOpenPrivacyPolicy,
  onNavigateHome,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 sm:px-8 py-3.5">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* App Logo and Titles */}
        <div
          onClick={onNavigateHome}
          className="flex items-center space-x-3.5 cursor-pointer select-none group"
        >
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-[#ff003f] shadow-md shadow-rose-500/20 text-white group-hover:scale-105 transition-transform">
            <Scissors className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                Video Tools
              </h1>
              <span className="hidden xs:inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#ff003f] bg-rose-50 border border-rose-200 rounded-full">
                Android Native
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Simple tools to edit, cut and adjust your videos
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-2.5">
          {/* Sound Toggle */}
          <button
            id="sound-toggle-button"
            type="button"
            onClick={() => {
              soundService.triggerButtonHaptic();
              onToggleSound();
            }}
            title={soundEnabled ? 'Sound Effects: ON' : 'Sound Effects: OFF'}
            className={`p-2 sm:px-2.5 sm:py-2 rounded-xl border text-xs font-semibold transition-all flex items-center space-x-1.5 ${
              soundEnabled
                ? 'bg-rose-50 border-rose-200 text-[#ff003f] hover:bg-rose-100'
                : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden md:inline">{soundEnabled ? 'Sound ON' : 'Sound OFF'}</span>
          </button>

          {/* Android Studio Code Explorer */}
          <button
            id="android-code-button"
            type="button"
            onClick={() => {
              soundService.triggerButtonHaptic();
              onOpenAndroidCode();
            }}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-semibold transition-all"
          >
            <Code2 className="w-4 h-4 text-[#ff003f]" />
            <span className="hidden sm:inline">Android Code (.ZIP)</span>
            <span className="sm:hidden">Code</span>
          </button>

          {/* Privacy & Play Store Checklist */}
          <button
            id="privacy-policy-button"
            type="button"
            onClick={() => {
              soundService.triggerButtonHaptic();
              onOpenPrivacyPolicy();
            }}
            className="p-2 sm:px-2.5 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition-all flex items-center space-x-1.5"
            title="Privacy Policy & Play Store Checklist"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="hidden lg:inline">Play Store Ready</span>
          </button>
        </div>
      </div>
    </header>
  );
};
