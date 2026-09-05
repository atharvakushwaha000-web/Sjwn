import React from 'react';
import { Sparkles, Check, Film } from 'lucide-react';
import { VideoQualityOption } from '../types';
import { soundService } from '../utils/audioEffects';

interface VideoQualitySectionProps {
  selectedQuality: VideoQualityOption;
  onQualityChange: (quality: VideoQualityOption) => void;
  originalResolution?: string;
  fps?: number;
  disabled?: boolean;
}

interface QualityCard {
  id: VideoQualityOption;
  title: string;
  badge: string;
  description: string;
  details: string;
}

const QUALITY_OPTIONS: QualityCard[] = [
  {
    id: 'original',
    title: 'Original Quality',
    badge: 'Recommended • Lossless',
    description: 'Exact same visual sharpness as your original file.',
    details: 'Zero quality loss • Fast stream copy • Full resolution',
  },
  {
    id: 'high',
    title: 'High Quality',
    badge: 'Pristine 1080p',
    description: 'Crisp, high-bitrate single-pass encoding.',
    details: 'CRF 18 • High bitrate • Sharp details',
  },
  {
    id: 'medium',
    title: 'Balanced Quality',
    badge: 'Smaller File Size',
    description: 'Faster processing and smaller file storage.',
    details: 'CRF 22 • Efficient size • Great for quick sharing',
  },
];

export const VideoQualitySection: React.FC<VideoQualitySectionProps> = ({
  selectedQuality,
  onQualityChange,
  originalResolution = '1080p',
  fps = 30,
  disabled = false,
}) => {
  return (
    <div
      id="section-video-quality"
      className="w-full rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm transition-all"
    >
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#ff003f] flex items-center justify-center font-bold">
          <Film className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            2. Video Quality
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Choose how your video is saved. We never downscale your video without asking.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {QUALITY_OPTIONS.map((opt) => {
          const isSelected = selectedQuality === opt.id;
          return (
            <div
              key={opt.id}
              id={`quality-card-${opt.id}`}
              onClick={() => {
                if (disabled) return;
                soundService.triggerButtonHaptic();
                onQualityChange(opt.id);
              }}
              className={`relative cursor-pointer rounded-xl border p-4 transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-[#ff003f] bg-rose-50/40 ring-2 ring-rose-200 shadow-sm'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-bold text-slate-900">{opt.title}</span>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-[#ff003f] text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>

                <span
                  className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 ${
                    isSelected ? 'bg-[#ff003f] text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {opt.badge}
                </span>

                <p className="text-xs text-slate-600 mb-2 leading-relaxed">
                  {opt.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 font-medium">
                {opt.id === 'original' ? `Source: ${originalResolution} @ ${fps} fps` : opt.details}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center space-x-2 text-xs text-slate-600">
        <Sparkles className="w-4 h-4 text-[#ff003f] shrink-0" />
        <span>
          <strong>Quality Guarantee:</strong> Original frame rate ({fps} fps) and aspect ratio are strictly maintained.
        </span>
      </div>
    </div>
  );
};
