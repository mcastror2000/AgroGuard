import React from 'react';
import { motion } from 'framer-motion';
import { Search, RefreshCw, Trash2, MapPin, Users } from 'lucide-react';
import { SearchResult } from '../services/weatherAPI';

interface SearchBarProps {
  query: string;
  loading: boolean;
  searchResults: SearchResult[];
  showSuggestions: boolean;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
  onRefresh: () => void;
  onClear: () => void;
  onSelectLocation: (location: SearchResult) => void;
  onFocusSearch: () => void;
  onBlurSearch: () => void;
}

export function SearchBar({
  query,
  loading,
  searchResults,
  showSuggestions,
  onQueryChange,
  onSearch,
  onRefresh,
  onClear,
  onSelectLocation,
  onFocusSearch,
  onBlurSearch
}: SearchBarProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      onSearch();
    }
  };

  const formatPopulation = (pop: number | undefined) => {
    if (!pop) return '';
    if (pop > 1000000) return `${(pop / 1000000).toFixed(1)}M hab.`;
    if (pop > 1000) return `${(pop / 1000).toFixed(0)}k hab.`;
    return `${pop} hab.`;
  };

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'city': return '🏙️';
      case 'town': return '🏘️';
      case 'village': return '🏡';
      case 'administrative': return '🏛️';
      default: return '📍';
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-6"
    >
      {/* Información sobre la búsqueda */}
      <div className="mb-4 p-3 bg-emerald-50 rounded-lg text-sm text-emerald-800">
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="w-4 h-4" />
          <strong>Búsqueda optimizada para Chile</strong>
        </div>
        <div className="text-xs text-emerald-700">
          Busca por ciudad, comuna o región. Ejemplos: "Santiago", "Valparaíso", "Temuco", "Región Metropolitana"
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_auto_auto_auto] items-end">
        <div className="relative" onBlur={onBlurSearch}>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            className="w-full pl-10 pr-4 py-3 text-lg rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm transition-all duration-200"
            placeholder="🌎 Buscar ciudad, comuna o región en Chile..."
            value={query}
            onChange={e => onQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={onFocusSearch}
            disabled={loading}
            aria-label="Buscar ubicación en Chile"
          />
          
          {/* Sugerencias de búsqueda */}
          {showSuggestions && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                  onClick={() => onSelectLocation(result)}
                  onMouseDown={(e) => e.preventDefault()} // Prevenir blur del input
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{getLocationIcon(result.type)}</span>
                      <div>
                        <div className="font-medium text-gray-900">{result.name}</div>
                        {result.admin2 && (
                          <div className="text-xs text-gray-500">
                            {result.admin2}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {result.population && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Users className="w-3 h-3" />
                          {formatPopulation(result.population)}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 capitalize">
                        {result.type === 'city' ? 'Ciudad' : 
                         result.type === 'town' ? 'Comuna' :
                         result.type === 'village' ? 'Localidad' : 'Administrativa'}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <button
          onClick={onSearch}
          disabled={loading || !query.trim()}
          className="h-12 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Search className="w-4 h-4" />
          Buscar
        </button>
        
        <button
          onClick={onRefresh}
          disabled={loading || !query.trim()}
          className="h-12 px-6 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
        
        <button
          onClick={onClear}
          disabled={loading}
          className="h-12 px-6 rounded-xl border border-gray-300 bg-white text-gray-700 font-medium shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Limpiar
        </button>
      </div>
      
      {/* Regiones populares */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600 mb-2">Regiones populares:</div>
        <div className="flex flex-wrap gap-2">
          {['Santiago', 'Valparaíso', 'Concepción', 'La Serena', 'Temuco', 'Antofagasta'].map((city) => (
            <button
              key={city}
              onClick={() => {
                onQueryChange(city);
                setTimeout(onSearch, 100);
              }}
              className="px-3 py-1 text-xs bg-gray-100 hover:bg-emerald-100 text-gray-700 hover:text-emerald-700 rounded-full transition-colors"
              disabled={loading}
            >
              {city}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}