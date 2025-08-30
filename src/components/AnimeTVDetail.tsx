import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Star, Calendar, Clock, Users, ArrowLeft } from 'lucide-react';

interface AnimeInfo {
  id: number;
  title: string;
  description: string;
  poster: string;
  banner: string;
  rating: number;
  year: number;
  status: string;
  episodes: number;
  duration: string;
  genres: string[];
  studios: string[];
}

interface Episode {
  id: number;
  number: number;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
}

const AnimeTVDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [animeInfo, setAnimeInfo] = useState<AnimeInfo | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState(1);

  useEffect(() => {
    const fetchAnimeDetails = async () => {
      try {
        setLoading(true);
        // Fetch anime details and episodes
        // This would typically call your anime API service
        
        // Mock data for now
        const mockAnime: AnimeInfo = {
          id: parseInt(id || '1'),
          title: 'Sample Anime Series',
          description: 'An exciting anime series with great characters and storyline.',
          poster: 'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg',
          banner: 'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg',
          rating: 8.5,
          year: 2023,
          status: 'Ongoing',
          episodes: 24,
          duration: '24 min',
          genres: ['Action', 'Adventure', 'Drama'],
          studios: ['Studio Example']
        };

        const mockEpisodes: Episode[] = Array.from({ length: 12 }, (_, i) => ({
          id: i + 1,
          number: i + 1,
          title: `Episode ${i + 1}`,
          description: `Description for episode ${i + 1}`,
          thumbnail: 'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg',
          duration: '24:30'
        }));

        setAnimeInfo(mockAnime);
        setEpisodes(mockEpisodes);
      } catch (error) {
        console.error('Error fetching anime details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAnimeDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!animeInfo) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Anime not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <div 
        className="relative h-96 bg-cover bg-center"
        style={{ backgroundImage: `url(${animeInfo.banner})` }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        <div className="relative z-10 container mx-auto px-4 h-full flex items-end pb-8">
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 p-2 bg-black bg-opacity-50 rounded-full hover:bg-opacity-70 transition-all"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <div className="flex items-end space-x-6">
            <img
              src={animeInfo.poster}
              alt={animeInfo.title}
              className="w-48 h-72 object-cover rounded-lg shadow-lg"
            />
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{animeInfo.title}</h1>
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-yellow-400 mr-1" />
                  <span>{animeInfo.rating}/10</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 mr-1" />
                  <span>{animeInfo.year}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-5 h-5 mr-1" />
                  <span>{animeInfo.duration}</span>
                </div>
                <div className="flex items-center">
                  <Users className="w-5 h-5 mr-1" />
                  <span>{animeInfo.episodes} episodes</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {animeInfo.genres.map((genre) => (
                  <span
                    key={genre}
                    className="px-3 py-1 bg-blue-600 rounded-full text-sm"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Synopsis</h2>
              <p className="text-gray-300 leading-relaxed">{animeInfo.description}</p>
            </div>

            {/* Episodes */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Episodes</h2>
              <div className="grid gap-4">
                {episodes.map((episode) => (
                  <div
                    key={episode.id}
                    className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors cursor-pointer"
                    onClick={() => navigate(`/watch/anime-tv/${id}/episode/${episode.number}`)}
                  >
                    <div className="flex items-center space-x-4">
                      <img
                        src={episode.thumbnail}
                        alt={episode.title}
                        className="w-24 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">
                          Episode {episode.number}: {episode.title}
                        </h3>
                        <p className="text-gray-400 text-sm mb-2">{episode.description}</p>
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>{episode.duration}</span>
                        </div>
                      </div>
                      <Play className="w-8 h-8 text-blue-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">Information</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-400">Status:</span>
                  <span className="ml-2">{animeInfo.status}</span>
                </div>
                <div>
                  <span className="text-gray-400">Episodes:</span>
                  <span className="ml-2">{animeInfo.episodes}</span>
                </div>
                <div>
                  <span className="text-gray-400">Duration:</span>
                  <span className="ml-2">{animeInfo.duration}</span>
                </div>
                <div>
                  <span className="text-gray-400">Studios:</span>
                  <div className="mt-1">
                    {animeInfo.studios.map((studio) => (
                      <span key={studio} className="block text-blue-400">
                        {studio}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimeTVDetail;