export interface PlayerSettings {
  playbackSpeed: number;
  subtitleSettings: {
    fontSize: number;
    color: string;
    delay: number;
    backgroundColor: string;
    backgroundOpacity: number;
  };
  theme: 'dark' | 'light';
}

export interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  className?: string;
}