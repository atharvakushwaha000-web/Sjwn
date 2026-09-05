import React from 'react';
import { Wand2, MicOff } from 'lucide-react';
import { soundService } from '../utils/audioEffects';

interface AutoEditSectionProps {
  autoEditSilenceCut: boolean;
  onSilenceCutChange: (enabled: boolean) => void;
  silenceThresholdDb: number;
  onThresholdChange: (db: number) => void;
  minSilenceDurationSec: number;
  onDurationChange: (sec: number) => void;
  disabled?: boolean;
}

const SILENCE_PRESETS = [
  { label: 'Gentle', duration: 1.0, hint: 'Pauses > 1.0s' },
  { label: 'Standard', duration: 0.5, hint: 'Pauses > 0.5s' },
  { label: 'Fast-Paced', duration: 0.3, hint: 'Pauses > 0.3s' },
];

export const AutoEditSection: React.FC<AutoEditSectionProps> = ({
  autoEditSilenceCut,
  onSilenceCutChange,
  silenceThresholdDb,
  onThresholdChange,
  minSilenceDurationSec,
  onDurationChange,
  disabled = false,
}) => {
  return (
    <div
      id="section-auto-edit"
      className="w-full rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm transition-all"
    >
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#ff003f] flex items-center justify-center font-bold">
          <Wand2 className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            5. Auto Edit
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Smart automatic editing to remove dead air and silent pauses.
          </p>
        </div>
      </div>

      <div
        id="card-auto-silence-cut"
        className={`p-4 rounded-xl border transition-all ${
          autoEditSilenceCut
            ? 'border-[#ff003f] bg-rose-50/40 ring-1 ring-rose-200'
            : 'border-slate-200 bg-slate-50'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start space-x-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                autoEditSilenceCut
                  ? 'bg-[#ff003f] text-white shadow-sm'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              <MicOff className="w-4 h-4" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Remove Silent Parts
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Automatically cuts out silent pauses in your video so your content stays snappy and engaging.
              </p>
            </div>
          </div>

          <button
            id="toggle-silence-cut"
            type="button"
            role="switch"
            aria-checked={autoEditSilenceCut}
            disabled={disabled}
            onClick={() => {
              soundService.triggerButtonHaptic();
              onSilenceCutChange(!autoEditSilenceCut);
            }}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              autoEditSilenceCut ? 'bg-[#ff003f]' : 'bg-slate-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                autoEditSilenceCut ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Sensitivity settings when ON */}
        {autoEditSilenceCut && (
          <div className="mt-4 pt-4 border-t border-slate-200/80 space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                How much silence should be removed?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {SILENCE_PRESETS.map((p) => {
                  const isSelected = Math.abs(minSilenceDurationSec - p.duration) < 0.05;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        soundService.triggerButtonHaptic();
                        onDurationChange(p.duration);
                      }}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        isSelected
                          ? 'border-[#ff003f] bg-white text-[#ff003f] font-bold shadow-sm ring-1 ring-rose-200'
                          : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-medium'
                      }`}
                    >
                      <div className="text-xs">{p.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{p.hint}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span>Silence Detection Level</span>
                <span className="font-mono text-slate-900 font-bold">{silenceThresholdDb} dB</span>
              </div>
              <input
                id="silence-threshold-slider"
                type="range"
                min={-50}
                max={-20}
                step={1}
                value={silenceThresholdDb}
                disabled={disabled}
                onChange={(e) => onThresholdChange(parseInt(e.target.value, 10))}
                className="w-full accent-[#ff003f] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-medium">
                <span>Quiet rooms (-45 dB)</span>
                <span>Normal speech (-35 dB)</span>
                <span>Noisy environments (-25 dB)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
