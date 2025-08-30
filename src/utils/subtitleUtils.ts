import { SubtitleTrack } from '../services/subtitles';

// Legacy subtitle utilities - keeping for backward compatibility
export function extractContentId(videoUrl: string): string {
  const hash = btoa(videoUrl).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  return hash;
}

// Check if Chromecast is available
export function isChromecastAvailable(): boolean {
  return 'chrome' in window && 'cast' in (window as any).chrome;
}

// Initialize Chromecast
export function initializeChromecast(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!isChromecastAvailable()) {
      reject(new Error('Chromecast not available'));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
    script.onload = () => {
      (window as any).__onGCastApiAvailable = (isAvailable: boolean) => {
        if (isAvailable) {
          resolve();
        } else {
          reject(new Error('Cast API not available'));
        }
      };
    };
    script.onerror = () => reject(new Error('Failed to load Cast SDK'));
    document.head.appendChild(script);
  });
}