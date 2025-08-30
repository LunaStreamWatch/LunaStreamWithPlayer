import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Star, Calendar, Clock, ArrowLeft, ChevronDown } from 'lucide-react';

interface SeasonInfo {
  id: number;
  seasonNumber: number;
  title: string;
  description: string;
  poster: string;
  banner: string;
  rating: number;
  year: number;
  episodeCount: number;
  showTitle: string;
}

interface Episode {
  id: number;
  number: number;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  airDate: string;
}

const SeasonDetail: React.FC = () => {
  const { showId, seasonNumber } = useParams<{ showId: string; seasonNumber: string }>();
  const navigate = useNavigate();
  const [seasonInfo, setSeasonInfo] = useState<SeasonInfo | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDescription, setShowDescription] = useState(false);

  useEffect(() => {
    const fetchSeasonDetails = async () => {
      try {
        setLoading(true);
        // Fetch season details and episodes
        // This would typically call your TV API service
        
        // Mock data for now
        const mockSeason: SeasonInfo = {
          id: parseInt(seasonNumber || '1'),
          seasonNumber: parseInt(seasonNumber || '1'),
          title: `Season ${seasonNumber}`,
          description: 'An exciting season with compelling storylines and character development that keeps viewers engaged throughout each episode.',
          poster: 'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg',
          banner: 'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg',
          rating: 8.7,
          year: 2023,
          episodeCount: 10,
          showTitle: 'Sample TV Series'
        };

        const mockEpisodes: Episode[] = Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          number: i + 1,
          title: `Episode ${i + 1}`,
          description: `An engaging episode that continues the story with new developments and character growth.`,
          thumbnail: 'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg',
          duration: '45:30',
          airDate: new Date(2023, 0, (i + 1) * 7).toLocaleDateString()
        }));

        setSeasonInfo(mockSeason);
        setEpisodes(mockEpisodes);
      } catch (error) {
        console.error('Error fetching season details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (showId && seasonNumber) {
      fetchSeasonDetails();
    }
  }, [showId, seasonNumber]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!seasonInfo) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Season not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <div 
        className="relative h-96 bg-cover bg-center"
        style={{ backgroundImage: `url(${seasonInfo.banner})` }}
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
              src={seasonInfo.poster}
              alt={`${seasonInfo.showTitle} ${seasonInfo.title}`}
              className="w-48 h-72 object-cover rounded-lg shadow-lg"
            />
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">
                {seasonInfo.showTitle}
              </h1>
              <h2 className="text-2xl text-gray-300 mb-4">{seasonInfo.title}</h2>
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-yellow-400 mr-1" />
                  <span>{seasonInfo.rating}/10</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 mr-1" />
                  <span>{seasonInfo.year}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-5 h-5 mr-1" />
                  <span>{seasonInfo.episodeCount} episodes</span>
                </div>
              </div>
              <button
                onClick={() => setShowDescription(!showDescription)}
                className="flex items-center text-gray-300 hover:text-white transition-colors"
              >
                <span className="mr-2">Description</span>
                <ChevronDown 
                  className={`w-4 h-4 transition-transform ${showDescription ? 'rotate-180' : ''}`} 
                />
              </button>
              {showDescription && (
                <p className="text-gray-300 mt-2 max-w-2xl">{seasonInfo.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Episodes Section */}
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Episodes</h2>
        <div className="grid gap-4">
          {episodes.map((episode) => (
            <div
              key={episode.id}
              className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors cursor-pointer group"
              onClick={() => navigate(`/watch/tv/${showId}/season/${seasonNumber}/episode/${episode.number}`)}
            >
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <img
                    src={episode.thumbnail}
                    alt={episode.title}
                    className="w-32 h-20 object-cover rounded"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded flex items-center justify-center">
                    <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1 text-lg">
                    {episode.number}. {episode.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-2 line-clamp-2">{episode.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{episode.duration}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>{episode.airDate}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SeasonDetail;