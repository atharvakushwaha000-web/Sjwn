import React from 'react';
import { Scissors, Clock } from 'lucide-react';
import { soundService } from '../utils/audioEffects';

interface VideoSplittingSectionProps {
  intervalSeconds: number;
  totalDuration: number;
  onIntervalChange: (seconds: number) => void;
  disabled?: boolean;
}

const PRESET_INTERVALS = [
  { label: '5s', value: 5, hint: 'Shorts / Stories' },
  { label: '10s', value: 10, hint: 'Standard Episodes' },
  { label: '15s', value: 15, hint: 'Reels / TikTok' },
  { label: '30s', value: 30, hint: 'Status / Clip' },
  { label: '60s', value: 60, hint: '1 Minute Parts' },
];

export const VideoSplittingSection: React.FC<VideoSplittingSectionProps> = ({
  intervalSeconds,
  totalDuration,
  onIntervalChange,
  disabled = false,
}) => {
  const calculatedEpisodes = totalDuration > 0 ? Math.ceil(totalDuration / Math.max(1, intervalSeconds)) : 0;

  return (
    <div
      id="section-video-splitting"
      className="w-full rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm transition-all"
    >
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#ff003f] flex items-center justify-center font-bold">
          <Scissors className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            1. Video Splitting
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Cut your video into equal-length episodes for social media and series.
          </p>
        </div>
      </div>

      {/* Preset Chips */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
          Episode Duration
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {PRESET_INTERVALS.map((preset) => {
            const isSelected = intervalSeconds === preset.value;
            return (
              <button
                key={preset.value}
                id={`split-preset-${preset.value}s`}
                type="button"
                disabled={disabled}
                onClick={() => {
                  soundService.triggerButtonHaptic();
                  onIntervalChange(preset.value);
                }}
                className={`flex flex-col items-center justify-center h-16 rounded-xl border font-medium text-xs transition-all ${
                  isSelected
                    ? 'border-[#ff003f] bg-rose-50 text-[#ff003f] shadow-sm font-bold ring-2 ring-rose-200'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <span className="text-sm font-bold">{preset.label}</span>
                <span className="text-[10px] text-slate-400 mt-0.5">{preset.hint}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Duration Input */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 gap-3">
        <div className="flex items-center space-x-2 text-xs font-medium text-slate-700">
          <Clock className="w-4 h-4 text-[#ff003f]" />
          <span>Custom length in seconds:</span>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <input
            id="custom-interval-input"
            type="number"
            min={1}
            max={3600}
            value={intervalSeconds}
            disabled={disabled}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val) && val > 0) onIntervalChange(val);
            }}
            className="w-24 px-3 py-2 text-center text-sm font-bold bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ff003f] focus:border-transparent"
          />
          <span className="text-xs text-slate-500 font-semibold">seconds per episode</span>
        </div>
      </div>

      {totalDuration > 0 && (
        <div className="mt-3 text-xs text-slate-600 flex items-center justify-between font-medium">
          <span>This video will be split into:</span>
          <span className="font-bold text-[#ff003f] text-sm">
            {calculatedEpisodes} {calculatedEpisodes === 1 ? 'Episode' : 'Episodes'}
          </span>
        </div>
      )}
    </div>
  );
};
