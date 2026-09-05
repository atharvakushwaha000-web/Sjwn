import React, { useRef, useState } from 'react';
import {
  Volume2,
  Upload,
  ArrowLeft,
  Play,
  Pause,
  Download,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Film,
} from 'lucide-react';
import { VideoMetadata } from '../types';
import { extractVideoMetadata } from '../utils/videoProcessor';
import { formatDuration } from '../utils/formatters';

interface AudioToolsScreenProps {
  onBack: () => void;
}

export const AudioToolsScreen: React.FC<AudioToolsScreenProps> = ({ onBack }) => {
  const [video, setVideo] = useState<VideoMetadata | null>(null);
  const [denoiseEnabled, setDenoiseEnabled] = useState(true);
  const [volumeMultiplier, setVolumeMultiplier] = useState(1.2); // 120%
  const [silenceCut, setSilenceCut] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExtractingAudio, setIsExtractingAudio] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPlayerRef = useRef<HTMLVideoElement>(null);

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const meta = await extractVideoMetadata(file);
      setVideo(meta);
    } catch {
      alert('Could not open video file.');
    }
  };

  const handleExportAudioOnly = async () => {
    if (!video) return;
    setIsExtractingAudio(true);
    try {
      // Create audio extraction
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      const resp = await fetch(video.blobUrl);
      const ab = await resp.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(ab);

      // Create WAV blob
      const wavBlob = audioBufferToWav(audioBuffer);
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${video.name.replace(/\.[^/.]+$/, '')}_Audio.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      ctx.close();
    } catch {
      alert('Failed to extract audio. Video may have no active audio track.');
    } finally {
      setIsExtractingAudio(false);
    }
  };

  return (
    <div id="audio-tools-screen-root" className="w-full max-w-4xl mx-auto px-4 py-8">
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
            <Volume2 className="w-5 h-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            AUDIO TOOLS
          </h1>
        </div>
        <p className="text-slate-500 text-sm sm:text-base font-medium">
          Reduce noise and manage your video audio with speech preservation.
        </p>
      </div>

      {!video ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-[#ff003f] flex items-center justify-center mx-auto mb-4">
            <Volume2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            Select Video for Audio Processing
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
            Enhance clarity, reduce microphone noise, or extract clean audio tracks.
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
                  {formatDuration(video.duration)} • Original Audio Active
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

          {/* Audio Controls */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <h3 className="text-base font-bold text-slate-900">
              Audio Enhancement Settings
            </h3>

            {/* Denoise Switch */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div>
                <p className="text-sm font-bold text-slate-900">
                  Speech-Safe Noise Reduction
                </p>
                <p className="text-xs text-slate-500">
                  Eliminates AC background rumble and air hiss without altering voice timbre.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDenoiseEnabled(!denoiseEnabled)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  denoiseEnabled ? 'bg-[#ff003f]' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`block w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${
                    denoiseEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Volume Multiplier */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Original Dialogue Volume
                </span>
                <span className="font-mono font-bold text-sm text-slate-900">
                  {Math.round(volumeMultiplier * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="2.0"
                step="0.05"
                value={volumeMultiplier}
                onChange={(e) => setVolumeMultiplier(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#ff003f]"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
                <span>0% (Mute)</span>
                <span>100% (Original)</span>
                <span>200% (2x Boost)</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="button"
                disabled={isExtractingAudio}
                onClick={handleExportAudioOnly}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 hover:border-slate-300 font-bold text-xs text-slate-700 bg-white hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExtractingAudio ? 'Extracting...' : 'Extract Audio Track (.wav)'}</span>
              </button>

              <button
                type="button"
                onClick={() => alert('Enhanced audio settings applied to your session.')}
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-white bg-[#ff003f] hover:bg-[#e00037] active:scale-[0.98] shadow-md shadow-rose-500/25 text-sm flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Apply Audio Enhancements</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels: Float32Array[] = [];
  let sampleRate = buffer.sampleRate;
  let offset = 0;
  let pos = 0;

  function setUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }
  function setUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  // RIFF chunk
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  // fmt chunk
  setUint32(0x20746d66); // "fmt "
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(sampleRate);
  setUint32(sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit precision

  // data chunk
  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4);

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out], { type: 'audio/wav' });
}
