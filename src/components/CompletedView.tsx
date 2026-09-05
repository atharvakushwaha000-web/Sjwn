import React, { useState } from 'react';
import {
  Download,
  Share2,
  Play,
  CheckCircle2,
  Archive,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { EpisodeItem } from '../types';
import { createEpisodesZip } from '../utils/videoProcessor';
import { soundService } from '../utils/audioEffects';

interface CompletedViewProps {
  episodes: EpisodeItem[];
  onPreviewEpisode: (episode: EpisodeItem) => void;
  onReset: () => void;
}

export const CompletedView: React.FC<CompletedViewProps> = ({
  episodes,
  onPreviewEpisode,
  onReset,
}) => {
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);

  const triggerDownloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const handleDownloadZip = async () => {
    soundService.triggerButtonHaptic();
    if (zipBlob) {
      triggerDownloadBlob(zipBlob, 'Video Episodes.zip');
      return;
    }

    setIsZipping(true);
    try {
      const generatedZip = await createEpisodesZip(episodes, (p) => setZipProgress(p));
      setZipBlob(generatedZip);
      triggerDownloadBlob(generatedZip, 'Video Episodes.zip');
    } catch {
      soundService.playError();
    } finally {
      setIsZipping(false);
    }
  };

  const handleShareZip = async () => {
    soundService.triggerButtonHaptic();
    try {
      let currentZip = zipBlob;
      if (!currentZip) {
        setIsZipping(true);
        currentZip = await createEpisodesZip(episodes);
        setZipBlob(currentZip);
        setIsZipping(false);
      }

      if (
        navigator.canShare &&
        navigator.canShare({
          files: [new File([currentZip], 'Video Episodes.zip', { type: 'application/zip' })],
        })
      ) {
        const file = new File([currentZip], 'Video Episodes.zip', { type: 'application/zip' });
        await navigator.share({
          title: 'Video Episodes',
          text: `Split video: ${episodes.length} episodes ready in ZIP archive.`,
          files: [file],
        });
      } else if (navigator.share) {
        await navigator.share({
          title: 'Video Episodes',
          text: `Split video: ${episodes.length} episodes created successfully.`,
        });
      } else {
        handleDownloadZip();
      }
    } catch {
      // User cancelled share
    }
  };

  const handleDownloadSingleEpisode = (episode: EpisodeItem) => {
    soundService.triggerButtonHaptic();
    if (episode.blob) {
      triggerDownloadBlob(episode.blob, episode.fileName);
    }
  };

  return (
    <div id="completed-episodes-view" className="w-full space-y-6">
      {/* Top Banner */}
      <div className="w-full rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                ✓ Video Processing Complete
              </h2>
              <p className="text-xs sm:text-sm text-emerald-600 font-medium">
                Episodes Created: {episodes.length}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundService.triggerButtonHaptic();
              onReset();
            }}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-all self-end sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Select Another Video</span>
          </button>
        </div>

        {/* ZIP Download / Share Section */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Archive className="w-4 h-4 text-[#ff003f]" />
              <span className="text-sm font-bold text-slate-900">Export All Episodes</span>
              <span className="text-xs text-slate-500 font-mono">
                (Video Episodes.zip)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              id="download-zip-button"
              type="button"
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="w-full py-3.5 px-5 rounded-xl bg-[#ff003f] hover:bg-[#e00037] active:bg-[#c50030] text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-md shadow-rose-500/20 transition-all cursor-pointer"
            >
              {isZipping ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Packaging ZIP ({zipProgress}%)...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download All (.zip)</span>
                </>
              )}
            </button>

            <button
              id="share-zip-button"
              type="button"
              onClick={handleShareZip}
              disabled={isZipping}
              className="w-full py-3.5 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm flex items-center justify-center space-x-2 border border-slate-200 transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Share All (.zip)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Episode List Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-lg sm:text-xl font-black text-slate-900">
          Generated Episodes ({episodes.length})
        </h3>
        <span className="text-xs text-slate-500 font-mono">
          Plays Real MP4 + Real Audio
        </span>
      </div>

      {/* Scrollable Episode List */}
      <div className="w-full space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
        {episodes.map((episode) => (
          <div
            key={episode.id}
            id={`episode-card-${episode.episodeNumber}`}
            className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-sm"
          >
            {/* Episode Title & Timestamp Range */}
            <div className="flex items-center space-x-3.5 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-xs font-mono font-bold text-[#ff003f] shrink-0">
                #{episode.episodeNumber}
              </div>

              <div className="min-w-0">
                <h4 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                  Episode {episode.episodeNumber}
                </h4>
                <div className="flex items-center space-x-2 text-xs text-slate-500 font-mono">
                  <span>{episode.formattedRange}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-[#ff003f] font-semibold">{episode.durationSeconds.toFixed(0)}s</span>
                  {episode.hasAudio && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="text-emerald-600 font-sans font-medium text-[11px]">Audio Active</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons: [▶ Preview] [Save Video] */}
            <div className="flex items-center space-x-2 shrink-0">
              <button
                id={`preview-episode-${episode.episodeNumber}-button`}
                type="button"
                onClick={() => {
                  soundService.triggerButtonHaptic();
                  onPreviewEpisode(episode);
                }}
                className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-[#ff003f] hover:bg-[#e00037] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Preview</span>
              </button>

              <button
                id={`save-episode-${episode.episodeNumber}-button`}
                type="button"
                onClick={() => handleDownloadSingleEpisode(episode)}
                title={`Save ${episode.fileName}`}
                className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save Video</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
