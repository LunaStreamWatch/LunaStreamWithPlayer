import React from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward } from 'lucide-react';

interface VideoControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
  isMuted: boolean;
  onMute: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  isFullscreen: boolean;
  onFullscreenToggle: () => void;
  onSkipBack?: () => void;
  onSkipForward?: () => void;
}

export function VideoControls({
  isPlaying,
  onPlayPause,
  volume,
  onVolumeChange,
  isMuted,
  onMute,
  currentTime,
  duration,
  onSeek,
  isFullscreen,
  onFullscreenToggle,
  onSkipBack,
  onSkipForward
}: VideoControlsProps) {
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center space-x-4 w-full">
      {/* Skip Back */}
      {onSkipBack && (
        <button
          onClick={onSkipBack}
          className="text-white hover:text-[#fbc9ff] transition-colors duration-200 p-1"
          aria-label="Skip back 10 seconds"
        >
          <SkipBack className="w-5 h-5" />
        </button>
      )}

      {/* Play/Pause */}
      <button
        onClick={onPlayPause}
        className="text-white hover:text-[#fbc9ff] transition-colors duration-200 p-1"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
      </button>

      {/* Skip Forward */}
      {onSkipForward && (
        <button
          onClick={onSkipForward}
          className="text-white hover:text-[#fbc9ff] transition-colors duration-200 p-1"
          aria-label="Skip forward 10 seconds"
        >
          <SkipForward className="w-5 h-5" />
        </button>
      )}

      {/* Time Display */}
      <div className="text-white text-sm font-mono">
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>

      {/* Progress Bar */}
      <div className="flex-1 mx-4">
        <div className="relative">
          <div className="w-full h-1 bg-white/30 rounded-full cursor-pointer">
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-full transition-all duration-150"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <input
            type="range"
            min="0"
            max={duration}
            value={currentTime}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
      </div>

      {/* Volume Controls */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onMute}
          className="text-white hover:text-[#fbc9ff] transition-colors duration-200 p-1"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
        <input
          type="range"
          min="0"
          max="100"
          value={isMuted ? 0 : volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          className="w-20 h-1 bg-white/30 rounded-full appearance-none cursor-pointer"
        />
      </div>

      {/* Fullscreen */}
      <button
        onClick={onFullscreenToggle}
        className="text-white hover:text-[#fbc9ff] transition-colors duration-200 p-1"
        aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      >
        {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
      </button>
    </div>
  );
}