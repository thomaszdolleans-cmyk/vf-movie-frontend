import React, { useState, useEffect } from 'react';
import { Search, Film, Globe, CheckCircle, XCircle, Loader, ArrowLeft, Tv, Shield, Zap, AlertCircle, ChevronDown } from 'lucide-react';

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
  const [audioFilter, setAudioFilter] = useState('all'); // 'all' = show all (VF + VOSTFR), 'vf' = VF only, 'vostfr' = VOSTFR only
  const [platformFilter, setPlatformFilter] = useState('all');
  const [typeFilters, setTypeFilters] = useState(['subscription', 'rent', 'buy', 'addon', 'free']);
  const [countryFilter, setCountryFilter] = useState('all');
  const [expandedCountries, setExpandedCountries] = useState({});
  const [showFiltersMenu, setShowFiltersMenu] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [error, setError] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  
  // Discover section states
  const [discoverResults, setDiscoverResults] = useState([]);
  const [genres, setGenres] = useState([]);
  const [discoverType, setDiscoverType] = useState('movie'); // 'movie' or 'tv'
  const [discoverGenre, setDiscoverGenre] = useState('');
  const [discoverYear, setDiscoverYear] = useState('');
  const [discoverSort, setDiscoverSort] = useState('popularity');
  const [loadingDiscover, setLoadingDiscover] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showFAQPage, setShowFAQPage] = useState(false);

  // Get share URL and text
  const getShareData = () => {
    const baseUrl = window.location.origin;
    if (selectedMovie) {
      return {
        url: baseUrl,
        title: `${selectedMovie.title} - Disponible en VF/VOSTFR`,
        text: `Découvrez où regarder "${selectedMovie.title}" en français sur VF Movie Finder! 🎬`
      };
    }
    return {
      url: baseUrl,
      title: 'VF Movie Finder - Films & Séries en français',
      text: 'Trouvez où regarder vos films et séries préférés en VF ou VOSTFR dans le monde entier! 🌍🎬'
    };
  };

  // Copy link to clipboard
  const copyToClipboard = async () => {
    const { url } = getShareData();
    try {
      await navigator.clipboard.writeText(url);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Share functions
  const shareToFacebook = () => {
    const { url } = getShareData();
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400');
  };

  const shareToTwitter = () => {
    const { url, text } = getShareData();
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank', 'width=600,height=400');
  };

  const shareToWhatsApp = () => {
    const { url, text } = getShareData();
    window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
  };

  const shareToTelegram = () => {
    const { url, text } = getShareData();
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareToTikTok = () => {
    // TikTok doesn't have a direct share URL, so we copy to clipboard and open TikTok
    const { url } = getShareData();
    navigator.clipboard.writeText(url);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
    window.open('https://www.tiktok.com', '_blank');
  };

  const shareToInstagram = () => {
    // Instagram doesn't have a direct share URL, so we copy to clipboard and open Instagram
    const { url } = getShareData();
    navigator.clipboard.writeText(url);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
    window.open('https://www.instagram.com', '_blank');
  };

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

  // Load genres on mount
  useEffect(() => {
    const loadGenres = async () => {
      try {
        const response = await fetch(`${API_URL}/api/genres`);
        const data = await response.json();
        setGenres(data.genres || []);
      } catch (err) {
        console.error('Error loading genres:', err);
      }
    };
    loadGenres();
  }, []);

  // Load discover content
  useEffect(() => {
    const loadDiscoverContent = async () => {
      setLoadingDiscover(true);
      try {
        const params = new URLSearchParams({
          type: discoverType,
          sort: discoverSort
        });
        if (discoverGenre) params.append('genre', discoverGenre);
        if (discoverYear) params.append('year', discoverYear);
        
        const response = await fetch(`${API_URL}/api/discover?${params.toString()}`);
        const data = await response.json();
        setDiscoverResults(data.results || []);
      } catch (err) {
        console.error('Error loading discover content:', err);
      } finally {
        setLoadingDiscover(false);
      }
    };
    loadDiscoverContent();
  }, [discoverType, discoverGenre, discoverYear, discoverSort]);

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
      const mediaType = movie.media_type || 'movie'; // Default to movie for backwards compatibility
      const response = await fetch(`${API_URL}/api/media/${mediaType}/${movie.tmdb_id}/availability`);
      const data = await response.json();
      setAvailabilities(data.availabilities || []);
      // Update selectedMovie with full details from backend (backdrop, overview, etc.)
      if (data.media) {
        setSelectedMovie({
          ...movie,
          ...data.media,
          tmdb_id: movie.tmdb_id, // Keep the original tmdb_id
          media_type: mediaType // Ensure media_type is set
        });
      }
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
    
    // Streaming type filter (multi-select) - if empty, show all types
    if (typeFilters.length > 0) {
      const streamingType = a.streaming_type || 'subscription';
      if (!typeFilters.includes(streamingType)) return false;
    }
    
    // Country filter
    if (countryFilter !== 'all' && a.country_code !== countryFilter) return false;
    
    // Audio/Subtitle filter
    if (audioFilter === 'vf') return a.has_french_audio; // VF only
    if (audioFilter === 'vostfr') return a.has_french_subtitles; // VOSTFR only
    // 'all' = show everything (both VF and VOSTFR mixed)
    
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

  // For TV series, group seasons by platform/type/addon
  const groupSeasons = (options) => {
    const grouped = {};
    options.forEach(opt => {
      const key = `${opt.platform}-${opt.streaming_type}-${opt.addon_name || ''}`;
      if (!grouped[key]) {
        grouped[key] = { ...opt, seasons: [] };
      }
      if (opt.season_number !== null && opt.season_number !== undefined) {
        grouped[key].seasons.push(opt.season_number);
      }
    });
    
    // Sort seasons and format them
    Object.values(grouped).forEach(group => {
      if (group.seasons.length > 0) {
        group.seasons.sort((a, b) => a - b);
        // Format as ranges if consecutive
        group.seasonsText = formatSeasonRanges(group.seasons);
      }
    });
    
    return Object.values(grouped);
  };

  // Format season numbers into ranges (e.g., "1-4, 6, 8-10")
  const formatSeasonRanges = (seasons) => {
    if (seasons.length === 0) return '';
    if (seasons.length === 1) return `Saison ${seasons[0]}`;
    
    const ranges = [];
    let start = seasons[0];
    let end = seasons[0];
    
    for (let i = 1; i < seasons.length; i++) {
      if (seasons[i] === end + 1) {
        end = seasons[i];
      } else {
        ranges.push(start === end ? `${start}` : `${start}-${end}`);
        start = end = seasons[i];
      }
    }
    ranges.push(start === end ? `${start}` : `${start}-${end}`);
    
    return ranges.length === 1 && ranges[0].includes('-') 
      ? `Saisons ${ranges[0]}` 
      : `Saison${ranges.length > 1 ? 's' : ''} ${ranges.join(', ')}`;
  };

  // Convert to array and sort by number of options (descending)
  const countriesArray = Object.values(groupedByCountry).sort((a, b) => b.options.length - a.options.length);
  
  // Group countries by geographic region
  const regionMapping = {
    // Europe
    'FR': 'Europe', 'DE': 'Europe', 'GB': 'Europe', 'IT': 'Europe', 'ES': 'Europe',
    'PT': 'Europe', 'NL': 'Europe', 'BE': 'Europe', 'CH': 'Europe', 'AT': 'Europe',
    'IE': 'Europe', 'SE': 'Europe', 'NO': 'Europe', 'DK': 'Europe', 'FI': 'Europe',
    'PL': 'Europe', 'CZ': 'Europe', 'HU': 'Europe', 'RO': 'Europe', 'GR': 'Europe',
    'HR': 'Europe', 'SK': 'Europe', 'SI': 'Europe', 'BG': 'Europe', 'LT': 'Europe',
    'LV': 'Europe', 'EE': 'Europe', 'IS': 'Europe', 'LU': 'Europe', 'MT': 'Europe',
    'CY': 'Europe', 'RS': 'Europe', 'UA': 'Europe', 'BA': 'Europe', 'ME': 'Europe',
    'MK': 'Europe', 'AL': 'Europe', 'MD': 'Europe', 'BY': 'Europe', 'RU': 'Europe',
    'TR': 'Europe',
    
    // Americas
    'US': 'Amériques', 'CA': 'Amériques', 'MX': 'Amériques', 'BR': 'Amériques', 'AR': 'Amériques',
    'CL': 'Amériques', 'CO': 'Amériques', 'PE': 'Amériques', 'VE': 'Amériques', 'EC': 'Amériques',
    'UY': 'Amériques', 'PY': 'Amériques', 'BO': 'Amériques', 'CR': 'Amériques', 'PA': 'Amériques',
    'GT': 'Amériques', 'HN': 'Amériques', 'NI': 'Amériques', 'SV': 'Amériques', 'DO': 'Amériques',
    'CU': 'Amériques', 'JM': 'Amériques', 'TT': 'Amériques', 'BB': 'Amériques', 'BS': 'Amériques',
    'BZ': 'Amériques', 'GY': 'Amériques', 'SR': 'Amériques', 'GF': 'Amériques', 'HT': 'Amériques',
    
    // Asia-Pacific
    'JP': 'Asie-Pacifique', 'KR': 'Asie-Pacifique', 'CN': 'Asie-Pacifique', 'IN': 'Asie-Pacifique',
    'TH': 'Asie-Pacifique', 'VN': 'Asie-Pacifique', 'PH': 'Asie-Pacifique', 'ID': 'Asie-Pacifique',
    'MY': 'Asie-Pacifique', 'SG': 'Asie-Pacifique', 'TW': 'Asie-Pacifique', 'HK': 'Asie-Pacifique',
    'AU': 'Asie-Pacifique', 'NZ': 'Asie-Pacifique', 'PK': 'Asie-Pacifique', 'BD': 'Asie-Pacifique',
    'LK': 'Asie-Pacifique', 'MM': 'Asie-Pacifique', 'KH': 'Asie-Pacifique', 'LA': 'Asie-Pacifique',
    'MN': 'Asie-Pacifique', 'NP': 'Asie-Pacifique', 'BT': 'Asie-Pacifique', 'MV': 'Asie-Pacifique',
    
    // Middle East & Africa
    'ZA': 'Afrique & Moyen-Orient', 'EG': 'Afrique & Moyen-Orient', 'NG': 'Afrique & Moyen-Orient',
    'KE': 'Afrique & Moyen-Orient', 'MA': 'Afrique & Moyen-Orient', 'TN': 'Afrique & Moyen-Orient',
    'DZ': 'Afrique & Moyen-Orient', 'GH': 'Afrique & Moyen-Orient', 'SN': 'Afrique & Moyen-Orient',
    'CI': 'Afrique & Moyen-Orient', 'SA': 'Afrique & Moyen-Orient', 'AE': 'Afrique & Moyen-Orient',
    'IL': 'Afrique & Moyen-Orient', 'QA': 'Afrique & Moyen-Orient', 'KW': 'Afrique & Moyen-Orient',
    'BH': 'Afrique & Moyen-Orient', 'OM': 'Afrique & Moyen-Orient', 'JO': 'Afrique & Moyen-Orient',
    'LB': 'Afrique & Moyen-Orient', 'IQ': 'Afrique & Moyen-Orient', 'YE': 'Afrique & Moyen-Orient',
    'ET': 'Afrique & Moyen-Orient', 'UG': 'Afrique & Moyen-Orient', 'TZ': 'Afrique & Moyen-Orient'
  };
  
  const countriesByRegion = countriesArray.reduce((acc, country) => {
    const region = regionMapping[country.country_code] || 'Autres régions';
    if (!acc[region]) {
      acc[region] = [];
    }
    acc[region].push(country);
    return acc;
  }, {});
  
  // Sort regions: Europe first, then Americas, then Asia-Pacific, then Middle East & Africa, then Others
  const regionOrder = ['Europe', 'Amériques', 'Asie-Pacifique', 'Afrique & Moyen-Orient', 'Autres régions'];
  const sortedRegions = regionOrder.filter(region => countriesByRegion[region]);
  
  // Get unique countries for filter
  let availableCountries = [];
  try {
    if (availabilities && Array.isArray(availabilities)) {
      const uniqueCountries = new Map();
      availabilities.forEach(a => {
        if (a && a.country_code && a.country_name) {
          uniqueCountries.set(a.country_code, {
            code: a.country_code,
            name: a.country_name
          });
        }
      });
      availableCountries = Array.from(uniqueCountries.values()).sort((a, b) => a.name.localeCompare(b.name));
    }
  } catch (error) {
    console.error('availableCountries error:', error);
    availableCountries = [];
  }

  // Get unique platforms from availabilities
  let availablePlatforms = [];
  try {
    if (availabilities && Array.isArray(availabilities)) {
      availablePlatforms = [...new Set(availabilities.filter(a => a && a.platform).map(a => a.platform))].sort();
    }
  } catch (error) {
    console.error('availablePlatforms error:', error);
    availablePlatforms = [];
  }
  
  // Count films with French content
  let frenchContentCount = 0;
  try {
    if (availabilities && Array.isArray(availabilities)) {
      frenchContentCount = availabilities.filter(a => a && (a.has_french_audio || a.has_french_subtitles)).length;
    }
  } catch (error) {
    console.error('frenchContentCount error:', error);
    frenchContentCount = 0;
  }
  
  // Reset all filters
  const resetFilters = () => {
    setAudioFilter('all'); // Reset to 'all' (show everything)
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
      // Remove if already selected
      setTypeFilters(typeFilters.filter(t => t !== type));
    } else {
      // Add if not selected
      setTypeFilters([...typeFilters, type]);
    }
  };
  
  // Count by type (dynamic based on current filters, BUT excluding type filter itself)
  const typeCount = {
    subscription: 0,
    rent: 0,
    buy: 0,
    addon: 0,
    free: 0
  };
  
  try {
    if (availabilities && Array.isArray(availabilities)) {
      // Count based on all availabilities, but filtered by audio/platform/country (NOT by type)
      const baseFiltered = availabilities.filter(a => {
        if (!a) return false;
        
        // Apply platform filter
        if (platformFilter !== 'all' && a.platform !== platformFilter) return false;
        
        // Apply country filter
        if (countryFilter !== 'all' && a.country_code !== countryFilter) return false;
        
        // Apply audio filter
        if (audioFilter === 'vf' && !a.has_french_audio) return false;
        if (audioFilter === 'vostfr' && !a.has_french_subtitles) return false;
        // 'all' = no audio filtering
        
        return true;
      });
      
      // Count by type in the base filtered results
      typeCount.subscription = baseFiltered.filter(a => (a.streaming_type || 'subscription') === 'subscription').length;
      typeCount.rent = baseFiltered.filter(a => a.streaming_type === 'rent').length;
      typeCount.buy = baseFiltered.filter(a => a.streaming_type === 'buy').length;
      typeCount.addon = baseFiltered.filter(a => a.streaming_type === 'addon').length;
      typeCount.free = baseFiltered.filter(a => a.streaming_type === 'free').length;
    }
  } catch (error) {
    console.error('typeCount error:', error);
  }
  
  // Count VF/VOSTFR based on current filters (excluding audio filter itself)
  const getAudioCount = (audioType) => {
    try {
      return availabilities.filter(a => {
        if (!a) return false;
        
        // Apply all filters except audio filter
        if (platformFilter !== 'all' && a.platform !== platformFilter) return false;
        
        // Apply type filter - if empty, show all types
        if (typeFilters.length > 0) {
          const streamingType = a.streaming_type || 'subscription';
          if (!typeFilters.includes(streamingType)) return false;
        }
        
        if (countryFilter !== 'all' && a.country_code !== countryFilter) return false;
        
        // Count based on audio type
        if (audioType === 'vf') return a.has_french_audio;
        if (audioType === 'vostfr') return a.has_french_subtitles;
        return true; // 'all' = count everything
      }).length;
    } catch (error) {
      console.error('getAudioCount error:', error);
      return 0;
    }
  };
  
  // Count platforms based on current filters (excluding platform filter itself)
  const getPlatformCount = (platform) => {
    try {
      return availabilities.filter(a => {
        if (!a) return false; // Safety check
        
        // Apply all filters except platform filter
        // Apply type filter - if empty, show all types
        if (typeFilters.length > 0) {
          const streamingType = a.streaming_type || 'subscription';
          if (!typeFilters.includes(streamingType)) return false;
        }
        
        if (countryFilter !== 'all' && a.country_code !== countryFilter) return false;
        
        if (audioFilter === 'vf' && !a.has_french_audio) return false;
        if (audioFilter === 'vostfr' && !a.has_french_subtitles) return false;
        // 'all' = no audio filtering
        
        // Then count based on platform
        return a.platform === platform;
      }).length;
    } catch (error) {
      console.error('getPlatformCount error:', error);
      return 0;
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-600 to-red-700 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-5 relative z-10">
          <div className="flex items-center justify-between gap-4">
            {/* Logo - Clickable to return home */}
            <button
              onClick={() => { setShowFAQPage(false); setShowLegalModal(false); setShowPrivacyModal(false); setSelectedMovie(null); }}
              className="flex items-center gap-2 md:gap-3 hover:opacity-90 transition-opacity"
            >
              <div className="bg-white rounded-xl md:rounded-2xl p-1.5 md:p-2.5 shadow-2xl transform -rotate-6">
                <Film className="w-5 h-5 md:w-8 md:h-8 text-red-600" />
              </div>
              <div className="text-left">
                <div className="flex items-baseline gap-1">
                  <span className="text-xl md:text-3xl font-black text-white tracking-tighter">VF</span>
                  <span className="text-base md:text-xl font-bold text-white/90">Movie</span>
                </div>
                <div className="text-xs md:text-base font-black text-red-200 -mt-0.5">FINDER</div>
              </div>
            </button>

            {/* Navigation */}
            <nav className="flex items-center gap-1.5 md:gap-3">
              <button
                onClick={() => { setShowFAQPage(true); setShowLegalModal(false); setShowPrivacyModal(false); }}
                className="bg-yellow-500 hover:bg-yellow-400 text-black px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg font-bold text-xs md:text-sm transition-all flex items-center gap-1"
              >
                <span className="text-sm md:text-base">❓</span>
                <span className="hidden sm:inline">FAQ</span>
              </button>
              <button
                onClick={() => { setShowLegalModal(true); setShowFAQPage(false); setShowPrivacyModal(false); }}
                className="bg-white/10 hover:bg-white/20 text-white px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg font-medium text-xs md:text-sm transition-all"
              >
                <span className="md:hidden">📜</span>
                <span className="hidden md:inline">📜 Mentions légales</span>
              </button>
              <button
                onClick={() => { setShowPrivacyModal(true); setShowFAQPage(false); setShowLegalModal(false); }}
                className="bg-white/10 hover:bg-white/20 text-white px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg font-medium text-xs md:text-sm transition-all"
              >
                <span className="md:hidden">🔒</span>
                <span className="hidden md:inline">🔒 Confidentialité</span>
              </button>
            </nav>
          </div>
          
          {/* Tagline - Hidden on mobile when space is tight */}
          <p className="text-red-100 text-xs md:text-sm font-medium text-center mt-2 md:mt-3 hidden sm:block">
            🌍 Films & Séries en français · Partout dans le monde
          </p>
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
        <div className="mb-4 md:mb-6 bg-gray-800/50 border border-gray-700 rounded-lg md:rounded-xl p-2 md:p-4 flex items-start gap-2 md:gap-3">
          <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs md:text-sm text-gray-400">
            <strong className="hidden md:inline">Information : </strong>Ce site est un service d'information indépendant. Les données de disponibilité proviennent de sources tierces et sont fournies à titre indicatif uniquement<span className="hidden md:inline">. Nous ne sommes affiliés à aucune plateforme de streaming</span>. <button onClick={() => setShowLegalModal(true)} className="text-red-400 hover:text-red-300 underline">Mentions légales</button>
          </div>
        </div>

        {!selectedMovie && (
          <>
            {/* Search Hero */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl md:rounded-3xl p-4 md:p-8 lg:p-12 border border-gray-700 shadow-2xl mb-6 md:mb-8">
              <div className="text-center mb-4 md:mb-8">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 md:mb-3">
                  Trouvez vos films et séries en VF ou VOSTFR 🎬📺
                </h2>
                <p className="text-gray-300 text-sm md:text-lg hidden md:block">
                  Recherchez parmi des milliers de films et séries disponibles dans le monde
                </p>
              </div>

              <div className="relative max-w-3xl mx-auto">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un film ou une série... (ex: Inception, Stranger Things)"
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
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-gray-900 text-lg">{movie.title}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                              movie.media_type === 'tv' ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'
                            }`}>
                              {movie.media_type === 'tv' ? '📺 SÉRIE' : '🎬 FILM'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 flex items-center gap-2">
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

            {/* VPN Partners Banner - Compact version above discover */}
            {searchResults.length === 0 && !searchQuery && (
              <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 rounded-2xl p-4 md:p-6 border border-purple-500/30 shadow-xl mb-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-500/20 p-2 rounded-xl">
                      <Shield className="w-8 h-8 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg">🌍 Accédez aux catalogues du monde entier</p>
                      <p className="text-purple-200 text-sm hidden md:block">Regardez les films et séries disponibles dans d'autres pays</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-center">
                    {/* NordVPN */}
                    <a
                      href="https://go.nordvpn.net/aff_c?offer_id=15&aff_id=93849"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-[#4687FF] hover:bg-[#3a75e0] text-white px-4 py-2 rounded-lg font-bold text-sm transition-all hover:scale-105 shadow-lg"
                    >
                      <img src="https://logo.clearbit.com/nordvpn.com" alt="NordVPN" className="h-5 w-5 rounded" />
                      NordVPN
                    </a>
                    {/* ExpressVPN */}
                    <a
                      href="https://www.expressvpn.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-[#DA3940] hover:bg-[#c13138] text-white px-4 py-2 rounded-lg font-bold text-sm transition-all hover:scale-105 shadow-lg"
                    >
                      <img src="https://logo.clearbit.com/expressvpn.com" alt="ExpressVPN" className="h-5 w-5 rounded" />
                      ExpressVPN
                    </a>
                    {/* Surfshark */}
                    <a
                      href="https://surfshark.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-[#178BCC] hover:bg-[#1379b3] text-white px-4 py-2 rounded-lg font-bold text-sm transition-all hover:scale-105 shadow-lg"
                    >
                      <img src="https://logo.clearbit.com/surfshark.com" alt="Surfshark" className="h-5 w-5 rounded" />
                      Surfshark
                    </a>
                    {/* CyberGhost */}
                    <a
                      href="https://www.cyberghostvpn.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-[#FFCC00] hover:bg-[#e6b800] text-black px-4 py-2 rounded-lg font-bold text-sm transition-all hover:scale-105 shadow-lg"
                    >
                      <img src="https://logo.clearbit.com/cyberghostvpn.com" alt="CyberGhost" className="h-5 w-5 rounded" />
                      CyberGhost
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Discover Section - Only show when no search results */}
            {searchResults.length === 0 && !searchQuery && (
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl md:rounded-3xl p-6 md:p-8 border border-gray-700 shadow-2xl">
                {/* Title */}
                <h3 className="text-2xl md:text-3xl font-black text-white mb-6 flex items-center gap-3">
                  <span className="bg-red-600 w-2 h-8 rounded-full"></span>
                  🎬 Explorer
                </h3>

                {/* Filters */}
                <div className="flex flex-wrap gap-3 mb-6">
                  {/* Type Filter */}
                  <select
                    value={discoverType}
                    onChange={(e) => setDiscoverType(e.target.value)}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="movie">🎬 Films</option>
                    <option value="tv">📺 Séries</option>
                  </select>

                  {/* Genre Filter */}
                  <select
                    value={discoverGenre}
                    onChange={(e) => setDiscoverGenre(e.target.value)}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">Tous les genres</option>
                    {genres.map(genre => (
                      <option key={genre.id} value={genre.id}>{genre.name}</option>
                    ))}
                  </select>

                  {/* Year Filter */}
                  <select
                    value={discoverYear}
                    onChange={(e) => setDiscoverYear(e.target.value)}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">Toutes les années</option>
                    {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>

                  {/* Sort Filter */}
                  <select
                    value={discoverSort}
                    onChange={(e) => setDiscoverSort(e.target.value)}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="popularity">📈 Popularité</option>
                    <option value="vote_average">⭐ Note</option>
                    <option value="release_date">📅 Date de sortie</option>
                  </select>
                </div>

                {/* Results Grid */}
                {loadingDiscover ? (
                  <div className="text-center py-12">
                    <Loader className="w-10 h-10 animate-spin text-red-500 mx-auto mb-4" />
                    <p className="text-gray-400">Chargement...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {discoverResults.map((item) => (
                      <div
                        key={item.tmdb_id}
                        onClick={() => selectMovie(item)}
                        className="cursor-pointer group"
                      >
                        <div className="relative overflow-hidden rounded-xl shadow-lg transition-all group-hover:scale-105 group-hover:shadow-2xl">
                          {item.poster ? (
                            <img
                              src={item.poster}
                              alt={item.title}
                              className="w-full aspect-[2/3] object-cover"
                            />
                          ) : (
                            <div className="w-full aspect-[2/3] bg-gray-700 flex items-center justify-center">
                              <Film className="w-12 h-12 text-gray-500" />
                            </div>
                          )}
                          
                          {/* Overlay with info */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-0 left-0 right-0 p-3">
                              <p className="text-white font-bold text-sm truncate">{item.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${
                                  item.media_type === 'tv' ? 'bg-purple-600' : 'bg-blue-600'
                                } text-white`}>
                                  {item.media_type === 'tv' ? 'SÉRIE' : 'FILM'}
                                </span>
                                {item.year && <span className="text-gray-300 text-xs">{item.year}</span>}
                                {item.vote_average > 0 && (
                                  <span className="text-yellow-400 text-xs">⭐ {item.vote_average.toFixed(1)}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Badge type always visible */}
                          <div className="absolute top-2 left-2">
                            <span className={`text-xs px-2 py-1 rounded font-bold ${
                              item.media_type === 'tv' ? 'bg-purple-600' : 'bg-blue-600'
                            } text-white shadow-lg`}>
                              {item.media_type === 'tv' ? '📺' : '🎬'}
                            </span>
                          </div>

                          {/* Rating badge */}
                          {item.vote_average > 0 && (
                            <div className="absolute top-2 right-2">
                              <span className="text-xs px-2 py-1 rounded font-bold bg-black/70 text-yellow-400 shadow-lg">
                                ⭐ {item.vote_average.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="mt-2 text-white font-medium text-sm truncate">{item.title}</p>
                        <p className="text-gray-400 text-xs">{item.year}</p>
                      </div>
                    ))}
                  </div>
                )}

                {discoverResults.length === 0 && !loadingDiscover && (
                  <div className="text-center py-12">
                    <p className="text-gray-400 text-lg">Aucun résultat trouvé</p>
                  </div>
                )}
              </div>
            )}

            {/* VPN Section - Full with all partners */}
            <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl md:rounded-3xl p-6 md:p-10 shadow-2xl border border-purple-500/30 overflow-hidden relative">
              {/* Background decoration */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-64 h-64 bg-purple-500 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl"></div>
              </div>
              
              <div className="relative z-10">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl mb-4 shadow-lg">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl md:text-4xl font-black text-white mb-3">
                    🌍 Accédez à tous les catalogues
                  </h3>
                  <p className="text-purple-200 text-sm md:text-lg max-w-2xl mx-auto">
                    Changez virtuellement de pays pour regarder les contenus disponibles ailleurs
                  </p>
                </div>

                {/* VPN Cards Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {/* NordVPN */}
                  <a
                    href="https://go.nordvpn.net/aff_c?offer_id=15&aff_id=93849"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-gradient-to-br from-[#4687FF] to-[#3366CC] p-4 md:p-6 rounded-2xl text-center hover:scale-105 transition-all shadow-lg hover:shadow-2xl"
                  >
                    <div className="bg-white rounded-xl p-3 mb-3 inline-block">
                      <img src="https://logo.clearbit.com/nordvpn.com" alt="NordVPN" className="h-8 md:h-10 w-8 md:w-10 mx-auto" />
                    </div>
                    <p className="text-white font-black text-lg md:text-xl">NordVPN</p>
                    <p className="text-blue-200 text-xs md:text-sm mt-1">⭐ #1 Mondial</p>
                    <div className="mt-3 bg-white/20 text-white text-xs md:text-sm px-3 py-1.5 rounded-lg font-bold group-hover:bg-white group-hover:text-blue-600 transition-all">
                      Découvrir →
                    </div>
                  </a>

                  {/* ExpressVPN */}
                  <a
                    href="https://www.expressvpn.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-gradient-to-br from-[#DA3940] to-[#B82E34] p-4 md:p-6 rounded-2xl text-center hover:scale-105 transition-all shadow-lg hover:shadow-2xl"
                  >
                    <div className="bg-white rounded-xl p-3 mb-3 inline-block">
                      <img src="https://logo.clearbit.com/expressvpn.com" alt="ExpressVPN" className="h-8 md:h-10 w-8 md:w-10 mx-auto" />
                    </div>
                    <p className="text-white font-black text-lg md:text-xl">ExpressVPN</p>
                    <p className="text-red-200 text-xs md:text-sm mt-1">🚀 Ultra rapide</p>
                    <div className="mt-3 bg-white/20 text-white text-xs md:text-sm px-3 py-1.5 rounded-lg font-bold group-hover:bg-white group-hover:text-red-600 transition-all">
                      Découvrir →
                    </div>
                  </a>

                  {/* Surfshark */}
                  <a
                    href="https://surfshark.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-gradient-to-br from-[#178BCC] to-[#0E5C8A] p-4 md:p-6 rounded-2xl text-center hover:scale-105 transition-all shadow-lg hover:shadow-2xl"
                  >
                    <div className="bg-white rounded-xl p-3 mb-3 inline-block">
                      <img src="https://logo.clearbit.com/surfshark.com" alt="Surfshark" className="h-8 md:h-10 w-8 md:w-10 mx-auto" />
                    </div>
                    <p className="text-white font-black text-lg md:text-xl">Surfshark</p>
                    <p className="text-cyan-200 text-xs md:text-sm mt-1">💰 Meilleur prix</p>
                    <div className="mt-3 bg-white/20 text-white text-xs md:text-sm px-3 py-1.5 rounded-lg font-bold group-hover:bg-white group-hover:text-cyan-600 transition-all">
                      Découvrir →
                    </div>
                  </a>

                  {/* CyberGhost */}
                  <a
                    href="https://www.cyberghostvpn.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-gradient-to-br from-[#FFCC00] to-[#E6A800] p-4 md:p-6 rounded-2xl text-center hover:scale-105 transition-all shadow-lg hover:shadow-2xl"
                  >
                    <div className="bg-white rounded-xl p-3 mb-3 inline-block">
                      <img src="https://logo.clearbit.com/cyberghostvpn.com" alt="CyberGhost" className="h-8 md:h-10 w-8 md:w-10 mx-auto" />
                    </div>
                    <p className="text-gray-900 font-black text-lg md:text-xl">CyberGhost</p>
                    <p className="text-yellow-800 text-xs md:text-sm mt-1">🛡️ Simple & efficace</p>
                    <div className="mt-3 bg-black/20 text-gray-900 text-xs md:text-sm px-3 py-1.5 rounded-lg font-bold group-hover:bg-gray-900 group-hover:text-yellow-400 transition-all">
                      Découvrir →
                    </div>
                  </a>
                </div>

                <p className="text-center text-purple-300 text-xs md:text-sm">
                  💡 Un VPN vous permet de changer virtuellement de pays et d'accéder aux catalogues étrangers
                </p>
              </div>
            </div>
          </>
        )}

        {selectedMovie && (
          <div className="space-y-8">
            {/* Movie Hero - Backdrop Design */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              {/* Backdrop Image */}
              {selectedMovie.backdrop && (
                <div className="absolute inset-0">
                  <img
                    src={selectedMovie.backdrop}
                    alt={selectedMovie.title}
                    className="w-full h-full object-cover"
                    style={{ filter: 'blur(8px)', transform: 'scale(1.1)' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40"></div>
                </div>
              )}
              
              {/* Content */}
              <div className="relative z-10 px-6 md:px-12 py-12 md:py-16">
                <button
                  onClick={goBack}
                  className="flex items-center gap-2 text-white/90 hover:text-white mb-8 transition-colors font-medium group"
                >
                  <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                  Nouvelle recherche
                </button>

                <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                  {/* Poster */}
                  {selectedMovie.poster && (
                    <img
                      src={selectedMovie.poster}
                      alt={selectedMovie.title}
                      className="w-48 md:w-64 rounded-2xl shadow-2xl border-4 border-white/20"
                    />
                  )}

                  {/* Info */}
                  <div className="flex-1 text-center md:text-left">
                    <h1 className="text-4xl md:text-6xl font-black text-white mb-2 leading-tight">
                      {selectedMovie.title}
                    </h1>
                    
                    {selectedMovie.original_title && selectedMovie.original_title !== selectedMovie.title && (
                      <p className="text-white/70 text-lg md:text-xl mb-4 italic">
                        {selectedMovie.original_title}
                      </p>
                    )}

                    <div className="flex items-center gap-4 justify-center md:justify-start mb-6 text-white/90">
                      {selectedMovie.year && (
                        <span className="text-lg md:text-xl font-medium">
                          📅 {selectedMovie.year}
                        </span>
                      )}
                      {selectedMovie.vote_average && (
                        <>
                          <span className="text-white/50">•</span>
                          <span className="text-lg md:text-xl font-medium flex items-center gap-1">
                            ⭐ {selectedMovie.vote_average.toFixed(1)}/10
                          </span>
                        </>
                      )}
                    </div>

                    {selectedMovie.overview && (
                      <p className="text-white/80 text-base md:text-lg leading-relaxed max-w-3xl">
                        {selectedMovie.overview}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Filters Section */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 md:p-8 border border-gray-700 shadow-2xl">
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
                        <p className="text-gray-500 text-xs mt-2">💡 Par défaut: Tout (VF + VOSTFR) - Cliquez pour filtrer</p>
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

            {loadingAvailability && (
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 border border-gray-700 text-center">
                <Loader className="w-16 h-16 text-red-500 mx-auto mb-6 animate-spin" />
                <p className="text-white text-2xl font-bold mb-2">Recherche en cours...</p>
                <p className="text-gray-400 text-lg">Recherche des disponibilités en cours...</p>
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

                {/* Countries - Grouped by Region */}
                {countriesArray && countriesArray.length > 0 && (
                  <div className="space-y-6">
                    {sortedRegions.map(region => (
                      <div key={region} className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 md:p-8 border border-gray-700 shadow-2xl">
                        <h4 className="text-2xl md:text-3xl font-black text-white mb-6 flex items-center gap-3">
                          <span className="bg-red-600 w-2 h-8 rounded-full"></span>
                          {region} ({countriesByRegion[region].length})
                        </h4>
                        <div className="space-y-3">
                          {countriesByRegion[region].map((country) => {
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
                                {(selectedMovie?.media_type === 'tv' ? groupSeasons(country.options) : country.options).map((avail, idx) => (
                                  <div
                                    key={idx}
                                    className="bg-gray-800 rounded-xl p-4 hover:bg-gray-750 transition-all"
                                  >
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        {/* For addons, show addon name first */}
                                        {avail.streaming_type === 'addon' && avail.addon_name ? (
                                          <>
                                            <span className="text-sm bg-blue-600 text-white px-3 py-1 rounded-full font-black">
                                              📡 {avail.addon_name}
                                            </span>
                                            <span className="text-xs text-gray-400 italic">
                                              (via {avail.platform})
                                            </span>
                                          </>
                                        ) : (
                                          <span className={`text-sm ${getPlatformStyle(avail.platform).bg} ${getPlatformStyle(avail.platform).text} px-3 py-1 rounded-full font-black`}>
                                            {getPlatformStyle(avail.platform).icon} {avail.platform}
                                          </span>
                                        )}
                                        
                                        {/* Show "INCLUS" badge for Prime subscription to clarify it's included */}
                                        {avail.platform === 'Amazon Prime' && avail.streaming_type === 'subscription' && (
                                          <span className="text-xs px-2 py-1 rounded bg-green-600 text-white font-bold">
                                            ✓ INCLUS
                                          </span>
                                        )}
                                        
                                        {/* Show season information for TV series */}
                                        {selectedMovie?.media_type === 'tv' && avail.seasonsText && (
                                          <span className="text-xs px-2 py-1 rounded bg-purple-600 text-white font-bold">
                                            📺 {avail.seasonsText}
                                          </span>
                                        )}
                                      </div>
                                      
                                      {/* Type badges */}
                                      <div className="flex flex-col gap-1 items-end">
                                        {avail.streaming_type === 'addon' && (
                                          <span className="text-xs px-2 py-1 rounded bg-orange-600 text-white font-bold">
                                            💳 ABONNEMENT SÉPARÉ
                                          </span>
                                        )}
                                        {avail.streaming_type === 'rent' && (
                                          <span className="text-sm px-3 py-1 rounded-lg bg-orange-600 text-white font-black shadow-lg">
                                            🎬 LOCATION
                                          </span>
                                        )}
                                        {avail.streaming_type === 'buy' && (
                                          <span className="text-sm px-3 py-1 rounded-lg bg-orange-600 text-white font-black shadow-lg">
                                            💰 ACHAT
                                          </span>
                                        )}
                                        {avail.streaming_type === 'free' && (
                                          <span className="text-sm px-3 py-1 rounded-lg bg-cyan-600 text-white font-black shadow-lg">
                                            🆓 GRATUIT
                                          </span>
                                        )}
                                      </div>
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
                                        className={`block text-center ${
                                          avail.streaming_type === 'addon' ? 'bg-blue-600' : getPlatformStyle(avail.platform).bg
                                        } hover:opacity-90 text-white py-2 rounded-lg text-sm font-black transition-all hover:scale-105 shadow-lg`}
                                      >
                                        {avail.streaming_type === 'rent' ? '🎬 Louer' :
                                         avail.streaming_type === 'buy' ? '💰 Acheter' :
                                         avail.streaming_type === 'addon' && avail.addon_name ? `💳 S'abonner à ${avail.addon_name}` :
                                         avail.streaming_type === 'addon' ? `📡 Chaîne payante` :
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
                    ))}
                  </div>
                )}

                {/* VPN CTA */}
                <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-3xl p-8 md:p-10 shadow-2xl border border-purple-500/30 overflow-hidden relative">
                  {/* Background decoration */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-purple-500 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl"></div>
                  </div>
                  
                  <div className="relative z-10 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl mb-4 shadow-lg">
                      <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-3xl md:text-4xl font-black text-white mb-4">
                      🌍 Ce contenu n'est pas disponible dans votre pays ?
                    </h3>
                    <p className="text-purple-200 text-lg mb-6 max-w-2xl mx-auto">
                      Utilisez un VPN pour accéder aux catalogues des autres pays
                    </p>
                    
                    {/* VPN Buttons */}
                    <div className="flex flex-wrap gap-3 justify-center mb-4">
                      <a
                        href="https://go.nordvpn.net/aff_c?offer_id=15&aff_id=93849"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-[#4687FF] hover:bg-[#3a75e0] text-white px-5 py-3 rounded-xl font-bold transition-all hover:scale-105 shadow-lg"
                      >
                        <img src="https://logo.clearbit.com/nordvpn.com" alt="NordVPN" className="h-5 w-5 rounded" />
                        NordVPN
                      </a>
                      <a
                        href="https://www.expressvpn.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-[#DA3940] hover:bg-[#c13138] text-white px-5 py-3 rounded-xl font-bold transition-all hover:scale-105 shadow-lg"
                      >
                        <img src="https://logo.clearbit.com/expressvpn.com" alt="ExpressVPN" className="h-5 w-5 rounded" />
                        ExpressVPN
                      </a>
                      <a
                        href="https://surfshark.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-[#178BCC] hover:bg-[#1379b3] text-white px-5 py-3 rounded-xl font-bold transition-all hover:scale-105 shadow-lg"
                      >
                        <img src="https://logo.clearbit.com/surfshark.com" alt="Surfshark" className="h-5 w-5 rounded" />
                        Surfshark
                      </a>
                      <a
                        href="https://www.cyberghostvpn.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-[#FFCC00] hover:bg-[#e6b800] text-black px-5 py-3 rounded-xl font-bold transition-all hover:scale-105 shadow-lg"
                      >
                        <img src="https://logo.clearbit.com/cyberghostvpn.com" alt="CyberGhost" className="h-5 w-5 rounded" />
                        CyberGhost
                      </a>
                    </div>
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
          {/* TMDB Attribution - Required */}
          <div className="flex flex-col items-center justify-center gap-4 mb-6 pb-6 border-b border-gray-800">
            <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
              <img 
                src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg" 
                alt="TMDB Logo" 
                className="h-6 md:h-8"
              />
            </a>
            <p className="text-gray-500 text-xs text-center max-w-lg">
              Ce produit utilise l'API TMDB mais n'est ni approuvé ni certifié par TMDB.
              Les informations sur les films et séries sont fournies par <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">The Movie Database (TMDB)</a>.
            </p>
          </div>

          {/* Main Footer Content */}
          <div className="text-center space-y-4">
            <p className="text-gray-500 text-sm">
              <img src="https://flagcdn.com/24x18/fr.png" alt="France" className="inline w-6 h-4 mr-1" /> Fait avec ❤️ pour les francophones du monde entier
            </p>
            
            {/* Legal Links */}
            <div className="flex items-center justify-center gap-4 text-sm">
              <button 
                onClick={() => setShowLegalModal(true)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                Mentions légales
              </button>
              <span className="text-gray-700">•</span>
              <button 
                onClick={() => setShowPrivacyModal(true)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                Politique de confidentialité
              </button>
              <span className="text-gray-700">•</span>
              <button 
                onClick={() => setShowFAQPage(true)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                FAQ
              </button>
            </div>

            {/* Copyright */}
            <p className="text-gray-600 text-xs">
              © {new Date().getFullYear()} VF Movie Finder. Tous droits réservés. 
              <br className="md:hidden" />
              <span className="hidden md:inline"> • </span>
              Service d'information indépendant, non affilié aux plateformes de streaming.
            </p>
          </div>
        </div>
      </footer>

      {/* Legal Modal - Mentions Légales */}
      {showLegalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl">
            <div className="sticky top-0 bg-gray-900 p-4 md:p-6 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-xl md:text-2xl font-bold text-white">📜 Mentions Légales</h2>
              <button 
                onClick={() => setShowLegalModal(false)}
                className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 md:p-6 space-y-6 text-gray-300">
              <section>
                <h3 className="text-lg font-bold text-white mb-2">1. Éditeur du site</h3>
                <p className="text-sm">
                  VF Movie Finder est un service d'information indépendant permettant aux utilisateurs de rechercher 
                  la disponibilité de films et séries sur les plateformes de streaming légales.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-white mb-2">2. Nature du service</h3>
                <p className="text-sm">
                  Ce site est un <strong>moteur de recherche et agrégateur d'informations</strong>. Il ne propose aucun 
                  contenu en streaming, téléchargement ou hébergement de fichiers vidéo. Toutes les redirections 
                  mènent vers des plateformes de streaming officielles et légales.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-white mb-2">3. Sources des données</h3>
                <p className="text-sm mb-2">Les informations affichées proviennent de :</p>
                <ul className="text-sm list-disc list-inside space-y-1 ml-2">
                  <li><strong>The Movie Database (TMDB)</strong> - Métadonnées des films et séries (titres, affiches, synopsis)</li>
                  <li><strong>Streaming Availability API</strong> - Informations de disponibilité sur les plateformes</li>
                </ul>
                <p className="text-sm mt-2">
                  Ces données sont fournies à titre indicatif et peuvent ne pas refléter la disponibilité en temps réel. 
                  Nous vous recommandons de vérifier directement sur la plateforme concernée.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-white mb-2">4. Non-affiliation</h3>
                <p className="text-sm">
                  VF Movie Finder n'est <strong>affilié, sponsorisé ou approuvé</strong> par aucune des plateformes de streaming 
                  mentionnées (Netflix, Disney+, Amazon Prime Video, Apple TV+, etc.). Les noms et logos sont la propriété 
                  de leurs détenteurs respectifs et sont utilisés à des fins d'identification uniquement.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-white mb-2">5. Attribution TMDB</h3>
                <div className="bg-gray-800 p-4 rounded-lg">
                  <img 
                    src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg" 
                    alt="TMDB Logo" 
                    className="h-8 mb-3"
                  />
                  <p className="text-sm">
                    Ce produit utilise l'API TMDB mais n'est ni approuvé ni certifié par TMDB. Toutes les informations 
                    relatives aux films, séries, acteurs et images sont fournies par The Movie Database.
                  </p>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-bold text-white mb-2">6. Services VPN et accès aux catalogues</h3>
                <p className="text-sm mb-2">
                  Ce site présente des services VPN partenaires qui permettent de changer virtuellement de localisation 
                  et ainsi d'accéder aux catalogues de streaming disponibles dans d'autres pays.
                </p>
                <p className="text-sm">
                  <strong>L'utilisation d'un VPN est légale</strong> dans la plupart des pays. Des millions d'utilisateurs 
                  dans le monde utilisent quotidiennement des VPN pour accéder à leurs contenus préférés et protéger 
                  leur vie privée en ligne.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-white mb-2">7. Limitation de responsabilité</h3>
                <p className="text-sm">
                  VF Movie Finder ne garantit pas l'exactitude, l'exhaustivité ou l'actualité des informations présentées. 
                  L'utilisation du site se fait sous l'entière responsabilité de l'utilisateur. Nous ne sommes pas 
                  responsables des contenus des sites tiers vers lesquels nous redirigeons.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-white mb-2">8. Propriété intellectuelle</h3>
                <p className="text-sm">
                  Les affiches, images et métadonnées des films et séries sont la propriété de leurs ayants droit respectifs. 
                  Elles sont affichées via l'API TMDB conformément à leurs conditions d'utilisation.
                </p>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Modal - Politique de confidentialité */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl">
            <div className="sticky top-0 bg-gray-900 p-4 md:p-6 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-xl md:text-2xl font-bold text-white">🔒 Politique de Confidentialité</h2>
              <button 
                onClick={() => setShowPrivacyModal(false)}
                className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 md:p-6 space-y-6 text-gray-300">
              <p className="text-sm text-gray-400">
                Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>

              <section>
                <h3 className="text-lg font-bold text-white mb-2">1. Introduction</h3>
                <p className="text-sm">
                  VF Movie Finder s'engage à protéger la vie privée de ses utilisateurs. Cette politique de 
                  confidentialité explique quelles informations nous collectons et comment nous les utilisons.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-white mb-2">2. Données collectées</h3>
                <p className="text-sm mb-2">Notre site collecte un minimum de données :</p>
                <ul className="text-sm list-disc list-inside space-y-1 ml-2">
                  <li><strong>Données de navigation</strong> - Pages visitées, recherches effectuées (non nominatives)</li>
                  <li><strong>Données techniques</strong> - Type de navigateur, appareil utilisé (anonymisées)</li>
                  <li><strong>Préférences</strong> - Filtres de recherche sélectionnés (stockés localement)</li>
                </ul>
                <p className="text-sm mt-2 text-green-400">
                  ✓ Nous ne collectons PAS : nom, email, adresse, données de paiement ou toute information personnelle identifiable.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-white mb-2">3. Cookies et stockage local</h3>
                <p className="text-sm">
                  Nous utilisons le stockage local (localStorage) de votre navigateur pour sauvegarder vos préférences 
                  (comme le prompt d'installation PWA). Aucun cookie de traçage publicitaire n'est utilisé sur ce site.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-white mb-2">4. Services tiers</h3>
                <p className="text-sm mb-2">Notre site interagit avec les services tiers suivants :</p>
                <ul className="text-sm list-disc list-inside space-y-1 ml-2">
                  <li><strong>TMDB API</strong> - Pour récupérer les informations sur les films/séries</li>
                  <li><strong>Streaming Availability API</strong> - Pour les données de disponibilité</li>
                  <li><strong>Clearbit</strong> - Pour les logos des partenaires VPN</li>
                  <li><strong>Flagcdn</strong> - Pour les drapeaux des pays</li>
                </ul>
                <p className="text-sm mt-2">
                  Ces services peuvent avoir leurs propres politiques de confidentialité.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-white mb-2">5. Liens affiliés</h3>
                <p className="text-sm">
                  Notre site contient des liens affiliés vers des services VPN. Lorsque vous cliquez sur ces liens 
                  et effectuez un achat, nous pouvons recevoir une commission. Cela n'affecte pas le prix que vous payez 
                  et nous aide à maintenir ce service gratuit.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-white mb-2">6. Liens externes</h3>
                <p className="text-sm">
                  Notre site contient des liens vers des plateformes de streaming et d'autres sites externes. 
                  Nous ne sommes pas responsables des pratiques de confidentialité de ces sites tiers. 
                  Nous vous encourageons à lire leurs politiques de confidentialité.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-white mb-2">7. Sécurité</h3>
                <p className="text-sm">
                  Notre site est servi via HTTPS pour assurer la sécurité de votre connexion. 
                  Nous ne stockons aucune donnée sensible sur nos serveurs.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-white mb-2">8. Vos droits</h3>
                <p className="text-sm">
                  Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression 
                  de vos données. Étant donné que nous ne collectons pas de données personnelles identifiables, 
                  ces droits s'appliquent principalement aux données stockées localement dans votre navigateur, 
                  que vous pouvez supprimer à tout moment en effaçant les données de navigation.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-white mb-2">9. Modifications</h3>
                <p className="text-sm">
                  Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. 
                  Les modifications seront effectives dès leur publication sur cette page.
                </p>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* FAQ Page - Full page SEO optimized */}
      {showFAQPage && (
        <div className="fixed inset-0 z-50 bg-gray-950 overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gray-900 border-b border-gray-800 z-10">
            <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-red-600 p-2 rounded-xl">
                  <Film className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-xl font-bold text-white">FAQ - Questions Fréquentes</h1>
              </div>
              <button 
                onClick={() => setShowFAQPage(false)}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Retour
              </button>
            </div>
          </div>

          {/* FAQ Content */}
          <div className="max-w-5xl mx-auto px-4 py-8">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
                ❓ Foire Aux Questions
              </h1>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Tout ce que vous devez savoir pour <strong className="text-white">regarder des films et séries en VF</strong> où que vous soyez dans le monde
              </p>
            </div>

            {/* FAQ Categories */}
            <div className="space-y-8">
              
              {/* Category 1: General */}
              <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
                <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    🎬 À propos de VF Movie Finder
                  </h2>
                </div>
                <div className="divide-y divide-gray-800">
                  
                  <details className="group">
                    <summary className="px-6 py-4 cursor-pointer hover:bg-gray-800/50 transition-colors flex items-center justify-between">
                      <h3 className="text-white font-medium">Comment fonctionne VF Movie Finder ?</h3>
                      <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="px-6 pb-4 text-gray-300 text-sm leading-relaxed">
                      <p className="mb-3">
                        <strong>VF Movie Finder</strong> est un moteur de recherche gratuit qui vous permet de trouver 
                        <strong> où regarder vos films et séries préférés en version française (VF) ou en version originale sous-titrée français (VOSTFR)</strong>.
                      </p>
                      <p className="mb-3">
                        Notre outil analyse en temps réel les catalogues des principales <strong>plateformes de streaming</strong> comme 
                        Netflix, Amazon Prime Video, Disney+, Apple TV+, Canal+, et bien d'autres, dans plus de 60 pays.
                      </p>
                      <p>
                        Il vous suffit de rechercher un film ou une série, et nous vous indiquons <strong>dans quels pays et sur quelles plateformes</strong> 
                        le contenu est disponible avec <strong>audio français ou sous-titres français</strong>.
                      </p>
                    </div>
                  </details>

                  <details className="group">
                    <summary className="px-6 py-4 cursor-pointer hover:bg-gray-800/50 transition-colors flex items-center justify-between">
                      <h3 className="text-white font-medium">D'où proviennent les informations de disponibilité ?</h3>
                      <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="px-6 pb-4 text-gray-300 text-sm leading-relaxed">
                      <p className="mb-3">
                        Nous utilisons deux sources de données fiables et mises à jour régulièrement :
                      </p>
                      <ul className="list-disc list-inside space-y-2 mb-3">
                        <li><strong>The Movie Database (TMDB)</strong> - Pour les informations sur les films et séries (titres, affiches, synopsis, casting)</li>
                        <li><strong>Streaming Availability API</strong> - Pour les données de disponibilité en temps réel sur les plateformes de streaming</li>
                      </ul>
                      <p>
                        Ces données sont actualisées quotidiennement pour vous fournir les informations les plus précises possibles.
                      </p>
                    </div>
                  </details>

                  <details className="group">
                    <summary className="px-6 py-4 cursor-pointer hover:bg-gray-800/50 transition-colors flex items-center justify-between">
                      <h3 className="text-white font-medium">VF Movie Finder est-il gratuit ?</h3>
                      <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="px-6 pb-4 text-gray-300 text-sm leading-relaxed">
                      <p className="mb-3">
                        <strong>Oui, VF Movie Finder est 100% gratuit !</strong> Vous pouvez rechercher autant de films et séries 
                        que vous le souhaitez, sans inscription et sans aucune limite.
                      </p>
                      <p>
                        Notre site est financé par des partenariats avec des services VPN de confiance. Si vous décidez d'utiliser 
                        un VPN via nos liens, nous recevons une petite commission qui nous aide à maintenir le service gratuit.
                      </p>
                    </div>
                  </details>

                  <details className="group">
                    <summary className="px-6 py-4 cursor-pointer hover:bg-gray-800/50 transition-colors flex items-center justify-between">
                      <h3 className="text-white font-medium">Que signifie VF et VOSTFR ?</h3>
                      <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="px-6 pb-4 text-gray-300 text-sm leading-relaxed">
                      <p className="mb-3">
                        <strong>VF (Version Française)</strong> signifie que le film ou la série est doublé en français. 
                        Les dialogues sont entièrement en français, idéal pour ceux qui préfèrent ne pas lire de sous-titres.
                      </p>
                      <p className="mb-3">
                        <strong>VOSTFR (Version Originale Sous-Titrée Français)</strong> signifie que le contenu est dans sa langue originale 
                        (anglais, espagnol, coréen, etc.) avec des sous-titres en français. Parfait pour les puristes qui veulent 
                        entendre les voix originales des acteurs.
                      </p>
                      <p>
                        Sur VF Movie Finder, vous pouvez <strong>filtrer les résultats</strong> pour afficher uniquement les pays 
                        où le contenu est disponible en VF, en VOSTFR, ou les deux.
                      </p>
                    </div>
                  </details>

                </div>
              </div>

              {/* Category 2: Expats & Travelers */}
              <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    🌍 Pour les expatriés et voyageurs francophones
                  </h2>
                </div>
                <div className="divide-y divide-gray-800">

                  <details className="group">
                    <summary className="px-6 py-4 cursor-pointer hover:bg-gray-800/50 transition-colors flex items-center justify-between">
                      <h3 className="text-white font-medium">Je vis à l'étranger, comment regarder des films en français ?</h3>
                      <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="px-6 pb-4 text-gray-300 text-sm leading-relaxed">
                      <p className="mb-3">
                        <strong>Vous êtes expatrié au Canada, aux États-Unis, en Australie, au Japon ou ailleurs ?</strong> 
                        Vous avez sûrement remarqué que les films en version française sont rares sur Netflix et les autres plateformes locales.
                      </p>
                      <p className="mb-3">
                        Avec VF Movie Finder, vous pouvez :
                      </p>
                      <ol className="list-decimal list-inside space-y-2 mb-3">
                        <li>Rechercher le film ou la série que vous voulez regarder</li>
                        <li>Voir dans quels pays il est disponible en VF ou VOSTFR</li>
                        <li>Utiliser un VPN pour accéder au catalogue de ce pays</li>
                        <li>Profiter de vos contenus préférés en français !</li>
                      </ol>
                      <p>
                        C'est la solution utilisée par <strong>des millions de francophones dans le monde</strong> pour ne pas perdre 
                        leur connexion avec le contenu francophone.
                      </p>
                    </div>
                  </details>

                  <details className="group">
                    <summary className="px-6 py-4 cursor-pointer hover:bg-gray-800/50 transition-colors flex items-center justify-between">
                      <h3 className="text-white font-medium">Comment accéder au catalogue Netflix France depuis l'étranger ?</h3>
                      <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="px-6 pb-4 text-gray-300 text-sm leading-relaxed">
                      <p className="mb-3">
                        Pour <strong>accéder au catalogue Netflix France</strong> (ou de n'importe quel autre pays) depuis l'étranger, 
                        vous avez besoin d'un <strong>VPN (Virtual Private Network)</strong>.
                      </p>
                      <p className="mb-3">
                        Un VPN vous permet de changer virtuellement votre localisation. Par exemple, si vous êtes au Canada 
                        et que vous vous connectez à un serveur VPN en France, Netflix pensera que vous êtes en France et 
                        vous affichera le <strong>catalogue français avec tous les films et séries en VF</strong>.
                      </p>
                      <p>
                        Nous recommandons des VPN fiables comme <strong>NordVPN, ExpressVPN, Surfshark ou CyberGhost</strong> 
                        qui fonctionnent parfaitement avec Netflix et toutes les plateformes de streaming.
                      </p>
                    </div>
                  </details>

                  <details className="group">
                    <summary className="px-6 py-4 cursor-pointer hover:bg-gray-800/50 transition-colors flex items-center justify-between">
                      <h3 className="text-white font-medium">Quel pays a le meilleur catalogue Netflix en français ?</h3>
                      <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="px-6 pb-4 text-gray-300 text-sm leading-relaxed">
                      <p className="mb-3">
                        Les pays avec les <strong>meilleurs catalogues de contenus en français</strong> sont généralement :
                      </p>
                      <ul className="list-disc list-inside space-y-2 mb-3">
                        <li><strong>🇫🇷 France</strong> - Le plus grand catalogue de films et séries en VF</li>
                        <li><strong>🇧🇪 Belgique</strong> - Excellent catalogue francophone, souvent identique à la France</li>
                        <li><strong>🇨🇭 Suisse</strong> - Bon catalogue multilingue incluant le français</li>
                        <li><strong>🇨🇦 Canada</strong> - Catalogue bilingue avec beaucoup de contenu en VF</li>
                        <li><strong>🇱🇺 Luxembourg</strong> - Petit pays mais catalogue francophone complet</li>
                      </ul>
                      <p>
                        Utilisez VF Movie Finder pour <strong>comparer les catalogues</strong> et trouver où votre film préféré 
                        est disponible en français !
                      </p>
                    </div>
                  </details>

                </div>
              </div>

              {/* Category 3: VPN */}
              <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    🔐 VPN et accès aux catalogues
                  </h2>
                </div>
                <div className="divide-y divide-gray-800">

                  <details className="group">
                    <summary className="px-6 py-4 cursor-pointer hover:bg-gray-800/50 transition-colors flex items-center justify-between">
                      <h3 className="text-white font-medium">Qu'est-ce qu'un VPN et comment ça marche ?</h3>
                      <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="px-6 pb-4 text-gray-300 text-sm leading-relaxed">
                      <p className="mb-3">
                        Un <strong>VPN (Virtual Private Network)</strong> est un outil qui crée une connexion sécurisée et chiffrée 
                        entre votre appareil et internet. Il masque votre adresse IP réelle et vous en attribue une nouvelle 
                        basée sur la localisation du serveur que vous choisissez.
                      </p>
                      <p className="mb-3">
                        <strong>Exemple concret :</strong> Vous êtes à Tokyo et vous voulez regarder un film en VF sur Netflix France. 
                        Vous activez votre VPN, vous sélectionnez un serveur en France, et voilà ! Netflix pense que vous êtes en France 
                        et vous donne accès au catalogue français.
                      </p>
                      <p>
                        En plus de l'accès aux contenus géo-restreints, un VPN <strong>protège votre vie privée</strong> et 
                        <strong> sécurise vos données</strong> sur les réseaux Wi-Fi publics.
                      </p>
                    </div>
                  </details>

                  <details className="group">
                    <summary className="px-6 py-4 cursor-pointer hover:bg-gray-800/50 transition-colors flex items-center justify-between">
                      <h3 className="text-white font-medium">Est-ce légal d'utiliser un VPN pour le streaming ?</h3>
                      <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="px-6 pb-4 text-gray-300 text-sm leading-relaxed">
                      <p className="mb-3">
                        <strong>Oui, l'utilisation d'un VPN est totalement légale</strong> dans la grande majorité des pays du monde, 
                        y compris en France, en Europe, aux États-Unis, au Canada, en Australie, au Japon, etc.
                      </p>
                      <p className="mb-3">
                        <strong>Des millions de personnes</strong> utilisent quotidiennement un VPN pour :
                      </p>
                      <ul className="list-disc list-inside space-y-1 mb-3">
                        <li>Protéger leur vie privée en ligne</li>
                        <li>Sécuriser leurs connexions sur les Wi-Fi publics</li>
                        <li>Accéder à leurs contenus préférés en voyage</li>
                        <li>Contourner la censure dans certains pays</li>
                      </ul>
                      <p>
                        Les VPN sont des outils légitimes utilisés aussi bien par les particuliers que par les entreprises 
                        pour leur sécurité informatique.
                      </p>
                    </div>
                  </details>

                  <details className="group">
                    <summary className="px-6 py-4 cursor-pointer hover:bg-gray-800/50 transition-colors flex items-center justify-between">
                      <h3 className="text-white font-medium">Quel VPN choisir pour regarder Netflix, Disney+ et Prime Video ?</h3>
                      <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="px-6 pb-4 text-gray-300 text-sm leading-relaxed">
                      <p className="mb-3">
                        Tous les VPN ne fonctionnent pas avec les plateformes de streaming. Nous recommandons ces 
                        <strong> VPN testés et approuvés</strong> qui fonctionnent parfaitement avec Netflix, Disney+, 
                        Amazon Prime Video, et autres :
                      </p>
                      <div className="space-y-3 mb-3">
                        <div className="bg-gray-800 p-3 rounded-lg">
                          <p className="font-bold text-white">🥇 NordVPN - Le plus populaire</p>
                          <p className="text-sm">Plus de 5000 serveurs dans 60 pays, vitesse excellente, fonctionne avec toutes les plateformes</p>
                        </div>
                        <div className="bg-gray-800 p-3 rounded-lg">
                          <p className="font-bold text-white">🥈 ExpressVPN - Le plus rapide</p>
                          <p className="text-sm">Vitesses ultra-rapides, parfait pour le streaming 4K, interface très simple</p>
                        </div>
                        <div className="bg-gray-800 p-3 rounded-lg">
                          <p className="font-bold text-white">🥉 Surfshark - Le meilleur rapport qualité/prix</p>
                          <p className="text-sm">Appareils illimités, prix attractif, excellent pour les familles</p>
                        </div>
                        <div className="bg-gray-800 p-3 rounded-lg">
                          <p className="font-bold text-white">🏅 CyberGhost - Le plus simple</p>
                          <p className="text-sm">Serveurs optimisés pour le streaming, interface intuitive, idéal pour les débutants</p>
                        </div>
                      </div>
                    </div>
                  </details>

                  <details className="group">
                    <summary className="px-6 py-4 cursor-pointer hover:bg-gray-800/50 transition-colors flex items-center justify-between">
                      <h3 className="text-white font-medium">Un VPN va-t-il ralentir ma connexion ?</h3>
                      <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="px-6 pb-4 text-gray-300 text-sm leading-relaxed">
                      <p className="mb-3">
                        Les VPN premium comme NordVPN, ExpressVPN et Surfshark sont optimisés pour le streaming et 
                        ont un <strong>impact minimal sur votre vitesse de connexion</strong>.
                      </p>
                      <p className="mb-3">
                        Avec une bonne connexion internet, vous pouvez facilement :
                      </p>
                      <ul className="list-disc list-inside space-y-1 mb-3">
                        <li>Regarder en <strong>4K Ultra HD</strong> sans buffering</li>
                        <li>Streamer sur plusieurs appareils simultanément</li>
                        <li>Télécharger rapidement pour regarder hors-ligne</li>
                      </ul>
                      <p>
                        <strong>Astuce :</strong> Choisissez un serveur proche de votre localisation réelle pour de meilleures performances. 
                        Par exemple, si vous êtes au Canada et voulez accéder à Netflix France, choisissez un serveur à Paris plutôt qu'à Marseille.
                      </p>
                    </div>
                  </details>

                </div>
              </div>

              {/* Category 4: Technical */}
              <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    ⚙️ Questions techniques
                  </h2>
                </div>
                <div className="divide-y divide-gray-800">

                  <details className="group">
                    <summary className="px-6 py-4 cursor-pointer hover:bg-gray-800/50 transition-colors flex items-center justify-between">
                      <h3 className="text-white font-medium">Pourquoi un film affiché n'est plus disponible ?</h3>
                      <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="px-6 pb-4 text-gray-300 text-sm leading-relaxed">
                      <p className="mb-3">
                        Les catalogues de streaming <strong>changent constamment</strong>. Les films et séries sont ajoutés 
                        et retirés régulièrement en fonction des accords de licence entre les plateformes et les studios.
                      </p>
                      <p className="mb-3">
                        Nos données sont mises à jour quotidiennement, mais il peut y avoir un léger décalage entre 
                        le moment où un contenu est retiré et la mise à jour de notre base de données.
                      </p>
                      <p>
                        Si vous constatez une erreur, n'hésitez pas à rafraîchir la recherche plus tard. 
                        Le contenu peut aussi revenir sur la plateforme ultérieurement.
                      </p>
                    </div>
                  </details>

                  <details className="group">
                    <summary className="px-6 py-4 cursor-pointer hover:bg-gray-800/50 transition-colors flex items-center justify-between">
                      <h3 className="text-white font-medium">Quelles plateformes de streaming sont supportées ?</h3>
                      <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="px-6 pb-4 text-gray-300 text-sm leading-relaxed">
                      <p className="mb-3">
                        VF Movie Finder analyse les catalogues de <strong>toutes les principales plateformes de streaming</strong> :
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                        <span className="bg-gray-800 px-3 py-1 rounded text-center">Netflix</span>
                        <span className="bg-gray-800 px-3 py-1 rounded text-center">Amazon Prime</span>
                        <span className="bg-gray-800 px-3 py-1 rounded text-center">Disney+</span>
                        <span className="bg-gray-800 px-3 py-1 rounded text-center">Apple TV+</span>
                        <span className="bg-gray-800 px-3 py-1 rounded text-center">Canal+</span>
                        <span className="bg-gray-800 px-3 py-1 rounded text-center">OCS</span>
                        <span className="bg-gray-800 px-3 py-1 rounded text-center">Paramount+</span>
                        <span className="bg-gray-800 px-3 py-1 rounded text-center">HBO Max</span>
                        <span className="bg-gray-800 px-3 py-1 rounded text-center">Hulu</span>
                        <span className="bg-gray-800 px-3 py-1 rounded text-center">Peacock</span>
                        <span className="bg-gray-800 px-3 py-1 rounded text-center">Crunchyroll</span>
                        <span className="bg-gray-800 px-3 py-1 rounded text-center">Et plus...</span>
                      </div>
                      <p>
                        Nous couvrons plus de <strong>60 pays</strong> et <strong>200+ services de streaming</strong>.
                      </p>
                    </div>
                  </details>

                  <details className="group">
                    <summary className="px-6 py-4 cursor-pointer hover:bg-gray-800/50 transition-colors flex items-center justify-between">
                      <h3 className="text-white font-medium">Puis-je utiliser VF Movie Finder sur mobile ?</h3>
                      <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="px-6 pb-4 text-gray-300 text-sm leading-relaxed">
                      <p className="mb-3">
                        <strong>Oui, absolument !</strong> VF Movie Finder est entièrement responsive et fonctionne parfaitement 
                        sur smartphone et tablette (iOS et Android).
                      </p>
                      <p className="mb-3">
                        Vous pouvez même <strong>installer l'application</strong> sur votre écran d'accueil :
                      </p>
                      <ul className="list-disc list-inside space-y-1 mb-3">
                        <li><strong>Sur iPhone/iPad :</strong> Appuyez sur le bouton partage puis "Ajouter à l'écran d'accueil"</li>
                        <li><strong>Sur Android :</strong> Appuyez sur les 3 points du navigateur puis "Installer l'application"</li>
                      </ul>
                      <p>
                        L'application fonctionne ensuite comme une app native, avec un accès rapide depuis votre écran d'accueil.
                      </p>
                    </div>
                  </details>

                </div>
              </div>

              {/* Category 5: Streaming Platforms */}
              <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-6 py-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    📺 Plateformes de streaming
                  </h2>
                </div>
                <div className="divide-y divide-gray-800">

                  <details className="group">
                    <summary className="px-6 py-4 cursor-pointer hover:bg-gray-800/50 transition-colors flex items-center justify-between">
                      <h3 className="text-white font-medium">Pourquoi le catalogue Netflix est différent selon les pays ?</h3>
                      <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="px-6 pb-4 text-gray-300 text-sm leading-relaxed">
                      <p className="mb-3">
                        Chaque pays a un <strong>catalogue Netflix différent</strong> en raison des droits de diffusion. 
                        Les studios vendent les droits de leurs films et séries pays par pays, ce qui crée des 
                        catalogues uniques partout dans le monde.
                      </p>
                      <p className="mb-3">
                        Par exemple :
                      </p>
                      <ul className="list-disc list-inside space-y-1 mb-3">
                        <li>Un film peut être sur Netflix en France mais sur Disney+ aux États-Unis</li>
                        <li>Une série peut avoir la VF disponible uniquement en Belgique et au Canada</li>
                        <li>Certains contenus sont exclusifs à certaines régions</li>
                      </ul>
                      <p>
                        C'est précisément pourquoi <strong>VF Movie Finder existe</strong> : pour vous aider à trouver 
                        où vos contenus préférés sont disponibles en français !
                      </p>
                    </div>
                  </details>

                  <details className="group">
                    <summary className="px-6 py-4 cursor-pointer hover:bg-gray-800/50 transition-colors flex items-center justify-between">
                      <h3 className="text-white font-medium">Dois-je avoir un abonnement dans chaque pays ?</h3>
                      <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="px-6 pb-4 text-gray-300 text-sm leading-relaxed">
                      <p className="mb-3">
                        <strong>Non !</strong> Un seul abonnement Netflix (ou autre plateforme) suffit. Votre abonnement 
                        fonctionne dans tous les pays, c'est simplement le catalogue qui change selon votre localisation.
                      </p>
                      <p className="mb-3">
                        Quand vous utilisez un VPN pour vous connecter à un serveur en France par exemple, Netflix détecte 
                        que vous êtes "en France" et vous affiche automatiquement le catalogue français.
                      </p>
                      <p>
                        Vous gardez votre abonnement, vos profils, votre historique - seul le catalogue affiché change.
                      </p>
                    </div>
                  </details>

                </div>
              </div>

            </div>

            {/* CTA Section */}
            <div className="mt-12 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-8 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                🎬 Prêt à trouver votre prochain film en VF ?
              </h2>
              <p className="text-red-100 mb-6 max-w-2xl mx-auto">
                Recherchez parmi des milliers de films et séries disponibles en version française dans le monde entier
              </p>
              <button
                onClick={() => setShowFAQPage(false)}
                className="bg-white text-red-600 px-8 py-3 rounded-xl font-bold text-lg hover:bg-red-50 transition-all hover:scale-105 shadow-lg"
              >
                Commencer ma recherche →
              </button>
            </div>

            {/* SEO Footer Text */}
            <div className="mt-12 text-center text-gray-500 text-sm max-w-4xl mx-auto">
              <p>
                VF Movie Finder - Votre guide pour <strong>regarder des films en français à l'étranger</strong>. 
                Trouvez où sont disponibles vos <strong>films et séries en VF</strong> sur Netflix, Disney+, Amazon Prime Video 
                et toutes les plateformes de streaming. La solution pour les <strong>expatriés francophones</strong>, 
                les voyageurs et tous ceux qui veulent <strong>accéder au catalogue Netflix France</strong> depuis n'importe où dans le monde.
              </p>
            </div>

          </div>
        </div>
      )}

      {/* Floating Share Widget */}
      <div className="fixed right-4 bottom-4 md:right-6 md:bottom-6 z-50">
        {/* Share Menu */}
        {showShareMenu && (
          <div className="absolute bottom-16 right-0 bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 p-3 mb-2 animate-fade-in">
            <p className="text-white text-xs font-bold mb-3 text-center">Partager</p>
            <div className="flex flex-col gap-2">
              {/* Facebook */}
              <button
                onClick={shareToFacebook}
                className="flex items-center gap-3 px-4 py-2 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-lg transition-all hover:scale-105"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="text-sm font-medium">Facebook</span>
              </button>

              {/* Twitter/X */}
              <button
                onClick={shareToTwitter}
                className="flex items-center gap-3 px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg transition-all hover:scale-105 border border-gray-600"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span className="text-sm font-medium">X (Twitter)</span>
              </button>

              {/* WhatsApp */}
              <button
                onClick={shareToWhatsApp}
                className="flex items-center gap-3 px-4 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-lg transition-all hover:scale-105"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span className="text-sm font-medium">WhatsApp</span>
              </button>

              {/* Telegram */}
              <button
                onClick={shareToTelegram}
                className="flex items-center gap-3 px-4 py-2 bg-[#0088cc] hover:bg-[#007ab8] text-white rounded-lg transition-all hover:scale-105"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                <span className="text-sm font-medium">Telegram</span>
              </button>

              {/* TikTok */}
              <button
                onClick={shareToTikTok}
                className="flex items-center gap-3 px-4 py-2 bg-black hover:bg-gray-900 text-white rounded-lg transition-all hover:scale-105 border border-gray-600"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
                <span className="text-sm font-medium">TikTok</span>
              </button>

              {/* Instagram */}
              <button
                onClick={shareToInstagram}
                className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] hover:opacity-90 text-white rounded-lg transition-all hover:scale-105"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
                <span className="text-sm font-medium">Instagram</span>
              </button>

              {/* Copy Link */}
              <button
                onClick={copyToClipboard}
                className={`flex items-center gap-3 px-4 py-2 ${copySuccess ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'} text-white rounded-lg transition-all hover:scale-105`}
              >
                {copySuccess ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
                <span className="text-sm font-medium">{copySuccess ? 'Copié!' : 'Copier le lien'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Share Toggle Button */}
        <button
          onClick={() => setShowShareMenu(!showShareMenu)}
          className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 ${
            showShareMenu 
              ? 'bg-red-600 hover:bg-red-700 rotate-45' 
              : 'bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
          }`}
        >
          {showShareMenu ? (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
