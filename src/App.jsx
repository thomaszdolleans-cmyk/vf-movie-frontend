diff --git a/src/App.jsx b/src/App.jsx
index e4f25040f9347cab26d69cb7c61a4d27e773997c..3ac4b5590943be3309e881d169aeede89a209400 100644
--- a/src/App.jsx
+++ b/src/App.jsx
@@ -1,1282 +1,543 @@
-import React, { useState, useEffect } from 'react';
-import { Search, Film, Globe, CheckCircle, XCircle, Loader, ArrowLeft, Tv, Shield, Zap, AlertCircle } from 'lucide-react';
+// VF Movie Finder – main application entry
+import React, { useEffect, useMemo, useState } from 'react';
+import {
+  AlertCircle,
+  ArrowLeft,
+  CheckCircle,
+  Film,
+  Globe,
+  Loader,
+  Search,
+  Shield,
+  Tv,
+  XCircle,
+  Zap,
+} from 'lucide-react';
 
 const API_URL = 'https://vf-movie-backend.onrender.com';
 
-const countryFlags = {
-  'FR': '🇫🇷', 'BE': '🇧🇪', 'CH': '🇨🇭', 'CA': '🇨🇦', 'US': '🇺🇸', 'GB': '🇬🇧',
-  'DE': '🇩🇪', 'ES': '🇪🇸', 'IT': '🇮🇹', 'PT': '🇵🇹', 'BR': '🇧🇷', 'MX': '🇲🇽',
-  'AR': '🇦🇷', 'CL': '🇨🇱', 'CO': '🇨🇴', 'AU': '🇦🇺', 'NZ': '🇳🇿', 'JP': '🇯🇵',
-  'KR': '🇰🇷', 'IN': '🇮🇳', 'SG': '🇸🇬', 'TH': '🇹🇭', 'NL': '🇳🇱', 'SE': '🇸🇪',
-  'NO': '🇳🇴', 'DK': '🇩🇰', 'FI': '🇫🇮', 'PL': '🇵🇱', 'CZ': '🇨🇿', 'GR': '🇬🇷',
-  'TR': '🇹🇷', 'ZA': '🇿🇦', 'MA': '🇲🇦', 'TN': '🇹🇳', 'DZ': '🇩🇿', 'SN': '🇸🇳',
-  'AT': '🇦🇹', 'IE': '🇮🇪', 'HU': '🇭🇺', 'RO': '🇷🇴', 'UA': '🇺🇦', 'IL': '🇮🇱',
-  'PH': '🇵🇭', 'MY': '🇲🇾', 'ID': '🇮🇩', 'VN': '🇻🇳', 'HK': '🇭🇰', 'TW': '🇹🇼',
-  'EG': '🇪🇬', 'NG': '🇳🇬', 'KE': '🇰🇪', 'CI': '🇨🇮', 'MG': '🇲🇬', 'IS': '🇮🇸',
-  'HR': '🇭🇷', 'RS': '🇷🇸', 'SI': '🇸🇮', 'SK': '🇸🇰', 'BG': '🇧🇬', 'LT': '🇱🇹',
-  'LV': '🇱🇻', 'EE': '🇪🇪', 'PE': '🇵🇪', 'VE': '🇻🇪', 'UY': '🇺🇾', 'EC': '🇪🇨'
-};
-
-// Platform colors and styles
 const platformStyles = {
-  'Netflix': { bg: 'bg-red-600', text: 'text-white', icon: '▶' },
-  'Amazon Prime': { bg: 'bg-blue-500', text: 'text-white', icon: '►' },
-  'Disney+': { bg: 'bg-blue-600', text: 'text-white', icon: '★' },
-  'HBO Max': { bg: 'bg-purple-600', text: 'text-white', icon: '▶' },
-  'Apple TV+': { bg: 'bg-black', text: 'text-white', icon: '' },
-  'Paramount+': { bg: 'bg-blue-700', text: 'text-white', icon: '▲' },
-  'Canal+': { bg: 'bg-black', text: 'text-white', icon: '+' },
-  'default': { bg: 'bg-gray-600', text: 'text-white', icon: '▶' }
+  Netflix: { bg: 'bg-red-600', text: 'text-white' },
+  'Amazon Prime': { bg: 'bg-blue-500', text: 'text-white' },
+  'Disney+': { bg: 'bg-blue-700', text: 'text-white' },
+  'HBO Max': { bg: 'bg-purple-600', text: 'text-white' },
+  'Apple TV+': { bg: 'bg-gray-900', text: 'text-white' },
+  'Paramount+': { bg: 'bg-blue-800', text: 'text-white' },
+  'Canal+': { bg: 'bg-black', text: 'text-white' },
+  default: { bg: 'bg-gray-700', text: 'text-white' },
 };
 
-function getPlatformStyle(platform) {
+const STREAMING_TYPES = [
+  { id: 'subscription', label: 'Abonnement' },
+  { id: 'rent', label: 'Location' },
+  { id: 'buy', label: 'Achat' },
+  { id: 'addon', label: 'Option' },
+  { id: 'free', label: 'Gratuit' },
+];
+
+function formatPlatformStyle(platform) {
   return platformStyles[platform] || platformStyles.default;
 }
 
+function AvailabilityBadge({ availability }) {
+  const style = formatPlatformStyle(availability.platform);
+  return (
+    <div
+      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-2xl border border-white/10 shadow-lg ${style.bg} ${style.text}`}
+    >
+      <div className="flex items-center gap-3">
+        <div className="bg-black/20 rounded-xl p-3">
+          <Tv className="w-5 h-5" />
+        </div>
+        <div>
+          <p className="text-lg font-bold flex items-center gap-2">
+            {availability.platform}
+            {availability.addon_name && (
+              <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded-lg">
+                + {availability.addon_name}
+              </span>
+            )}
+          </p>
+          <p className="text-sm text-white/80 capitalize">
+            {availability.streaming_type || 'subscription'} · {availability.country_name || availability.country_code}
+          </p>
+        </div>
+      </div>
+      <div className="flex flex-wrap gap-2">
+        {availability.has_french_audio && (
+          <span className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">
+            <CheckCircle className="w-4 h-4" /> VF
+          </span>
+        )}
+        {availability.has_french_subtitles && (
+          <span className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">
+            <Globe className="w-4 h-4" /> VOSTFR
+          </span>
+        )}
+      </div>
+    </div>
+  );
+}
+
+function Filters({
+  audioFilter,
+  availableCountries,
+  availablePlatforms,
+  onReset,
+  platformFilter,
+  setAudioFilter,
+  setCountryFilter,
+  setPlatformFilter,
+  toggleType,
+  typeFilters,
+}) {
+  return (
+    <div className="bg-gray-900/80 rounded-3xl border border-gray-800 p-6 space-y-6">
+      <div className="flex items-center justify-between gap-3">
+        <h3 className="text-lg font-bold text-white flex items-center gap-2">
+          <Shield className="w-5 h-5" /> Filtres
+        </h3>
+        <button
+          onClick={onReset}
+          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold"
+        >
+          <XCircle className="w-4 h-4" /> Réinitialiser
+        </button>
+      </div>
+
+      <div className="grid md:grid-cols-2 gap-4">
+        <div className="space-y-3">
+          <p className="text-xs uppercase tracking-wide text-gray-400">Audio</p>
+          <div className="flex flex-wrap gap-2">
+            {[
+              { id: 'all', label: 'VF + VOSTFR' },
+              { id: 'vf', label: 'VF uniquement' },
+              { id: 'vostfr', label: 'VOSTFR uniquement' },
+            ].map((option) => (
+              <button
+                key={option.id}
+                onClick={() => setAudioFilter(option.id)}
+                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
+                  audioFilter === option.id
+                    ? 'bg-red-600 border-red-500 text-white'
+                    : 'bg-gray-800 border-gray-700 text-gray-200 hover:border-gray-500'
+                }`}
+              >
+                {option.label}
+              </button>
+            ))}
+          </div>
+        </div>
+
+        <div className="space-y-3">
+          <p className="text-xs uppercase tracking-wide text-gray-400">Plateforme</p>
+          <div className="flex flex-wrap gap-2">
+            <button
+              onClick={() => setPlatformFilter('all')}
+              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
+                platformFilter === 'all'
+                  ? 'bg-red-600 border-red-500 text-white'
+                  : 'bg-gray-800 border-gray-700 text-gray-200 hover:border-gray-500'
+              }`}
+            >
+              Toutes
+            </button>
+            {availablePlatforms.map((platform) => (
+              <button
+                key={platform}
+                onClick={() => setPlatformFilter(platform)}
+                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
+                  platformFilter === platform
+                    ? 'bg-red-600 border-red-500 text-white'
+                    : 'bg-gray-800 border-gray-700 text-gray-200 hover:border-gray-500'
+                }`}
+              >
+                {platform}
+              </button>
+            ))}
+          </div>
+        </div>
+      </div>
+
+      <div className="grid md:grid-cols-2 gap-4">
+        <div className="space-y-3">
+          <p className="text-xs uppercase tracking-wide text-gray-400">Pays</p>
+          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
+            <button
+              onClick={() => setCountryFilter('all')}
+              className="px-4 py-2 rounded-xl text-sm font-semibold border bg-gray-800 border-gray-700 text-gray-200 hover:border-gray-500"
+            >
+              Tous les pays
+            </button>
+            {availableCountries.map((country) => (
+              <button
+                key={country.code}
+                onClick={() => setCountryFilter(country.code)}
+                className="px-4 py-2 rounded-xl text-sm font-semibold border bg-gray-800 border-gray-700 text-gray-200 hover:border-gray-500"
+              >
+                {country.name}
+              </button>
+            ))}
+          </div>
+        </div>
+
+        <div className="space-y-3">
+          <p className="text-xs uppercase tracking-wide text-gray-400">Type</p>
+          <div className="flex flex-wrap gap-2">
+            {STREAMING_TYPES.map((type) => (
+              <button
+                key={type.id}
+                onClick={() => toggleType(type.id)}
+                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
+                  typeFilters.includes(type.id)
+                    ? 'bg-red-600 border-red-500 text-white'
+                    : 'bg-gray-800 border-gray-700 text-gray-200 hover:border-gray-500'
+                }`}
+              >
+                {type.label}
+              </button>
+            ))}
+          </div>
+        </div>
+      </div>
+    </div>
+  );
+}
+
 export default function App() {
   const [searchQuery, setSearchQuery] = useState('');
   const [searchResults, setSearchResults] = useState([]);
   const [selectedMovie, setSelectedMovie] = useState(null);
   const [availabilities, setAvailabilities] = useState([]);
-  const [audioFilter, setAudioFilter] = useState('all'); // 'all' = show all (VF + VOSTFR), 'vf' = VF only, 'vostfr' = VOSTFR only
-  const [platformFilter, setPlatformFilter] = useState('all');
-  const [typeFilters, setTypeFilters] = useState(['subscription', 'rent', 'buy', 'addon', 'free']);
-  const [countryFilter, setCountryFilter] = useState('all');
-  const [expandedCountries, setExpandedCountries] = useState({});
-  const [showFiltersMenu, setShowFiltersMenu] = useState(true);
-  const [loading, setLoading] = useState(false);
+  const [loadingSearch, setLoadingSearch] = useState(false);
   const [loadingAvailability, setLoadingAvailability] = useState(false);
   const [error, setError] = useState(null);
-  const [deferredPrompt, setDeferredPrompt] = useState(null);
-  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
-  const [isIOS, setIsIOS] = useState(false);
-  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
-
-  // Detect iOS
-  useEffect(() => {
-    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
-    setIsIOS(ios);
-    
-    // Show iOS prompt if on iOS and not already installed
-    if (ios && !window.navigator.standalone) {
-      // Wait 3 seconds before showing
-      setTimeout(() => setShowIOSPrompt(true), 3000);
-    }
-  }, []);
-
-  // PWA Install prompt
-  useEffect(() => {
-    const handler = (e) => {
-      e.preventDefault();
-      setDeferredPrompt(e);
-      setShowInstallPrompt(true);
-    };
-    
-    window.addEventListener('beforeinstallprompt', handler);
-    
-    return () => window.removeEventListener('beforeinstallprompt', handler);
-  }, []);
-
-  const handleInstallClick = async () => {
-    if (!deferredPrompt) return;
-    
-    deferredPrompt.prompt();
-    const { outcome } = await deferredPrompt.userChoice;
-    
-    if (outcome === 'accepted') {
-      console.log('User accepted the install prompt');
-    }
-    
-    setDeferredPrompt(null);
-    setShowInstallPrompt(false);
-  };
+  const [audioFilter, setAudioFilter] = useState('all');
+  const [platformFilter, setPlatformFilter] = useState('all');
+  const [countryFilter, setCountryFilter] = useState('all');
+  const [typeFilters, setTypeFilters] = useState(STREAMING_TYPES.map((t) => t.id));
 
   useEffect(() => {
-    if (searchQuery.length < 2) {
+    if (searchQuery.trim().length < 2) {
       setSearchResults([]);
       return;
     }
 
     const timer = setTimeout(() => {
-      searchMovies(searchQuery);
-    }, 500);
+      void searchMovies(searchQuery.trim());
+    }, 400);
 
     return () => clearTimeout(timer);
   }, [searchQuery]);
 
   const searchMovies = async (query) => {
-    setLoading(true);
+    setLoadingSearch(true);
     setError(null);
     try {
       const response = await fetch(`${API_URL}/api/search?query=${encodeURIComponent(query)}`);
       const data = await response.json();
       setSearchResults(data.results || []);
     } catch (err) {
-      setError('Erreur lors de la recherche');
       console.error(err);
+      setError("Erreur lors de la recherche. Réessaie dans quelques instants.");
     } finally {
-      setLoading(false);
+      setLoadingSearch(false);
     }
   };
 
   const selectMovie = async (movie) => {
     setSelectedMovie(movie);
     setSearchResults([]);
-    setLoadingAvailability(true);
+    setAvailabilities([]);
     setError(null);
+    setLoadingAvailability(true);
+
     try {
-      const mediaType = movie.media_type || 'movie'; // Default to movie for backwards compatibility
+      const mediaType = movie.media_type || 'movie';
       const response = await fetch(`${API_URL}/api/media/${mediaType}/${movie.tmdb_id}/availability`);
       const data = await response.json();
       setAvailabilities(data.availabilities || []);
-      // Update selectedMovie with full details from backend (backdrop, overview, etc.)
-      if (data.media) {
-        setSelectedMovie({
-          ...movie,
-          ...data.media,
-          tmdb_id: movie.tmdb_id, // Keep the original tmdb_id
-          media_type: mediaType // Ensure media_type is set
-        });
-      }
+      setSelectedMovie({ ...movie, ...data.media, media_type: mediaType, tmdb_id: movie.tmdb_id });
     } catch (err) {
-      setError('Erreur lors de la récupération des disponibilités');
       console.error(err);
+      setError("Impossible de récupérer les disponibilités.");
     } finally {
       setLoadingAvailability(false);
     }
   };
 
-  const goBack = () => {
-    setSelectedMovie(null);
-    setAvailabilities([]);
-    setSearchQuery('');
-  };
-
-  const filteredAvailabilities = availabilities.filter(a => {
-    // Platform filter
-    if (platformFilter !== 'all' && a.platform !== platformFilter) return false;
-    
-    // Streaming type filter (multi-select) - if empty, show all types
-    if (typeFilters.length > 0) {
-      const streamingType = a.streaming_type || 'subscription';
-      if (!typeFilters.includes(streamingType)) return false;
-    }
-    
-    // Country filter
-    if (countryFilter !== 'all' && a.country_code !== countryFilter) return false;
-    
-    // Audio/Subtitle filter
-    if (audioFilter === 'vf') return a.has_french_audio; // VF only
-    if (audioFilter === 'vostfr') return a.has_french_subtitles; // VOSTFR only
-    // 'all' = show everything (both VF and VOSTFR mixed)
-    
-    return true;
-  });
-
-  // Group availabilities by country
-  const groupedByCountry = filteredAvailabilities.reduce((acc, avail) => {
-    if (!avail || !avail.country_code) return acc; // Safety check
-    const countryCode = avail.country_code;
-    if (!acc[countryCode]) {
-      acc[countryCode] = {
-        country_code: countryCode,
-        country_name: avail.country_name || countryCode,
-        options: []
-      };
-    }
-    acc[countryCode].options.push(avail);
-    return acc;
-  }, {});
-
-  // For TV series, group seasons by platform/type/addon
-  const groupSeasons = (options) => {
-    const grouped = {};
-    options.forEach(opt => {
-      const key = `${opt.platform}-${opt.streaming_type}-${opt.addon_name || ''}`;
-      if (!grouped[key]) {
-        grouped[key] = { ...opt, seasons: [] };
-      }
-      if (opt.season_number !== null && opt.season_number !== undefined) {
-        grouped[key].seasons.push(opt.season_number);
-      }
+  const filteredAvailabilities = useMemo(() => {
+    return availabilities.filter((item) => {
+      if (!item) return false;
+      if (platformFilter !== 'all' && item.platform !== platformFilter) return false;
+      if (countryFilter !== 'all' && item.country_code !== countryFilter) return false;
+      if (typeFilters.length && !typeFilters.includes(item.streaming_type || 'subscription')) return false;
+      if (audioFilter === 'vf' && !item.has_french_audio) return false;
+      if (audioFilter === 'vostfr' && !item.has_french_subtitles) return false;
+      return true;
     });
-    
-    // Sort seasons and format them
-    Object.values(grouped).forEach(group => {
-      if (group.seasons.length > 0) {
-        group.seasons.sort((a, b) => a - b);
-        // Format as ranges if consecutive
-        group.seasonsText = formatSeasonRanges(group.seasons);
+  }, [audioFilter, availabilities, countryFilter, platformFilter, typeFilters]);
+
+  const availableCountries = useMemo(() => {
+    const unique = new Map();
+    availabilities.forEach((a) => {
+      if (a?.country_code && a?.country_name) {
+        unique.set(a.country_code, { code: a.country_code, name: a.country_name });
       }
     });
-    
-    return Object.values(grouped);
-  };
+    return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name));
+  }, [availabilities]);
 
-  // Format season numbers into ranges (e.g., "1-4, 6, 8-10")
-  const formatSeasonRanges = (seasons) => {
-    if (seasons.length === 0) return '';
-    if (seasons.length === 1) return `Saison ${seasons[0]}`;
-    
-    const ranges = [];
-    let start = seasons[0];
-    let end = seasons[0];
-    
-    for (let i = 1; i < seasons.length; i++) {
-      if (seasons[i] === end + 1) {
-        end = seasons[i];
-      } else {
-        ranges.push(start === end ? `${start}` : `${start}-${end}`);
-        start = end = seasons[i];
-      }
-    }
-    ranges.push(start === end ? `${start}` : `${start}-${end}`);
-    
-    return ranges.length === 1 && ranges[0].includes('-') 
-      ? `Saisons ${ranges[0]}` 
-      : `Saison${ranges.length > 1 ? 's' : ''} ${ranges.join(', ')}`;
-  };
+  const availablePlatforms = useMemo(() => {
+    const set = new Set();
+    availabilities.forEach((a) => {
+      if (a?.platform) set.add(a.platform);
+    });
+    return Array.from(set).sort();
+  }, [availabilities]);
 
-  // Convert to array and sort by number of options (descending)
-  const countriesArray = Object.values(groupedByCountry).sort((a, b) => b.options.length - a.options.length);
-  
-  // Group countries by geographic region
-  const regionMapping = {
-    // Europe
-    'FR': '🇪🇺 Europe', 'DE': '🇪🇺 Europe', 'GB': '🇪🇺 Europe', 'IT': '🇪🇺 Europe', 'ES': '🇪🇺 Europe',
-    'PT': '🇪🇺 Europe', 'NL': '🇪🇺 Europe', 'BE': '🇪🇺 Europe', 'CH': '🇪🇺 Europe', 'AT': '🇪🇺 Europe',
-    'IE': '🇪🇺 Europe', 'SE': '🇪🇺 Europe', 'NO': '🇪🇺 Europe', 'DK': '🇪🇺 Europe', 'FI': '🇪🇺 Europe',
-    'PL': '🇪🇺 Europe', 'CZ': '🇪🇺 Europe', 'HU': '🇪🇺 Europe', 'RO': '🇪🇺 Europe', 'GR': '🇪🇺 Europe',
-    'HR': '🇪🇺 Europe', 'SK': '🇪🇺 Europe', 'SI': '🇪🇺 Europe', 'BG': '🇪🇺 Europe', 'LT': '🇪🇺 Europe',
-    'LV': '🇪🇺 Europe', 'EE': '🇪🇺 Europe', 'IS': '🇪🇺 Europe', 'LU': '🇪🇺 Europe', 'MT': '🇪🇺 Europe',
-    'CY': '🇪🇺 Europe', 'RS': '🇪🇺 Europe', 'UA': '🇪🇺 Europe', 'BA': '🇪🇺 Europe', 'ME': '🇪🇺 Europe',
-    'MK': '🇪🇺 Europe', 'AL': '🇪🇺 Europe', 'MD': '🇪🇺 Europe', 'BY': '🇪🇺 Europe', 'RU': '🇪🇺 Europe',
-    'TR': '🇪🇺 Europe',
-    
-    // Americas
-    'US': '🌎 Amériques', 'CA': '🌎 Amériques', 'MX': '🌎 Amériques', 'BR': '🌎 Amériques', 'AR': '🌎 Amériques',
-    'CL': '🌎 Amériques', 'CO': '🌎 Amériques', 'PE': '🌎 Amériques', 'VE': '🌎 Amériques', 'EC': '🌎 Amériques',
-    'UY': '🌎 Amériques', 'PY': '🌎 Amériques', 'BO': '🌎 Amériques', 'CR': '🌎 Amériques', 'PA': '🌎 Amériques',
-    'GT': '🌎 Amériques', 'HN': '🌎 Amériques', 'NI': '🌎 Amériques', 'SV': '🌎 Amériques', 'DO': '🌎 Amériques',
-    'CU': '🌎 Amériques', 'JM': '🌎 Amériques', 'TT': '🌎 Amériques', 'BB': '🌎 Amériques', 'BS': '🌎 Amériques',
-    'BZ': '🌎 Amériques', 'GY': '🌎 Amériques', 'SR': '🌎 Amériques', 'GF': '🌎 Amériques', 'HT': '🌎 Amériques',
-    
-    // Asia-Pacific
-    'JP': '🌏 Asie-Pacifique', 'KR': '🌏 Asie-Pacifique', 'CN': '🌏 Asie-Pacifique', 'IN': '🌏 Asie-Pacifique',
-    'TH': '🌏 Asie-Pacifique', 'VN': '🌏 Asie-Pacifique', 'PH': '🌏 Asie-Pacifique', 'ID': '🌏 Asie-Pacifique',
-    'MY': '🌏 Asie-Pacifique', 'SG': '🌏 Asie-Pacifique', 'TW': '🌏 Asie-Pacifique', 'HK': '🌏 Asie-Pacifique',
-    'AU': '🌏 Asie-Pacifique', 'NZ': '🌏 Asie-Pacifique', 'PK': '🌏 Asie-Pacifique', 'BD': '🌏 Asie-Pacifique',
-    'LK': '🌏 Asie-Pacifique', 'MM': '🌏 Asie-Pacifique', 'KH': '🌏 Asie-Pacifique', 'LA': '🌏 Asie-Pacifique',
-    'MN': '🌏 Asie-Pacifique', 'NP': '🌏 Asie-Pacifique', 'BT': '🌏 Asie-Pacifique', 'MV': '🌏 Asie-Pacifique',
-    
-    // Middle East & Africa
-    'ZA': '🌍 Afrique & Moyen-Orient', 'EG': '🌍 Afrique & Moyen-Orient', 'NG': '🌍 Afrique & Moyen-Orient',
-    'KE': '🌍 Afrique & Moyen-Orient', 'MA': '🌍 Afrique & Moyen-Orient', 'TN': '🌍 Afrique & Moyen-Orient',
-    'DZ': '🌍 Afrique & Moyen-Orient', 'GH': '🌍 Afrique & Moyen-Orient', 'SN': '🌍 Afrique & Moyen-Orient',
-    'CI': '🌍 Afrique & Moyen-Orient', 'SA': '🌍 Afrique & Moyen-Orient', 'AE': '🌍 Afrique & Moyen-Orient',
-    'IL': '🌍 Afrique & Moyen-Orient', 'QA': '🌍 Afrique & Moyen-Orient', 'KW': '🌍 Afrique & Moyen-Orient',
-    'BH': '🌍 Afrique & Moyen-Orient', 'OM': '🌍 Afrique & Moyen-Orient', 'JO': '🌍 Afrique & Moyen-Orient',
-    'LB': '🌍 Afrique & Moyen-Orient', 'IQ': '🌍 Afrique & Moyen-Orient', 'YE': '🌍 Afrique & Moyen-Orient',
-    'ET': '🌍 Afrique & Moyen-Orient', 'UG': '🌍 Afrique & Moyen-Orient', 'TZ': '🌍 Afrique & Moyen-Orient'
+  const toggleType = (type) => {
+    setTypeFilters((prev) =>
+      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
+    );
   };
-  
-  const countriesByRegion = countriesArray.reduce((acc, country) => {
-    const region = regionMapping[country.country_code] || '🌍 Autres régions';
-    if (!acc[region]) {
-      acc[region] = [];
-    }
-    acc[region].push(country);
-    return acc;
-  }, {});
-  
-  // Sort regions: Europe first, then Americas, then Asia-Pacific, then Middle East & Africa, then Others
-  const regionOrder = ['🇪🇺 Europe', '🌎 Amériques', '🌏 Asie-Pacifique', '🌍 Afrique & Moyen-Orient', '🌍 Autres régions'];
-  const sortedRegions = regionOrder.filter(region => countriesByRegion[region]);
-  
-  // Get unique countries for filter
-  let availableCountries = [];
-  try {
-    if (availabilities && Array.isArray(availabilities)) {
-      const uniqueCountries = new Map();
-      availabilities.forEach(a => {
-        if (a && a.country_code && a.country_name) {
-          uniqueCountries.set(a.country_code, {
-            code: a.country_code,
-            name: a.country_name
-          });
-        }
-      });
-      availableCountries = Array.from(uniqueCountries.values()).sort((a, b) => a.name.localeCompare(b.name));
-    }
-  } catch (error) {
-    console.error('availableCountries error:', error);
-    availableCountries = [];
-  }
 
-  // Get unique platforms from availabilities
-  let availablePlatforms = [];
-  try {
-    if (availabilities && Array.isArray(availabilities)) {
-      availablePlatforms = [...new Set(availabilities.filter(a => a && a.platform).map(a => a.platform))].sort();
-    }
-  } catch (error) {
-    console.error('availablePlatforms error:', error);
-    availablePlatforms = [];
-  }
-  
-  // Count films with French content
-  let frenchContentCount = 0;
-  try {
-    if (availabilities && Array.isArray(availabilities)) {
-      frenchContentCount = availabilities.filter(a => a && (a.has_french_audio || a.has_french_subtitles)).length;
-    }
-  } catch (error) {
-    console.error('frenchContentCount error:', error);
-    frenchContentCount = 0;
-  }
-  
-  // Reset all filters
   const resetFilters = () => {
-    setAudioFilter('all'); // Reset to 'all' (show everything)
+    setAudioFilter('all');
     setPlatformFilter('all');
     setCountryFilter('all');
-    setTypeFilters(['subscription', 'rent', 'buy', 'addon', 'free']);
-  };
-  
-  // Check if any filters are active
-  const hasActiveFilters = audioFilter !== 'all' ||
-                          platformFilter !== 'all' || 
-                          countryFilter !== 'all' ||
-                          typeFilters.length < 5;
-  
-  // Toggle country expansion
-  const toggleCountry = (countryCode) => {
-    setExpandedCountries(prev => ({
-      ...prev,
-      [countryCode]: !prev[countryCode]
-    }));
+    setTypeFilters(STREAMING_TYPES.map((t) => t.id));
   };
-  
-  // Toggle streaming type filter (multi-select)
-  const toggleTypeFilter = (type) => {
-    if (typeFilters.includes(type)) {
-      // Remove if already selected
-      setTypeFilters(typeFilters.filter(t => t !== type));
-    } else {
-      // Add if not selected
-      setTypeFilters([...typeFilters, type]);
+
+  const renderResults = () => {
+    if (!searchQuery.trim()) {
+      return (
+        <div className="text-center text-gray-400 py-12">
+          <p>Recherche un film ou une série avec au moins deux lettres.</p>
+        </div>
+      );
     }
-  };
-  
-  // Count by type (dynamic based on current filters, BUT excluding type filter itself)
-  const typeCount = {
-    subscription: 0,
-    rent: 0,
-    buy: 0,
-    addon: 0,
-    free: 0
-  };
-  
-  try {
-    if (availabilities && Array.isArray(availabilities)) {
-      // Count based on all availabilities, but filtered by audio/platform/country (NOT by type)
-      const baseFiltered = availabilities.filter(a => {
-        if (!a) return false;
-        
-        // Apply platform filter
-        if (platformFilter !== 'all' && a.platform !== platformFilter) return false;
-        
-        // Apply country filter
-        if (countryFilter !== 'all' && a.country_code !== countryFilter) return false;
-        
-        // Apply audio filter
-        if (audioFilter === 'vf' && !a.has_french_audio) return false;
-        if (audioFilter === 'vostfr' && !a.has_french_subtitles) return false;
-        // 'all' = no audio filtering
-        
-        return true;
-      });
-      
-      // Count by type in the base filtered results
-      typeCount.subscription = baseFiltered.filter(a => (a.streaming_type || 'subscription') === 'subscription').length;
-      typeCount.rent = baseFiltered.filter(a => a.streaming_type === 'rent').length;
-      typeCount.buy = baseFiltered.filter(a => a.streaming_type === 'buy').length;
-      typeCount.addon = baseFiltered.filter(a => a.streaming_type === 'addon').length;
-      typeCount.free = baseFiltered.filter(a => a.streaming_type === 'free').length;
+
+    if (loadingSearch) {
+      return (
+        <div className="flex items-center justify-center py-12 text-gray-200">
+          <Loader className="w-5 h-5 animate-spin mr-2" /> Recherche en cours...
+        </div>
+      );
     }
-  } catch (error) {
-    console.error('typeCount error:', error);
-  }
-  
-  // Count VF/VOSTFR based on current filters (excluding audio filter itself)
-  const getAudioCount = (audioType) => {
-    try {
-      return availabilities.filter(a => {
-        if (!a) return false;
-        
-        // Apply all filters except audio filter
-        if (platformFilter !== 'all' && a.platform !== platformFilter) return false;
-        
-        // Apply type filter - if empty, show all types
-        if (typeFilters.length > 0) {
-          const streamingType = a.streaming_type || 'subscription';
-          if (!typeFilters.includes(streamingType)) return false;
-        }
-        
-        if (countryFilter !== 'all' && a.country_code !== countryFilter) return false;
-        
-        // Count based on audio type
-        if (audioType === 'vf') return a.has_french_audio;
-        if (audioType === 'vostfr') return a.has_french_subtitles;
-        return true; // 'all' = count everything
-      }).length;
-    } catch (error) {
-      console.error('getAudioCount error:', error);
-      return 0;
+
+    if (error) {
+      return (
+        <div className="flex items-center gap-2 text-red-400 py-12">
+          <AlertCircle className="w-5 h-5" /> {error}
+        </div>
+      );
     }
-  };
-  
-  // Count platforms based on current filters (excluding platform filter itself)
-  const getPlatformCount = (platform) => {
-    try {
-      return availabilities.filter(a => {
-        if (!a) return false; // Safety check
-        
-        // Apply all filters except platform filter
-        // Apply type filter - if empty, show all types
-        if (typeFilters.length > 0) {
-          const streamingType = a.streaming_type || 'subscription';
-          if (!typeFilters.includes(streamingType)) return false;
-        }
-        
-        if (countryFilter !== 'all' && a.country_code !== countryFilter) return false;
-        
-        if (audioFilter === 'vf' && !a.has_french_audio) return false;
-        if (audioFilter === 'vostfr' && !a.has_french_subtitles) return false;
-        // 'all' = no audio filtering
-        
-        // Then count based on platform
-        return a.platform === platform;
-      }).length;
-    } catch (error) {
-      console.error('getPlatformCount error:', error);
-      return 0;
+
+    if (searchResults.length === 0) {
+      return (
+        <div className="text-center text-gray-400 py-12">
+          <p>Aucun résultat pour "{searchQuery}".</p>
+        </div>
+      );
     }
-  };
 
-  return (
-    <div className="min-h-screen bg-black">
-      {/* Header */}
-      <header className="bg-gradient-to-r from-red-600 to-red-700 shadow-2xl relative overflow-hidden">
-        <div className="absolute inset-0 bg-black/20"></div>
-        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 relative z-10">
-          <div className="flex items-center justify-center">
-            <div className="text-center">
-              {/* Logo stylé */}
-              <div className="flex items-center justify-center gap-2 md:gap-3 mb-2 md:mb-3">
-                <div className="bg-white rounded-xl md:rounded-2xl p-2 md:p-4 shadow-2xl transform -rotate-6">
-                  <Film className="w-6 h-6 md:w-12 md:h-12 text-red-600" />
-                </div>
-                <div className="text-left">
-                  <div className="flex items-baseline gap-1 md:gap-2">
-                    <span className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter">VF</span>
-                    <span className="text-xl md:text-3xl lg:text-4xl font-bold text-white/90">Movie</span>
-                  </div>
-                  <div className="text-base md:text-2xl lg:text-3xl font-black text-red-200 -mt-1 md:-mt-2">FINDER</div>
-                </div>
+    return (
+      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
+        {searchResults.map((movie) => (
+          <button
+            key={`${movie.tmdb_id}-${movie.media_type}`}
+            onClick={() => selectMovie(movie)}
+            className="bg-gray-900/80 border border-gray-800 rounded-2xl text-left overflow-hidden hover:border-red-500 transition"
+          >
+            {movie.poster ? (
+              <img src={movie.poster} alt={movie.title} className="w-full h-64 object-cover" />
+            ) : (
+              <div className="w-full h-64 bg-gray-800 flex items-center justify-center text-gray-500">
+                <Film className="w-10 h-10" />
               </div>
-              <p className="text-red-100 text-xs md:text-base lg:text-lg font-semibold">
-                🌍 Films en français · Partout dans le monde
+            )}
+            <div className="p-4 space-y-2">
+              <p className="text-sm text-gray-400 uppercase tracking-wide">
+                {movie.media_type === 'tv' ? 'Série' : 'Film'}
               </p>
+              <p className="text-lg font-bold text-white leading-tight">{movie.title}</p>
+              {movie.year && <p className="text-gray-400 text-sm">{movie.year}</p>}
             </div>
-          </div>
+          </button>
+        ))}
+      </div>
+    );
+  };
+
+  const renderAvailability = () => {
+    if (loadingAvailability) {
+      return (
+        <div className="flex items-center justify-center py-12 text-gray-200">
+          <Loader className="w-5 h-5 animate-spin mr-2" /> Chargement des disponibilités...
         </div>
-      </header>
+      );
+    }
 
-      {/* iOS Install Instructions */}
-      {isIOS && showIOSPrompt && !window.navigator.standalone && (
-        <div className="bg-gradient-to-r from-blue-600 to-blue-700 border-b-2 md:border-b-4 border-blue-800">
-          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 md:py-4">
-            <div className="flex items-start justify-between flex-wrap gap-2 md:gap-4">
-              <div className="flex items-start gap-2 md:gap-3">
-                <div className="bg-white rounded-lg md:rounded-xl p-1 md:p-2 flex-shrink-0">
-                  <Film className="w-4 h-4 md:w-6 md:h-6 text-blue-600" />
-                </div>
-                <div>
-                  <p className="text-white font-bold text-sm md:text-lg flex items-center gap-2">
-                    📱 Installer l'app
-                  </p>
-                  <p className="text-blue-100 text-xs md:text-sm mt-0.5 md:mt-1">
-                    <span className="hidden md:inline">Appuyez sur </span>
-                    <span className="inline-flex items-center mx-1 px-1 md:px-2 py-0.5 bg-white/20 rounded">
-                      <svg className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24">
-                        <path d="M16 5l-1.42 1.42-1.59-1.59V16h-1.98V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z"/>
-                      </svg>
-                    </span> 
-                    <span className="hidden md:inline">puis </span>"Sur l'écran d'accueil"
-                  </p>
-                </div>
-              </div>
-              <button
-                onClick={() => setShowIOSPrompt(false)}
-                className="text-white hover:text-blue-100 px-2 md:px-4 font-medium text-xs md:text-sm"
-              >
-                ✕
-              </button>
-            </div>
-          </div>
+    if (!availabilities.length) {
+      return (
+        <div className="text-center text-gray-400 py-12">
+          <p>Aucune disponibilité trouvée pour ce titre.</p>
         </div>
-      )}
+      );
+    }
 
-      {/* PWA Install Prompt */}
-      {showInstallPrompt && (
-        <div className="bg-gradient-to-r from-green-600 to-emerald-600 border-b-2 md:border-b-4 border-green-700">
-          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 md:py-4">
-            <div className="flex items-center justify-between flex-wrap gap-2 md:gap-4">
-              <div className="flex items-center gap-2 md:gap-3">
-                <div className="bg-white rounded-lg md:rounded-xl p-1 md:p-2">
-                  <Film className="w-4 h-4 md:w-6 md:h-6 text-green-600" />
-                </div>
-                <div>
-                  <p className="text-white font-bold text-sm md:text-lg">📱 Installer l'app</p>
-                  <p className="text-green-100 text-xs md:text-sm hidden md:block">Accédez rapidement depuis votre écran d'accueil!</p>
-                </div>
-              </div>
-              <div className="flex gap-2 md:gap-3">
-                <button
-                  onClick={handleInstallClick}
-                  className="bg-white text-green-600 px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl text-sm md:text-base font-black hover:bg-green-50 transition-all shadow-lg"
-                >
-                  Installer
-                </button>
-                <button
-                  onClick={() => setShowInstallPrompt(false)}
-                  className="text-white hover:text-green-100 px-2 md:px-4 text-sm md:text-base font-medium"
-                >
-                  <span className="md:hidden">✕</span>
-                  <span className="hidden md:inline">Plus tard</span>
-                </button>
-              </div>
-            </div>
+    return (
+      <div className="space-y-3">
+        {filteredAvailabilities.map((availability, index) => (
+          <AvailabilityBadge key={`${availability.platform}-${index}`} availability={availability} />
+        ))}
+        {filteredAvailabilities.length === 0 && (
+          <div className="text-center text-gray-400 py-8 text-sm">
+            Aucun résultat ne correspond à ces filtres.
           </div>
-        </div>
-      )}
+        )}
+      </div>
+    );
+  };
 
-      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
-        {/* Disclaimer */}
-        <div className="mb-4 md:mb-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg md:rounded-xl p-2 md:p-4 flex items-start gap-2 md:gap-3">
-          <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
-          <div className="text-xs md:text-sm text-yellow-200">
-            <strong className="hidden md:inline">Info importante : </strong>Les données proviennent d'une base tierce<span className="hidden md:inline"> mise à jour quotidiennement. Certaines informations peuvent être incomplètes ou obsolètes</span>. Vérifiez sur Netflix.
+  return (
+    <div className="min-h-screen bg-black text-white">
+      <header className="bg-gradient-to-r from-red-600 to-red-700 shadow-2xl">
+        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center gap-3">
+          <div className="bg-white text-red-600 p-3 rounded-2xl shadow-xl">
+            <Film className="w-6 h-6" />
+          </div>
+          <div>
+            <p className="text-sm text-white/80">Trouve des films et séries en français</p>
+            <h1 className="text-3xl font-black tracking-tight">VF Movie Finder</h1>
           </div>
         </div>
+      </header>
 
+      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
         {!selectedMovie && (
-          <>
-            {/* Search Hero */}
-            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl md:rounded-3xl p-4 md:p-8 lg:p-12 border border-gray-700 shadow-2xl mb-6 md:mb-8">
-              <div className="text-center mb-4 md:mb-8">
-                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 md:mb-3">
-                  Trouvez vos films et séries en VF ou VOSTFR 🎬📺
-                </h2>
-                <p className="text-gray-300 text-sm md:text-lg hidden md:block">
-                  Recherchez parmi des milliers de films et séries disponibles dans le monde
-                </p>
+          <div className="bg-gray-900/70 border border-gray-800 rounded-3xl p-6 shadow-2xl">
+            <div className="flex items-center gap-3 mb-4">
+              <div className="bg-red-600/20 p-2 rounded-xl">
+                <Search className="w-5 h-5 text-red-300" />
               </div>
-
-              <div className="relative max-w-3xl mx-auto">
-                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
-                <input
-                  type="text"
-                  value={searchQuery}
-                  onChange={(e) => setSearchQuery(e.target.value)}
-                  placeholder="Rechercher un film ou une série... (ex: Inception, Stranger Things)"
-                  className="w-full pl-14 pr-6 py-5 bg-white rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-red-500/50 text-lg font-medium shadow-xl transition-all"
-                />
+              <div>
+                <p className="text-sm text-gray-300">Tape un titre</p>
+                <h2 className="text-xl font-bold">Recherche</h2>
               </div>
-
-              {searchResults.length > 0 && (
-                <div className="mt-6 bg-white rounded-2xl shadow-2xl max-h-96 overflow-y-auto">
-                  {searchResults.map((movie) => (
-                    <div
-                      key={movie.tmdb_id}
-                      onClick={() => selectMovie(movie)}
-                      className="p-4 hover:bg-red-50 cursor-pointer border-b last:border-b-0 transition-all hover:scale-[1.01]"
-                    >
-                      <div className="flex items-center gap-4">
-                        {movie.poster ? (
-                          <img src={movie.poster} alt={movie.title} className="w-16 h-24 object-cover rounded-lg shadow-md" />
-                        ) : (
-                          <div className="w-16 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
-                            <Film className="w-8 h-8 text-gray-400" />
-                          </div>
-                        )}
-                        <div className="flex-1">
-                          <div className="flex items-center gap-2 mb-1">
-                            <h3 className="font-bold text-gray-900 text-lg">{movie.title}</h3>
-                            <span className={`text-xs px-2 py-0.5 rounded font-bold ${
-                              movie.media_type === 'tv' ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'
-                            }`}>
-                              {movie.media_type === 'tv' ? '📺 SÉRIE' : '🎬 FILM'}
-                            </span>
-                          </div>
-                          <p className="text-sm text-gray-600 flex items-center gap-2">
-                            📅 {movie.year}
-                            {movie.availability_count > 0 && (
-                              <>
-                                <span>·</span>
-                                <span className="text-green-600 font-semibold">
-                                  ✓ VF dans {movie.availability_count} pays
-                                </span>
-                              </>
-                            )}
-                          </p>
-                        </div>
-                      </div>
-                    </div>
-                  ))}
-                </div>
-              )}
-
-              {loading && (
-                <div className="mt-6 text-center text-white flex items-center justify-center gap-3">
-                  <Loader className="w-6 h-6 animate-spin" />
-                  <span className="text-lg font-medium">Recherche en cours...</span>
-                </div>
-              )}
-
-              {error && (
-                <div className="mt-6 bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-xl">
-                  {error}
-                </div>
-              )}
             </div>
-
-            {/* VPN Section */}
-            <div className="bg-gradient-to-br from-red-600 to-pink-600 rounded-2xl md:rounded-3xl p-6 md:p-8 lg:p-10 text-center shadow-2xl border border-red-500">
-              <Shield className="w-12 h-12 md:w-16 md:h-16 text-white mx-auto mb-3 md:mb-4" />
-              <h3 className="text-2xl md:text-3xl lg:text-4xl font-black text-white mb-3 md:mb-4">
-                Besoin d'un VPN ?
-              </h3>
-              <p className="text-white/90 text-sm md:text-lg mb-6 md:mb-8 max-w-2xl mx-auto">
-                Accédez aux catalogues Netflix du monde entier en toute sécurité
-              </p>
-              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center">
-                <a
-                  href="https://go.nordvpn.net/aff_c?offer_id=15&aff_id=93849"
-                  target="_blank"
-                  rel="noopener noreferrer"
-                  className="inline-flex items-center gap-2 bg-white text-red-600 px-6 md:px-8 py-3 md:py-4 rounded-xl font-black text-base md:text-lg hover:bg-gray-100 transition-all hover:scale-105 shadow-xl w-full sm:w-auto justify-center"
-                >
-                  <Zap className="w-4 h-4 md:w-5 md:h-5" />
-                  NordVPN
-                </a>
-                <a
-                  href="https://www.expressvpn.com"
-                  target="_blank"
-                  rel="noopener noreferrer"
-                  className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-lg text-white border-2 border-white px-6 md:px-8 py-3 md:py-4 rounded-xl font-black text-base md:text-lg hover:bg-white/20 transition-all hover:scale-105 w-full sm:w-auto justify-center"
-                >
-                  <Tv className="w-4 h-4 md:w-5 md:h-5" />
-                  ExpressVPN
-                </a>
-              </div>
-              <p className="text-white/70 text-xs md:text-sm mt-4 md:mt-6">
-                💰 Économisez jusqu'à 60% avec nos liens partenaires
-              </p>
+            <div className="relative">
+              <input
+                value={searchQuery}
+                onChange={(e) => setSearchQuery(e.target.value)}
+                className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-red-500"
+                placeholder="Ex: The Boys, Le Hobbit, Kaamelott..."
+              />
+              <Search className="w-4 h-4 text-gray-500 absolute right-4 top-1/2 -translate-y-1/2" />
             </div>
-          </>
+            <div className="mt-6">{renderResults()}</div>
+          </div>
         )}
 
         {selectedMovie && (
-          <div className="space-y-8">
-            {/* Movie Hero - Backdrop Design */}
-            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
-              {/* Backdrop Image */}
-              {selectedMovie.backdrop && (
-                <div className="absolute inset-0">
-                  <img
-                    src={selectedMovie.backdrop}
-                    alt={selectedMovie.title}
-                    className="w-full h-full object-cover"
-                    style={{ filter: 'blur(8px)', transform: 'scale(1.1)' }}
-                  />
-                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40"></div>
+          <div className="space-y-6">
+            <button
+              onClick={() => {
+                setSelectedMovie(null);
+                setAvailabilities([]);
+                setSearchQuery('');
+                resetFilters();
+              }}
+              className="flex items-center gap-2 text-gray-300 hover:text-white"
+            >
+              <ArrowLeft className="w-4 h-4" /> Nouvelle recherche
+            </button>
+
+            <div className="bg-gray-900/80 border border-gray-800 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row gap-6">
+              {selectedMovie.poster ? (
+                <img
+                  src={selectedMovie.poster}
+                  alt={selectedMovie.title}
+                  className="w-full md:w-60 rounded-2xl object-cover"
+                />
+              ) : (
+                <div className="w-full md:w-60 h-72 bg-gray-800 rounded-2xl flex items-center justify-center text-gray-500">
+                  <Film className="w-10 h-10" />
                 </div>
               )}
-              
-              {/* Content */}
-              <div className="relative z-10 px-6 md:px-12 py-12 md:py-16">
-                <button
-                  onClick={goBack}
-                  className="flex items-center gap-2 text-white/90 hover:text-white mb-8 transition-colors font-medium group"
-                >
-                  <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
-                  Nouvelle recherche
-                </button>
 
-                <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
-                  {/* Poster */}
-                  {selectedMovie.poster && (
-                    <img
-                      src={selectedMovie.poster}
-                      alt={selectedMovie.title}
-                      className="w-48 md:w-64 rounded-2xl shadow-2xl border-4 border-white/20"
-                    />
+              <div className="flex-1 space-y-3">
+                <div className="flex items-center gap-2">
+                  <Zap className="w-4 h-4 text-red-400" />
+                  <p className="text-sm uppercase tracking-wide text-gray-400">
+                    {selectedMovie.media_type === 'tv' ? 'Série' : 'Film'}
+                  </p>
+                </div>
+                <h2 className="text-3xl font-black leading-tight">{selectedMovie.title}</h2>
+                {selectedMovie.original_title && selectedMovie.original_title !== selectedMovie.title && (
+                  <p className="text-gray-400 italic">{selectedMovie.original_title}</p>
+                )}
+                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300">
+                  {selectedMovie.year && <span>📅 {selectedMovie.year}</span>}
+                  {selectedMovie.vote_average && (
+                    <span className="flex items-center gap-1">
+                      ⭐ {Number(selectedMovie.vote_average).toFixed(1)}/10
+                    </span>
                   )}
-
-                  {/* Info */}
-                  <div className="flex-1 text-center md:text-left">
-                    <h1 className="text-4xl md:text-6xl font-black text-white mb-2 leading-tight">
-                      {selectedMovie.title}
-                    </h1>
-                    
-                    {selectedMovie.original_title && selectedMovie.original_title !== selectedMovie.title && (
-                      <p className="text-white/70 text-lg md:text-xl mb-4 italic">
-                        {selectedMovie.original_title}
-                      </p>
-                    )}
-
-                    <div className="flex items-center gap-4 justify-center md:justify-start mb-6 text-white/90">
-                      {selectedMovie.year && (
-                        <span className="text-lg md:text-xl font-medium">
-                          📅 {selectedMovie.year}
-                        </span>
-                      )}
-                      {selectedMovie.vote_average && (
-                        <>
-                          <span className="text-white/50">•</span>
-                          <span className="text-lg md:text-xl font-medium flex items-center gap-1">
-                            ⭐ {selectedMovie.vote_average.toFixed(1)}/10
-                          </span>
-                        </>
-                      )}
-                    </div>
-
-                    {selectedMovie.overview && (
-                      <p className="text-white/80 text-base md:text-lg leading-relaxed max-w-3xl">
-                        {selectedMovie.overview}
-                      </p>
-                    )}
-                  </div>
                 </div>
+                {selectedMovie.overview && (
+                  <p className="text-gray-300 leading-relaxed text-sm md:text-base">
+                    {selectedMovie.overview}
+                  </p>
+                )}
               </div>
             </div>
 
-            {/* Filters Section */}
-            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 md:p-8 border border-gray-700 shadow-2xl">
-              {/* Reset Filters Button */}
-              {hasActiveFilters && (
-                <div className="mb-4 space-y-2">
-                  <button
-                    onClick={resetFilters}
-                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700 transition-all hover:scale-105 shadow-lg"
-                  >
-                    <XCircle className="w-5 h-5" />
-                    Réinitialiser tous les filtres
-                  </button>
-                  <p className="text-gray-400 text-sm">
-                    📊 Affichage de <span className="text-white font-bold">{filteredAvailabilities.length}</span> résultat{filteredAvailabilities.length > 1 ? 's' : ''} sur <span className="text-white font-bold">{availabilities.length}</span> au total
-                  </p>
+            <Filters
+              audioFilter={audioFilter}
+              availableCountries={availableCountries}
+              availablePlatforms={availablePlatforms}
+              onReset={resetFilters}
+              platformFilter={platformFilter}
+              setAudioFilter={setAudioFilter}
+              setCountryFilter={setCountryFilter}
+              setPlatformFilter={setPlatformFilter}
+              toggleType={toggleType}
+              typeFilters={typeFilters}
+            />
+
+            <div className="bg-gray-900/80 border border-gray-800 rounded-3xl p-6 shadow-2xl">
+              <div className="flex items-center justify-between gap-3 mb-4">
+                <div className="flex items-center gap-2 text-gray-200">
+                  <Globe className="w-5 h-5" /> Disponibilités ({filteredAvailabilities.length}/{availabilities.length})
                 </div>
-              )}
-
-              {/* Filters Toggle Button */}
-              <button
-                onClick={() => setShowFiltersMenu(!showFiltersMenu)}
-                className="w-full mb-4 px-6 py-4 rounded-xl font-bold bg-gray-800 text-white hover:bg-gray-700 transition-all border-2 border-gray-600 flex items-center justify-between"
-              >
-                <span className="text-lg">🎚️ Filtres ({Object.keys({audioFilter, platformFilter, countryFilter, typeFilters}).length})</span>
-                <span className="text-2xl">{showFiltersMenu ? '▼' : '▶'}</span>
-              </button>
-
-                  {/* Collapsible Filters Menu */}
-                  {showFiltersMenu && (
-                    <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-gray-700 space-y-6">
-                      
-                      {/* Audio Filters */}
-                      <div>
-                        <p className="text-gray-300 text-sm font-bold mb-3 flex items-center gap-2">
-                          <span className="w-1 h-6 bg-red-500 rounded"></span>
-                          🎙️ LANGUE
-                        </p>
-                        <div className="flex gap-2 flex-wrap">
-                          <button
-                            onClick={() => setAudioFilter('vf')}
-                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
-                              audioFilter === 'vf'
-                                ? 'bg-red-600 text-white shadow-lg scale-105'
-                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
-                            }`}
-                          >
-                            🎙️ VF ({getAudioCount('vf')})
-                          </button>
-                          <button
-                            onClick={() => setAudioFilter('vostfr')}
-                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
-                              audioFilter === 'vostfr'
-                                ? 'bg-red-600 text-white shadow-lg scale-105'
-                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
-                            }`}
-                          >
-                            📝 VOSTFR ({getAudioCount('vostfr')})
-                          </button>
-                        </div>
-                        <p className="text-gray-500 text-xs mt-2">💡 Par défaut: Tout (VF + VOSTFR) - Cliquez pour filtrer</p>
-                      </div>
-
-                      {/* Platform Filters */}
-                      {availablePlatforms.length > 1 && (
-                        <div>
-                          <p className="text-gray-300 text-sm font-bold mb-3 flex items-center gap-2">
-                            <span className="w-1 h-6 bg-red-500 rounded"></span>
-                            📺 PLATEFORME
-                          </p>
-                          <div className="flex gap-2 flex-wrap">
-                            <button
-                              onClick={() => setPlatformFilter('all')}
-                              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
-                                platformFilter === 'all'
-                                  ? 'bg-white text-red-600 shadow-lg'
-                                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
-                              }`}
-                            >
-                              Toutes
-                            </button>
-                            {availablePlatforms.map(platform => {
-                              const style = getPlatformStyle(platform);
-                              const count = getPlatformCount(platform);
-                              return (
-                                <button
-                                  key={platform}
-                                  onClick={() => setPlatformFilter(platform)}
-                                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
-                                    platformFilter === platform
-                                      ? `${style.bg} ${style.text} shadow-lg scale-105`
-                                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
-                                  }`}
-                                >
-                                  {style.icon} {platform} ({count})
-                                </button>
-                              );
-                            })}
-                          </div>
-                        </div>
-                      )}
-
-                      {/* Type Filters */}
-                      {(typeCount.rent > 0 || typeCount.buy > 0 || typeCount.addon > 0) && (
-                        <div>
-                          <p className="text-gray-300 text-sm font-bold mb-3 flex items-center gap-2">
-                            <span className="w-1 h-6 bg-red-500 rounded"></span>
-                            💳 TYPE DE DISPONIBILITÉ
-                          </p>
-                          <div className="flex gap-2 flex-wrap">
-                            {typeCount.subscription > 0 && (
-                              <button
-                                onClick={() => toggleTypeFilter('subscription')}
-                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
-                                  typeFilters.includes('subscription')
-                                    ? 'bg-green-600 text-white shadow-lg scale-105'
-                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 opacity-50'
-                                }`}
-                              >
-                                📺 Streaming ({typeCount.subscription})
-                              </button>
-                            )}
-                            {typeCount.rent > 0 && (
-                              <button
-                                onClick={() => toggleTypeFilter('rent')}
-                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
-                                  typeFilters.includes('rent')
-                                    ? 'bg-yellow-600 text-white shadow-lg scale-105'
-                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 opacity-50'
-                                }`}
-                              >
-                                🎬 Location ({typeCount.rent})
-                              </button>
-                            )}
-                            {typeCount.buy > 0 && (
-                              <button
-                                onClick={() => toggleTypeFilter('buy')}
-                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
-                                  typeFilters.includes('buy')
-                                    ? 'bg-purple-600 text-white shadow-lg scale-105'
-                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 opacity-50'
-                                }`}
-                              >
-                                💰 Achat ({typeCount.buy})
-                              </button>
-                            )}
-                            {typeCount.addon > 0 && (
-                              <button
-                                onClick={() => toggleTypeFilter('addon')}
-                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
-                                  typeFilters.includes('addon')
-                                    ? 'bg-blue-600 text-white shadow-lg scale-105'
-                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 opacity-50'
-                                }`}
-                              >
-                                📡 Chaîne payante ({typeCount.addon})
-                              </button>
-                            )}
-                            {typeCount.free > 0 && (
-                              <button
-                                onClick={() => toggleTypeFilter('free')}
-                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
-                                  typeFilters.includes('free')
-                                    ? 'bg-cyan-600 text-white shadow-lg scale-105'
-                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 opacity-50'
-                                }`}
-                              >
-                                🆓 Gratuit ({typeCount.free})
-                              </button>
-                            )}
-                          </div>
-                          <p className="text-gray-500 text-xs mt-2">💡 Sélection multiple possible</p>
-                        </div>
-                      )}
-
-                      {/* Country Filter */}
-                      {availableCountries.length > 1 && (
-                        <div>
-                          <p className="text-gray-300 text-sm font-bold mb-3 flex items-center gap-2">
-                            <span className="w-1 h-6 bg-red-500 rounded"></span>
-                            🌍 PAYS
-                          </p>
-                          <select
-                            value={countryFilter}
-                            onChange={(e) => setCountryFilter(e.target.value)}
-                            className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-red-500 focus:outline-none font-medium"
-                          >
-                            <option value="all">Tous les pays ({availableCountries.length})</option>
-                            {availableCountries.map(country => {
-                              const count = availabilities.filter(a => a.country_code === country.code).length;
-                              return (
-                                <option key={country.code} value={country.code}>
-                                  {country.name} ({count})
-                                </option>
-                              );
-                            })}
-                          </select>
-                        </div>
-                      )}
-                    </div>
-                  )}
-            </div>
-
-            {loadingAvailability && (
-              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 border border-gray-700 text-center">
-                <Loader className="w-16 h-16 text-red-500 mx-auto mb-6 animate-spin" />
-                <p className="text-white text-2xl font-bold mb-2">Recherche en cours...</p>
-                <p className="text-gray-400 text-lg">Analyse des catalogues Netflix dans le monde entier</p>
-              </div>
-            )}
-
-            {!loadingAvailability && filteredAvailabilities.length === 0 && availabilities.length > 0 && (
-              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 border border-gray-700 text-center">
-                <Globe className="w-16 h-16 text-gray-500 mx-auto mb-6" />
-                <p className="text-gray-300 text-2xl font-bold mb-3">
-                  Aucun résultat avec ces filtres
-                </p>
-                <p className="text-gray-500 text-lg mb-6">
-                  Le film est disponible dans {availabilities.length} pays, mais aucun ne correspond à vos filtres actuels.
-                </p>
-                <button
-                  onClick={resetFilters}
-                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700 transition-all hover:scale-105 shadow-lg"
-                >
-                  <XCircle className="w-5 h-5" />
-                  Réinitialiser les filtres
-                </button>
-              </div>
-            )}
-
-            {!loadingAvailability && availabilities.length === 0 && (
-              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 border border-gray-700 text-center">
-                <Globe className="w-16 h-16 text-gray-500 mx-auto mb-6" />
-                <p className="text-gray-300 text-2xl font-bold mb-3">
-                  Film non disponible en streaming
-                </p>
-                <p className="text-gray-500 text-lg">Ce film n'est peut-être pas disponible sur les plateformes de streaming ou les données ne sont pas encore disponibles</p>
-              </div>
-            )}
-
-            {!loadingAvailability && filteredAvailabilities.length > 0 && (
-              <div className="space-y-8">
-                {/* Summary */}
-                {frenchContentCount > 0 ? (
-                  <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl p-8 text-center shadow-2xl border border-green-500">
-                    <div className="flex items-center justify-center gap-3 mb-3">
-                      <CheckCircle className="w-10 h-10 text-white" />
-                      <div className="text-left">
-                        <h3 className="text-4xl font-black text-white">
-                          {[...new Set(availabilities.filter(a => a && (a.has_french_audio || a.has_french_subtitles)).map(a => a.country_code))].length} pays
-                        </h3>
-                        <p className="text-green-100 text-lg font-medium">
-                          sur {availablePlatforms.length} plateforme{availablePlatforms.length > 1 ? "s" : ""}
-                        </p>
-                      </div>
-                    </div>
-                    <p className="text-green-100 text-xl font-medium mt-2">
-                      Film disponible avec contenu français
-                    </p>
-                  </div>
+                {filteredAvailabilities.length === availabilities.length ? (
+                  <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-200 flex items-center gap-1">
+                    <CheckCircle className="w-3 h-3" /> Tout est affiché
+                  </span>
                 ) : (
-                  <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl p-8 text-center shadow-2xl border border-blue-500">
-                    <div className="flex items-center justify-center gap-3 mb-3">
-                      <Globe className="w-10 h-10 text-white" />
-                      <div className="text-left">
-                        <h3 className="text-4xl font-black text-white">
-                          {[...new Set(filteredAvailabilities.map(a => a.country_code))].length} pays
-                        </h3>
-                        <p className="text-blue-100 text-lg font-medium">
-                          sur {availablePlatforms.length} plateforme{availablePlatforms.length > 1 ? "s" : ""}
-                        </p>
-                      </div>
-                    </div>
-                    <p className="text-blue-100 text-xl font-medium mt-2">
-                      Film disponible (VO uniquement)
-                    </p>
-                  </div>
+                  <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-200 flex items-center gap-1">
+                    <AlertCircle className="w-3 h-3" /> Filtres actifs
+                  </span>
                 )}
-
-                {/* Countries - Grouped by Region */}
-                {countriesArray && countriesArray.length > 0 && (
-                  <div className="space-y-6">
-                    {sortedRegions.map(region => (
-                      <div
-                        key={region}
-                        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 md:p-8 border border-gray-700 shadow-2xl"
-                      >
-                        <h4 className="text-2xl md:text-3xl font-black text-white mb-6 flex items-center gap-3">
-                          <span className="bg-red-600 w-2 h-8 rounded-full"></span>
-                          {region} ({countriesByRegion[region].length})
-                        </h4>
-                        <div className="space-y-3">
-                          {countriesByRegion[region].map(country => {
-                            const isExpanded = expandedCountries[country.country_code];
-                            const optionsCount = country.options.length;
-
-                            return (
-                              <div
-                                key={country.country_code}
-                                className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 overflow-hidden hover:border-red-500 transition-all"
-                              >
-                                {/* Country Header */}
-                                <button
-                                  onClick={() => toggleCountry(country.country_code)}
-                                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-800 transition-all"
-                                >
-                                  <div className="flex items-center gap-4">
-                                    <img
-                                      src={`https://flagcdn.com/48x36/${country.country_code.toLowerCase()}.png`}
-                                      alt={`Drapeau ${country.country_name}`}
-                                      className="w-12 h-9 rounded shadow-lg border border-gray-600"
-                                      onError={e => {
-                                        e.target.style.display = "none";
-                                      }}
-                                    />
-                                    <div className="text-left">
-                                      <h5 className="font-black text-white text-xl">{country.country_name}</h5>
-                                      <p className="text-gray-400 text-sm">
-                                        {optionsCount} option{optionsCount > 1 ? "s" : ""} disponible{optionsCount > 1 ? "s" : ""}
-                                      </p>
-                                    </div>
-                                  </div>
-                                  <div className="flex items-center gap-3">
-                                    <span className="text-red-500 font-black text-2xl">
-                                      {isExpanded ? "▼" : "▶"}
-                                    </span>
-                                  </div>
-                                </button>
-
-                                {/* Options for this country */}
-                                {isExpanded && (
-                                  <div className="px-6 pb-6 pt-2 border-t border-gray-700 space-y-3 bg-gray-900/30">
-                                    {(selectedMovie?.media_type === "tv"
-                                      ? groupSeasons(country.options)
-                                      : country.options
-                                    ).map((avail, idx) => (
-                                      <div
-                                        key={idx}
-                                        className="bg-gray-800 rounded-xl p-4 hover:bg-gray-750 transition-all"
-                                      >
-                                        <div className="flex items-start justify-between mb-3">
-                                          <div className="flex items-center gap-2 flex-wrap">
-                                            {avail.streaming_type === "addon" && avail.addon_name ? (
-                                              <>
-                                                <span className="text-sm bg-blue-600 text-white px-3 py-1 rounded-full font-black">
-                                                  📡 {avail.addon_name}
-                                                </span>
-                                                <span className="text-xs text-gray-400 italic">
-                                                  (via {avail.platform})
-                                                </span>
-                                              </>
-                                            ) : (
-                                              <span
-                                                className={`text-sm ${getPlatformStyle(avail.platform).bg} ${getPlatformStyle(avail.platform).text} px-3 py-1 rounded-full font-black`}
-                                              >
-                                                {getPlatformStyle(avail.platform).icon} {avail.platform}
-                                              </span>
-                                            )}
-
-                                            {avail.platform === "Amazon Prime" && avail.streaming_type === "subscription" && (
-                                              <span className="text-xs px-2 py-1 rounded bg-green-600 text-white font-bold">
-                                                ✓ INCLUS
-                                              </span>
-                                            )}
-
-                                            {selectedMovie?.media_type === "tv" && avail.seasonsText && (
-                                              <span className="text-xs px-2 py-1 rounded bg-purple-600 text-white font-bold">
-                                                📺 {avail.seasonsText}
-                                              </span>
-                                            )}
-                                          </div>
-
-                                          <div className="flex flex-col gap-1 items-end">
-                                            {avail.streaming_type === "addon" && (
-                                              <span className="text-xs px-2 py-1 rounded bg-orange-600 text-white font-bold">
-                                                💳 ABONNEMENT SÉPARÉ
-                                              </span>
-                                            )}
-                                            {avail.streaming_type === "rent" && (
-                                              <span className="text-sm px-3 py-1 rounded-lg bg-orange-600 text-white font-black shadow-lg">
-                                                🎬 LOCATION
-                                              </span>
-                                            )}
-                                            {avail.streaming_type === "buy" && (
-                                              <span className="text-sm px-3 py-1 rounded-lg bg-orange-600 text-white font-black shadow-lg">
-                                                💰 ACHAT
-                                              </span>
-                                            )}
-                                            {avail.streaming_type === "free" && (
-                                              <span className="text-sm px-3 py-1 rounded-lg bg-cyan-600 text-white font-black shadow-lg">
-                                                🆓 GRATUIT
-                                              </span>
-                                            )}
-                                          </div>
-                                        </div>
-
-                                        <div className="flex items-center gap-4 mb-3 text-sm">
-                                          <div className="flex items-center gap-2">
-                                            {avail.has_french_audio ? (
-                                              <CheckCircle className="w-4 h-4 text-green-400" />
-                                            ) : (
-                                              <XCircle className="w-4 h-4 text-gray-600" />
-                                            )}
-                                            <span
-                                              className={avail.has_french_audio ? "text-green-400 font-medium" : "text-gray-500"}
-                                            >
-                                              VF
-                                            </span>
-                                          </div>
-
-                                          <div className="flex items-center gap-2">
-                                            {avail.has_french_subtitles ? (
-                                              <CheckCircle className="w-4 h-4 text-green-400" />
-                                            ) : (
-                                              <XCircle className="w-4 h-4 text-gray-600" />
-                                            )}
-                                            <span
-                                              className={avail.has_french_subtitles ? "text-green-400 font-medium" : "text-gray-500"}
-                                            >
-                                              VOSTFR
-                                            </span>
-                                          </div>
-
-                                          {avail.quality && (
-                                            <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded font-semibold">
-                                              {avail.quality.toUpperCase()}
-                                            </span>
-                                          )}
-                                        </div>
-
-                                        {avail.streaming_url && (
-                                          <a
-                                            href={avail.streaming_url}
-                                            target="_blank"
-                                            rel="noopener noreferrer"
-                                            className={`block text-center ${
-                                              avail.streaming_type === "addon"
-                                                ? "bg-blue-600"
-                                                : getPlatformStyle(avail.platform).bg
-                                            } hover:opacity-90 text-white py-2 rounded-lg text-sm font-black transition-all hover:scale-105 shadow-lg`}
-                                          >
-                                            {avail.streaming_type === "rent"
-                                              ? "🎬 Louer"
-                                              : avail.streaming_type === "buy"
-                                              ? "💰 Acheter"
-                                              : avail.streaming_type === "addon" && avail.addon_name
-                                              ? `💳 S'abonner à ${avail.addon_name}`
-                                              : avail.streaming_type === "addon"
-                                              ? "📡 Chaîne payante"
-                                              : avail.streaming_type === "free"
-                                              ? `🆓 Voir sur ${avail.platform}`
-                                              : `▶ Voir sur ${avail.platform}`}
-                                          </a>
-                                        )}
-                                      </div>
-                                    ))}
-                                  </div>
-                                )}
-                              </div>
-                            );
-                          })}
-                        </div>
-                      </div>
-                    ))}
-                  </div>
-                )}
-
-                {/* VPN CTA */}
-                <div className="bg-gradient-to-br from-red-600 to-pink-600 rounded-3xl p-8 md:p-10 text-center shadow-2xl border border-red-500">
-                  <Shield className="w-16 h-16 text-white mx-auto mb-4" />
-                  <h3 className="text-3xl md:text-4xl font-black text-white mb-4">
-                    Débloquez ce film avec un VPN
-                  </h3>
-                  <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
-                    Changez virtuellement de pays pour accéder à n'importe quel catalogue Netflix
-                  </p>
-                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
-                    <a
-                      href="https://go.nordvpn.net/aff_c?offer_id=15&aff_id=93849"
-                      target="_blank"
-                      rel="noopener noreferrer"
-                      className="inline-flex items-center gap-2 bg-white text-red-600 px-8 py-4 rounded-xl font-black text-lg hover:bg-gray-100 transition-all hover:scale-105 shadow-xl"
-                    >
-                      <Zap className="w-5 h-5" />
-                      Essayer NordVPN
-                    </a>
-                    <a
-                      href="https://www.expressvpn.com"
-                      target="_blank"
-                      rel="noopener noreferrer"
-                      className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-lg text-white border-2 border-white px-8 py-4 rounded-xl font-black text-lg hover:bg-white/20 transition-all hover:scale-105"
-                    >
-                      <Tv className="w-5 h-5" />
-                      Essayer ExpressVPN
-                    </a>
-                  </div>
-                </div>
               </div>
-            )}
+              {renderAvailability()}
+            </div>
+          </div>
         )}
       </main>
 
-      {/* Footer */}
-      <footer className="mt-20 border-t border-gray-800 bg-black">
-        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
-          <div className="text-center space-y-3">
-            <p className="text-gray-400 text-sm">
-              Données fournies par TMDb et Streaming Availability
-            </p>
-            <p className="text-gray-500 text-sm">
-              🇫🇷 Fait avec ❤️ pour les francophones du monde entier
-            </p>
-          </div>
+      <footer className="border-t border-gray-800 py-6 text-center text-gray-500 text-sm bg-black/80">
+        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-3">
+          <p className="flex items-center gap-2">
+            <Film className="w-4 h-4" /> VF Movie Finder · Vérifie où regarder en français
+          </p>
+          <p className="flex items-center gap-2 text-gray-400">
+            <Shield className="w-4 h-4" /> Données fournies par l'API backend
+          </p>
         </div>
       </footer>
     </div>
   );
 }
