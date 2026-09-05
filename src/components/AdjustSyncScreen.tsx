import React, { useEffect, useRef, useState } from 'react';
import {
  Sliders,
  Upload,
  ArrowLeft,
  Play,
  Pause,
  Download,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Video,
  Music,
  RotateCcw,
  Volume2,
  VolumeX,
  ExternalLink,
  Copy,
  Check,
  Repeat,
} from 'lucide-react';
import { AudioMetadata, AudioSyncResult, EpisodeItem, VideoMetadata } from '../types';
import { extractVideoMetadata } from '../utils/videoProcessor';
import {
  detectAudioSyncOffset,
  exportSynchronizedVideo,
} from '../utils/audioSync';
import { formatDuration } from '../utils/formatters';

interface AdjustSyncScreenProps {
  onBack: () => void;
  onSaveCompletedEpisode?: (item: EpisodeItem) => void;
}

interface ExportedVideoResult {
  blob: Blob;
  blobUrl: string;
  fileName: string;
  size: number;
  duration: number;
}

export const AdjustSyncScreen: React.FC<AdjustSyncScreenProps> = ({
  onBack,
  onSaveCompletedEpisode,
}) => {
  const [video, setVideo] = useState<VideoMetadata | null>(null);
  const [audio, setAudio] = useState<AudioMetadata | null>(null);

  // Sync and adjustment state
  const [offsetSeconds, setOffsetSeconds] = useState<number>(0);
  const [audioVolume, setAudioVolume] = useState<number>(1.0);
  const [loopAudio, setLoopAudio] = useState<boolean>(false);

  // Auto-detect analysis state (optional)
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [syncResult, setSyncResult] = useState<AudioSyncResult | null>(null);

  // Preview state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPreviewMuted, setIsPreviewMuted] = useState(false);

  // Export state
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportedVideo, setExportedVideo] = useState<ExportedVideoResult | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Synchronize audio element with video element during preview
  const syncMediaElements = (videoTime: number) => {
    if (!videoRef.current || !audioRef.current) return;
    videoRef.current.currentTime = videoTime;

    // Target audio playback time based on offset
    // offset > 0 means audio begins offset seconds into video
    const targetAudioTime = videoTime - offsetSeconds;
    const audioDur = audio?.duration || 0;

    if (audioDur > 0) {
      if (loopAudio) {
        // If looping, wrap around target audio time
        if (targetAudioTime >= 0) {
          audioRef.current.currentTime = targetAudioTime % audioDur;
          audioRef.current.muted = isPreviewMuted;
        } else {
          audioRef.current.muted = true;
        }
      } else {
        if (targetAudioTime >= 0 && targetAudioTime <= audioDur) {
          audioRef.current.currentTime = targetAudioTime;
          audioRef.current.muted = isPreviewMuted;
        } else {
          audioRef.current.muted = true;
        }
      }
    }
  };

  // Video selection handler
  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);
    try {
      const meta = await extractVideoMetadata(file);
      setVideo(meta);
      setSyncResult(null);
      setExportedVideo(null);
      setCurrentTime(0);
      setIsPlaying(false);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load video file.');
    }
  };

  // Audio selection handler
  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);

    const blobUrl = URL.createObjectURL(file);
    const audioMeta: AudioMetadata = {
      name: file.name,
      size: file.size,
      duration: 0,
      mimeType: file.type || 'audio/mp3',
      blobUrl,
      file,
    };

    const tempAudio = document.createElement('audio');
    tempAudio.src = blobUrl;
    tempAudio.onloadedmetadata = () => {
      const dur = tempAudio.duration || 0;
      audioMeta.duration = dur;
      setAudio(audioMeta);
      setSyncResult(null);
      setExportedVideo(null);

      // Auto-enable loop if audio is shorter than video
      if (video && dur > 0 && dur < video.duration) {
        setLoopAudio(true);
      }
    };
    tempAudio.onerror = () => {
      setErrorMsg('Could not read audio file metadata. Please select an MP3, WAV, or AAC file.');
    };
  };

  // Optional: Auto-detect timing match if video has audio
  const handleAutoAnalyzeSync = async () => {
    if (!video || !audio) return;
    setIsAnalyzing(true);
    setErrorMsg(null);

    try {
      const videoBlob = video.file || (await (await fetch(video.blobUrl)).blob());
      const audioBlob = audio.file || (await (await fetch(audio.blobUrl)).blob());

      const result = await detectAudioSyncOffset(videoBlob, audioBlob, 30);
      setSyncResult(result);
      setOffsetSeconds(result.offsetSeconds);
      if (videoRef.current) syncMediaElements(videoRef.current.currentTime);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Error analyzing audio synchronization.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Play / Pause preview control
  const togglePlay = () => {
    if (!videoRef.current || !audioRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      syncMediaElements(videoRef.current.currentTime);
      videoRef.current.play().catch(() => {});
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleSeek = (newTime: number) => {
    setCurrentTime(newTime);
    syncMediaElements(newTime);
  };

  // Update volume on preview audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = Math.min(1.0, Math.max(0, audioVolume));
    }
  }, [audioVolume]);

  // Main Action: CREATE SINGLE VIDEO WITH AUDIO
  const handleCreateSingleVideo = async () => {
    if (!video || !audio) return;
    setIsExporting(true);
    setExportProgress(0);
    setErrorMsg(null);
    setExportedVideo(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const finalBlob = await exportSynchronizedVideo({
        video,
        externalAudio: audio,
        offsetSeconds,
        volume: audioVolume,
        loopAudio,
        onProgress: (p) => setExportProgress(p),
        abortSignal: controller.signal,
      });

      const url = URL.createObjectURL(finalBlob);
      const isMp4 = finalBlob.type.includes('mp4');
      const ext = isMp4 ? 'mp4' : 'webm';
      const cleanBaseName = video.name.replace(/\.[^/.]+$/, '');
      const outFileName = `${cleanBaseName}_with_audio.${ext}`;

      const res: ExportedVideoResult = {
        blob: finalBlob,
        blobUrl: url,
        fileName: outFileName,
        size: finalBlob.size,
        duration: video.duration,
      };

      setExportedVideo(res);

      // Save to My Videos if handler exists
      if (onSaveCompletedEpisode) {
        const episodeItem: EpisodeItem = {
          id: Date.now(),
          episodeNumber: 1,
          fileName: outFileName,
          filePath: `/storage/emulated/0/Movies/VideoEditor/${outFileName}`,
          fileUri: url,
          startSeconds: 0,
          endSeconds: video.duration,
          durationSeconds: video.duration,
          formattedRange: `0:00 - ${formatDuration(video.duration)}`,
          blob: finalBlob,
          blobUrl: url,
          size: finalBlob.size,
          isReady: true,
          hasAudio: true,
        };
        onSaveCompletedEpisode(episodeItem);
      }

      // Auto-trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = outFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('cancelled')) {
        setErrorMsg('Video creation was cancelled.');
      } else {
        setErrorMsg(
          err instanceof Error
            ? err.message
            : 'Failed to create single video with audio. Please try again.'
        );
      }
    } finally {
      setIsExporting(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelExport = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleCopyLink = () => {
    if (!exportedVideo) return;
    navigator.clipboard.writeText(exportedVideo.blobUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  return (
    <div id="adjust-sync-screen-root" className="w-full max-w-4xl mx-auto px-4 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>
      </div>

      {/* Screen Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#ff003f] text-white flex items-center justify-center shadow-md shadow-rose-500/20">
            <Sliders className="w-5 h-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            ADJUST & ADD AUDIO TO VIDEO
          </h1>
        </div>
        <p className="text-slate-600 text-sm sm:text-base">
          Upload your video (silent or with existing sound), upload your external audio file, adjust timing according to the video, and create a single video with full working audio.
        </p>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1 & 2: UPLOAD VIDEO & AUDIO CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Step 1: Video Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <Video className="w-5 h-5 text-[#ff003f]" />
                <h3 className="text-base">1. Select Video File</h3>
              </div>
              {video && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                  Ready
                </span>
              )}
            </div>

            {video ? (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1.5">
                <p className="text-sm font-bold text-slate-900 truncate">
                  {video.name}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>{formatDuration(video.duration)}</span>
                  <span>•</span>
                  <span>{video.width}×{video.height}</span>
                  <span>•</span>
                  <span>{(video.size / (1024 * 1024)).toFixed(1)} MB</span>
                </div>

                {/* Audio track info */}
                <div className="pt-1">
                  {video.hasAudio === false ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                      Silent Video (No Audio)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-800 border border-blue-200">
                      Original Audio will be replaced
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center">
                <Video className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">
                  Upload your video file. Videos with or without audio are supported.
                </p>
              </div>
            )}
          </div>

          <div className="mt-4">
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              onChange={handleVideoSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="w-full py-3 px-4 rounded-xl border border-slate-200 hover:border-slate-300 font-bold text-sm text-slate-700 bg-slate-50 hover:bg-slate-100 flex items-center justify-center gap-2 transition-all"
            >
              <Upload className="w-4 h-4 text-slate-500" />
              <span>{video ? 'Change Video File' : 'Select Video File'}</span>
            </button>
          </div>
        </div>

        {/* Step 2: Audio Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <Music className="w-5 h-5 text-[#ff003f]" />
                <h3 className="text-base">2. Select Audio File</h3>
              </div>
              {audio && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                  Ready
                </span>
              )}
            </div>

            {audio ? (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1.5">
                <p className="text-sm font-bold text-slate-900 truncate">
                  {audio.name}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>{formatDuration(audio.duration)}</span>
                  <span>•</span>
                  <span>{(audio.size / (1024 * 1024)).toFixed(1)} MB</span>
                  <span>•</span>
                  <span>{audio.mimeType.replace('audio/', '').toUpperCase()}</span>
                </div>

                {video && (
                  <div className="pt-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-50 text-purple-800 border border-purple-200">
                      {audio.duration < video.duration
                        ? `Audio is shorter than video (${formatDuration(audio.duration)} vs ${formatDuration(video.duration)})`
                        : `Audio covers full video (${formatDuration(audio.duration)})`}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center">
                <Music className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">
                  Upload the audio track you want to merge into the video (MP3, WAV, AAC, M4A).
                </p>
              </div>
            )}
          </div>

          <div className="mt-4">
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*"
              onChange={handleAudioSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => audioInputRef.current?.click()}
              className="w-full py-3 px-4 rounded-xl border border-slate-200 hover:border-slate-300 font-bold text-sm text-slate-700 bg-slate-50 hover:bg-slate-100 flex items-center justify-center gap-2 transition-all"
            >
              <Upload className="w-4 h-4 text-slate-500" />
              <span>{audio ? 'Change Audio File' : 'Select Audio File'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* STEP 3: ADJUST AUDIO SETTINGS & LIVE PREVIEW */}
      {video && audio && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                3. Adjust Audio According to Video
              </h3>
              <p className="text-xs text-slate-500">
                Fine-tune when the audio track starts, volume level, and looping behavior.
              </p>
            </div>

            {/* Optional auto-match button */}
            {video.hasAudio && (
              <button
                type="button"
                disabled={isAnalyzing}
                onClick={handleAutoAnalyzeSync}
                className="self-start sm:self-auto px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center gap-1.5 transition-colors"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sliders className="w-3.5 h-3.5 text-[#ff003f]" />
                    <span>Auto-Match with Original Audio</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Sync Result Banner if auto-analyzed */}
          {syncResult && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs ${
                syncResult.confidence >= 0.4
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              {syncResult.confidence >= 0.4 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-bold">
                  Offset:{' '}
                  <span className="font-mono">
                    {offsetSeconds >= 0 ? '+' : ''}
                    {offsetSeconds.toFixed(2)}s
                  </span>
                </p>
                <p className="mt-0.5 opacity-90">{syncResult.statusMessage}</p>
              </div>
            </div>
          )}

          {/* Audio Timing Offset Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Audio Start Timing (Offset)
              </span>
              <span className="font-mono font-bold text-sm px-3 py-1 rounded-md bg-slate-100 text-slate-900 border border-slate-200">
                {offsetSeconds === 0
                  ? '0.00s (Starts at 0:00)'
                  : `${offsetSeconds > 0 ? '+' : ''}${offsetSeconds.toFixed(2)}s`}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-semibold text-slate-400">-30s</span>
              <input
                type="range"
                min="-30"
                max="30"
                step="0.05"
                value={offsetSeconds}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setOffsetSeconds(val);
                  if (videoRef.current) syncMediaElements(videoRef.current.currentTime);
                }}
                className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#ff003f]"
              />
              <span className="text-xs font-mono font-semibold text-slate-400">+30s</span>
            </div>

            {/* Quick Adjustment buttons */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const val = Math.max(-30, offsetSeconds - 1.0);
                  setOffsetSeconds(val);
                  if (videoRef.current) syncMediaElements(videoRef.current.currentTime);
                }}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                -1.0s
              </button>
              <button
                type="button"
                onClick={() => {
                  const val = Math.max(-30, offsetSeconds - 0.25);
                  setOffsetSeconds(val);
                  if (videoRef.current) syncMediaElements(videoRef.current.currentTime);
                }}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                -0.25s
              </button>
              <button
                type="button"
                onClick={() => {
                  setOffsetSeconds(0);
                  if (videoRef.current) syncMediaElements(videoRef.current.currentTime);
                }}
                className="px-3 py-1 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset 0s</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const val = Math.min(30, offsetSeconds + 0.25);
                  setOffsetSeconds(val);
                  if (videoRef.current) syncMediaElements(videoRef.current.currentTime);
                }}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                +0.25s
              </button>
              <button
                type="button"
                onClick={() => {
                  const val = Math.min(30, offsetSeconds + 1.0);
                  setOffsetSeconds(val);
                  if (videoRef.current) syncMediaElements(videoRef.current.currentTime);
                }}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                +1.0s
              </button>
            </div>
          </div>

          {/* Volume and Loop Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
            {/* Audio Volume */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700">
                  Audio Track Volume
                </span>
                <span className="text-xs font-mono font-bold text-slate-900">
                  {Math.round(audioVolume * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-slate-400" />
                <input
                  type="range"
                  min="0.2"
                  max="1.5"
                  step="0.05"
                  value={audioVolume}
                  onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#ff003f]"
                />
              </div>
            </div>

            {/* Loop Audio Toggle */}
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200/70">
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-[#ff003f]" />
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Loop Audio
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Repeats audio if shorter than video
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={loopAudio}
                  onChange={(e) => setLoopAudio(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#ff003f]"></div>
              </label>
            </div>
          </div>

          {/* Synchronized Live Preview Player */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Live Synchronized Preview
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsPreviewMuted(!isPreviewMuted);
                  if (audioRef.current) audioRef.current.muted = !isPreviewMuted;
                }}
                className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1"
              >
                {isPreviewMuted ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-rose-500" />
                    <span>Audio Muted</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-slate-700" />
                    <span>Audio Playing</span>
                  </>
                )}
              </button>
            </div>

            <div className="aspect-video w-full max-w-xl mx-auto rounded-xl bg-black overflow-hidden relative shadow-md flex items-center justify-center">
              <video
                ref={videoRef}
                src={video.blobUrl}
                playsInline
                muted // Always keep video element muted; preview audio is played from external audio tag
                onTimeUpdate={() => {
                  if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
                }}
                onEnded={() => setIsPlaying(false)}
                className="w-full h-full object-contain"
              />
              <audio ref={audioRef} src={audio.blobUrl} />

              <button
                type="button"
                onClick={togglePlay}
                className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-all"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
              </button>
            </div>

            {/* Video Scrubber */}
            <div className="max-w-xl mx-auto">
              <input
                type="range"
                min="0"
                max={video.duration || 100}
                step="0.1"
                value={currentTime}
                onChange={(e) => handleSeek(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#ff003f]"
              />
              <div className="flex justify-between text-xs font-mono text-slate-500 mt-1">
                <span>{formatDuration(currentTime)}</span>
                <span>{formatDuration(video.duration)}</span>
              </div>
            </div>
          </div>

          {/* MAIN ACTION: CREATE SINGLE VIDEO WITH AUDIO */}
          <div className="pt-6 border-t border-slate-200">
            {isExporting ? (
              <div className="bg-rose-50 border border-rose-200 p-6 rounded-2xl text-center space-y-4">
                <div className="flex items-center justify-center gap-3 text-rose-900 font-bold text-base">
                  <RefreshCw className="w-5 h-5 animate-spin text-[#ff003f]" />
                  <span>Creating Single Video with Audio ({exportProgress}%)</span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-3 bg-rose-200/60 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#ff003f] transition-all duration-150 ease-out"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>

                <p className="text-xs text-rose-700">
                  Rendering video frames and encoding custom audio track. Please wait...
                </p>

                <button
                  type="button"
                  onClick={handleCancelExport}
                  className="px-4 py-2 text-xs font-bold text-rose-700 hover:text-rose-900 hover:bg-rose-100 rounded-xl transition-colors"
                >
                  Cancel Export
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleCreateSingleVideo}
                className="w-full py-4 px-6 rounded-2xl font-extrabold text-white bg-[#ff003f] hover:bg-[#e00037] active:scale-[0.99] shadow-lg shadow-rose-500/30 flex items-center justify-center gap-3 text-base sm:text-lg transition-all"
              >
                <Download className="w-5 h-5" />
                <span>CREATE SINGLE VIDEO WITH AUDIO</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* STEP 4: RESULT SECTION WITH DIRECT VIDEO & AUDIO LINK */}
      {exportedVideo && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 shadow-sm mb-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-emerald-200/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-emerald-950">
                  Video Created Successfully with Audio!
                </h3>
                <p className="text-xs text-emerald-700 font-medium">
                  The audio has been merged into the video. You can play, listen, and download directly below.
                </p>
              </div>
            </div>

            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-200 text-emerald-900">
              <Check className="w-3.5 h-3.5" />
              Saved to My Videos
            </span>
          </div>

          {/* Embedded Full Video Player with Audio Working */}
          <div className="max-w-xl mx-auto space-y-2">
            <div className="aspect-video w-full rounded-xl bg-black overflow-hidden shadow-md">
              <video
                controls
                playsInline
                preload="auto"
                src={exportedVideo.blobUrl}
                className="w-full h-full object-contain"
              />
            </div>
            <p className="text-center text-xs text-emerald-800 font-medium">
              Click Play to hear your custom audio working in this video.
            </p>
          </div>

          {/* Details & Action Buttons */}
          <div className="bg-white/80 rounded-xl p-4 border border-emerald-200/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-900 truncate">
                {exportedVideo.fileName}
              </p>
              <p className="text-xs text-slate-500">
                {formatDuration(exportedVideo.duration)} • {(exportedVideo.size / (1024 * 1024)).toFixed(1)} MB • Audio Included
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-500" />
                    <span>Copy Video Link</span>
                  </>
                )}
              </button>

              <a
                href={exportedVideo.blobUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-slate-500" />
                <span>Open in Tab</span>
              </a>

              <a
                href={exportedVideo.blobUrl}
                download={exportedVideo.fileName}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-extrabold text-white bg-[#ff003f] hover:bg-[#e00037] shadow-md shadow-rose-500/20 text-xs flex items-center justify-center gap-2 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Video</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
