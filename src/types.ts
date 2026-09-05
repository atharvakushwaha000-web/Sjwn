export type VideoQualityOption = 'original' | 'high' | 'medium';

export type AppFeature =
  | 'home'
  | 'auto-cut'
  | 'auto-script'
  | 'adjust-sync'
  | 'audio-tools'
  | 'video-tools'
  | 'my-videos';

export interface BackgroundMusicConfig {
  enabled: boolean;
  file?: File;
  fileName?: string;
  audioBuffer?: AudioBuffer;
  volume: number; // 0 to 1 (default 0.2)
  originalAudioVolume: number; // 0 to 1 (default 1.0)
  fadeIn: boolean;
  fadeOut: boolean;
}

export interface VideoMetadata {
  name: string;
  size: number; // in bytes
  duration: number; // in seconds
  width: number;
  height: number;
  fps?: number;
  mimeType: string;
  thumbnailUrl: string;
  blobUrl: string;
  hasAudio?: boolean;
  file?: File;
}

export interface AudioMetadata {
  name: string;
  size: number;
  duration: number;
  mimeType: string;
  blobUrl: string;
  file?: File;
}

export interface SplitConfig {
  intervalSeconds: number;
  totalEpisodes: number;
  videoQuality: VideoQualityOption;
  // Feature: Audio settings
  originalAudioVolume: number; // 0 to 1 (default 1.0)
  // Feature: Auto Video Noise Reduction (Default: OFF)
  autoVideoNoiseReduction: boolean;
  // Feature: Auto Audio Noise Reduction (Default: OFF)
  autoAudioNoiseReduction: boolean;
  // Feature: Auto Edit - Silence Cut Only
  autoEditSilenceCut: boolean;
  silenceThresholdDb: number; // default -35 dB
  minSilenceDurationSec: number; // default 0.5s
  // Feature: Background music
  backgroundMusic: BackgroundMusicConfig;
}

export interface EpisodeItem {
  id: number;
  episodeNumber: number;
  fileName: string;
  filePath: string;
  fileUri: string;
  startSeconds: number;
  endSeconds: number;
  durationSeconds: number;
  formattedRange: string;
  blob?: Blob;
  blobUrl?: string;
  size?: number;
  isReady: boolean;
  hasAudio?: boolean;
}

export type ProcessingStatus = 'idle' | 'preparing' | 'processing' | 'cancelled' | 'completed' | 'error';

export interface ProcessingProgress {
  currentEpisode: number;
  totalEpisodes: number;
  percent: number;
  currentSegmentStart: number;
  currentSegmentEnd: number;
  currentEpisodeElapsedSec: number;
  currentEpisodeTotalSec: number;
  overallCurrentSeconds: number;
  overallTotalSeconds: number;
  estimatedRemainingSeconds: number | null;
  speed: string;
  currentTask?: string;
}

export interface AudioSyncResult {
  offsetSeconds: number;
  confidence: number; // 0.0 to 1.0
  isManualOverride?: boolean;
  statusMessage?: string;
  alignedVideoBlob?: Blob;
  alignedVideoUrl?: string;
}

export interface ScriptScene {
  id: string;
  sceneNumber: number;
  startTime: number;
  endTime: number;
  scriptText: string;
  speaker?: string;
}

export interface AndroidProjectFile {
  path: string;
  content: string;
  description: string;
  category: 'manifest' | 'gradle' | 'kotlin' | 'resource' | 'proguard' | 'documentation';
}
