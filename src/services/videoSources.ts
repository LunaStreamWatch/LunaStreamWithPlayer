// Video source management with multiple providers
export interface VideoSource {
  id: string;
  name: string;
  quality: string;
  url: string;
  type: 'embed' | 'direct';
  provider: string;
}

export interface SourceProvider {
  id: string;
  name: string;
  priority: number;
  generateUrl: (params: {
    tmdbId?: string;
    anilistId?: string;
    seasonNumber?: number;
    episodeNumber?: number;
    mediaType: 'movie' | 'tv' | 'anime';
    isDub?: boolean;
  }) => string;
  supportsSubtitles: boolean;
  supportsQualitySelection: boolean;
}

export const sourceProviders: SourceProvider[] = [
  {
    id: 'vidplus',
    name: 'VidPlus',
    priority: 1,
    generateUrl: ({ tmdbId, anilistId, seasonNumber, episodeNumber, mediaType, isDub = false }) => {
      const baseUrl = 'https://player.vidplus.to/embed';
      const playerParams = new URLSearchParams({
        primarycolor: 'fbc9ff',
        secondarycolor: 'f8b4ff',
        iconcolor: 'fbc9ff',
        autoplay: 'true',
        poster: 'true',
        title: 'true',
        watchparty: 'false'
      });

      if (mediaType === 'movie' && tmdbId) {
        return `${baseUrl}/movie/${tmdbId}?${playerParams.toString()}`;
      } else if (mediaType === 'tv' && tmdbId && seasonNumber && episodeNumber) {
        return `${baseUrl}/tv/${tmdbId}/${seasonNumber}/${episodeNumber}?${playerParams.toString()}`;
      } else if (mediaType === 'anime' && anilistId && episodeNumber) {
        const animeParams = new URLSearchParams({
          ...Object.fromEntries(playerParams),
          dub: isDub.toString()
        });
        return `${baseUrl}/anime/${anilistId}/${episodeNumber}?${animeParams.toString()}`;
      }
      
      throw new Error(`Invalid parameters for ${mediaType}`);
    },
    supportsSubtitles: true,
    supportsQualitySelection: true
  },
  {
    id: 'vidnest',
    name: 'Vidnest',
    priority: 2,
    generateUrl: ({ tmdbId, anilistId, seasonNumber, episodeNumber, mediaType, isDub = false }) => {
      if (mediaType === 'movie' && tmdbId) {
        return `https://vidnest.fun/movie/${tmdbId}`;
      } else if (mediaType === 'tv' && tmdbId && seasonNumber && episodeNumber) {
        return `https://vidnest.fun/tv/${tmdbId}/${seasonNumber}/${episodeNumber}`;
      } else if (mediaType === 'anime' && anilistId && episodeNumber) {
        return `https://vidnest.fun/anime/${anilistId}/${episodeNumber}/${isDub ? 'dub' : 'sub'}`;
      }
      
      throw new Error(`Invalid parameters for ${mediaType}`);
    },
    supportsSubtitles: false,
    supportsQualitySelection: false
  },
  {
    id: 'superembed',
    name: 'SuperEmbed',
    priority: 3,
    generateUrl: ({ tmdbId, seasonNumber, episodeNumber, mediaType }) => {
      if (mediaType === 'movie' && tmdbId) {
        return `https://multiembed.mov/directstream.php?video_id=${tmdbId}&tmdb=1`;
      } else if (mediaType === 'tv' && tmdbId && seasonNumber && episodeNumber) {
        return `https://multiembed.mov/directstream.php?video_id=${tmdbId}&tmdb=1&s=${seasonNumber}&e=${episodeNumber}`;
      }
      
      throw new Error(`SuperEmbed does not support ${mediaType}`);
    },
    supportsSubtitles: false,
    supportsQualitySelection: false
  }
];

class VideoSourceService {
  async getSources(params: {
    tmdbId?: string;
    anilistId?: string;
    seasonNumber?: number;
    episodeNumber?: number;
    mediaType: 'movie' | 'tv' | 'anime';
    isDub?: boolean;
  }): Promise<VideoSource[]> {
    const sources: VideoSource[] = [];
    
    // Filter providers based on media type
    const availableProviders = sourceProviders.filter(provider => {
      if (params.mediaType === 'anime') {
        return provider.id === 'vidplus' || provider.id === 'vidnest';
      }
      return true;
    });

    for (const provider of availableProviders) {
      try {
        const url = provider.generateUrl(params);
        sources.push({
          id: `${provider.id}-${Date.now()}`,
          name: provider.name,
          quality: 'Auto',
          url,
          type: 'embed',
          provider: provider.id
        });
      } catch (error) {
        console.warn(`Provider ${provider.name} failed:`, error);
      }
    }

    return sources.sort((a, b) => {
      const providerA = sourceProviders.find(p => p.id === a.provider);
      const providerB = sourceProviders.find(p => p.id === b.provider);
      return (providerA?.priority || 999) - (providerB?.priority || 999);
    });
  }

  getDefaultSource(sources: VideoSource[]): VideoSource | null {
    return sources.length > 0 ? sources[0] : null;
  }

  async testSourceAvailability(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
      return true; // If no error, assume it's available
    } catch {
      return false;
    }
  }
}

export const videoSourceService = new VideoSourceService();