import React, { useState } from 'react';
import { Film, X, AlertTriangle } from 'lucide-react';
import { ProcessingProgress, VideoMetadata } from '../types';
import { formatSecondsToTime } from '../utils/formatters';
import { soundService } from '../utils/audioEffects';

interface ProcessingViewProps {
  video?: VideoMetadata | null;
  progress: ProcessingProgress;
  onCancelConfirmed?: () => void;
  onCancel?: () => void;
  soundEnabled?: boolean;
}

export const ProcessingView: React.FC<ProcessingViewProps> = ({
  video,
  progress,
  onCancelConfirmed,
  onCancel,
}) => {
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Time calculations
  const curSec = Math.round(progress.currentEpisodeElapsedSec ?? 0);
  const totalEpSec = Math.round(
    progress.currentEpisodeTotalSec ??
      Math.max(1, progress.currentSegmentEnd - progress.currentSegmentStart)
  );
  const overallCur = Math.round(
    progress.overallCurrentSeconds ??
      (progress.currentEpisode - 1) * totalEpSec + curSec
  );
  const overallTot = Math.round(
    progress.overallTotalSeconds ?? video?.duration ?? 0
  );

  const handleCancelClick = () => {
    soundService.triggerButtonHaptic();
    setShowCancelModal(true);
  };

  const handleConfirmCancel = () => {
    soundService.triggerButtonHaptic();
    setShowCancelModal(false);
    if (onCancelConfirmed) {
      onCancelConfirmed();
    } else if (onCancel) {
      onCancel();
    }
  };

  const handleDismissCancel = () => {
    soundService.triggerButtonHaptic();
    setShowCancelModal(false);
  };

  return (
    <div
      id="dedicated-processing-screen"
      className="w-full flex flex-col items-center justify-center py-6 px-4"
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-lg relative overflow-hidden">
        {/* Video Thumbnail */}
        <div className="relative w-full h-44 sm:h-52 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 mb-6 shadow-sm">
          {video?.thumbnailUrl ? (
            <img
              src={video.thumbnailUrl}
              alt={video.name || 'Video'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <Film className="w-12 h-12" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white font-medium">
            <span className="truncate max-w-[220px]">{video?.name || 'Processing Video'}</span>
            {video?.duration ? (
              <span className="font-mono bg-black/60 px-2 py-0.5 rounded text-white">
                {formatSecondsToTime(video.duration)}
              </span>
            ) : null}
          </div>
        </div>

        {/* Status Header */}
        <div className="text-center mb-6">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-1">
            Processing Your Video
          </h2>
          <div className="text-sm font-semibold text-[#ff003f] mt-1">
            {progress.currentTask || `Creating Episode ${progress.currentEpisode}`}
          </div>
          <div className="text-base sm:text-lg font-bold text-slate-800 mt-0.5">
            Episode: {progress.currentEpisode} / {progress.totalEpisodes}
          </div>
        </div>

        {/* Current & Overall Counters */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-center space-y-1.5 font-mono">
          <div className="text-sm sm:text-base font-bold text-slate-900">
            Current: {formatSecondsToTime(curSec)} / {formatSecondsToTime(totalEpSec)}
          </div>
          <div className="text-xs sm:text-sm font-semibold text-slate-500">
            Overall: {formatSecondsToTime(overallCur)} / {formatSecondsToTime(overallTot)}
          </div>
        </div>

        {/* Progress Bar & Percentage */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs font-bold font-mono mb-2">
            <span className="text-slate-700">Progress</span>
            <span className="text-[#ff003f] text-sm">{progress.percent}%</span>
          </div>

          <div className="relative w-full h-3.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <div
              className="h-full bg-[#ff003f] rounded-full transition-all duration-300 shadow-sm"
              style={{ width: `${Math.min(100, Math.max(0, progress.percent))}%` }}
            />
          </div>

          {/* Time Remaining */}
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2.5 font-mono">
            <span>
              {progress.estimatedRemainingSeconds !== null
                ? `Est. remaining: ${
                    progress.estimatedRemainingSeconds > 60
                      ? `${Math.floor(progress.estimatedRemainingSeconds / 60)}m ${
                          progress.estimatedRemainingSeconds % 60
                        }s`
                      : `${progress.estimatedRemainingSeconds}s`
                  }`
                : 'Estimating time...'}
            </span>
            <span className="text-slate-400 font-sans">{progress.speed}</span>
          </div>
        </div>

        {/* Cancel Button */}
        <div className="pt-2 flex justify-center">
          <button
            id="cancel-processing-button"
            type="button"
            onClick={handleCancelClick}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl border border-rose-200 text-[#ff003f] hover:bg-rose-50 text-xs font-bold transition-all"
          >
            <X className="w-4 h-4" />
            <span>Cancel Processing</span>
          </button>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div
          id="cancel-confirmation-dialog"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#ff003f] mb-4 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900 text-center mb-2">
              Cancel video processing?
            </h3>
            <p className="text-xs text-slate-500 text-center mb-6 leading-relaxed">
              Are you sure you want to stop? Completed episodes up to this point will be saved.
            </p>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleDismissCancel}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all"
              >
                Keep Processing
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="flex-1 py-2.5 rounded-xl bg-[#ff003f] hover:bg-[#e00037] text-white text-xs font-bold shadow-md shadow-rose-500/20 transition-all"
              >
                Cancel Processing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
