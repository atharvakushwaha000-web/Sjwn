import React from 'react';
import { Volume2, VolumeX, CheckCircle, AlertCircle } from 'lucide-react';
import { soundService } from '../utils/audioEffects';

interface AudioSettingsSectionProps {
  hasAudio: boolean;
  originalAudioVolume: number; // 0 to 1
  onVolumeChange: (volume: number) => void;
  disabled?: boolean;
}

export const AudioSettingsSection: React.FC<AudioSettingsSectionProps> = ({
  hasAudio,
  originalAudioVolume,
  onVolumeChange,
  disabled = false,
}) => {
  const volumePercent = Math.round(originalAudioVolume * 100);

  // Generate visual bar representation: [██████████] 100%
  const totalBlocks = 10;
  const filledBlocks = Math.round((volumePercent / 100) * totalBlocks);
  const visualBar = '█'.repeat(filledBlocks) + '░'.repeat(totalBlocks - filledBlocks);

  return (
    <div
      id="section-audio-settings"
      className="w-full rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm transition-all"
    >
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#ff003f] flex items-center justify-center font-bold">
          <Volume2 className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            3. Audio Settings
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Control the voice and sound level of your video.
          </p>
        </div>
      </div>

      {/* Audio Status Banner */}
      <div
        className={`p-3 rounded-xl border flex items-center justify-between mb-4 ${
          hasAudio
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
            : 'bg-amber-50/70 border-amber-200 text-amber-900'
        }`}
      >
        <div className="flex items-center space-x-2 text-xs font-semibold">
          {hasAudio ? (
            <>
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Audio track detected in your video (will be 100% preserved)</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Source video contains no audio track</span>
            </>
          )}
        </div>
        <span
          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
            hasAudio ? 'bg-emerald-200/80 text-emerald-800' : 'bg-amber-200/80 text-amber-800'
          }`}
        >
          {hasAudio ? 'Active Audio' : 'Muted Video'}
        </span>
      </div>

      {hasAudio && (
        <div className="space-y-4">
          {/* Volume Slider */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="original-audio-volume-slider"
                className="text-xs font-bold text-slate-800 flex items-center space-x-1.5"
              >
                {volumePercent === 0 ? (
                  <VolumeX className="w-4 h-4 text-slate-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-[#ff003f]" />
                )}
                <span>Original Video Voice Volume</span>
              </label>
              <span className="font-mono text-xs font-bold text-slate-900 px-2 py-0.5 rounded bg-white border border-slate-200">
                {volumePercent}%
              </span>
            </div>

            <input
              id="original-audio-volume-slider"
              type="range"
              min={0}
              max={100}
              step={5}
              value={volumePercent}
              disabled={disabled}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10) / 100;
                onVolumeChange(val);
              }}
              className="w-full accent-[#ff003f] cursor-pointer"
            />

            {/* Beginner visual balance display */}
            <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-slate-500 bg-white p-2 rounded-lg border border-slate-200/80">
              <span className="font-semibold text-slate-700">Original Audio:</span>
              <span className="text-[#ff003f] tracking-widest font-bold">[{visualBar}]</span>
              <span className="font-bold text-slate-800">{volumePercent}%</span>
            </div>

            <p className="text-[11px] text-slate-500 mt-2">
              Controls the loudness of the speaker or video soundtrack. 100% is full original volume.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
