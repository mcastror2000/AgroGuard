import React from 'react';
import { motion } from 'framer-motion';
import { Search, RefreshCw, Trash2 } from 'lucide-react';

interface SearchBarProps {
  query: string;
  loading: boolean;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
  onRefresh: () => void;
  onClear: () => void;
}

export function SearchBar({
  query,
  loading,
  onQueryChange,
  onSearch,
  onRefresh,
  onClear
}: SearchBarProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      onSearch();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-6"
    >
      <div className="grid gap-4 md:grid-cols-[1fr_auto_auto_auto] items-end">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            className="w-full pl-10 pr-4 py-3 text-lg rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm transition-all duration-200"
            placeholder="🌎 Ingresa una localidad de Chile..."
            value={query}
            onChange={e => onQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            aria-label="Buscar localidad en Chile"
          />
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
    </motion.div>
  );
}