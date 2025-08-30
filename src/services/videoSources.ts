// Enhanced video source management with p-stream integration
import { pstreamService, PStreamSource } from './pstream';

export interface VideoSource {
  id: string;
  name: string;
  quality: string;
  url: string;
  type: 'embed' | 'direct';
  provider: string;
  subtitles?: Array<{
    language: string;
    url: string;
    label: string;
  }>;
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
    let sources: VideoSource[] = [];
    
    // Try p-stream first for better quality sources
    try {
      const pstreamSources = await this.getPStreamSources(params);
      sources.push(...pstreamSources);
    } catch (error) {
      console.warn('P-Stream failed, falling back to legacy providers:', error);
    }
    
    // Add legacy providers as fallback
    const availableProviders = sourceProviders.filter(provider => {
      if (params.mediaType === 'anime') {
        return provider.id === 'vidplus' || provider.id === 'vidnest';
      }
      return true;
    });

    for (const provider of availableProviders) {
      try {
        const url = provider.generateUrl(params);
        const legacySource: VideoSource = {
          id: `${provider.id}-${Date.now()}`,
          name: provider.name,
          quality: 'Auto',
          url,
          type: 'embed',
          provider: provider.id
        };
        
        // Only add if we don't already have this provider from p-stream
        if (!sources.some(s => s.provider === provider.id)) {
          sources.push(legacySource);
        }
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

  private async getPStreamSources(params: {
    tmdbId?: string;
    anilistId?: string;
    seasonNumber?: number;
    episodeNumber?: number;
    mediaType: 'movie' | 'tv' | 'anime';
    isDub?: boolean;
  }): Promise<VideoSource[]> {
    let pstreamResponse;
    
    if (params.mediaType === 'movie' && params.tmdbId) {
      pstreamResponse = await pstreamService.getMovieSources(params.tmdbId);
    } else if (params.mediaType === 'tv' && params.tmdbId && params.seasonNumber && params.episodeNumber) {
      pstreamResponse = await pstreamService.getTVSources(params.tmdbId, params.seasonNumber, params.episodeNumber);
    } else if (params.mediaType === 'anime' && params.anilistId && params.episodeNumber) {
      pstreamResponse = await pstreamService.getAnimeSources(params.anilistId, params.episodeNumber, params.isDub);
    } else {
      return [];
    }

    if (!pstreamResponse.success) {
      // Try fallback sources from p-stream service
      const fallbackSources = pstreamService.getFallbackSources(params);
      return fallbackSources.map(source => ({
        id: source.id,
        name: source.name,
        quality: source.quality,
        url: source.url,
        type: source.type,
        provider: source.provider
      }));
    }

    return pstreamResponse.sources.map((source: PStreamSource) => ({
      id: source.id,
      name: source.name,
      quality: source.quality,
      url: source.url,
      type: source.type,
      provider: source.provider,
      subtitles: source.subtitles
    }));
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