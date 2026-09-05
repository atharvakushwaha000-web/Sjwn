import React from 'react';
import { formatSecondsToTime } from '../utils/formatters';

interface OutputPreviewProps {
  durationSeconds: number;
  intervalSeconds: number;
}

export const OutputPreview: React.FC<OutputPreviewProps> = ({
  durationSeconds,
  intervalSeconds,
}) => {
  const episodesCount =
    intervalSeconds > 0 && durationSeconds > 0
      ? Math.ceil(durationSeconds / intervalSeconds)
      : 0;

  const hasRemainingFinalSegment =
    durationSeconds > 0 &&
    intervalSeconds > 0 &&
    durationSeconds % intervalSeconds !== 0;

  const finalSegmentSeconds =
    hasRemainingFinalSegment && durationSeconds > 0 && intervalSeconds > 0
      ? (durationSeconds % intervalSeconds).toFixed(0)
      : null;

  return (
    <div
      id="output-preview-card"
      className="w-full rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm"
    >
      <div className="grid grid-cols-3 divide-x divide-slate-100 text-center">
        {/* Video Duration */}
        <div className="px-2 sm:px-4">
          <span className="block text-xs font-semibold text-slate-500 mb-1">
            Video Duration
          </span>
          <span className="text-xl sm:text-2xl font-extrabold font-mono text-slate-900 tracking-tight">
            {durationSeconds > 0 ? formatSecondsToTime(durationSeconds) : '00:00'}
          </span>
          <span className="block text-[11px] text-slate-400 font-mono mt-0.5">
            {durationSeconds > 0 ? `${Math.round(durationSeconds)}s` : '0s'}
          </span>
        </div>

        {/* Split Interval */}
        <div className="px-2 sm:px-4">
          <span className="block text-xs font-semibold text-slate-500 mb-1">
            Split Interval
          </span>
          <span className="text-xl sm:text-2xl font-extrabold font-mono text-[#ff003f] tracking-tight">
            {intervalSeconds > 0 ? `${intervalSeconds} sec` : '—'}
          </span>
          <span className="block text-[11px] text-slate-400 font-mono mt-0.5">
            per clip
          </span>
        </div>

        {/* Episodes */}
        <div className="px-2 sm:px-4">
          <span className="block text-xs font-semibold text-slate-500 mb-1">
            Episodes
          </span>
          <span className="text-xl sm:text-2xl font-extrabold font-mono text-emerald-600 tracking-tight">
            {episodesCount > 0 ? episodesCount : '0'}
          </span>
          <span className="block text-[11px] text-slate-400 font-mono mt-0.5">
            automatic
          </span>
        </div>
      </div>

      {hasRemainingFinalSegment && finalSegmentSeconds && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Final episode portion:</span>
          <span className="font-mono font-semibold text-[#ff003f]">
            Episode {episodesCount} → {finalSegmentSeconds}s duration
          </span>
        </div>
      )}
    </div>
  );
};
