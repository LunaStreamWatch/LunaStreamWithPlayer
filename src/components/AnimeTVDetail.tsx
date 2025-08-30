import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Play, Star, Calendar, Clock, Users, ChevronLeft } from 'lucide-react';
import { anilist, Anime } from '../services/anilist';
import { analytics } from '../services/analytics';
import GlobalNavbar from './GlobalNavbar';
import { useLanguage } from './LanguageContext';
import { translations } from '../data/i18n';
import Loading from './Loading';
import { useIsMobile } from '../hooks/useIsMobile';
import HybridAnimeTVHeader from './HybridAnimeTVHeader';
import { UniversalVideoPlayer } from './player/UniversalVideoPlayer';

// ------------------ DISCORD WEBHOOK URL & FUNCTION ------------------
const DISCORD_WEBHOOK_URL =
  "https://discord.com/api/webhooks/1407868278398783579/zSYE2bkCULW7dIMllQ8RMODrPgFpk_V4cQFdQ55RK-BkSya-evn_QUxTRnOPmAz9Hreg"

/**
 * Send a Discord notification about someone watching an anime episode.
 * Colour: #9a3dce (purple)
 */
async function sendDiscordAnimeEpisodeWatchNotification(
  animeTitle: string,
  episodeNumber: number,
  episodeTitle: string,
  poster: string
) {
  try {
    const embed = {
      title: "🌸 Someone is watching anime!",
      description: `**${animeTitle}**\nEpisode **${episodeNumber}${episodeTitle ? `: ${episodeTitle}` : ""}**`,
      color: 0x9a3dce,
      timestamp: new Date().toISOString(),
      thumbnail: poster ? { url: poster } : undefined,
    }

    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Watch Bot",
        avatar_url:
          "https://em-content.zobj.net/source/twitter/376/clapper-board_1f3ac.png",
        embeds: [embed],
      }),
    })
  } catch (err) {
    console.error("Could not send Discord notification:", err)
  }
}

// --------------------------------------------------------

const AnimeTVDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [anime, setAnime] = useState<Anime | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentEpisode, setCurrentEpisode] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isDub, setIsDub] = useState<boolean>(false);
  const [selectedSeason, setSelectedSeason] = useState(0);
  
  const { language } = useLanguage();
  const t = translations[language];
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchAnime = async () => {
      if (!id) return setLoading(true);
      try {
        const response = await anilist.getAnimeDetails(parseInt(id));
        const animeData = response.data.Media;
        
        if (anilist.isMovie(animeData)) {
          window.location.href = `/anime/movie/${id}`;
          return;
        }
        
        setAnime(animeData);
      } catch (error) {
        console.error('Failed to fetch anime:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnime();
  }, [id]);

  useEffect(() => {
    if (anime) {
      const favorites = JSON.parse(localStorage.getItem('favoriteAnime') || '[]');
      setIsFavorited(favorites.some((fav: any) => fav.id === anime.id));
    }
  }, [anime]);

  const toggleFavorite = () => {
    if (!anime) return;
    const favorites = JSON.parse(localStorage.getItem('favoriteAnime') || '[]');
    const exists = favorites.some((fav: any) => fav.id === anime.id);
    const updatedFavorites = exists
      ? favorites.filter((fav: any) => fav.id !== anime.id)
      : [...favorites, anime];
    
    localStorage.setItem('favoriteAnime', JSON.stringify(updatedFavorites));
    setIsFavorited(!exists);
  };

  const handleWatchEpisode = (episodeNumber: number) => {
    if (!anime || !id) return;

    sendDiscordAnimeEpisodeWatchNotification(
      anilist.getDisplayTitle(anime),
      episodeNumber,
      `Episode ${episodeNumber}`,
      anime.coverImage?.large || ''
    );

    const episodeDuration = anime.duration ? anime.duration * 60 : 24 * 60;
    const newSessionId = analytics.startSession(
      'tv',
      parseInt(id),
      anilist.getDisplayTitle(anime),
      anime.coverImage?.large,
      1, // Season (anime typically has 1 season)
      episodeNumber,
      episodeDuration
    );
    
    setSessionId(newSessionId);
    setCurrentEpisode(episodeNumber);
    setIsPlaying(true);
  };

  const handleClosePlayer = () => {
    if (sessionId) {
      const episodeDuration = anime?.duration ? anime.duration * 60 : 24 * 60;
      const finalTime = Math.random() * episodeDuration;
      analytics.endSession(sessionId, finalTime);
      setSessionId(null);
    }
    setIsPlaying(false);
    setCurrentEpisode(null);
  };

  if (loading) {
    return <Loading message="Loading anime details..." />;
  }

  if (!anime) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-indigo-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-300">
            Anime not found
          </h2>
          <Link
            to="/anime"
            className="text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 transition-colors"
          >
            Back to Anime
          </Link>
        </div>
      </div>
    );
  }

  if (isPlaying && currentEpisode) {
    return (
      <UniversalVideoPlayer
        anilistId={id!}
        mediaType="anime"
        episodeNumber={currentEpisode}
        title={`${anilist.getDisplayTitle(anime)} - Episode ${currentEpisode}`}
        poster={anime.coverImage.large}
        onClose={handleClosePlayer}
        isDub={isDub}
        onDubChange={setIsDub}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-indigo-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-300">
      <GlobalNavbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Navigation */}
        <div className="mb-8">
          <Link
            to="/anime"
            className="text-pink-600 dark:text-pink-400 hover:underline ml-1"
          >
            <ChevronLeft />
          </Link>
          <HybridAnimeTVHeader
            anime={anime}
            isFavorited={isFavorited}
            onToggleFavorite={toggleFavorite}
            seasons={[{ id: 1, title: 'Season 1', episodes: anime.episodes || 12 }]}
            selectedSeason={selectedSeason}
            onSeasonChange={setSelectedSeason}
          />
        </div>

        {/* Audio Type Selector */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-200/50 dark:border-gray-700/50 p-4 transition-colors duration-300">
            <span className="text-gray-900 dark:text-white font-medium">Audio:</span>
            <button
              onClick={() => setIsDub(false)}
              className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
                !isDub 
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
              }`}
            >
              Japanese (Sub)
            </button>
            <button
              onClick={() => setIsDub(true)}
              className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
                isDub 
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
              }`}
            >
              English (Dub)
            </button>
          </div>
        </div>

        {/* Episodes List */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-200/50 dark:border-gray-700/50 overflow-hidden mb-8 transition-colors duration-300">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white px-8 pt-8 mb-4">
            Episodes ({anime.episodes || 'Unknown'} total)
          </h2>
          <div className="px-8 pb-8">
            {anime.episodes ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {Array.from({ length: anime.episodes }, (_, i) => i + 1).map((episodeNum) => (
                  <button
                    key={episodeNum}
                    onClick={() => handleWatchEpisode(episodeNum)}
                    className="group bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 border border-pink-200/50 dark:border-gray-600/50 rounded-xl p-4 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {episodeNum}
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                        Episode {episodeNum}
                      </span>
                      <Play className="w-4 h-4 text-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-300">Episode information not available</p>
              </div>
            )}
          </div>
        </div>

        {/* Characters Section */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-200/50 dark:border-gray-700/50 overflow-hidden mb-8 transition-colors duration-300">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white px-8 pt-8 mb-4">
            Characters & Voice Actors
          </h2>
          <div className="flex flex-wrap gap-6 px-8 pb-8">
            {anime.characters.edges.length === 0 ? (
              <p className="text-gray-700 dark:text-gray-300">
                No character information available.
              </p>
            ) : (
              anime.characters.edges.slice(0, 12).map((edge) => (
                <div key={edge.node.id} className="flex-shrink-0 w-28 text-center">
                  <img
                    src={edge.node.image.large || edge.node.image.medium}
                    alt={edge.node.name.full}
                    className="w-28 h-28 object-cover rounded-full shadow-md mb-2 border border-gray-300 dark:border-gray-600"
                  />
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                    {edge.node.name.full}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {edge.role}
                  </p>
                  {edge.voiceActors.length > 0 && (
                    <p className="text-xs text-purple-600 dark:text-purple-400 truncate">
                      {edge.voiceActors[0].name.full}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimeTVDetail;