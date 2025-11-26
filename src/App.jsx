import React, { useState, useEffect } from 'react';
import { Search, Film, Globe, CheckCircle, XCircle, Loader, ArrowLeft } from 'lucide-react';

const API_URL = 'https://vf-movie-backend.onrender.com';

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [availabilities, setAvailabilities] = useState([]);
  const [audioFilter, setAudioFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      searchMovies(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchMovies = async (query) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/search?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (err) {
      setError('Erreur lors de la recherche');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectMovie = async (movie) => {
    setSelectedMovie(movie);
    setSearchResults([]);
    setLoadingAvailability(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/movie/${movie.tmdb_id}/availability`);
      const data = await response.json();
      setAvailabilities(data.availabilities || []);
    } catch (err) {
      setError('Erreur lors de la récupération des disponibilités');
      console.error(err);
    } finally {
      setLoadingAvailability(false);
    }
  };

  const goBack = () => {
    setSelectedMovie(null);
    setAvailabilities([]);
    setSearchQuery('');
  };

  const filteredAvailabilities = availabilities.filter(a => {
    if (audioFilter === 'vf') return a.has_french_audio;
    if (audioFilter === 'vostfr') return a.has_french_subtitles;
    return true;
  });

  const groupByRegion = (availabilities) => {
    const regions = {
      'Europe': ['FR', 'BE', 'CH', 'LU', 'MC', 'DE', 'ES', 'IT', 'PT', 'NL', 'GB', 'SE', 'NO', 'DK', 'FI', 'PL', 'AT', 'CZ', 'GR'],
      'Amérique': ['CA', 'US', 'MX', 'BR', 'AR', 'CL', 'CO', 'PE', 'VE'],
      'Afrique': ['MA', 'TN', 'DZ', 'SN', 'CI', 'MG', 'ZA', 'KE', 'NG', 'EG'],
      'Asie': ['JP', 'KR', 'IN', 'TH', 'SG', 'MY', 'ID', 'PH', 'VN', 'HK', 'TW'],
      'Océanie': ['AU', 'NZ']
    };

    const grouped = {};
    availabilities.forEach(avail => {
      const region = Object.keys(regions).find(r => regions[r].includes(avail.country_code)) || 'Autres';
      if (!grouped[region]) grouped[region] = [];
      grouped[region].push(avail);
    });

    return grouped;
  };

  const groupedAvailabilities = groupByRegion(filteredAvailabilities);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <header className="bg-black/30 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Film className="w-8 h-8 text-purple-400" />
            <div>
              <h1 className="text-3xl font-bold text-white">VF Movie Finder</h1>
              <p className="text-gray-300 text-sm mt-1">Trouvez où regarder vos films en français, partout dans le monde</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {!selectedMovie && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un film... (ex: Inception, Matrix, Amélie)"
                className="w-full pl-12 pr-4 py-4 bg-white/90 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg"
              />
            </div>

            {searchResults.length > 0 && (
              <div className="mt-4 bg-white rounded-xl shadow-lg max-h-96 overflow-y-auto">
                {searchResults.map((movie) => (
                  <div
                    key={movie.tmdb_id}
                    onClick={() => selectMovie(movie)}
                    className="p-4 hover:bg-purple-50 cursor-pointer border-b last:border-b-0 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {movie.poster ? (
                        <img src={movie.poster} alt={movie.title} className="w-12 h-18 object-cover rounded shadow" />
                      ) : (
                        <div className="w-12 h-18 bg-gray-200 rounded flex items-center justify-center">
                          <Film className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{movie.title}</h3>
                        <p className="text-sm text-gray-600">
                          {movie.year} • {movie.availability_count > 0 ? `Dispo en VF dans ${movie.availability_count} pays` : 'Aucune donnée VF'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {loading && (
              <div className="mt-4 text-center text-white flex items-center justify-center gap-2">
                <Loader className="w-5 h-5 animate-spin" />
                <span>Recherche en cours...</span>
              </div>
            )}

            {error && (
              <div className="mt-4 bg-red-500/20 text-red-200 p-4 rounded-lg">
                {error}
              </div>
            )}
          </div>
        )}

        {selectedMovie && (
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <button
                onClick={goBack}
                className="flex items-center gap-2 text-purple-300 hover:text-purple-200 mb-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Nouvelle recherche
              </button>

              <div className="flex gap-6 flex-col md:flex-row">
                {selectedMovie.poster && (
                  <img
                    src={selectedMovie.poster.replace('w200', 'w500')}
                    alt={selectedMovie.title}
                    className="w-full md:w-48 rounded-lg shadow-2xl"
                  />
                )}
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-white mb-2">{selectedMovie.title}</h2>
                  {selectedMovie.original_title && selectedMovie.original_title !== selectedMovie.title && (
                    <p className="text-gray-300 mb-2">Titre original : {selectedMovie.original_title}</p>
                  )}
                  <p className="text-gray-400 mb-4">{selectedMovie.year}</p>

                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setAudioFilter('all')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        audioFilter === 'all'
                          ? 'bg-purple-500 text-white'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      Tous ({availabilities.length})
                    </button>
                    <button
                      onClick={() => setAudioFilter('vf')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        audioFilter === 'vf'
                          ? 'bg-purple-500 text-white'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      VF uniquement ({availabilities.filter(a => a.has_french_audio).length})
                    </button>
                    <button
                      onClick={() => setAudioFilter('vostfr')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        audioFilter === 'vostfr'
                          ? 'bg-purple-500 text-white'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      VOSTFR ({availabilities.filter(a => a.has_french_subtitles).length})
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {loadingAvailability && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 text-center">
                <Loader className="w-12 h-12 text-purple-400 mx-auto mb-4 animate-spin" />
                <p className="text-white text-lg">Recherche des disponibilités dans le monde entier...</p>
              </div>
            )}

            {!loadingAvailability && filteredAvailabilities.length === 0 && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 text-center">
                <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-300 text-lg">
                  {audioFilter === 'vf' 
                    ? 'Aucun pays avec VF trouvé pour ce film'
                    : audioFilter === 'vostfr'
                    ? 'Aucun pays avec VOSTFR trouvé'
                    : 'Aucune disponibilité trouvée sur Netflix'}
                </p>
                <p className="text-gray-400 text-sm mt-2">Essayez un autre film ou changez le filtre</p>
              </div>
            )}

            {!loadingAvailability && filteredAvailabilities.length > 0 && (
              <div className="space-y-6">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                  <h3 className="text-2xl font-semibold text-white mb-2">
                    📍 Disponible dans {filteredAvailabilities.length} pays
                  </h3>
                  <p className="text-gray-300">Utilisez un VPN pour accéder aux catalogues étrangers</p>
                </div>

                {Object.keys(groupedAvailabilities).map(region => (
                  <div key={region} className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                    <h4 className="text-xl font-semibold text-white mb-4">
                      {region} ({groupedAvailabilities[region].length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {groupedAvailabilities[region].map((avail, idx) => (
                        <div
                          key={idx}
                          className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-semibold text-white text-lg">
                              {avail.country_name}
                            </span>
                            <span className="text-xs bg-red-600 text-white px-2 py-1 rounded font-bold">
                              Netflix
                            </span>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              {avail.has_french_audio ? (
                                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                              ) : (
                                <XCircle className="w-4 h-4 text-gray-500 flex-shrink-0" />
                              )}
                              <span className="text-sm text-gray-300">
                                Audio français (VF)
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {avail.has_french_subtitles ? (
                                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                              ) : (
                                <XCircle className="w-4 h-4 text-gray-500 flex-shrink-0" />
                              )}
                              <span className="text-sm text-gray-300">
                                Sous-titres français
                              </span>
                            </div>
                          </div>

                          {avail.netflix_url && (
                            
                              href={avail.netflix_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-3 block text-center bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                              Voir sur Netflix
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-center">
                  <h3 className="text-2xl font-bold text-white mb-4">
                    Besoin d'un VPN pour accéder ?
                  </h3>
                  <p className="text-white/90 mb-6">
                    Accédez aux catalogues Netflix du monde entier avec un VPN fiable et rapide
                  </p>
                  
                    href="https://nordvpn.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-white text-purple-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors"
                  >
                    Voir les meilleurs VPN →
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="mt-16 border-t border-white/10 bg-black/30 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-gray-400 text-sm">
          <p>Données fournies par TMDb et uNoGS • Mis à jour régulièrement</p>
          <p className="mt-2">Pour les francophones du monde entier 🌍</p>
        </div>
      </footer>
    </div>
  );
}
