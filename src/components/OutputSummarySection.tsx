import React from 'react';
import { Play, Zap, ShieldCheck, Film, Volume2, Music } from 'lucide-react';
import { SplitConfig, VideoMetadata } from '../types';
import { formatSecondsToTime } from '../utils/formatters';
import { soundService } from '../utils/audioEffects';

interface OutputSummarySectionProps {
  video: VideoMetadata;
  config: SplitConfig;
  onStartProcessing: () => void;
  disabled?: boolean;
}

export const OutputSummarySection: React.FC<OutputSummarySectionProps> = ({
  video,
  config,
  onStartProcessing,
  disabled = false,
}) => {
  const totalEpisodes = Math.ceil(video.duration / Math.max(1, config.intervalSeconds));

  const isModeB =
    config.autoVideoNoiseReduction ||
    config.autoAudioNoiseReduction ||
    config.autoEditSilenceCut ||
    config.backgroundMusic.enabled ||
    config.originalAudioVolume !== 1.0 ||
    config.videoQuality !== 'original';

  return (
    <div
      id="section-output-summary"
      className="w-full rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm transition-all"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            7. Ready to Process
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Review your export settings before generating episodes.
          </p>
        </div>

        {/* Processing Mode Indicator */}
        <span
          className={`inline-flex items-center space-x-1 text-xs font-bold px-3 py-1 rounded-full ${
            isModeB
              ? 'bg-rose-100 text-[#ff003f] border border-rose-200'
              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>{isModeB ? 'Mode B: Single-Pass Quality' : 'Mode A: Fast Stream Copy'}</span>
        </span>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Episodes
          </span>
          <span className="text-xl font-bold text-slate-900 block mt-0.5">
            {totalEpisodes}
          </span>
          <span className="text-[10px] text-slate-500">
            {config.intervalSeconds}s each
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Duration
          </span>
          <span className="text-xl font-bold text-slate-900 block mt-0.5">
            {formatSecondsToTime(video.duration)}
          </span>
          <span className="text-[10px] text-slate-500">
            Total Length
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Resolution
          </span>
          <span className="text-xl font-bold text-slate-900 block mt-0.5">
            {config.videoQuality === 'original' ? `${video.width}p` : config.videoQuality === 'high' ? '1080p' : '720p'}
          </span>
          <span className="text-[10px] text-slate-500">
            {video.fps || 30} FPS
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Audio Status
          </span>
          <span className="text-sm font-bold text-emerald-600 block mt-1">
            {video.hasAudio ? 'Preserved' : 'No Audio'}
          </span>
          <span className="text-[10px] text-slate-500">
            {config.backgroundMusic.enabled ? '+ Bg Music' : 'Original Track'}
          </span>
        </div>
      </div>

      {/* Safety Badge */}
      <div className="mb-6 p-3 rounded-xl bg-rose-50/60 border border-rose-100 flex items-center space-x-2.5 text-xs text-slate-700">
        <ShieldCheck className="w-5 h-5 text-[#ff003f] shrink-0" />
        <span>
          <strong>Audio Guarantee:</strong> Output episodes are strictly validated to ensure speech and audio are never lost.
        </span>
      </div>

      {/* Primary Action Button: Neon Red, Large, Centered */}
      <button
        id="start-processing-button"
        type="button"
        disabled={disabled}
        onClick={() => {
          soundService.triggerButtonHaptic();
          soundService.playProcessingStarted();
          onStartProcessing();
        }}
        className="w-full py-4 px-6 rounded-xl bg-[#ff003f] hover:bg-[#e00037] active:bg-[#c50030] text-white font-bold text-base sm:text-lg shadow-lg shadow-rose-500/25 transition-all flex items-center justify-center space-x-3 group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Play className="w-5 h-5 fill-white" />
        <span>START PROCESSING</span>
        <span className="text-xs font-normal opacity-90 hidden sm:inline">
          (Generate {totalEpisodes} Episodes)
        </span>
      </button>
    </div>
  );
};
