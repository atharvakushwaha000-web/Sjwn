import React from 'react';
import { Mic, ShieldCheck, Video, Sliders } from 'lucide-react';
import { soundService } from '../utils/audioEffects';

interface NoiseReductionSectionProps {
  autoAudioNoiseReduction: boolean;
  onAudioNoiseReductionChange: (enabled: boolean) => void;
  autoVideoNoiseReduction: boolean;
  onVideoNoiseReductionChange: (enabled: boolean) => void;
  disabled?: boolean;
}

export const NoiseReductionSection: React.FC<NoiseReductionSectionProps> = ({
  autoAudioNoiseReduction,
  onAudioNoiseReductionChange,
  autoVideoNoiseReduction,
  onVideoNoiseReductionChange,
  disabled = false,
}) => {
  return (
    <div
      id="section-noise-reduction"
      className="w-full rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm transition-all"
    >
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#ff003f] flex items-center justify-center font-bold">
          <Sliders className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            4. Noise Reduction
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Clean up audio hiss, background fans, and camera grain.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {/* 1. Audio Noise Reduction Card */}
        <div
          id="card-audio-noise-reduction"
          className={`p-4 rounded-xl border transition-all ${
            autoAudioNoiseReduction
              ? 'border-[#ff003f] bg-rose-50/40 ring-1 ring-rose-200'
              : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  autoAudioNoiseReduction
                    ? 'bg-[#ff003f] text-white shadow-sm'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                <Mic className="w-4 h-4" />
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    Remove Background Noise
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Audio Safe</span>
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Reduces fan, hiss and unwanted background sounds while keeping your original audio.
                </p>

                <div className="mt-2 text-[11px] text-slate-500 font-medium">
                  Speech, music, and voice sync are strictly preserved.
                </div>
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              id="toggle-audio-noise-reduction"
              type="button"
              role="switch"
              aria-checked={autoAudioNoiseReduction}
              disabled={disabled}
              onClick={() => {
                soundService.triggerButtonHaptic();
                onAudioNoiseReductionChange(!autoAudioNoiseReduction);
              }}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                autoAudioNoiseReduction ? 'bg-[#ff003f]' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  autoAudioNoiseReduction ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* 2. Video Noise Reduction Card */}
        <div
          id="card-video-noise-reduction"
          className={`p-4 rounded-xl border transition-all ${
            autoVideoNoiseReduction
              ? 'border-[#ff003f] bg-rose-50/40 ring-1 ring-rose-200'
              : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  autoVideoNoiseReduction
                    ? 'bg-[#ff003f] text-white shadow-sm'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                <Video className="w-4 h-4" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Video Clean Up
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Reduces visual grain and digital noise in low-light videos without softening sharp edges.
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              id="toggle-video-noise-reduction"
              type="button"
              role="switch"
              aria-checked={autoVideoNoiseReduction}
              disabled={disabled}
              onClick={() => {
                soundService.triggerButtonHaptic();
                onVideoNoiseReductionChange(!autoVideoNoiseReduction);
              }}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                autoVideoNoiseReduction ? 'bg-[#ff003f]' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  autoVideoNoiseReduction ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
