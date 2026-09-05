import React from 'react';
import { Sliders, AlertCircle, Sparkles, Volume2, Video, Scissors } from 'lucide-react';
import { soundService } from '../utils/audioEffects';

interface SplitSettingsProps {
  intervalSeconds: number;
  intervalInput: string;
  videoDuration: number;
  onIntervalChange: (value: string) => void;
  disabled?: boolean;
  videoNoiseReduction?: boolean;
  onToggleVideoNoiseReduction?: () => void;
  audioNoiseReduction?: boolean;
  onToggleAudioNoiseReduction?: () => void;
  silenceCut?: boolean;
  onToggleSilenceCut?: () => void;
}

export const SplitSettings: React.FC<SplitSettingsProps> = ({
  intervalSeconds,
  intervalInput,
  videoDuration,
  onIntervalChange,
  disabled = false,
  videoNoiseReduction = false,
  onToggleVideoNoiseReduction,
  audioNoiseReduction = false,
  onToggleAudioNoiseReduction,
  silenceCut = false,
  onToggleSilenceCut,
}) => {
  const presets = [1, 5, 10, 15, 20, 30, 60];

  // Validation logic
  const numVal = parseInt(intervalInput, 10);
  const isEmpty = intervalInput.trim() === '';
  const isZeroOrNegative = !isEmpty && (isNaN(numVal) || numVal <= 0);
  const isExceedingDuration = videoDuration > 0 && numVal > videoDuration;

  let validationError: string | null = null;
  if (isEmpty) {
    validationError = 'Please enter a split duration.';
  } else if (isZeroOrNegative) {
    validationError = 'Interval must be greater than 0 seconds.';
  } else if (isExceedingDuration) {
    validationError = `Interval cannot exceed video duration (${Math.floor(videoDuration)}s).`;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const cleaned = raw.replace(/[^\d]/g, '');
    onIntervalChange(cleaned);
  };

  const handlePresetClick = (sec: number) => {
    soundService.triggerButtonHaptic();
    onIntervalChange(sec.toString());
  };

  return (
    <div
      id="split-settings-card"
      className="w-full rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-5"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-[#ff003f]" />
          <span>Split every</span>
        </h2>
        <span className="text-xs font-semibold text-slate-500">
          Duration per episode
        </span>
      </div>

      {/* Large numeric input + unit selector */}
      <div className="flex items-center space-x-3">
        <div className="relative flex-1">
          <input
            id="split-interval-input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={intervalInput}
            onChange={handleInputChange}
            disabled={disabled}
            placeholder="10"
            className={`w-full px-4 py-3 sm:py-3.5 rounded-xl bg-slate-50 border text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 focus:outline-none transition-all ${
              validationError
                ? 'border-red-400 focus:border-red-500'
                : 'border-slate-200 focus:border-[#ff003f] focus:ring-2 focus:ring-[#ff003f]/20'
            }`}
          />
        </div>

        {/* Unit Selector: "Seconds" */}
        <div className="px-5 py-3.5 sm:py-4 rounded-xl bg-slate-50 border border-slate-200 text-sm sm:text-base font-bold text-slate-700 select-none">
          Seconds
        </div>
      </div>

      {/* Validation Message */}
      {validationError && (
        <div className="flex items-center space-x-2 text-xs font-semibold text-[#ff003f] bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Preset Chips */}
      <div>
        <span className="block text-xs text-slate-500 font-medium mb-2">
          Quick intervals:
        </span>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {presets.map((sec) => {
            const isSelected = intervalInput === sec.toString();
            return (
              <button
                key={sec}
                type="button"
                onClick={() => handlePresetClick(sec)}
                disabled={disabled}
                className={`py-2 rounded-lg text-xs font-bold font-mono transition-all border ${
                  isSelected
                    ? 'bg-[#ff003f] text-white border-[#ff003f] shadow-sm shadow-[#ff003f]/30'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                {sec}s
              </button>
            );
          })}
        </div>
      </div>

      {/* Advanced Audio/Video Controls */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#ff003f]" />
          <span>Audio & Video Enhancements</span>
        </h3>

        {/* Video Noise Reduction */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex items-center space-x-3">
            <Video className="w-4 h-4 text-slate-600" />
            <div>
              <div className="text-xs font-bold text-slate-900">Auto Video Noise Reduction</div>
              <div className="text-[11px] text-slate-500">Applies spatial-temporal video denoising (hqdn3d)</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleVideoNoiseReduction}
            className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
              videoNoiseReduction ? 'bg-[#ff003f]' : 'bg-slate-300'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                videoNoiseReduction ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {videoNoiseReduction && (
          <div className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
            ⚠ Warning: Video denoising may increase processing time.
          </div>
        )}

        {/* Audio Noise Reduction */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex items-center space-x-3">
            <Volume2 className="w-4 h-4 text-slate-600" />
            <div>
              <div className="text-xs font-bold text-slate-900">Auto Audio Noise Reduction</div>
              <div className="text-[11px] text-slate-500">Suppresses background hum and hiss (afftdn)</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleAudioNoiseReduction}
            className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
              audioNoiseReduction ? 'bg-[#ff003f]' : 'bg-slate-300'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                audioNoiseReduction ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Silence Cut */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex items-center space-x-3">
            <Scissors className="w-4 h-4 text-slate-600" />
            <div>
              <div className="text-xs font-bold text-slate-900">Auto Edit — Silence Cut Only</div>
              <div className="text-[11px] text-slate-500">Detects and trims silent gaps (-35 dB, 0.5s)</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleSilenceCut}
            className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
              silenceCut ? 'bg-[#ff003f]' : 'bg-slate-300'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                silenceCut ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
