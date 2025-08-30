// Enhanced subtitle service with multiple providers
export interface SubtitleTrack {
  id: string;
  language: string;
  country: string;
  url: string;
  provider: string;
}

export interface SubtitleCue {
  start: number;
  end: number;
  text: string;
}

class SubtitleService {
  private readonly providers = [
    {
      name: 'OpenSubtitles',
      baseUrl: 'https://api.opensubtitles.com/api/v1',
      apiKey: 'ubzr1nyb4zG6xeYx3RorbzXaHXm1k4El'
    }
  ];

  async fetchSubtitles(tmdbId: number, mediaType: 'movie' | 'tv', season?: number, episode?: number): Promise<SubtitleTrack[]> {
    try {
      const endpoint = mediaType === 'movie' 
        ? `/api/subtitles/movie/${tmdbId}`
        : `/api/subtitles/tv/${tmdbId}/season/${season}/episode/${episode}`;
      
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`Failed to fetch subtitles: ${response.status}`);
      }
      
      const subtitles = await response.json();
      return subtitles.map((sub: any) => ({
        id: sub.id.toString(),
        language: sub.language,
        country: this.getCountryCode(sub.language),
        url: sub.url,
        provider: 'OpenSubtitles'
      }));
    } catch (error) {
      console.error('Failed to fetch subtitles:', error);
      return this.getFallbackSubtitles();
    }
  }

  private getCountryCode(language: string): string {
    const languageMap: Record<string, string> = {
      'en': 'US',
      'es': 'ES',
      'fr': 'FR',
      'de': 'DE',
      'it': 'IT',
      'pt': 'PT',
      'ru': 'RU',
      'ja': 'JP',
      'ko': 'KR',
      'zh': 'CN',
      'ar': 'SA',
      'hi': 'IN',
      'th': 'TH',
      'vi': 'VN',
      'tr': 'TR',
      'pl': 'PL',
      'nl': 'NL',
      'sv': 'SE',
      'da': 'DK',
      'no': 'NO',
      'fi': 'FI'
    };
    return languageMap[language] || 'US';
  }

  private getFallbackSubtitles(): SubtitleTrack[] {
    // Provide some common subtitle options as fallback
    return [
      { id: '1', language: 'English', country: 'US', url: '', provider: 'Fallback' },
      { id: '2', language: 'Spanish', country: 'ES', url: '', provider: 'Fallback' },
      { id: '3', language: 'French', country: 'FR', url: '', provider: 'Fallback' },
      { id: '4', language: 'German', country: 'DE', url: '', provider: 'Fallback' },
      { id: '5', language: 'Italian', country: 'IT', url: '', provider: 'Fallback' }
    ];
  }

  parseSRT(srtContent: string): SubtitleCue[] {
    const cues: SubtitleCue[] = [];
    const blocks = srtContent.trim().split(/\n\s*\n/);

    for (const block of blocks) {
      const lines = block.trim().split('\n');
      if (lines.length < 3) continue;

      const timeMatch = lines[1].match(/(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})/);
      if (!timeMatch) continue;

      const startTime = this.parseTime(timeMatch[1], timeMatch[2], timeMatch[3], timeMatch[4]);
      const endTime = this.parseTime(timeMatch[5], timeMatch[6], timeMatch[7], timeMatch[8]);
      const text = lines.slice(2).join('\n').replace(/<[^>]*>/g, '');

      cues.push({
        start: startTime,
        end: endTime,
        text: text.trim()
      });
    }

    return cues;
  }

  private parseTime(hours: string, minutes: string, seconds: string, milliseconds: string): number {
    return (
      parseInt(hours) * 3600 +
      parseInt(minutes) * 60 +
      parseInt(seconds) +
      parseInt(milliseconds) / 1000
    );
  }

  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

export const subtitleService = new SubtitleService();