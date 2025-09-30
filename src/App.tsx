import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Leaf, AlertTriangle } from 'lucide-react';

import { SearchBar } from './components/SearchBar';
import { RiskIndicator } from './components/RiskIndicator';
import { TodaySummary } from './components/TodaySummary';
import { FrostForecast } from './components/FrostForecast';
import { WeatherForecast } from './components/WeatherForecast';
import { incrementVisitCounter, formatVisitCount, incrementGlobalCounter, getGlobalCounter } from './utils/visitCounter';

import { geocode, fetchForecast, fetchObservations, searchLocations, LocationData, SearchResult } from './services/weatherAPI';
import { frostCategory, fungalRisk, uvCategory } from './utils/riskCalculations';

export default function App() {
  const [query, setQuery] = useState("");
  const [place, setPlace] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [meteo, setMeteo] = useState<any>(null);
  const [obs, setObs] = useState<any>(null);
  const [focusNight, setFocusNight] = useState(false);
  const [servedFromCache, setServedFromCache] = useState(false);
  const lastController = useRef<AbortController | null>(null);
  const [visitCount, setVisitCount] = useState(0);
  const [globalVisitCount, setGlobalVisitCount] = useState<number | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Incrementar contadores de visitas al cargar la aplicación
  useEffect(() => {
    const count = incrementVisitCounter();
    setVisitCount(count);
    
    // Manejar contador global - CADA CARGA DE PÁGINA ES UNA VISITA
    const hasVisitedThisSession = sessionStorage.getItem("agroguard:session_visited");
    
    if (!hasVisitedThisSession) {
      // Nueva sesión: incrementar contador global (500, 501, 502...)
      sessionStorage.setItem("agroguard:session_visited", "true");
      incrementGlobalCounter().then(globalCount => {
        if (globalCount !== null) {
          setGlobalVisitCount(globalCount);
        }
      });
    } else {
      // Misma sesión: solo obtener el valor actual
      getGlobalCounter().then(globalCount => {
        if (globalCount !== null) {
          setGlobalVisitCount(globalCount);
        }
      });
    }
    
    // Timeout de seguridad: si después de 3 segundos no hay contador global, usar fallback
    const timeout = setTimeout(() => {
      if (globalVisitCount === null) {
        // Fallback que empieza en 500 y usa localStorage
        const fallbackKey = 'agroguard:global_fallback';
        const fallback = parseInt(localStorage.getItem(fallbackKey) || '500');
        setGlobalVisitCount(fallback);
      }
    }, 3000);
    
    return () => clearTimeout(timeout);
  }, [globalVisitCount]);

  // Búsqueda de sugerencias con debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const results = await searchLocations(query.trim());
          setSearchResults(results);
        } catch (error) {
          console.warn('Error buscando sugerencias:', error);
          setSearchResults([]);
        }
      }, 300);
    } else {
      setSearchResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  // Search location function
  async function searchLocation(forceRefresh = false) {
    if (lastController.current) {
      try {
        lastController.current.abort();
      } catch {}
    }

    const controller = new AbortController();
    lastController.current = controller;

    try {
      setError("");
      setLoading(true);
      setPlace(null);
      setMeteo(null);
      setObs(null);
      setShowSuggestions(false);

      const location = await geocode(query, forceRefresh, controller.signal);
      setPlace(location);

      const [{ json: meteorological, fromCache }, observations] = await Promise.all([
        fetchForecast(location.lat, location.lon, forceRefresh, controller.signal),
        fetchObservations(location.lat, location.lon, forceRefresh, controller.signal)
      ]);

      setServedFromCache(fromCache === true);
      setMeteo(meteorological);
      setObs(observations);
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setError(e?.message || "Error buscando ubicación");
      setMeteo(null);
      setObs(null);
    } finally {
      setLoading(false);
    }
  }

  // Seleccionar ubicación desde sugerencias
  function selectLocation(location: SearchResult) {
    setQuery(location.name);
    setShowSuggestions(false);
    setPlace(location);
    
    // Buscar datos meteorológicos para la ubicación seleccionada
    setTimeout(() => searchLocation(false), 100);
  }

  // Clear all data
  function clearData() {
    setPlace(null);
    setMeteo(null);
    setObs(null);
    setError("");
    setSearchResults([]);
    setShowSuggestions(false);
  }

  // Save last query to localStorage
  useEffect(() => {
    if (place?.name) {
      localStorage.setItem("agroguard:lastQuery", place.name);
    }
  }, [place?.name]);

  // Calculate next 48 hours data
  const next48h = useMemo(() => {
    if (!meteo?.hourly) return [];
    
    const { time, temperature_2m, relative_humidity_2m, precipitation, precipitation_probability, uv_index } = meteo.hourly;
    const now = Date.now();
    
    return time.map((t: string, i: number) => ({
      t,
      temp: temperature_2m?.[i],
      rh: relative_humidity_2m?.[i],
      rain: precipitation?.[i],
      ppop: precipitation_probability?.[i],
      uv: uv_index?.[i]
    })).filter((h: any) => {
      const ts = new Date(h.t).getTime();
      return ts >= now && ts <= now + 48 * 3600 * 1000;
    });
  }, [meteo]);

  // Calculate fungal risk
  const fungalRiskData = useMemo(() => fungalRisk(next48h), [next48h]);

  // Calculate next 24 hours data and rain accumulation
  const next24h = useMemo(() => 
    next48h.filter(h => new Date(h.t).getTime() <= Date.now() + 24 * 3600 * 1000), 
    [next48h]
  );
  
  const rain24mm = useMemo(() => 
    next24h.reduce((sum, h) => sum + (typeof h.rain === 'number' ? h.rain : 0), 0), 
    [next24h]
  );

  // Calculate daily weather data
  const dailyRain = useMemo(() => {
    if (!meteo?.daily) return [];
    
    const n = meteo.daily.time.length;
    const today = new Date().toLocaleDateString('en-CA');
    const rows = [];
    
    for (let i = 0; i < n; i++) {
      if (meteo.daily.time[i] < today) continue;
      
      rows.push({
        date: meteo.daily.time[i],
        pop: meteo.daily.precipitation_probability_max?.[i] ?? null,
        sum: meteo.daily.precipitation_sum?.[i] ?? null,
        tmin: meteo.daily.temperature_2m_min?.[i] ?? null,
        tmax: meteo.daily.temperature_2m_max?.[i] ?? null,
        uvmax: meteo.daily.uv_index_max?.[i] ?? null,
      });
    }
    
    return rows.slice(0, 5);
  }, [meteo]);

  // Calculate current UV
  const uvNow = useMemo(() => {
    if (!meteo?.hourly?.time?.length) return null;
    
    const { time, uv_index } = meteo.hourly;
    let best = null;
    let bestDiff = Infinity;
    
    for (let i = 0; i < time.length; i++) {
      const ts = new Date(time[i]).getTime();
      const diff = Math.abs(ts - Date.now());
      
      if (diff < bestDiff && typeof uv_index?.[i] === 'number') {
        best = uv_index[i];
        bestDiff = diff;
      }
    }
    
    return best;
  }, [meteo]);

  // Calculate frost bands
  const frostBands = useMemo(() => {
    if (!meteo?.hourly?.time?.length) return [];
    
    const { time, temperature_2m } = meteo.hourly;
    const now = Date.now();
    const end = now + 48 * 3600 * 1000;
    
    const isNight = (ts: number) => {
      const h = new Date(ts).getHours();
      return h >= 18 || h < 8;
    };
    
    const hours = [];
    for (let i = 0; i < time.length; i++) {
      const ts = new Date(time[i]).getTime();
      if (ts >= now && ts <= end) {
        const t = temperature_2m?.[i];
        if (typeof t === 'number') {
          // Si focusNight está activado, solo incluir horas nocturnas
          if (!focusNight || isNight(ts)) {
            hours.push({ ts, temp: t });
          }
        }
      }
    }
    
    if (!hours.length) return [];
    
    // Cambiar a bandas de 4 horas para tener más datos
    const bandMs = 4 * 3600 * 1000; // 4 hours
    const start0 = now;
    const out = [];
    
    // Crear más bandas (12 bandas de 4 horas = 48 horas)
    for (let b = 0; b < 12; b++) {
      const bStart = start0 + b * bandMs;
      const bEnd = bStart + bandMs;
      const inBand = hours.filter(h => h.ts >= bStart && h.ts < bEnd);
      
      if (!inBand.length) continue;
      
      const tmin = inBand.reduce((m, h) => Math.min(m, h.temp), Infinity);
      const cat = frostCategory(tmin);
      
      out.push({
        start: new Date(bStart),
        end: new Date(bEnd),
        tmin,
        ...cat
      });
    }
    
    return out;
  }, [meteo, focusNight]);

  // Calculate frost risk for next night
  const frostNextNight = useMemo(() => {
    if (!meteo?.hourly?.time?.length) return frostCategory(null);
    
    const { time, temperature_2m } = meteo.hourly;
    const now = Date.now();
    const targetHours = new Set([18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6, 7]);
    
    let min = Infinity;
    let found = false;
    
    for (let i = 0; i < time.length; i++) {
      const d = new Date(time[i]);
      const ts = d.getTime();
      
      if (ts < now) continue;
      if (ts > now + 18 * 3600 * 1000) break;
      
      const h = d.getHours();
      if (targetHours.has(h)) {
        const v = temperature_2m?.[i];
        if (typeof v === 'number') {
          min = Math.min(min, v);
          found = true;
        }
      }
    }
    
    return frostCategory(found ? min : null);
  }, [meteo]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 text-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-emerald-600 rounded-2xl shadow-lg">
              <Leaf className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
              AgroGuard
            </h1>
          </div>
          <p className="mt-2 text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Sistema de monitoreo riesgos de heladas, hongos, precipitaciones e índice UV
          </p>
        </motion.header>

        {/* Search Bar */}
        <SearchBar
          query={query}
          loading={loading}
          searchResults={searchResults}
          showSuggestions={showSuggestions}
          onQueryChange={setQuery}
          onSearch={() => searchLocation(false)}
          onRefresh={() => searchLocation(true)}
          onClear={clearData}
          onSelectLocation={selectLocation}
          onFocusSearch={() => setShowSuggestions(true)}
          onBlurSearch={() => setTimeout(() => setShowSuggestions(false), 200)}
        />

        {/* Night Focus Toggle */}
        <div className="flex items-center justify-center mb-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={focusNight}
              onChange={e => setFocusNight(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
            />
            <span className="text-sm text-gray-700 font-medium">
              Enfocar periodo nocturno (18:00–08:00)
            </span>
          </label>
        </div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-100 border border-red-300 rounded-xl text-red-800 text-center flex items-center justify-center gap-2"
            role="alert"
          >
            <AlertTriangle className="w-5 h-5" />
            {error}
          </motion.div>
        )}

        {/* Location and Cache Info */}
        {place && (
          <div className="mb-2 text-center">
            <div className="text-lg font-semibold text-gray-800">
              📍 {place.name}
              {place.population && (
                <span className="ml-2 text-sm text-gray-600">
                  ({place.population > 1000000 ? `${(place.population / 1000000).toFixed(1)}M` : 
                    place.population > 1000 ? `${Math.round(place.population / 1000)}k` : 
                    place.population} hab.)
                </span>
              )}
            </div>
            {meteo && (
              <div className="text-xs text-gray-600 mt-1">
                {servedFromCache 
                  ? "⚡ Datos desde caché (≤10 min)" 
                  : "🌐 Datos frescos desde API"
                }
                {meteo.timezone && (
                  <span className="ml-3">🕒 {meteo.timezone}</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Weather Data Display */}
        {meteo && (
          <>
            {/* Main Risk Indicators */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <RiskIndicator
                title="Riesgo de Heladas (próx. noche)"
                {...frostNextNight}
              />
              <RiskIndicator
                title="Riesgo de Hongos (próx. 48h)"
                {...fungalRiskData}
              />
              {(() => {
                const dailyMaxUV = meteo?.daily?.uv_index_max?.[0];
                if (dailyMaxUV == null) return null;
                const uvCat = uvCategory(dailyMaxUV);
                return (
                  <RiskIndicator
                    title="Índice UV (máximo hoy)"
                    {...uvCat}
                  />
                );
              })()}
            </div>

            {/* Today's Summary */}
            <TodaySummary meteo={meteo} obs={obs} uvNow={uvNow} />

            {/* Frost Forecast */}
            <FrostForecast frostBands={frostBands} focusNight={focusNight} />

            {/* Weather Forecast */}
            <WeatherForecast dailyRain={dailyRain} rain24mm={rain24mm} />
          </>
        )}

        {/* Footer con información del desarrollador */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12 text-center"
        >
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow-md">
            <p className="text-sm text-gray-600">
              Desarrollado por <span className="font-semibold text-emerald-700">MC</span> • Versión 1.0
            </p>
            <div className="text-xs text-gray-500 mt-1 space-y-1">
              <p>Visitas en este dispositivo: {formatVisitCount(visitCount)}</p>
              {globalVisitCount !== null && (
                <p>Visitas totales: {formatVisitCount(globalVisitCount)}</p>
              )}
              {globalVisitCount === null && (
                <p>Visitas totales: <span className="text-gray-400">cargando...</span></p>
              )}
            </div>
          </div>
        </motion.footer>
      </div>
    </div>
  );
}