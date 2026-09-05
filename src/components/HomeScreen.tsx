import React from 'react';
import {
  Scissors,
  FileText,
  Sliders,
  Volume2,
  Video,
  Film,
  ArrowRight,
} from 'lucide-react';
import { AppFeature } from '../types';

interface HomeScreenProps {
  onSelectFeature: (feature: AppFeature) => void;
  myVideosCount: number;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectFeature,
  myVideosCount,
}) => {
  const featureCards = [
    {
      id: 'auto-script' as AppFeature,
      cardNum: 1,
      title: 'AUTO SCRIPT VIDEO',
      description: 'Create and edit videos using a script.',
      icon: FileText,
      badge: 'Script & Dialogue',
    },
    {
      id: 'auto-cut' as AppFeature,
      cardNum: 2,
      title: 'AUTO CUT VIDEO',
      description: 'Automatically cut your video into 10-second clips.',
      icon: Scissors,
      badge: 'Core Feature',
      isPrimary: true,
    },
    {
      id: 'adjust-sync' as AppFeature,
      cardNum: 3,
      title: 'ADJUST VIDEO & AUDIO',
      description: 'Match your audio timing with your video.',
      icon: Sliders,
      badge: 'Content Sync',
    },
    {
      id: 'audio-tools' as AppFeature,
      cardNum: 4,
      title: 'AUDIO TOOLS',
      description: 'Reduce noise and manage your video audio.',
      icon: Volume2,
      badge: 'Denoise & Boost',
    },
    {
      id: 'video-tools' as AppFeature,
      cardNum: 5,
      title: 'VIDEO TOOLS',
      description: 'Adjust and process your video.',
      icon: Video,
      badge: 'Speed & Quality',
    },
    {
      id: 'my-videos' as AppFeature,
      cardNum: 6,
      title: 'MY VIDEOS',
      description: 'View your processed videos and episodes.',
      icon: Film,
      badge: myVideosCount > 0 ? `${myVideosCount} Ready` : 'Library',
    },
  ];

  return (
    <div id="home-screen-root" className="w-full max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div id="home-header" className="mb-10 text-center sm:text-left">
        <h1
          id="home-title"
          className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight"
        >
          Video Tools
        </h1>
        <p
          id="home-subtitle"
          className="text-base sm:text-lg text-slate-500 mt-2 font-medium"
        >
          Simple tools to edit, cut and adjust your videos.
        </p>
      </div>

      {/* Feature Cards Grid */}
      <div
        id="feature-cards-grid"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {featureCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              id={`feature-card-${card.id}`}
              className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between p-6 shadow-sm hover:shadow-md ${
                card.isPrimary
                  ? 'border-[#ff003f]/40 ring-1 ring-[#ff003f]/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      card.isPrimary
                        ? 'bg-[#ff003f] text-white shadow-md shadow-rose-500/20'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                    {card.badge}
                  </span>
                </div>

                <h2
                  id={`card-title-${card.id}`}
                  className="text-lg font-bold text-slate-900 mb-2 tracking-tight"
                >
                  {card.title}
                </h2>
                <p
                  id={`card-desc-${card.id}`}
                  className="text-sm text-slate-500 leading-relaxed min-h-[40px]"
                >
                  {card.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <button
                  id={`btn-open-${card.id}`}
                  type="button"
                  onClick={() => onSelectFeature(card.id)}
                  className={`w-full py-3 px-5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                    card.isPrimary
                      ? 'bg-[#ff003f] hover:bg-[#e00037] text-white shadow-sm hover:shadow shadow-rose-500/25'
                      : 'bg-slate-900 hover:bg-black text-white'
                  }`}
                >
                  <span>Open</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
