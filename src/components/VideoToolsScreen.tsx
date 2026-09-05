import React, { useRef, useState } from 'react';
import {
  Video,
  Upload,
  ArrowLeft,
  Play,
  Pause,
  Download,
  Gauge,
  SlidersHorizontal,
  RefreshCw,
} from 'lucide-react';
import { VideoMetadata, VideoQualityOption } from '../types';
import { extractVideoMetadata } from '../utils/videoProcessor';
import { formatDuration } from '../utils/formatters';

interface VideoToolsScreenProps {
  onBack: () => void;
}

export const VideoToolsScreen: React.FC<VideoToolsScreenProps> = ({ onBack }) => {
  const [video, setVideo] = useState<VideoMetadata | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [videoQuality, setVideoQuality] = useState<VideoQualityOption>('original');
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPlayerRef = useRef<HTMLVideoElement>(null);

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const meta = await extractVideoMetadata(file);
      setVideo(meta);
    } catch {
      alert('Failed to load video file.');
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoPlayerRef.current) {
      videoPlayerRef.current.playbackRate = speed;
    }
  };

  return (
    <div id="video-tools-screen-root" className="w-full max-w-4xl mx-auto px-4 py-8">
      {/* Back Button */}
      <div className="mb-8">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Video Tools</span>
        </button>
      </div>

      {/* Title */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#ff003f] text-white flex items-center justify-center shadow-md shadow-rose-500/20">
            <Video className="w-5 h-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            VIDEO TOOLS
          </h1>
        </div>
        <p className="text-slate-500 text-sm sm:text-base font-medium">
          Adjust and process your video speed, resolution, and quality.
        </p>
      </div>

      {!video ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-[#ff003f] flex items-center justify-center mx-auto mb-4">
            <Video className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            Select Video to Adjust
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
            Modify playback speed, change resolution presets, or export optimized versions.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleVideoSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 rounded-xl font-bold text-white bg-[#ff003f] hover:bg-[#e00037] active:scale-[0.98] shadow-md shadow-rose-500/25 text-sm inline-flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>Select Video</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Video Preview */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 truncate">
                  {video.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {formatDuration(video.duration)} • {video.width}×{video.height}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setVideo(null)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline"
              >
                Change Video
              </button>
            </div>

            <div className="aspect-video max-w-md mx-auto rounded-xl bg-black overflow-hidden shadow-inner">
              <video
                ref={videoPlayerRef}
                src={video.blobUrl}
                controls
                playsInline
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Tools Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            {/* Speed Control */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-[#ff003f]" />
                <span>Playback Speed</span>
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSpeedChange(s)}
                    className={`py-2 px-3 rounded-xl font-mono text-xs font-bold border transition-all ${
                      playbackSpeed === s
                        ? 'bg-[#ff003f] text-white border-[#ff003f] shadow-sm shadow-rose-500/20'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {/* Quality Preset */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#ff003f]" />
                <span>Video Quality Profile</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'original', label: 'Original Quality', desc: 'No compression' },
                  { id: 'high', label: 'High (1080p)', desc: 'Full HD profile' },
                  { id: 'medium', label: 'Medium (720p)', desc: 'Compact file size' },
                ].map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setVideoQuality(q.id as VideoQualityOption)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      videoQuality === q.id
                        ? 'border-[#ff003f] bg-rose-50/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <p className="text-xs font-bold text-slate-900">{q.label}</p>
                    <p className="text-[11px] text-slate-500">{q.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
