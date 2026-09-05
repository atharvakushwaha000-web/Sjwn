import React from 'react';
import { Scissors, Loader2 } from 'lucide-react';
import { soundService } from '../utils/audioEffects';

interface ActionButtonProps {
  onSplitVideo: () => void;
  isProcessing: boolean;
  disabled: boolean;
  episodesCount: number;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  onSplitVideo,
  isProcessing,
  disabled,
  episodesCount,
}) => {
  const handleClick = () => {
    if (disabled || isProcessing) return;
    soundService.triggerButtonHaptic();
    onSplitVideo();
  };

  return (
    <div className="w-full pt-2">
      <button
        id="split-video-main-button"
        type="button"
        onClick={handleClick}
        disabled={disabled || isProcessing}
        className={`relative w-full py-4 sm:py-4.5 px-8 rounded-2xl font-extrabold text-base sm:text-lg flex items-center justify-center space-x-3 transition-all duration-200 select-none shadow-md ${
          disabled || isProcessing
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none'
            : 'bg-[#ff003f] hover:bg-[#e00037] active:bg-[#c50030] text-white active:scale-[0.99] shadow-rose-500/25 hover:shadow-rose-500/35 border border-[#ff003f]'
        }`}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin text-white" />
            <span>Processing...</span>
          </>
        ) : (
          <>
            <Scissors className="w-5 h-5 text-white" />
            <span>
              {episodesCount > 0 ? `Split Video into ${episodesCount} Episodes` : 'Split Video'}
            </span>
          </>
        )}
      </button>
    </div>
  );
};
