/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Header } from './components/Header';
import { HomeScreen } from './components/HomeScreen';
import { AutoCutScreen } from './components/AutoCutScreen';
import { AdjustSyncScreen } from './components/AdjustSyncScreen';
import { AutoScriptScreen } from './components/AutoScriptScreen';
import { AudioToolsScreen } from './components/AudioToolsScreen';
import { VideoToolsScreen } from './components/VideoToolsScreen';
import { MyVideosScreen } from './components/MyVideosScreen';
import { AndroidProjectModal } from './components/AndroidProjectModal';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { AppFeature, EpisodeItem } from './types';
import { soundService } from './utils/audioEffects';

export default function App() {
  const [currentFeature, setCurrentFeature] = useState<AppFeature>('home');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(soundService.soundEnabled);
  const [savedEpisodes, setSavedEpisodes] = useState<EpisodeItem[]>([]);

  // Modals
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState<boolean>(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState<boolean>(false);

  const handleToggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    soundService.setSoundEnabled(nextVal);
  };

  const handleSaveEpisodes = (newEpisodes: EpisodeItem[]) => {
    setSavedEpisodes((prev) => {
      const existingIds = new Set(prev.map((e) => e.id));
      const filtered = newEpisodes.filter((e) => !existingIds.has(e.id));
      return [...filtered, ...prev];
    });
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col selection:bg-[#ff003f]/20 selection:text-[#ff003f]">
      {/* Production Header */}
      <Header
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenAndroidCode={() => setIsAndroidModalOpen(true)}
        onOpenPrivacyPolicy={() => setIsPrivacyModalOpen(true)}
        onNavigateHome={() => setCurrentFeature('home')}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full bg-[#fafafa]">
        {currentFeature === 'home' && (
          <HomeScreen
            onSelectFeature={(feat) => {
              soundService.triggerButtonHaptic();
              setCurrentFeature(feat);
            }}
            myVideosCount={savedEpisodes.length}
          />
        )}

        {currentFeature === 'auto-cut' && (
          <AutoCutScreen
            onBack={() => setCurrentFeature('home')}
            onSaveCompletedEpisodes={handleSaveEpisodes}
          />
        )}

        {currentFeature === 'adjust-sync' && (
          <AdjustSyncScreen
            onBack={() => setCurrentFeature('home')}
            onSaveCompletedEpisode={(item) => handleSaveEpisodes([item])}
          />
        )}

        {currentFeature === 'auto-script' && (
          <AutoScriptScreen onBack={() => setCurrentFeature('home')} />
        )}

        {currentFeature === 'audio-tools' && (
          <AudioToolsScreen onBack={() => setCurrentFeature('home')} />
        )}

        {currentFeature === 'video-tools' && (
          <VideoToolsScreen onBack={() => setCurrentFeature('home')} />
        )}

        {currentFeature === 'my-videos' && (
          <MyVideosScreen
            episodes={savedEpisodes}
            onBack={() => setCurrentFeature('home')}
            onOpenAutoCut={() => setCurrentFeature('auto-cut')}
            onClearEpisodes={() => setSavedEpisodes([])}
          />
        )}
      </main>

      {/* Android Native Source Code (.ZIP) Modal */}
      {isAndroidModalOpen && (
        <AndroidProjectModal onClose={() => setIsAndroidModalOpen(false)} />
      )}

      {/* Privacy Policy & Google Play Checklist Modal */}
      {isPrivacyModalOpen && (
        <PrivacyPolicyModal onClose={() => setIsPrivacyModalOpen(false)} />
      )}
    </div>
  );
}
