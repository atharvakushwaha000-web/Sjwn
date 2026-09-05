import React, { useState } from 'react';
import {
  ArrowLeft,
  Play,
  Download,
  Trash2,
  Film,
  Scissors,
} from 'lucide-react';
import { EpisodeItem } from '../types';
import { VideoPlayerModal } from './VideoPlayerModal';

interface MyVideosScreenProps {
  episodes: EpisodeItem[];
  onBack: () => void;
  onOpenAutoCut: () => void;
  onClearEpisodes: () => void;
}

export const MyVideosScreen: React.FC<MyVideosScreenProps> = ({
  episodes,
  onBack,
  onOpenAutoCut,
  onClearEpisodes,
}) => {
  const [previewEpisode, setPreviewEpisode] = useState<EpisodeItem | null>(null);

  const handleDownload = (ep: EpisodeItem) => {
    if (!ep.blob && !ep.blobUrl) return;
    const url = ep.blobUrl || (ep.blob ? URL.createObjectURL(ep.blob) : '');
    const a = document.createElement('a');
    a.href = url;
    a.download = ep.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div id="my-videos-screen-root" className="w-full max-w-4xl mx-auto px-4 py-8">
      {/* Back Button */}
      <div className="flex items-center justify-between mb-8">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Video Tools</span>
        </button>

        {episodes.length > 0 && (
          <button
            type="button"
            onClick={onClearEpisodes}
            className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Library</span>
          </button>
        )}
      </div>

      {/* Title */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#ff003f] text-white flex items-center justify-center shadow-md shadow-rose-500/20">
            <Film className="w-5 h-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            MY VIDEOS
          </h1>
        </div>
        <p className="text-slate-500 text-sm sm:text-base font-medium">
          View and play your processed videos and generated episodes.
        </p>
      </div>

      {episodes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <Film className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">
            No Processed Videos Yet
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
            Videos and 10-second episodes that you cut will appear here for instant preview and download.
          </p>
          <button
            type="button"
            onClick={onOpenAutoCut}
            className="px-6 py-3 rounded-xl font-bold text-white bg-[#ff003f] hover:bg-[#e00037] active:scale-[0.98] shadow-md shadow-rose-500/25 text-sm inline-flex items-center gap-2"
          >
            <Scissors className="w-4 h-4" />
            <span>Start Auto Cut</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Ready Episodes ({episodes.length})
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {episodes.map((ep) => (
              <div
                key={ep.id}
                className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
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
                      {ep.formattedRange} ({ep.durationSeconds.toFixed(1)}s) • Genuine MP4
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
                    onClick={() => handleDownload(ep)}
                    className="px-3.5 py-2 rounded-lg bg-[#ff003f] hover:bg-[#e00037] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Video Preview Modal */}
      {previewEpisode && (
        <VideoPlayerModal
          episode={previewEpisode}
          onClose={() => setPreviewEpisode(null)}
          onDownload={() => handleDownload(previewEpisode)}
        />
      )}
    </div>
  );
};
