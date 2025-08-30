import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, Subtitles, RotateCcw, RotateCw, Monitor } from 'lucide-react';
import { subtitleService, SubtitleTrack, SubtitleCue } from '../../services/subtitles';
import { videoSourceService, VideoSource } from '../../services/videoSources';

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

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  // Load sources and subtitles
  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get video sources
        const videoSources = await videoSourceService.getSources({
          tmdbId,
          anilistId,
          seasonNumber,
          episodeNumber,
          mediaType,
          isDub
        });

        if (videoSources.length === 0) {
          throw new Error('No video sources available');
        }

        setSources(videoSources);
        setCurrentSource(videoSources[0]);

        // Get subtitles for non-anime content
        if (mediaType !== 'anime' && tmdbId) {
          const subs = await subtitleService.fetchSubtitles(
            parseInt(tmdbId),
            mediaType,
            seasonNumber,
            episodeNumber
          );
          setSubtitleTracks(subs);
        }
      } catch (err) {
        console.error('Failed to load content:', err);
        setError(err instanceof Error ? err.message : 'Failed to load video');
      } finally {
        setLoading(false);
      }
    };

    loadContent();
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
  };

  const handleSubtitleChange = (trackId: string | null) => {
    setCurrentSubtitle(trackId);
    setShowSubtitleMenu(false);
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
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-4">
            <X className="w-8 h-8 text-white" />
          </div>
          <p className="text-white text-lg mb-4">{error}</p>
          <button
            onClick={onClose}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-pink-600 hover:to-purple-700 transition-all duration-200"
          >
            Close Player
          </button>
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
              {/* Source Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowSourceMenu(!showSourceMenu)}
                  className="text-white hover:text-pink-400 transition-colors p-2 bg-black/50 rounded-lg"
                  aria-label="Video Sources"
                >
                  <Monitor className="w-5 h-5" />
                </button>
                
                {showSourceMenu && (
                  <div className="absolute bottom-full left-0 mb-2 bg-black/90 backdrop-blur-sm rounded-lg border border-white/20 min-w-[200px] overflow-hidden">
                    <div className="p-2">
                      <div className="text-white text-sm font-medium mb-2 px-2">Video Sources</div>
                      {sources.map((source) => (
                        <button
                          key={source.id}
                          onClick={() => handleSourceChange(source)}
                          className={`w-full text-left px-2 py-2 text-white hover:bg-white/10 rounded text-sm flex items-center justify-between ${
                            currentSource?.id === source.id ? 'bg-pink-500/20' : ''
                          }`}
                        >
                          <span>{source.name}</span>
                          {currentSource?.id === source.id && (
                            <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Subtitle Selector */}
              {subtitleTracks.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setShowSubtitleMenu(!showSubtitleMenu)}
                    className="text-white hover:text-pink-400 transition-colors p-2 bg-black/50 rounded-lg"
                    aria-label="Subtitles"
                  >
                    <Subtitles className="w-5 h-5" />
                  </button>
                  
                  {showSubtitleMenu && (
                    <div className="absolute bottom-full left-0 mb-2 bg-black/90 backdrop-blur-sm rounded-lg border border-white/20 min-w-[200px] overflow-hidden">
                      <div className="p-2">
                        <div className="text-white text-sm font-medium mb-2 px-2">Subtitles</div>
                        
                        <button
                          onClick={() => handleSubtitleChange(null)}
                          className={`w-full text-left px-2 py-2 text-white hover:bg-white/10 rounded text-sm flex items-center justify-between ${
                            !currentSubtitle ? 'bg-pink-500/20' : ''
                          }`}
                        >
                          <span>Off</span>
                          {!currentSubtitle && <div className="w-2 h-2 bg-pink-500 rounded-full"></div>}
                        </button>
                        
                        {subtitleTracks.map((track) => (
                          <button
                            key={track.id}
                            onClick={() => handleSubtitleChange(track.id)}
                            className={`w-full text-left px-2 py-2 text-white hover:bg-white/10 rounded text-sm flex items-center justify-between ${
                              currentSubtitle === track.id ? 'bg-pink-500/20' : ''
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <img
                                src={`https://flagsapi.com/${track.country}/flat/24.png`}
                                alt={`${track.country} flag`}
                                className="w-4 h-3 rounded-sm"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                              <span>{track.language}</span>
                            </div>
                            {currentSubtitle === track.id && (
                              <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Controls */}
            <div className="flex items-center space-x-4">
              {/* Anime Audio Toggle */}
              {mediaType === 'anime' && onDubChange && (
                <div className="flex items-center space-x-2 bg-black/50 rounded-lg p-2">
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

              {/* Settings */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="text-white hover:text-pink-400 transition-colors p-2 bg-black/50 rounded-lg"
                aria-label="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="absolute top-20 right-6 bg-black/90 backdrop-blur-sm rounded-lg border border-white/20 p-4 min-w-[250px]">
            <h3 className="text-white font-semibold mb-3">Player Settings</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-white text-sm block mb-1">Video Quality</label>
                <select className="w-full bg-gray-800 text-white rounded px-3 py-1 text-sm">
                  <option>Auto</option>
                  <option>1080p</option>
                  <option>720p</option>
                  <option>480p</option>
                </select>
              </div>
              
              <div>
                <label className="text-white text-sm block mb-1">Playback Speed</label>
                <select className="w-full bg-gray-800 text-white rounded px-3 py-1 text-sm">
                  <option value="0.5">0.5x</option>
                  <option value="0.75">0.75x</option>
                  <option value="1" selected>1x</option>
                  <option value="1.25">1.25x</option>
                  <option value="1.5">1.5x</option>
                  <option value="2">2x</option>
                </select>
              </div>
            </div>
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
        />
      )}

      {/* Subtitle Overlay */}
      {currentSubtitle && subtitleCues.length > 0 && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 pointer-events-none z-20">
          <div className="bg-black/80 text-white px-4 py-2 rounded-lg text-center max-w-md">
            {/* This would need actual video time tracking for real implementation */}
            <div className="text-lg font-medium">
              Subtitles: {currentSubtitle}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};