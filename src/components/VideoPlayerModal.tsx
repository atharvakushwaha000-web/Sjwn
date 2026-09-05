import React, { useRef, useState, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  RotateCcw,
} from 'lucide-react';
import { EpisodeItem } from '../types';
import { formatSecondsToTime } from '../utils/formatters';

interface VideoPlayerModalProps {
  episode: EpisodeItem | null;
  onClose: () => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  episode,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (episode && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [episode]);

  if (!episode) return null;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || episode.durationSeconds);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = target;
      setCurrentTime(target);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  return (
    <div
      id="video-player-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
    >
      <div
        ref={containerRef}
        className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-white">
          <div className="flex items-center space-x-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff003f] animate-pulse" />
            <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
              {episode.fileName}
            </h3>
            <span className="text-xs font-mono text-[#ff003f] bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              {episode.formattedRange}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Canvas / Player Area: Displays the REAL generated episode MP4 */}
        <div className="relative w-full aspect-video bg-black flex items-center justify-center">
          <video
            ref={videoRef}
            src={episode.blobUrl}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
            playsInline
            className="w-full h-full object-contain"
            onClick={togglePlay}
          />

          {/* Central Play/Pause Overlay indicator */}
          {!isPlaying && (
            <button
              type="button"
              onClick={togglePlay}
              className="absolute w-14 h-14 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white backdrop-blur-sm hover:scale-110 transition-transform"
            >
              <Play className="w-6 h-6 ml-0.5 fill-current" />
            </button>
          )}
        </div>

        {/* Controls Bar */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col space-y-3">
          {/* Seek Bar */}
          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono text-slate-500 min-w-[38px]">
              {formatSecondsToTime(currentTime)}
            </span>
            <input
              type="range"
              min="0"
              max={duration || episode.durationSeconds || 1}
              step="0.05"
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1.5 bg-slate-200 accent-[#ff003f] rounded-lg cursor-pointer"
            />
            <span className="text-xs font-mono text-slate-500 min-w-[38px] text-right">
              {formatSecondsToTime(duration || episode.durationSeconds)}
            </span>
          </div>

          {/* Media Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={togglePlay}
                className="p-2 rounded-lg bg-[#ff003f] hover:bg-[#e00037] text-white transition-all shadow-sm"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = 0;
                    videoRef.current.play().catch(() => {});
                    setIsPlaying(true);
                  }
                }}
                title="Restart"
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Volume Slider */}
              <div className="flex items-center space-x-1.5 pl-2">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="p-1.5 text-slate-500 hover:text-slate-800"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1 bg-slate-200 accent-[#ff003f] rounded-lg cursor-pointer"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
              title="Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
