// P-Stream service for fetching video sources from multiple providers
export interface PStreamSource {
  id: string;
  name: string;
  quality: string;
  url: string;
  type: 'embed' | 'direct';
  provider: string;
  subtitles?: PStreamSubtitle[];
}

export interface PStreamSubtitle {
  language: string;
  url: string;
  label: string;
}

export interface PStreamResponse {
  sources: PStreamSource[];
  subtitles: PStreamSubtitle[];
  success: boolean;
  message?: string;
}

class PStreamService {
  private readonly baseUrl = 'https://pstream.vercel.app';
  
  async getMovieSources(tmdbId: string): Promise<PStreamResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/movie/${tmdbId}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return this.formatResponse(data);
    } catch (error) {
      console.error('P-Stream movie fetch error:', error);
      return { sources: [], subtitles: [], success: false, message: error.message };
    }
  }

  async getTVSources(tmdbId: string, season: number, episode: number): Promise<PStreamResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/tv/${tmdbId}/${season}/${episode}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return this.formatResponse(data);
    } catch (error) {
      console.error('P-Stream TV fetch error:', error);
      return { sources: [], subtitles: [], success: false, message: error.message };
    }
  }

  async getAnimeSources(anilistId: string, episode: number, isDub: boolean = false): Promise<PStreamResponse> {
    try {
      const audioType = isDub ? 'dub' : 'sub';
      const response = await fetch(`${this.baseUrl}/anime/${anilistId}/${episode}?type=${audioType}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return this.formatResponse(data, isDub);
    } catch (error) {
      console.error('P-Stream anime fetch error:', error);
      return { sources: [], subtitles: [], success: false, message: error.message };
    }
  }

  private formatResponse(data: any, isDub: boolean = false): PStreamResponse {
    const sources: PStreamSource[] = [];
    const subtitles: PStreamSubtitle[] = [];

    // Handle different response formats from p-stream
    if (data.sources && Array.isArray(data.sources)) {
      data.sources.forEach((source: any, index: number) => {
        sources.push({
          id: `pstream-${index}`,
          name: source.name || source.server || `Source ${index + 1}`,
          quality: source.quality || 'Auto',
          url: source.url,
          type: 'embed',
          provider: 'p-stream',
          subtitles: source.subtitles || []
        });
      });
    }

    // Handle direct source format
    if (data.url) {
      sources.push({
        id: 'pstream-direct',
        name: 'P-Stream Direct',
        quality: data.quality || 'Auto',
        url: data.url,
        type: 'direct',
        provider: 'p-stream'
      });
    }

    // Handle subtitles
    if (data.subtitles && Array.isArray(data.subtitles)) {
      data.subtitles.forEach((sub: any) => {
        subtitles.push({
          language: sub.language || sub.lang || 'Unknown',
          url: sub.url,
          label: sub.label || sub.language || 'Unknown'
        });
      });
    }

    // For anime dub, we might not need subtitles
    if (isDub && subtitles.length === 0) {
      subtitles.push({
        language: 'English',
        url: '',
        label: 'English Dub (No Subtitles)'
      });
    }

    return {
      sources,
      subtitles,
      success: sources.length > 0,
      message: sources.length === 0 ? 'No sources available' : undefined
    };
  }

  async testSourceAvailability(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { 
        method: 'HEAD', 
        mode: 'no-cors',
        signal: AbortSignal.timeout(5000)
      });
      return true;
    } catch {
      return false;
    }
  }

  // Fallback sources when p-stream fails
  getFallbackSources(params: {
    tmdbId?: string;
    anilistId?: string;
    seasonNumber?: number;
    episodeNumber?: number;
    mediaType: 'movie' | 'tv' | 'anime';
    isDub?: boolean;
  }): PStreamSource[] {
    const fallbackSources: PStreamSource[] = [];
    
    // VidPlus fallback
    try {
      const baseUrl = "https://player.vidplus.to/embed";
      const playerParams = new URLSearchParams({
        primarycolor: "fbc9ff",
        secondarycolor: "f8b4ff",
        iconcolor: "fbc9ff",
        autoplay: "true",
        poster: "true",
        title: "true",
        watchparty: "false"
      });

      let url = '';
      if (params.mediaType === "movie" && params.tmdbId) {
        url = `${baseUrl}/movie/${params.tmdbId}?${playerParams.toString()}`;
      } else if (params.mediaType === "tv" && params.tmdbId && params.seasonNumber && params.episodeNumber) {
        url = `${baseUrl}/tv/${params.tmdbId}/${params.seasonNumber}/${params.episodeNumber}?${playerParams.toString()}`;
      } else if (params.mediaType === "anime" && params.anilistId && params.episodeNumber) {
        const animeParams = new URLSearchParams({
          ...Object.fromEntries(playerParams),
          dub: (params.isDub || false).toString()
        });
        url = `${baseUrl}/anime/${params.anilistId}/${params.episodeNumber}?${animeParams.toString()}`;
      }

      if (url) {
        fallbackSources.push({
          id: 'vidplus-fallback',
          name: 'VidPlus (Fallback)',
          quality: 'Auto',
          url,
          type: 'embed',
          provider: 'vidplus'
        });
      }
    } catch (error) {
      console.warn('VidPlus fallback failed:', error);
    }

    return fallbackSources;
  }
}

export const pstreamService = new PStreamService();