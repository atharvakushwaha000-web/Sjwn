export function formatSecondsToTime(totalSeconds: number, forceHours: boolean = false): string {
  const rounded = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const seconds = rounded % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0 || forceHours) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

export const formatDuration = formatSecondsToTime;

export function formatSecondsRange(start: number, end: number, longFormat: boolean = false): string {
  if (longFormat) {
    return `${formatSecondsToTime(start, true)} → ${formatSecondsToTime(end, true)}`;
  }
  return `${formatSecondsToTime(start)}–${formatSecondsToTime(end)}`;
}

export function formatBytes(bytes: number, decimals: number = 1): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatResolution(width: number, height: number): string {
  if (!width || !height) return '';
  const minDim = Math.min(width, height);
  const maxDim = Math.max(width, height);

  if (maxDim >= 3840 || minDim >= 2160) return '4K';
  if (maxDim >= 2560 || minDim >= 1440) return '2K';
  if (maxDim >= 1920 || minDim >= 1080) return '1080p';
  if (maxDim >= 1280 || minDim >= 720) return '720p';
  if (maxDim >= 854 || minDim >= 480) return '480p';
  return `${width}x${height}`;
}
