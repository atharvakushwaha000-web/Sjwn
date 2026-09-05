import React, { useRef, useState } from 'react';
import { Upload, RefreshCw, Film, Play } from 'lucide-react';
import { VideoMetadata } from '../types';
import { formatBytes, formatResolution, formatSecondsToTime } from '../utils/formatters';
import { extractVideoMetadata } from '../utils/videoProcessor';
import { soundService } from '../utils/audioEffects';

interface VideoSelectorProps {
  video: VideoMetadata | null;
  onVideoSelected: (video: VideoMetadata) => void;
  onError: (msg: string) => void;
  disabled?: boolean;
}

export const VideoSelector: React.FC<VideoSelectorProps> = ({
  video,
  onVideoSelected,
  onError,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|mov|webm|m4v|mkv)$/i)) {
      onError('Unsupported format: Please select a valid video file (MP4, WebM, MOV).');
      soundService.playError();
      return;
    }

    try {
      soundService.playVideoSelected();
      const meta = await extractVideoMetadata(file);
      onVideoSelected(meta);
    } catch (err) {
      soundService.playError();
      onError(err instanceof Error ? err.message : 'Failed to read video metadata.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,.mp4,.mov,.webm,.m4v,.mkv"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />

      {!video ? (
        // Empty State: White card with Neon Red button & accents
        <div
          id="video-selector-empty-card"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative w-full rounded-2xl border-2 transition-all p-8 sm:p-10 flex flex-col items-center justify-center text-center ${
            isDragging
              ? 'border-[#ff003f] bg-rose-50/50 scale-[1.01]'
              : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mb-4 text-[#ff003f]">
            <Film className="w-8 h-8" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
            No video selected
          </h2>
          <p className="text-sm text-slate-500 max-w-sm mb-6">
            Select a video to get started. Drag and drop any video or choose from your device.
          </p>

          <button
            id="select-video-button"
            type="button"
            onClick={() => {
              soundService.triggerButtonHaptic();
              fileInputRef.current?.click();
            }}
            disabled={disabled}
            className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-[#ff003f] hover:bg-[#e00037] active:bg-[#c50030] text-white font-bold text-sm sm:text-base shadow-md shadow-rose-500/20 transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>Select Video</span>
          </button>
        </div>
      ) : (
        // Selected State
        <div
          id="video-selector-selected-card"
          className="w-full rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
              <span>Selected Video</span>
            </h2>

            <button
              id="change-video-button"
              type="button"
              onClick={() => {
                soundService.triggerButtonHaptic();
                fileInputRef.current?.click();
              }}
              disabled={disabled}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Change Video</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-5">
            {/* Thumbnail */}
            <div className="relative w-full sm:w-44 h-28 sm:h-28 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 group">
              {video?.thumbnailUrl ? (
                <img
                  src={video.thumbnailUrl}
                  alt={video.name || 'Video'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <Film className="w-8 h-8" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="w-7 h-7 text-white drop-shadow" />
              </div>
              <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 text-[11px] font-mono font-semibold bg-black/80 text-white rounded">
                {formatSecondsToTime(video?.duration ?? 0)}
              </span>
            </div>

            {/* Video Details */}
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate mb-1">
                {video.name}
              </h3>

              <div className="flex items-center space-x-2 text-sm text-[#ff003f] font-semibold mb-2">
                <span>{formatSecondsToTime(video.duration)}</span>
                <span className="text-slate-300">•</span>
                <span>{formatResolution(video.width, video.height)}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-500">
                <div>
                  <span className="text-slate-400">Size: </span>
                  <span className="font-mono text-slate-700 font-medium">{formatBytes(video.size)}</span>
                </div>
                <div>
                  <span className="text-slate-400">Frames: </span>
                  <span className="font-mono text-slate-700 font-medium">{video.fps || 30} fps</span>
                </div>
                <div>
                  <span className="text-slate-400">Duration: </span>
                  <span className="font-mono text-slate-700 font-medium">{Math.round(video.duration)}s</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
