import React from 'react';
import { Monitor, Check, Wifi, WifiOff } from 'lucide-react';
import { VideoSource } from '../../services/videoSources';

interface SourceSelectorProps {
  isOpen: boolean;
  onToggle: () => void;
  sources: VideoSource[];
  currentSource: VideoSource | null;
  onSourceChange: (source: VideoSource) => void;
  onRetry?: () => void;
}

export function SourceSelector({
  isOpen,
  onToggle,
  sources,
  currentSource,
  onSourceChange,
  onRetry
}: SourceSelectorProps) {
  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="text-white hover:text-[#fbc9ff] transition-colors duration-200 p-1"
        aria-label="Video Sources"
      >
        <Monitor className="w-5 h-5" />
      </button>
    );
  }

  const groupedSources = sources.reduce((acc, source) => {
    if (!acc[source.provider]) {
      acc[source.provider] = [];
    }
    acc[source.provider].push(source);
    return acc;
  }, {} as Record<string, VideoSource[]>);

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="text-[#fbc9ff] transition-colors duration-200 p-1"
        aria-label="Video Sources"
      >
        <Monitor className="w-5 h-5" />
      </button>
      
      <div className="absolute bottom-full left-0 mb-2 bg-black/90 backdrop-blur-sm rounded-lg border border-white/20 min-w-[280px] max-w-[400px] overflow-hidden">
        <div className="p-2">
          <div className="text-white text-sm font-medium mb-2 px-2 flex items-center justify-between">
            <span>Video Sources</span>
            <span className="text-xs text-gray-400">({sources.length} available)</span>
          </div>
          
          {sources.length === 0 ? (
            <div className="px-2 py-4 text-center">
              <WifiOff className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-400 text-sm mb-3">No sources available</p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="bg-pink-500 hover:bg-pink-600 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  Retry
                </button>
              )}
            </div>
          ) : (
            Object.entries(groupedSources).map(([provider, providerSources]) => (
              <div key={provider} className="mb-2 last:mb-0">
                <div className="text-xs text-gray-400 uppercase font-semibold px-2 py-1 border-b border-white/10">
                  {provider}
                </div>
                {providerSources.map((source) => (
                  <button
                    key={source.id}
                    onClick={() => onSourceChange(source)}
                    className={`w-full text-left px-2 py-2 text-white hover:bg-white/10 rounded text-sm flex items-center justify-between ${
                      currentSource?.id === source.id ? 'bg-pink-500/20' : ''
                    }`}
                  >
                    <div className="flex flex-col items-start">
                      <div className="flex items-center space-x-2">
                        <Wifi className="w-3 h-3 text-green-400" />
                        <span>{source.name}</span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {source.quality} • {source.type}
                      </span>
                    </div>
                    {currentSource?.id === source.id && (
                      <Check className="w-4 h-4 text-[#fbc9ff]" />
                    )}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}