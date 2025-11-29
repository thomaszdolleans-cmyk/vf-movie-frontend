import React, { useState, useEffect } from 'react';
import { Search, Film, Globe, CheckCircle, XCircle, Loader, ArrowLeft, Tv, Shield, Zap, AlertCircle } from 'lucide-react';

const API_URL = 'https://vf-movie-backend.onrender.com';

const countryFlags = {
  'FR': '🇫🇷', 'BE': '🇧🇪', 'CH': '🇨🇭', 'CA': '🇨🇦', 'US': '🇺🇸', 'GB': '🇬🇧',
  'DE': '🇩🇪', 'ES': '🇪🇸', 'IT': '🇮🇹', 'PT': '🇵🇹', 'BR': '🇧🇷', 'MX': '🇲🇽',
  'AR': '🇦🇷', 'CL': '🇨🇱', 'CO': '🇨🇴', 'AU': '🇦🇺', 'NZ': '🇳🇿', 'JP': '🇯🇵',
  'KR': '🇰🇷', 'IN': '🇮🇳', 'SG': '🇸🇬', 'TH': '🇹🇭', 'NL': '🇳🇱', 'SE': '🇸🇪',
  'NO': '🇳🇴', 'DK': '🇩🇰', 'FI': '🇫🇮', 'PL': '🇵🇱', 'CZ': '🇨🇿', 'GR': '🇬🇷',
  'TR': '🇹🇷', 'ZA': '🇿🇦', 'MA': '🇲🇦', 'TN': '🇹🇳', 'DZ': '🇩🇿', 'SN': '🇸🇳',
  'AT': '🇦🇹', 'IE': '🇮🇪', 'HU': '🇭🇺', 'RO': '🇷🇴', 'UA': '🇺🇦', 'IL': '🇮🇱',
  'PH': '🇵🇭', 'MY': '🇲🇾', 'ID': '🇮🇩', 'VN': '🇻🇳', 'HK': '🇭🇰', 'TW': '🇹🇼',
  'EG': '🇪🇬', 'NG': '🇳🇬', 'KE': '🇰🇪', 'CI': '🇨🇮', 'MG': '🇲🇬', 'IS': '🇮🇸',
  'HR': '🇭🇷', 'RS': '🇷🇸', 'SI': '🇸🇮', 'SK': '🇸🇰', 'BG': '🇧🇬', 'LT': '🇱🇹',
  'LV': '🇱🇻', 'EE': '🇪🇪', 'PE': '🇵🇪', 'VE': '🇻🇪', 'UY': '🇺🇾', 'EC': '🇪🇨'
};

// Platform colors and styles
const platformStyles = {
  'Netflix': { bg: 'bg-red-600', text: 'text-white', icon: '▶' },
  'Amazon Prime': { bg: 'bg-blue-500', text: 'text-white', icon: '►' },
  'Disney+': { bg: 'bg-blue-600', text: 'text-white', icon: '★' },
  'HBO Max': { bg: 'bg-purple-600', text: 'text-white', icon: '▶' },
  'Apple TV+': { bg: 'bg-black', text: 'text-white', icon: '' },
  'Paramount+': { bg: 'bg-blue-700', text: 'text-white', icon: '▲' },
  'Canal+': { bg: 'bg-black', text: 'text-white', icon: '+' },
  'default': { bg: 'bg-gray-600', text: 'text-white', icon: '▶' }
};

function getPlatformStyle(platform) {
  return platformStyles[platform] || platformStyles.default;
}

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [availabilities, setAvailabilities] = useState([]);
  const [audioFilter, setAudioFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [typeFilters, setTypeFilters] = useState(['subscription', 'rent', 'buy', 'addon', 'free']);
  const [countryFilter, setCountryFilter] = useState('all'); // New: Country filter
  const [expandedCountries, setExpandedCountries] = useState({}); // Track which countries are expanded
  const [showFiltersMenu, setShowFiltersMenu] = useState(true); // Toggle filters visibility
  const [loading, setLoading] = useState(false);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [error, setError] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  // Detect iOS
  useEffect(() => {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(ios);
    
    // Show iOS prompt if on iOS and not already installed
    if (ios && !window.navigator.standalone) {
      // Wait 3 seconds before showing
      setTimeout(() => setShowIOSPrompt(true), 3000);
    }
  }, []);

  // PWA Install prompt
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };
    
    window.addEventListener('beforeinstallprompt', handler);
    
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

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
    // Platform filter
    if (platformFilter !== 'all' && a.platform !== platformFilter) return false;
    
    // Streaming type filter (multi-select)
    const streamingType = a.streaming_type || 'subscription';
    if (!typeFilters.includes(streamingType)) return false;
    
    // Country filter (new)
    if (countryFilter !== 'all' && a.country_code !== countryFilter) return false;
    
    // Audio/Subtitle filter
    if (audioFilter === 'vf') return a.has_french_audio;
    if (audioFilter === 'vostfr') return a.has_french_subtitles;
    
    // 'all' = show everything
    return true;
  });

  // Group availabilities by country
  const groupedByCountry = filteredAvailabilities.reduce((acc, avail) => {
    if (!avail || !avail.country_code) return acc; // Safety check
    const countryCode = avail.country_code;
    if (!acc[countryCode]) {
      acc[countryCode] = {
        country_code: countryCode,
        country_name: avail.country_name || countryCode,
        options: []
      };
    }
    acc[countryCode].options.push(avail);
    return acc;
  }, {});

  // Convert to array and sort by number of options (descending)
  const countriesArray = Object.values(groupedByCountry).sort((a, b) => b.options.length - a.options.length);
  
  // Get unique countries for filter
  const availableCountries = [...new Set(availabilities.map(a => ({
    code: a.country_code,
    name: a.country_name
  })).map(c => JSON.stringify(c)))].map(c => JSON.parse(c)).sort((a, b) => a.name.localeCompare(b.name));

  // Get unique platforms from availabilities
  const availablePlatforms = [...new Set(availabilities.map(a => a.platform))].sort();
  
  // Count films with French content
  const frenchContentCount = availabilities.filter(a => a.has_french_audio || a.has_french_subtitles).length;
  
  // Reset all filters
  const resetFilters = () => {
    setAudioFilter('all');
    setPlatformFilter('all');
    setCountryFilter('all');
    setTypeFilters(['subscription', 'rent', 'buy', 'addon', 'free']);
  };
  
  // Check if any filters are active
  const hasActiveFilters = audioFilter !== 'all' || 
                          platformFilter !== 'all' || 
                          countryFilter !== 'all' ||
                          typeFilters.length < 5;
  
  // Toggle country expansion
  const toggleCountry = (countryCode) => {
    setExpandedCountries(prev => ({
      ...prev,
      [countryCode]: !prev[countryCode]
    }));
  };
  
  // Toggle streaming type filter (multi-select)
  const toggleTypeFilter = (type) => {
    if (typeFilters.includes(type)) {
      // Remove if already selected (but keep at least one)
      if (typeFilters.length > 1) {
        setTypeFilters(typeFilters.filter(t => t !== type));
      }
    } else {
      // Add if not selected
      setTypeFilters([...typeFilters, type]);
    }
  };
  
  // Count by type (dynamic based on current filters)
  const typeCount = {
    subscription: filteredAvailabilities.filter(a => (a.streaming_type || 'subscription') === 'subscription').length,
    rent: filteredAvailabilities.filter(a => a.streaming_type === 'rent').length,
    buy: filteredAvailabilities.filter(a => a.streaming_type === 'buy').length,
    addon: filteredAvailabilities.filter(a => a.streaming_type === 'addon').length,
    free: filteredAvailabilities.filter(a => a.streaming_type === 'free').length
  };
  
  // Count VF/VOSTFR based on current filters (excluding audio filter itself)
  const getAudioCount = (audioType) => {
    return availabilities.filter(a => {
      // Apply all filters except audio filter
      if (platformFilter !== 'all' && a.platform !== platformFilter) return false;
      
      const streamingType = a.streaming_type || 'subscription';
      if (!typeFilters.includes(streamingType)) return false;
      
      // Then count based on audio type
      if (audioType === 'vf') return a.has_french_audio;
      if (audioType === 'vostfr') return a.has_french_subtitles;
      return true; // 'all'
    }).length;
  };
  
  // Count platforms based on current filters (excluding platform filter itself)
  const getPlatformCount = (platform) => {
    return availabilities.filter(a => {
      // Apply all filters except platform filter
      const streamingType = a.streaming_type || 'subscription';
      if (!typeFilters.includes(streamingType)) return false;
      
      if (audioFilter === 'vf' && !a.has_french_audio) return false;
      if (audioFilter === 'vostfr' && !a.has_french_subtitles) return false;
      
      // Then count based on platform
      return a.platform === platform;
    }).length;
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-600 to-red-700 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 relative z-10">
          <div className="flex items-center justify-center">
            <div className="text-center">
              {/* Logo stylé */}
              <div className="flex items-center justify-center gap-2 md:gap-3 mb-2 md:mb-3">
                <div className="bg-white rounded-xl md:rounded-2xl p-2 md:p-4 shadow-2xl transform -rotate-6">
                  <Film className="w-6 h-6 md:w-12 md:h-12 text-red-600" />
                </div>
                <div className="text-left">
                  <div className="flex items-baseline gap-1 md:gap-2">
                    <span className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter">VF</span>
                    <span className="text-xl md:text-3xl lg:text-4xl font-bold text-white/90">Movie</span>
                  </div>
                  <div className="text-base md:text-2xl lg:text-3xl font-black text-red-200 -mt-1 md:-mt-2">FINDER</div>
                </div>
              </div>
              <p className="text-red-100 text-xs md:text-base lg:text-lg font-semibold">
                🌍 Films en français · Partout dans le monde
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* iOS Install Instructions */}
      {isIOS && showIOSPrompt && !window.navigator.standalone && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 border-b-2 md:border-b-4 border-blue-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 md:py-4">
            <div className="flex items-start justify-between flex-wrap gap-2 md:gap-4">
              <div className="flex items-start gap-2 md:gap-3">
                <div className="bg-white rounded-lg md:rounded-xl p-1 md:p-2 flex-shrink-0">
                  <Film className="w-4 h-4 md:w-6 md:h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm md:text-lg flex items-center gap-2">
                    📱 Installer l'app
                  </p>
                  <p className="text-blue-100 text-xs md:text-sm mt-0.5 md:mt-1">
                    <span className="hidden md:inline">Appuyez sur </span>
                    <span className="inline-flex items-center mx-1 px-1 md:px-2 py-0.5 bg-white/20 rounded">
                      <svg className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16 5l-1.42 1.42-1.59-1.59V16h-1.98V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z"/>
                      </svg>
                    </span> 
                    <span className="hidden md:inline">puis </span>"Sur l'écran d'accueil"
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSPrompt(false)}
                className="text-white hover:text-blue-100 px-2 md:px-4 font-medium text-xs md:text-sm"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PWA Install Prompt */}
      {showInstallPrompt && (
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 border-b-2 md:border-b-4 border-green-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 md:py-4">
            <div className="flex items-center justify-between flex-wrap gap-2 md:gap-4">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="bg-white rounded-lg md:rounded-xl p-1 md:p-2">
                  <Film className="w-4 h-4 md:w-6 md:h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm md:text-lg">📱 Installer l'app</p>
                  <p className="text-green-100 text-xs md:text-sm hidden md:block">Accédez rapidement depuis votre écran d'accueil!</p>
                </div>
              </div>
              <div className="flex gap-2 md:gap-3">
                <button
                  onClick={handleInstallClick}
                  className="bg-white text-green-600 px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl text-sm md:text-base font-black hover:bg-green-50 transition-all shadow-lg"
                >
                  Installer
                </button>
                <button
                  onClick={() => setShowInstallPrompt(false)}
                  className="text-white hover:text-green-100 px-2 md:px-4 text-sm md:text-base font-medium"
                >
                  <span className="md:hidden">✕</span>
                  <span className="hidden md:inline">Plus tard</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        {/* Disclaimer */}
        <div className="mb-4 md:mb-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg md:rounded-xl p-2 md:p-4 flex items-start gap-2 md:gap-3">
          <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs md:text-sm text-yellow-200">
            <strong className="hidden md:inline">Info importante : </strong>Les données proviennent d'une base tierce<span className="hidden md:inline"> mise à jour quotidiennement. Certaines informations peuvent être incomplètes ou obsolètes</span>. Vérifiez sur Netflix.
          </div>
        </div>

        {!selectedMovie && (
          <>
            {/* Search Hero */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl md:rounded-3xl p-4 md:p-8 lg:p-12 border border-gray-700 shadow-2xl mb-6 md:mb-8">
              <div className="text-center mb-4 md:mb-8">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 md:mb-3">
                  Trouvez votre film en VF 🎬
                </h2>
                <p className="text-gray-300 text-sm md:text-lg hidden md:block">
                  Recherchez parmi des milliers de films disponibles sur Netflix dans le monde
                </p>
              </div>

              <div className="relative max-w-3xl mx-auto">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un film... (ex: Inception, Matrix, Amélie)"
                  className="w-full pl-14 pr-6 py-5 bg-white rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-red-500/50 text-lg font-medium shadow-xl transition-all"
                />
              </div>

              {searchResults.length > 0 && (
                <div className="mt-6 bg-white rounded-2xl shadow-2xl max-h-96 overflow-y-auto">
                  {searchResults.map((movie) => (
                    <div
                      key={movie.tmdb_id}
                      onClick={() => selectMovie(movie)}
                      className="p-4 hover:bg-red-50 cursor-pointer border-b last:border-b-0 transition-all hover:scale-[1.01]"
                    >
                      <div className="flex items-center gap-4">
                        {movie.poster ? (
                          <img src={movie.poster} alt={movie.title} className="w-16 h-24 object-cover rounded-lg shadow-md" />
                        ) : (
                          <div className="w-16 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Film className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-lg">{movie.title}</h3>
                          <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                            📅 {movie.year}
                            {movie.availability_count > 0 && (
                              <>
                                <span>·</span>
                                <span className="text-green-600 font-semibold">
                                  ✓ VF dans {movie.availability_count} pays
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {loading && (
                <div className="mt-6 text-center text-white flex items-center justify-center gap-3">
                  <Loader className="w-6 h-6 animate-spin" />
                  <span className="text-lg font-medium">Recherche en cours...</span>
                </div>
              )}

              {error && (
                <div className="mt-6 bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-xl">
                  {error}
                </div>
              )}
            </div>

            {/* VPN Section */}
            <div className="bg-gradient-to-br from-red-600 to-pink-600 rounded-2xl md:rounded-3xl p-6 md:p-8 lg:p-10 text-center shadow-2xl border border-red-500">
              <Shield className="w-12 h-12 md:w-16 md:h-16 text-white mx-auto mb-3 md:mb-4" />
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-black text-white mb-3 md:mb-4">
                Besoin d'un VPN ?
              </h3>
              <p className="text-white/90 text-sm md:text-lg mb-6 md:mb-8 max-w-2xl mx-auto">
                Accédez aux catalogues Netflix du monde entier en toute sécurité
              </p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center">
                <a
                  href="https://go.nordvpn.net/aff_c?offer_id=15&aff_id=93849"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white text-red-600 px-6 md:px-8 py-3 md:py-4 rounded-xl font-black text-base md:text-lg hover:bg-gray-100 transition-all hover:scale-105 shadow-xl w-full sm:w-auto justify-center"
                >
                  <Zap className="w-4 h-4 md:w-5 md:h-5" />
                  NordVPN
                </a>
                <a
                  href="https://www.expressvpn.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-lg text-white border-2 border-white px-6 md:px-8 py-3 md:py-4 rounded-xl font-black text-base md:text-lg hover:bg-white/20 transition-all hover:scale-105 w-full sm:w-auto justify-center"
                >
                  <Tv className="w-4 h-4 md:w-5 md:h-5" />
                  ExpressVPN
                </a>
              </div>
              <p className="text-white/70 text-xs md:text-sm mt-4 md:mt-6">
                💰 Économisez jusqu'à 60% avec nos liens partenaires
              </p>
            </div>
          </>
        )}

        {selectedMovie && (
          <div className="space-y-8">
            {/* Movie Header */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 md:p-8 border border-gray-700 shadow-2xl">
              <button
                onClick={goBack}
                className="flex items-center gap-2 text-red-400 hover:text-red-300 mb-6 transition-colors font-medium group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                Nouvelle recherche
              </button>

              <div className="flex gap-6 flex-col md:flex-row">
                {selectedMovie.poster && (
                  <img
                    src={selectedMovie.poster.replace('w200', 'w500')}
                    alt={selectedMovie.title}
                    className="w-full md:w-56 rounded-2xl shadow-2xl border-4 border-gray-700"
                  />
                )}
                <div className="flex-1">
                  <h2 className="text-4xl md:text-5xl font-black text-white mb-3 leading-tight">{selectedMovie.title}</h2>
                  {selectedMovie.original_title && selectedMovie.original_title !== selectedMovie.title && (
                    <p className="text-gray-400 text-lg mb-2">Titre original : {selectedMovie.original_title}</p>
                  )}
                  <p className="text-gray-500 text-xl mb-6">📅 {selectedMovie.year}</p>

                  {/* Reset Filters Button */}
                  {hasActiveFilters && (
                    <div className="mb-4 space-y-2">
                      <button
                        onClick={resetFilters}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700 transition-all hover:scale-105 shadow-lg"
                      >
                        <XCircle className="w-5 h-5" />
                        Réinitialiser tous les filtres
                      </button>
                      <p className="text-gray-400 text-sm">
                        📊 Affichage de <span className="text-white font-bold">{filteredAvailabilities.length}</span> résultat{filteredAvailabilities.length > 1 ? 's' : ''} sur <span className="text-white font-bold">{availabilities.length}</span> au total
                      </p>
                    </div>
                  )}

                  {/* Filters Toggle Button */}
                  <button
                    onClick={() => setShowFiltersMenu(!showFiltersMenu)}
                    className="w-full mb-4 px-6 py-4 rounded-xl font-bold bg-gray-800 text-white hover:bg-gray-700 transition-all border-2 border-gray-600 flex items-center justify-between"
                  >
                    <span className="text-lg">🎚️ Filtres ({Object.keys({audioFilter, platformFilter, countryFilter, typeFilters}).length})</span>
                    <span className="text-2xl">{showFiltersMenu ? '▼' : '▶'}</span>
                  </button>

                  {/* Collapsible Filters Menu */}
                  {showFiltersMenu && (
                    <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-gray-700 space-y-6">
                      
                      {/* Audio Filters */}
                      <div>
                        <p className="text-gray-300 text-sm font-bold mb-3 flex items-center gap-2">
                          <span className="w-1 h-6 bg-red-500 rounded"></span>
                          🎙️ LANGUE
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => setAudioFilter('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                              audioFilter === 'all'
                                ? 'bg-red-600 text-white shadow-lg scale-105'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            Tous ({getAudioCount('all')})
                          </button>
                          <button
                            onClick={() => setAudioFilter('vf')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                              audioFilter === 'vf'
                                ? 'bg-red-600 text-white shadow-lg scale-105'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            🎙️ VF ({getAudioCount('vf')})
                          </button>
                          <button
                            onClick={() => setAudioFilter('vostfr')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                              audioFilter === 'vostfr'
                                ? 'bg-red-600 text-white shadow-lg scale-105'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            📝 VOSTFR ({getAudioCount('vostfr')})
                          </button>
                        </div>
                      </div>

                      {/* Platform Filters */}
                      {availablePlatforms.length > 1 && (
                        <div>
                          <p className="text-gray-300 text-sm font-bold mb-3 flex items-center gap-2">
                            <span className="w-1 h-6 bg-red-500 rounded"></span>
                            📺 PLATEFORME
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => setPlatformFilter('all')}
                              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                platformFilter === 'all'
                                  ? 'bg-white text-red-600 shadow-lg'
                                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              }`}
                            >
                              Toutes
                            </button>
                            {availablePlatforms.map(platform => {
                              const style = getPlatformStyle(platform);
                              const count = getPlatformCount(platform);
                              return (
                                <button
                                  key={platform}
                                  onClick={() => setPlatformFilter(platform)}
                                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                    platformFilter === platform
                                      ? `${style.bg} ${style.text} shadow-lg scale-105`
                                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                  }`}
                                >
                                  {style.icon} {platform} ({count})
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Type Filters */}
                      {(typeCount.rent > 0 || typeCount.buy > 0 || typeCount.addon > 0) && (
                        <div>
                          <p className="text-gray-300 text-sm font-bold mb-3 flex items-center gap-2">
                            <span className="w-1 h-6 bg-red-500 rounded"></span>
                            💳 TYPE DE DISPONIBILITÉ
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            {typeCount.subscription > 0 && (
                              <button
                                onClick={() => toggleTypeFilter('subscription')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                  typeFilters.includes('subscription')
                                    ? 'bg-green-600 text-white shadow-lg scale-105'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 opacity-50'
                                }`}
                              >
                                📺 Streaming ({typeCount.subscription})
                              </button>
                            )}
                            {typeCount.rent > 0 && (
                              <button
                                onClick={() => toggleTypeFilter('rent')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                  typeFilters.includes('rent')
                                    ? 'bg-yellow-600 text-white shadow-lg scale-105'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 opacity-50'
                                }`}
                              >
                                🎬 Location ({typeCount.rent})
                              </button>
                            )}
                            {typeCount.buy > 0 && (
                              <button
                                onClick={() => toggleTypeFilter('buy')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                  typeFilters.includes('buy')
                                    ? 'bg-purple-600 text-white shadow-lg scale-105'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 opacity-50'
                                }`}
                              >
                                💰 Achat ({typeCount.buy})
                              </button>
                            )}
                            {typeCount.addon > 0 && (
                              <button
                                onClick={() => toggleTypeFilter('addon')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                  typeFilters.includes('addon')
                                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 opacity-50'
                                }`}
                              >
                                📡 Chaîne payante ({typeCount.addon})
                              </button>
                            )}
                            {typeCount.free > 0 && (
                              <button
                                onClick={() => toggleTypeFilter('free')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                  typeFilters.includes('free')
                                    ? 'bg-cyan-600 text-white shadow-lg scale-105'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 opacity-50'
                                }`}
                              >
                                🆓 Gratuit ({typeCount.free})
                              </button>
                            )}
                          </div>
                          <p className="text-gray-500 text-xs mt-2">💡 Sélection multiple possible</p>
                        </div>
                      )}

                      {/* Country Filter */}
                      {availableCountries.length > 1 && (
                        <div>
                          <p className="text-gray-300 text-sm font-bold mb-3 flex items-center gap-2">
                            <span className="w-1 h-6 bg-red-500 rounded"></span>
                            🌍 PAYS
                          </p>
                          <select
                            value={countryFilter}
                            onChange={(e) => setCountryFilter(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-red-500 focus:outline-none font-medium"
                          >
                            <option value="all">Tous les pays ({availableCountries.length})</option>
                            {availableCountries.map(country => {
                              const count = availabilities.filter(a => a.country_code === country.code).length;
                              return (
                                <option key={country.code} value={country.code}>
                                  {country.name} ({count})
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {loadingAvailability && (
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 border border-gray-700 text-center">
                <Loader className="w-16 h-16 text-red-500 mx-auto mb-6 animate-spin" />
                <p className="text-white text-2xl font-bold mb-2">Recherche en cours...</p>
                <p className="text-gray-400 text-lg">Analyse des catalogues Netflix dans le monde entier</p>
              </div>
            )}

            {!loadingAvailability && filteredAvailabilities.length === 0 && availabilities.length > 0 && (
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 border border-gray-700 text-center">
                <Globe className="w-16 h-16 text-gray-500 mx-auto mb-6" />
                <p className="text-gray-300 text-2xl font-bold mb-3">
                  Aucun résultat avec ces filtres
                </p>
                <p className="text-gray-500 text-lg mb-6">
                  Le film est disponible dans {availabilities.length} pays, mais aucun ne correspond à vos filtres actuels.
                </p>
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700 transition-all hover:scale-105 shadow-lg"
                >
                  <XCircle className="w-5 h-5" />
                  Réinitialiser les filtres
                </button>
              </div>
            )}

            {!loadingAvailability && availabilities.length === 0 && (
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 border border-gray-700 text-center">
                <Globe className="w-16 h-16 text-gray-500 mx-auto mb-6" />
                <p className="text-gray-300 text-2xl font-bold mb-3">
                  Film non disponible en streaming
                </p>
                <p className="text-gray-500 text-lg">Ce film n'est peut-être pas disponible sur les plateformes de streaming ou les données ne sont pas encore disponibles</p>
              </div>
            )}

            {!loadingAvailability && filteredAvailabilities.length > 0 && (
              <div className="space-y-8">
                {/* Summary */}
                {frenchContentCount > 0 ? (
                  <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl p-8 text-center shadow-2xl border border-green-500">
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <CheckCircle className="w-10 h-10 text-white" />
                      <div className="text-left">
                        <h3 className="text-4xl font-black text-white">
                          {[...new Set(availabilities.filter(a => a.has_french_audio || a.has_french_subtitles).map(a => a.country_code))].length} pays
                        </h3>
                        <p className="text-green-100 text-lg font-medium">
                          sur {availablePlatforms.length} plateforme{availablePlatforms.length > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <p className="text-green-100 text-xl font-medium mt-2">
                      Film disponible avec contenu français
                    </p>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl p-8 text-center shadow-2xl border border-blue-500">
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <Globe className="w-10 h-10 text-white" />
                      <div className="text-left">
                        <h3 className="text-4xl font-black text-white">
                          {[...new Set(filteredAvailabilities.map(a => a.country_code))].length} pays
                        </h3>
                        <p className="text-blue-100 text-lg font-medium">
                          sur {availablePlatforms.length} plateforme{availablePlatforms.length > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <p className="text-blue-100 text-xl font-medium mt-2">
                      Film disponible (VO uniquement)
                    </p>
                  </div>
                )}

                {/* Countries - Grouped and Collapsible */}
                {countriesArray && countriesArray.length > 0 && (
                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 md:p-8 border border-gray-700 shadow-2xl">
                    <h4 className="text-2xl md:text-3xl font-black text-white mb-6 flex items-center gap-3">
                      <span className="bg-red-600 w-2 h-8 rounded-full"></span>
                      Pays ({countriesArray.length})
                    </h4>
                    <div className="space-y-3">
                      {countriesArray.map((country) => {
                        const isExpanded = expandedCountries[country.country_code];
                        const optionsCount = country.options.length;
                        
                        return (
                          <div key={country.country_code} className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 overflow-hidden hover:border-red-500 transition-all">
                            {/* Country Header - Clickable */}
                            <button
                              onClick={() => toggleCountry(country.country_code)}
                              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-800 transition-all"
                            >
                              <div className="flex items-center gap-4">
                                <img 
                                  src={`https://flagcdn.com/48x36/${country.country_code.toLowerCase()}.png`}
                                  alt={`Drapeau ${country.country_name}`}
                                  className="w-12 h-9 rounded shadow-lg border border-gray-600"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'inline';
                                  }}
                                />
                                <span style={{display: 'none'}} className="text-3xl">🌍</span>
                                <div className="text-left">
                                  <h5 className="font-black text-white text-xl">{country.country_name}</h5>
                                  <p className="text-gray-400 text-sm">
                                    {optionsCount} option{optionsCount > 1 ? 's' : ''} disponible{optionsCount > 1 ? 's' : ''}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-red-500 font-black text-2xl">
                                  {isExpanded ? '▼' : '▶'}
                                </span>
                              </div>
                            </button>

                            {/* Expanded Options */}
                            {isExpanded && (
                              <div className="px-6 pb-6 pt-2 border-t border-gray-700 space-y-3 bg-gray-900/30">
                                {country.options.map((avail, idx) => (
                                  <div
                                    key={idx}
                                    className="bg-gray-800 rounded-xl p-4 hover:bg-gray-750 transition-all"
                                  >
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex items-center gap-3">
                                        <span className={`text-sm ${getPlatformStyle(avail.platform).bg} ${getPlatformStyle(avail.platform).text} px-3 py-1 rounded-full font-black`}>
                                          {getPlatformStyle(avail.platform).icon} {avail.platform}
                                        </span>
                                      </div>
                                      {avail.streaming_type && avail.streaming_type !== 'subscription' && (
                                        <span className={`text-xs px-2 py-1 rounded font-bold ${
                                          avail.streaming_type === 'addon' ? 'bg-blue-600' :
                                          avail.streaming_type === 'free' ? 'bg-cyan-600' :
                                          'bg-yellow-600'
                                        } text-white`}>
                                          {avail.streaming_type === 'rent' ? '🎬 LOCATION' : 
                                           avail.streaming_type === 'buy' ? '💰 ACHAT' : 
                                           avail.streaming_type === 'free' ? '🆓 GRATUIT' : 
                                           avail.streaming_type === 'addon' && avail.addon_name ? `📡 ${avail.addon_name}` :
                                           avail.streaming_type === 'addon' ? '📡 CHAÎNE PAYANTE' :
                                           avail.streaming_type.toUpperCase()}
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-4 mb-3 text-sm">
                                      <div className="flex items-center gap-2">
                                        {avail.has_french_audio ? (
                                          <CheckCircle className="w-4 h-4 text-green-400" />
                                        ) : (
                                          <XCircle className="w-4 h-4 text-gray-600" />
                                        )}
                                        <span className={avail.has_french_audio ? 'text-green-400 font-medium' : 'text-gray-500'}>
                                          VF
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        {avail.has_french_subtitles ? (
                                          <CheckCircle className="w-4 h-4 text-green-400" />
                                        ) : (
                                          <XCircle className="w-4 h-4 text-gray-600" />
                                        )}
                                        <span className={avail.has_french_subtitles ? 'text-green-400 font-medium' : 'text-gray-500'}>
                                          VOSTFR
                                        </span>
                                      </div>

                                      {avail.quality && (
                                        <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded font-semibold">
                                          {avail.quality.toUpperCase()}
                                        </span>
                                      )}
                                    </div>

                                    {avail.streaming_url && (
                                      <a
                                        href={avail.streaming_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`block text-center ${getPlatformStyle(avail.platform).bg} hover:opacity-90 text-white py-2 rounded-lg text-sm font-black transition-all hover:scale-105 shadow-lg`}
                                      >
                                        {avail.streaming_type === 'rent' ? '🎬 Louer' :
                                         avail.streaming_type === 'buy' ? '💰 Acheter' :
                                         avail.streaming_type === 'addon' && avail.addon_name ? `📡 ${avail.addon_name}` :
                                         avail.streaming_type === 'addon' ? `📡 Chaîne sur ${avail.platform}` :
                                         avail.streaming_type === 'free' ? `🆓 Voir sur ${avail.platform}` :
                                         `▶ Voir sur ${avail.platform}`}
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* VPN CTA */}
                <div className="bg-gradient-to-br from-red-600 to-pink-600 rounded-3xl p-8 md:p-10 text-center shadow-2xl border border-red-500">
                  <Shield className="w-16 h-16 text-white mx-auto mb-4" />
                  <h3 className="text-3xl md:text-4xl font-black text-white mb-4">
                    Débloquez ce film avec un VPN
                  </h3>
                  <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
                    Changez virtuellement de pays pour accéder à n'importe quel catalogue Netflix
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a
                      href="https://go.nordvpn.net/aff_c?offer_id=15&aff_id=93849"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-white text-red-600 px-8 py-4 rounded-xl font-black text-lg hover:bg-gray-100 transition-all hover:scale-105 shadow-xl"
                    >
                      <Zap className="w-5 h-5" />
                      Essayer NordVPN
                    </a>
                    <a
                      href="https://www.expressvpn.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-lg text-white border-2 border-white px-8 py-4 rounded-xl font-black text-lg hover:bg-white/20 transition-all hover:scale-105"
                    >
                      <Tv className="w-5 h-5" />
                      Essayer ExpressVPN
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-gray-800 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center space-y-3">
            <p className="text-gray-400 text-sm">
              Données fournies par TMDb et uNoGS · Non affilié à Netflix
            </p>
            <p className="text-gray-500 text-sm">
              🇫🇷 Fait avec ❤️ pour les francophones du monde entier
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
