import React, { useRef, useState } from 'react';
import { Music, Upload, Play, Square, Check, Volume2, Sparkles, Sliders } from 'lucide-react';
import { BackgroundMusicConfig } from '../types';
import { MUSIC_PRESETS, renderPresetMusicBuffer } from '../utils/musicTracks';
import { decodeAudioFromMedia } from '../utils/videoProcessor';
import { soundService } from '../utils/audioEffects';

interface BackgroundMusicSectionProps {
  config: BackgroundMusicConfig;
  onChange: (config: BackgroundMusicConfig) => void;
  disabled?: boolean;
}

export const BackgroundMusicSection: React.FC<BackgroundMusicSectionProps> = ({
  config,
  onChange,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('acoustic');
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const previewSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const previewAudioCtxRef = useRef<AudioContext | null>(null);

  const musicVolPercent = Math.round((config.volume ?? 0.2) * 100);
  const origVolPercent = Math.round((config.originalAudioVolume ?? 1.0) * 100);

  // Compute beginner visual bar strings
  const getVisualBar = (percent: number) => {
    const totalBlocks = 10;
    const filled = Math.round((percent / 100) * totalBlocks);
    return '█'.repeat(filled) + '░'.repeat(totalBlocks - filled);
  };

  const handleToggle = async (enabled: boolean) => {
    soundService.triggerButtonHaptic();
    if (enabled && !config.audioBuffer) {
      // Auto-load default preset
      try {
        const buf = await renderPresetMusicBuffer('acoustic');
        onChange({
          ...config,
          enabled: true,
          fileName: 'Gentle Acoustic Calm (Preset)',
          audioBuffer: buf,
          volume: config.volume || 0.2,
          originalAudioVolume: config.originalAudioVolume || 1.0,
        });
      } catch {
        onChange({ ...config, enabled: true });
      }
    } else {
      stopPreview();
      onChange({ ...config, enabled });
    }
  };

  const handleSelectPreset = async (presetId: string) => {
    soundService.triggerButtonHaptic();
    setSelectedPresetId(presetId);
    stopPreview();
    try {
      const preset = MUSIC_PRESETS.find((p) => p.id === presetId);
      const buf = await renderPresetMusicBuffer(presetId);
      onChange({
        ...config,
        fileName: `${preset?.name || presetId} (Preset)`,
        file: undefined,
        audioBuffer: buf,
      });
    } catch (e) {
      console.error('Failed to load music preset:', e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    soundService.triggerButtonHaptic();
    stopPreview();

    try {
      const buf = await decodeAudioFromMedia(file);
      if (!buf) {
        alert('Could not decode audio from the selected file. Please choose an MP3, WAV, or AAC file.');
        return;
      }
      onChange({
        ...config,
        fileName: file.name,
        file,
        audioBuffer: buf,
      });
    } catch (err) {
      alert('Failed to read music file.');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const togglePreview = () => {
    if (isPlayingPreview) {
      stopPreview();
      return;
    }

    if (!config.audioBuffer) return;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      previewAudioCtxRef.current = ctx;

      const src = ctx.createBufferSource();
      src.buffer = config.audioBuffer;
      src.loop = true;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(config.volume ?? 0.2, ctx.currentTime);

      src.connect(gain);
      gain.connect(ctx.destination);

      src.start(0);
      previewSourceRef.current = src;
      setIsPlayingPreview(true);

      src.onended = () => {
        setIsPlayingPreview(false);
      };
    } catch (e) {
      console.warn('Audio preview error:', e);
    }
  };

  const stopPreview = () => {
    try {
      if (previewSourceRef.current) {
        previewSourceRef.current.stop();
        previewSourceRef.current = null;
      }
      if (previewAudioCtxRef.current && previewAudioCtxRef.current.state !== 'closed') {
        previewAudioCtxRef.current.close();
        previewAudioCtxRef.current = null;
      }
    } catch {}
    setIsPlayingPreview(false);
  };

  return (
    <div
      id="section-background-music"
      className="w-full rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm transition-all"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.aac,.m4a,.ogg"
        className="hidden"
        onChange={handleFileUpload}
      />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#ff003f] flex items-center justify-center font-bold">
            <Music className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              6. Background Music
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Add soft background music that blends smoothly behind your voice.
            </p>
          </div>
        </div>

        {/* Master ON/OFF Switch */}
        <button
          id="toggle-background-music"
          type="button"
          role="switch"
          aria-checked={config.enabled}
          disabled={disabled}
          onClick={() => handleToggle(!config.enabled)}
          className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            config.enabled ? 'bg-[#ff003f]' : 'bg-slate-300'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              config.enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {config.enabled ? (
        <div className="space-y-4 pt-2">
          {/* Music Selection Header */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Current Music Track
                </span>
                <span className="text-sm font-bold text-slate-900 truncate block mt-0.5">
                  {config.fileName || 'Gentle Acoustic Calm (Preset)'}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                {config.audioBuffer && (
                  <button
                    type="button"
                    onClick={togglePreview}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all shadow-sm"
                  >
                    {isPlayingPreview ? (
                      <>
                        <Square className="w-3.5 h-3.5 text-[#ff003f]" />
                        <span>Stop</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 text-[#ff003f]" />
                        <span>Test Sound</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  id="choose-music-file-button"
                  type="button"
                  disabled={disabled}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#ff003f] hover:bg-[#e00037] text-white text-xs font-bold transition-all shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose Music File</span>
                </button>
              </div>
            </div>

            {/* Presets Grid */}
            <div className="mt-3 pt-3 border-t border-slate-200/80">
              <label className="text-[11px] font-semibold text-slate-500 mb-2 block">
                Or pick a gentle royalty-free preset:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {MUSIC_PRESETS.map((p) => {
                  const isPresetActive = selectedPresetId === p.id && !config.file;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPreset(p.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isPresetActive
                          ? 'border-[#ff003f] bg-white ring-2 ring-rose-200 shadow-sm'
                          : 'border-slate-200 bg-white hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{p.name}</span>
                        {isPresetActive && <Check className="w-3.5 h-3.5 text-[#ff003f]" />}
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{p.genre}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Volume Balancing Controls */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
              <Sliders className="w-4 h-4 text-[#ff003f]" />
              <span>Smart Audio Balance</span>
            </div>

            {/* Background Music Volume */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-700">Background Music Volume</span>
                <span className="font-mono font-bold text-[#ff003f] bg-white px-2 py-0.5 rounded border border-slate-200">
                  {musicVolPercent}% (Gentle)
                </span>
              </div>
              <input
                id="bg-music-volume-slider"
                type="range"
                min={0}
                max={100}
                step={2}
                value={musicVolPercent}
                disabled={disabled}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10) / 100;
                  onChange({ ...config, volume: val });
                }}
                className="w-full accent-[#ff003f] cursor-pointer"
              />
            </div>

            {/* Original Video Volume */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-700">Original Voice Volume</span>
                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {origVolPercent}%
                </span>
              </div>
              <input
                id="original-voice-volume-slider"
                type="range"
                min={0}
                max={100}
                step={5}
                value={origVolPercent}
                disabled={disabled}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10) / 100;
                  onChange({ ...config, originalAudioVolume: val });
                }}
                className="w-full accent-[#ff003f] cursor-pointer"
              />
            </div>

            {/* Beginner visual balance display */}
            <div className="p-3 rounded-lg bg-white border border-slate-200/80 font-mono text-xs space-y-1.5">
              <div className="flex justify-between items-center text-slate-600">
                <span className="font-sans font-semibold text-[11px] text-slate-700">Original Audio:</span>
                <span className="text-[#ff003f] font-bold">[{getVisualBar(origVolPercent)}]</span>
                <span className="font-bold text-slate-800">{origVolPercent}%</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="font-sans font-semibold text-[11px] text-slate-700">Background Music:</span>
                <span className="text-slate-500 font-bold">[{getVisualBar(musicVolPercent)}]</span>
                <span className="font-bold text-[#ff003f]">{musicVolPercent}%</span>
              </div>
            </div>

            {/* Fade In / Fade Out Toggles */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <label className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200 cursor-pointer">
                <span className="text-xs font-semibold text-slate-700">Fade In at start</span>
                <input
                  type="checkbox"
                  checked={config.fadeIn}
                  onChange={(e) => onChange({ ...config, fadeIn: e.target.checked })}
                  className="accent-[#ff003f] rounded w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200 cursor-pointer">
                <span className="text-xs font-semibold text-slate-700">Fade Out at end</span>
                <input
                  type="checkbox"
                  checked={config.fadeOut}
                  onChange={(e) => onChange({ ...config, fadeOut: e.target.checked })}
                  className="accent-[#ff003f] rounded w-4 h-4 cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>Background music is turned off. Your video will use its original audio track.</span>
          <button
            type="button"
            onClick={() => handleToggle(true)}
            className="text-xs font-bold text-[#ff003f] hover:underline shrink-0 ml-2"
          >
            Add Music
          </button>
        </div>
      )}
    </div>
  );
};
