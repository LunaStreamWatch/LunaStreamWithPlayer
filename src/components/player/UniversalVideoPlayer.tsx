import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, Subtitles, RotateCcw, RotateCw, Monitor, RefreshCw, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { subtitleService, SubtitleTrack, SubtitleCue } from '../../services/subtitles';
import { videoSourceService, VideoSource } from '../../services/videoSources';
import { pstreamService } from '../../services/pstream';
import { SourceSelector } from './SourceSelector';
import { SubtitleMenu } from './SubtitleMenu';
import { SettingsMenu } from './SettingsMenu';
import { PlayerSettings } from '../../types/player';

interface UniversalVideoPlayerProps {
  tmdbId?: string;
  anilistId?: string;
  mediaType: 'movie' | 'tv' | 'anime';
  seasonNumber?: number;
  episodeNumber?: number;
  title: string;
  poster?: string;
  onClose: () => void;
  isDub?: boolean;
  onDubChange?: (isDub: boolean) => void;
}

export const UniversalVideoPlayer: React.FC<UniversalVideoPlayerProps> = ({
  tmdbId,
  anilistId,
  mediaType,
  seasonNumber,
  episodeNumber,
  title,
  poster,
  onClose,
  isDub = false,
  onDubChange
}) => {
  const [sources, setSources] = useState<VideoSource[]>([]);
  const [currentSource, setCurrentSource] = useState<VideoSource | null>(null);
  const [subtitleTracks, setSubtitleTracks] = useState<SubtitleTrack[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState<string | null>(null);
  const [subtitleCues, setSubtitleCues] = useState<SubtitleCue[]>([]);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  const [showSourceMenu, setShowSourceMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [sourceError, setSourceError] = useState<string | null>(null);
  const [playerSettings, setPlayerSettings] = useState<PlayerSettings>({
    playbackSpeed: 1,
    subtitleSettings: {
      fontSize: 16,
      color: '#ffffff',
      delay: 0,
      backgroundColor: '#000000',
      backgroundOpacity: 0.8
    },
    theme: 'dark'
  });

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  // Load sources and subtitles
  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      setError(null);
      setSourceError(null);

      try {
        // Get video sources with p-stream integration
        const videoSources = await videoSourceService.getSources({
          tmdbId,
          anilistId,
          seasonNumber,
          episodeNumber,
          mediaType,
          isDub
        });

        if (videoSources.length === 0) {
          setSourceError('No video sources available from any provider');
          // Try direct p-stream fallback
          const fallbackSources = pstreamService.getFallbackSources({
            tmdbId,
            anilistId,
            seasonNumber,
            episodeNumber,
            mediaType,
            isDub
          });
          
          if (fallbackSources.length > 0) {
            const convertedSources = fallbackSources.map(source => ({
              id: source.id,
              name: source.name,
              quality: source.quality,
              url: source.url,
              type: source.type as 'embed' | 'direct',
              provider: source.provider
            }));
            setSources(convertedSources);
            setCurrentSource(convertedSources[0]);
          } else {
            throw new Error('No video sources available from any provider');
          }
        } else {
          setSources(videoSources);
          setCurrentSource(videoSources[0]);
        }


        // Get subtitles for non-anime content
        if (mediaType !== 'anime' && tmdbId) {
          const subs = await subtitleService.fetchSubtitles(
            parseInt(tmdbId),
            mediaType,
            seasonNumber,
            episodeNumber
          );
          setSubtitleTracks(subs);
        } else if (mediaType === 'anime' && !isDub) {
          // For anime sub, we might want to show subtitle options
          setSubtitleTracks([
            {
              id: 'anime-en',
              language: 'English',
              country: 'US',
              url: '',
              provider: 'embedded'
            }
          ]);
        }
      } catch (err) {
        console.error('Failed to load content:', err);
        setError(err instanceof Error ? err.message : 'Failed to load video');
      } finally {
        setLoading(false);
      }
    };

    loadContent();
    setRetryCount(0);
  }, [tmdbId, anilistId, mediaType, seasonNumber, episodeNumber, isDub]);

  // Load subtitle content when track is selected
  useEffect(() => {
    const loadSubtitleContent = async () => {
      if (!currentSubtitle) {
        setSubtitleCues([]);
        return;
      }

      const track = subtitleTracks.find(t => t.id === currentSubtitle);
      if (!track || !track.url) {
        setSubtitleCues([]);
        return;
      }

      try {
        const response = await fetch(track.url);
        const srtContent = await response.text();
        const cues = subtitleService.parseSRT(srtContent);
        setSubtitleCues(cues);
      } catch (error) {
        console.error('Failed to load subtitle content:', error);
        setSubtitleCues([]);
      }
    };

    loadSubtitleContent();
  }, [currentSubtitle, subtitleTracks]);

  // Auto-hide controls
  const showControlsTemporarily = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const handleMouseMove = () => {
    showControlsTemporarily();
  };

  const handleSourceChange = (source: VideoSource) => {
    setCurrentSource(source);
    setShowSourceMenu(false);
    setSourceError(null);
  };

  const handleSubtitleChange = (trackId: string | null) => {
    setCurrentSubtitle(trackId);
    setShowSubtitleMenu(false);
  };

  const handleRetryLoad = () => {
    setRetryCount(prev => prev + 1);
    setError(null);
    setSourceError(null);
    
    // Trigger reload by updating a dependency
    const loadContent = async () => {
      setLoading(true);
      try {
        const videoSources = await videoSourceService.getSources({
          tmdbId,
          anilistId,
          seasonNumber,
          episodeNumber,
          mediaType,
          isDub
        });
        
        if (videoSources.length > 0) {
          setSources(videoSources);
          setCurrentSource(videoSources[0]);
          setError(null);
        } else {
          throw new Error('No sources available after retry');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Retry failed');
      } finally {
        setLoading(false);
      }
    };
    
    loadContent();
  };
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'Escape':
          onClose();
          break;
        case 'Space':
          e.preventDefault();
          showControlsTemporarily();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full animate-spin flex items-center justify-center mb-4">
            <Play className="w-8 h-8 text-white" />
          </div>
          <p className="text-white text-lg">Loading player...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-4 animate-pulse">
            <AlertCircle className="w-8 h-8 text-white" />
          </div>
          <p className="text-white text-lg mb-4">{error}</p>
          {sourceError && (
            <p className="text-red-400 text-sm mb-4">Source Error: {sourceError}</p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleRetryLoad}
              disabled={loading}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              <span>Retry ({retryCount}/3)</span>
            </button>
            <button
              onClick={onClose}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-pink-600 hover:to-purple-700 transition-all duration-200"
            >
              Close Player
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black z-50"
      onMouseMove={handleMouseMove}
    >
      {/* Controls Overlay */}
      <div className={`absolute inset-0 z-10 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        {/* Top Controls */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white text-xl font-semibold">{title}</h1>
              {mediaType === 'tv' && seasonNumber && episodeNumber && (
                <p className="text-gray-300 text-sm">Season {seasonNumber}, Episode {episodeNumber}</p>
              )}
              {mediaType === 'anime' && episodeNumber && (
                <p className="text-gray-300 text-sm">Episode {episodeNumber}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300 transition-colors p-2"
              aria-label="Close Player"
            >
              <X className="w-8 h-8" />
            </button>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
          <div className="flex items-center justify-between">
            {/* Left Controls */}
            <div className="flex items-center space-x-4">
              {/* Enhanced Source Selector */}
              <SourceSelector
                isOpen={showSourceMenu}
                onToggle={() => setShowSourceMenu(!showSourceMenu)}
                sources={sources}
                currentSource={currentSource}
                onSourceChange={handleSourceChange}
                onRetry={handleRetryLoad}
              />

              {/* Enhanced Subtitle Menu */}
              <SubtitleMenu
                isOpen={showSubtitleMenu}
                onToggle={() => setShowSubtitleMenu(!showSubtitleMenu)}
                subtitleTracks={subtitleTracks}
                currentSubtitle={currentSubtitle}
                onSubtitleChange={handleSubtitleChange}
              />
            </div>

            {/* Right Controls */}
            <div className="flex items-center space-x-4">
              {/* Anime Audio Toggle */}
              {mediaType === 'anime' && onDubChange && (
                <div className="flex items-center space-x-2 bg-black/50 rounded-lg p-2">
                  <span className="text-white text-sm mr-2">Audio:</span>
                  <button
                    onClick={() => onDubChange(false)}
                    className={`px-3 py-1 rounded-md text-sm transition-colors ${
                      !isDub ? 'bg-pink-500 text-white' : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    Sub
                  </button>
                  <button
                    onClick={() => onDubChange(true)}
                    className={`px-3 py-1 rounded-md text-sm transition-colors ${
                      isDub ? 'bg-pink-500 text-white' : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    Dub
                  </button>
                </div>
              )}

              {/* Enhanced Settings Menu */}
              <SettingsMenu
                isOpen={showSettings}
                onToggle={() => setShowSettings(!showSettings)}
                settings={playerSettings}
                onSettingsChange={setPlayerSettings}
              />
            </div>
          </div>
        </div>

        {/* Source Status Indicator */}
        {currentSource && (
          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1 flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-white text-sm">{currentSource.name}</span>
            <span className="text-gray-300 text-xs">({currentSource.provider})</span>
          </div>
        )}
      </div>

      {/* Video Player */}
      {currentSource && (
        <iframe
          ref={iframeRef}
          src={currentSource.url}
          className="w-full h-full border-0"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          title={title}
          referrerPolicy="no-referrer"
          onError={() => {
            setSourceError(`Failed to load ${currentSource.name}`);
          }}
          onLoad={() => {
            setSourceError(null);
          }}
        />
      )}

      {/* Subtitle Overlay */}
      {currentSubtitle && subtitleCues.length > 0 && !isDub && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 pointer-events-none z-20">
          <div className="bg-black/80 text-white px-4 py-2 rounded-lg text-center max-w-md">
            {/* This would need actual video time tracking for real implementation */}
            <div className="text-lg font-medium">
              Subtitles: {currentSubtitle}
            </div>
          </div>
        </div>
      )}
      
      {/* Debug Info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-20 left-4 bg-black/80 text-white p-2 rounded text-xs max-w-xs">
          <div>Media: {mediaType}</div>
          <div>TMDB: {tmdbId || 'N/A'}</div>
          <div>AniList: {anilistId || 'N/A'}</div>
          {seasonNumber && <div>Season: {seasonNumber}</div>}
          {episodeNumber && <div>Episode: {episodeNumber}</div>}
          <div>Audio: {isDub ? 'Dub' : 'Sub'}</div>
          <div>Sources: {sources.length}</div>
          <div>Provider: {currentSource?.provider || 'None'}</div>
        </div>
      )}
    </div>
  );
};