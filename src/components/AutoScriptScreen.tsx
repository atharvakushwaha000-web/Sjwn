import React, { useRef, useState } from 'react';
import {
  FileText,
  Upload,
  ArrowLeft,
  Play,
  Download,
  Plus,
  Trash2,
  Clock,
  Film,
  Scissors,
  CheckCircle2,
} from 'lucide-react';
import { ScriptScene, VideoMetadata } from '../types';
import { extractVideoMetadata } from '../utils/videoProcessor';
import { formatDuration } from '../utils/formatters';

interface AutoScriptScreenProps {
  onBack: () => void;
}

export const AutoScriptScreen: React.FC<AutoScriptScreenProps> = ({ onBack }) => {
  const [video, setVideo] = useState<VideoMetadata | null>(null);
  const [scenes, setScenes] = useState<ScriptScene[]>([
    {
      id: 'scene-1',
      sceneNumber: 1,
      startTime: 0,
      endTime: 10,
      scriptText: 'Introduction and title hook.',
      speaker: 'Speaker 1',
    },
    {
      id: 'scene-2',
      sceneNumber: 2,
      startTime: 10,
      endTime: 20,
      scriptText: 'Main event explanation and demonstration.',
      speaker: 'Speaker 1',
    },
  ]);

  const [activeScene, setActiveScene] = useState<ScriptScene | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const videoPlayerRef = useRef<HTMLVideoElement>(null);

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const meta = await extractVideoMetadata(file);
      setVideo(meta);
      // Auto divide duration into initial script cues if needed
      const step = Math.min(15, Math.max(5, Math.floor(meta.duration / 3)));
      setScenes([
        {
          id: 'scene-1',
          sceneNumber: 1,
          startTime: 0,
          endTime: Math.min(step, meta.duration),
          scriptText: 'Scene 1 Dialogue / Hook',
          speaker: 'Speaker 1',
        },
        {
          id: 'scene-2',
          sceneNumber: 2,
          startTime: step,
          endTime: Math.min(step * 2, meta.duration),
          scriptText: 'Scene 2 Body / Action',
          speaker: 'Speaker 1',
        },
      ]);
    } catch {
      alert('Could not open selected video file.');
    }
  };

  const handleAddScene = () => {
    const lastScene = scenes[scenes.length - 1];
    const newStart = lastScene ? lastScene.endTime : 0;
    const newEnd = video ? Math.min(newStart + 10, video.duration) : newStart + 10;

    const newScene: ScriptScene = {
      id: `scene-${Date.now()}`,
      sceneNumber: scenes.length + 1,
      startTime: newStart,
      endTime: newEnd,
      scriptText: `Scene ${scenes.length + 1} script line`,
      speaker: 'Speaker 1',
    };

    setScenes([...scenes, newScene]);
  };

  const handleRemoveScene = (id: string) => {
    setScenes(scenes.filter((s) => s.id !== id));
  };

  const handleUpdateScene = (id: string, field: keyof ScriptScene, value: unknown) => {
    setScenes(
      scenes.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const playScene = (scene: ScriptScene) => {
    setActiveScene(scene);
    if (videoPlayerRef.current) {
      videoPlayerRef.current.currentTime = scene.startTime;
      videoPlayerRef.current.play().catch(() => {});
    }
  };

  return (
    <div id="auto-script-screen-root" className="w-full max-w-4xl mx-auto px-4 py-8">
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
            <FileText className="w-5 h-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            AUTO SCRIPT VIDEO
          </h1>
        </div>
        <p className="text-slate-500 text-sm sm:text-base font-medium">
          Create and edit videos using a script and dialogue cues.
        </p>
      </div>

      {/* VIDEO SELECTION */}
      {!video ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm mb-8">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-[#ff003f] flex items-center justify-center mx-auto mb-4">
            <Film className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            Select Video to Edit with Script
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
            Load your video file to align scenes and dialogue.
          </p>

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
            className="px-6 py-3 rounded-xl font-bold text-white bg-[#ff003f] hover:bg-[#e00037] active:scale-[0.98] shadow-md shadow-rose-500/25 text-sm inline-flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>Select Video</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Video Preview Player */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 truncate">
                  {video.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Duration: {formatDuration(video.duration)} • Original Audio Preserved
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

          {/* Script Scenes Editor */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#ff003f]" />
                <span>Script Scenes ({scenes.length})</span>
              </h3>

              <button
                type="button"
                onClick={handleAddScene}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Scene</span>
              </button>
            </div>

            <div className="space-y-4">
              {scenes.map((scene, idx) => (
                <div
                  key={scene.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#ff003f]">
                      Scene {idx + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => playScene(scene)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1"
                      >
                        <Play className="w-3 h-3 text-[#ff003f]" />
                        <span>Play Scene</span>
                      </button>
                      {scenes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveScene(scene.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 uppercase">
                        Start (s)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={video.duration}
                        value={scene.startTime}
                        onChange={(e) =>
                          handleUpdateScene(
                            scene.id,
                            'startTime',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-mono font-bold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 uppercase">
                        End (s)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={video.duration}
                        value={scene.endTime}
                        onChange={(e) =>
                          handleUpdateScene(
                            scene.id,
                            'endTime',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-mono font-bold text-slate-800"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[11px] font-semibold text-slate-500 uppercase">
                        Speaker / Role
                      </label>
                      <input
                        type="text"
                        value={scene.speaker || ''}
                        onChange={(e) =>
                          handleUpdateScene(scene.id, 'speaker', e.target.value)
                        }
                        className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 uppercase">
                      Script Dialogue / Text
                    </label>
                    <textarea
                      rows={2}
                      value={scene.scriptText}
                      onChange={(e) =>
                        handleUpdateScene(scene.id, 'scriptText', e.target.value)
                      }
                      className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 resize-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() =>
                  alert('Script scenes saved! You can now preview each scene.')
                }
                className="px-6 py-3 rounded-xl font-bold text-white bg-[#ff003f] hover:bg-[#e00037] active:scale-[0.98] shadow-md shadow-rose-500/25 text-sm flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Script Timeline</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
