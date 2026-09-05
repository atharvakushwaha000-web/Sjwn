import React, { useRef, useState } from 'react';
import {
  Scissors,
  Upload,
  ArrowLeft,
  Play,
  Download,
  AlertCircle,
  CheckCircle2,
  Volume2,
  Clock,
  Sparkles,
  RefreshCw,
  Film,
} from 'lucide-react';
import {
  EpisodeItem,
  ProcessingProgress,
  ProcessingStatus,
  SplitConfig,
  VideoMetadata,
} from '../types';
import {
  createEpisodesZip,
  executeVideoSplitting,
  extractVideoMetadata,
} from '../utils/videoProcessor';
import { formatDuration } from '../utils/formatters';
import { ProcessingView } from './ProcessingView';
import { VideoPlayerModal } from './VideoPlayerModal';

interface AutoCutScreenProps {
  onBack: () => void;
  onSaveCompletedEpisodes: (episodes: EpisodeItem[]) => void;
}

export const AutoCutScreen: React.FC<AutoCutScreenProps> = ({
  onBack,
  onSaveCompletedEpisodes,
}) => {
  const [selectedVideo, setSelectedVideo] = useState<VideoMetadata | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // Split settings (default: 10s)
  const [intervalSeconds, setIntervalSeconds] = useState<number>(10);
  const [customInterval, setCustomInterval] = useState<string>('10');
  const [useCustomInterval, setUseCustomInterval] = useState(false);

  // Audio & Quality settings
  const [autoAudioNoiseReduction, setAutoAudioNoiseReduction] = useState(false);
  const [autoVideoNoiseReduction, setAutoVideoNoiseReduction] = useState(false);
  const [originalAudioVolume, setOriginalAudioVolume] = useState(1.0);

  // Processing state
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [episodes, setEpisodes] = useState<EpisodeItem[]>([]);
  const [previewEpisode, setPreviewEpisode] = useState<EpisodeItem | null>(null);
  const [isZipping, setIsZipping] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fast Video Import without loading file into RAM
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);

    try {
      const metadata = await extractVideoMetadata(file);
      setSelectedVideo(metadata);
      setStatus('idle');
      setEpisodes([]);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : 'Could not open video file. Please ensure it is a supported video format.';
      setImportError(errorMsg);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);

    try {
      const metadata = await extractVideoMetadata(file);
      setSelectedVideo(metadata);
      setStatus('idle');
      setEpisodes([]);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Could not open video file.';
      setImportError(errorMsg);
    } finally {
      setIsImporting(false);
    }
  };

  const currentInterval = useCustomInterval
    ? parseInt(customInterval, 10) || 10
    : intervalSeconds;

  const totalCalculatedEpisodes = selectedVideo
    ? Math.ceil(selectedVideo.duration / Math.max(1, currentInterval))
    : 0;

  // Start Auto Cut
  const handleStartAutoCut = async () => {
    if (!selectedVideo) return;

    setStatus('processing');
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const result = await executeVideoSplitting({
        videoMetadata: selectedVideo,
        intervalSeconds: currentInterval,
        videoQuality: 'original',
        originalAudioVolume,
        autoVideoNoiseReduction,
        autoAudioNoiseReduction,
        onProgress: (p) => setProgress(p),
        onEpisodeCompleted: (ep) => {
          setEpisodes((prev) => [...prev, ep]);
        },
        abortSignal: controller.signal,
      });

      setEpisodes(result);
      setStatus('completed');
      onSaveCompletedEpisodes(result);
    } catch (err: unknown) {
      if (controller.signal.aborted) {
        setStatus('idle');
      } else {
        setStatus('error');
        setImportError(
          err instanceof Error
            ? err.message
            : 'An error occurred while cutting the video.'
        );
      }
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleCancelProcessing = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setStatus('idle');
    }
  };

  const handleDownloadSingle = (ep: EpisodeItem) => {
    if (!ep.blob && !ep.blobUrl) return;
    const url = ep.blobUrl || (ep.blob ? URL.createObjectURL(ep.blob) : '');
    const a = document.createElement('a');
    a.href = url;
    a.download = ep.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadAllZip = async () => {
    if (episodes.length === 0) return;
    setIsZipping(true);
    try {
      const zipBlob = await createEpisodesZip(episodes);
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedVideo?.name.replace(/\.[^/.]+$/, '') || 'Episodes'}_Split_All.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err) {
      alert('Failed to generate ZIP archive.');
    } finally {
      setIsZipping(false);
    }
  };

  // PROCESSING VIEW
  if (status === 'processing' && progress) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 py-8">
        <ProcessingView
          video={selectedVideo}
          progress={progress}
          onCancelConfirmed={handleCancelProcessing}
          onCancel={handleCancelProcessing}
          soundEnabled={true}
        />
      </div>
    );
  }

  return (
    <div id="auto-cut-screen-root" className="w-full max-w-4xl mx-auto px-4 py-8">
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-8">
        <button
          id="btn-back-home"
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Video Tools</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Volume2 className="w-3.5 h-3.5" />
          <span>Original Audio Preserved</span>
        </div>
      </div>

      {/* Feature Title */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#ff003f] text-white flex items-center justify-center shadow-md shadow-rose-500/20">
            <Scissors className="w-5 h-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            AUTO CUT VIDEO
          </h1>
        </div>
        <p className="text-slate-500 text-sm sm:text-base font-medium">
          Automatically cut your video into 10-second clips.
        </p>
      </div>

      {/* Error Banner */}
      {importError && (
        <div
          id="auto-cut-error-banner"
          className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-sm"
        >
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{importError}</p>
          </div>
          <button
            type="button"
            onClick={() => setImportError(null)}
            className="text-xs font-bold text-rose-700 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* STEP 1: SELECT VIDEO */}
      {!selectedVideo && (
        <div
          id="video-dropzone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all bg-white ${
            isImporting
              ? 'border-[#ff003f] bg-rose-50/20'
              : 'border-slate-300 hover:border-[#ff003f]/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,.mp4,.mkv,.mov,.webm,.avi"
            onChange={handleFileChange}
            className="hidden"
            id="video-file-input"
          />

          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-[#ff003f] flex items-center justify-center mx-auto mb-4">
            {isImporting ? (
              <RefreshCw className="w-8 h-8 animate-spin" />
            ) : (
              <Upload className="w-8 h-8" />
            )}
          </div>

          <h3 className="text-lg font-bold text-slate-900 mb-2">
            {isImporting ? 'Reading video details...' : 'Select your video file'}
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            Supports 10s, 1m, 8m, 20m, 1hr+ videos in MP4, MKV, MOV, or WebM format.
            No artificial size or duration limits.
          </p>

          <button
            id="btn-select-video"
            type="button"
            disabled={isImporting}
            onClick={() => fileInputRef.current?.click()}
            className="px-8 py-3.5 rounded-xl font-bold text-white bg-[#ff003f] hover:bg-[#e00037] active:scale-[0.98] shadow-md shadow-rose-500/25 transition-all text-sm inline-flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>Select Video</span>
          </button>
        </div>
      )}

      {/* SELECTED VIDEO & CONTROLS */}
      {selectedVideo && status !== 'completed' && (
        <div className="space-y-6">
          {/* Selected Video Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row items-center gap-5">
            <div className="w-full sm:w-44 h-28 rounded-xl bg-slate-900 overflow-hidden relative shrink-0 flex items-center justify-center">
              {selectedVideo?.thumbnailUrl ? (
                <img
                  src={selectedVideo.thumbnailUrl}
                  alt={selectedVideo.name || 'Video'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Film className="w-10 h-10 text-slate-600" />
              )}
              <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-black/80 text-white">
                {formatDuration(selectedVideo?.duration ?? 0)}
              </span>
            </div>

            <div className="flex-1 min-w-0 text-center sm:text-left">
              <h3 className="text-base font-bold text-slate-900 truncate mb-1">
                {selectedVideo?.name || 'Selected Video'}
              </h3>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-slate-500 mb-3">
                <span className="px-2 py-0.5 rounded bg-slate-100 font-medium">
                  {selectedVideo?.width} × {selectedVideo?.height}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-100 font-medium">
                  {((selectedVideo?.size ?? 0) / (1024 * 1024)).toFixed(1)} MB
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                  Audio Active
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedVideo(null);
                  setEpisodes([]);
                }}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline"
              >
                Change Video
              </button>
            </div>
          </div>

          {/* SPLIT SETTINGS */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#ff003f]" />
              <span>Split Interval</span>
            </h3>

            {/* Interval buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[10, 15, 30, 60].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => {
                    setIntervalSeconds(sec);
                    setUseCustomInterval(false);
                  }}
                  className={`py-3 px-4 rounded-xl text-sm font-bold border transition-all ${
                    !useCustomInterval && intervalSeconds === sec
                      ? 'bg-[#ff003f] text-white border-[#ff003f] shadow-sm shadow-rose-500/20'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {sec} seconds
                </button>
              ))}
            </div>

            {/* Calculated Episodes Info */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Output
                </p>
                <p className="text-lg font-extrabold text-slate-900">
                  {totalCalculatedEpisodes} Clips (each {currentInterval}s)
                </p>
              </div>
              <div className="text-right text-xs text-slate-500">
                <span>Total Length: </span>
                <span className="font-mono font-bold text-slate-900">
                  {formatDuration(selectedVideo.duration)}
                </span>
              </div>
            </div>
          </div>

          {/* AUDIO OPTIONS */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-[#ff003f]" />
              <span>Audio & Speech Settings</span>
            </h3>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
              <div>
                <p className="text-sm font-bold text-slate-900">
                  Speech-Safe Noise Reduction
                </p>
                <p className="text-xs text-slate-500">
                  Filters AC rumble and fan hiss while keeping voices loud and natural.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAutoAudioNoiseReduction(!autoAudioNoiseReduction)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  autoAudioNoiseReduction ? 'bg-[#ff003f]' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`block w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${
                    autoAudioNoiseReduction ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* START BUTTON */}
          <button
            id="btn-start-auto-cut"
            type="button"
            onClick={handleStartAutoCut}
            className="w-full py-4 rounded-xl font-extrabold text-white text-base bg-[#ff003f] hover:bg-[#e00037] active:scale-[0.99] shadow-lg shadow-rose-500/25 flex items-center justify-center gap-3 transition-all"
          >
            <Scissors className="w-5 h-5" />
            <span>START AUTO CUT ({totalCalculatedEpisodes} CLIPS)</span>
          </button>
        </div>
      )}

      {/* COMPLETED VIEW */}
      {status === 'completed' && (
        <div className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-emerald-950">
                  Splitting Completed Successfully!
                </h3>
                <p className="text-sm text-emerald-800">
                  {episodes.length} genuine MP4 episodes created with original audio.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                disabled={isZipping}
                onClick={handleDownloadAllZip}
                className="flex-1 sm:flex-initial px-6 py-3 rounded-xl font-bold text-white bg-slate-900 hover:bg-black text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Download className="w-4 h-4" />
                <span>{isZipping ? 'Zipping...' : 'Download All (.zip)'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatus('idle');
                  setEpisodes([]);
                }}
                className="px-4 py-3 rounded-xl font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 text-sm transition-all"
              >
                Cut Another
              </button>
            </div>
          </div>

          {/* Episode List */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Generated Episodes ({episodes.length})
              </h4>
            </div>

            <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
              {episodes.map((ep) => (
                <div
                  key={ep.id}
                  className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#ff003f] flex items-center justify-center font-bold text-sm">
                      {ep.episodeNumber}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {ep.fileName}
                      </p>
                      <p className="text-xs text-slate-500 font-mono">
                        {ep.formattedRange} ({ep.durationSeconds.toFixed(1)}s)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewEpisode(ep)}
                      className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 text-[#ff003f]" />
                      <span>Preview</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadSingle(ep)}
                      className="px-3.5 py-2 rounded-lg bg-[#ff003f] hover:bg-[#e00037] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Save Video</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* REAL VIDEO PREVIEW MODAL */}
      {previewEpisode && (
        <VideoPlayerModal
          episode={previewEpisode}
          onClose={() => setPreviewEpisode(null)}
          onDownload={() => handleDownloadSingle(previewEpisode)}
        />
      )}
    </div>
  );
};
