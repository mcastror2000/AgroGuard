import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Cloud, 
  Droplets, 
  Thermometer, 
  Wind, 
  Eye, 
  Users, 
  Sun,
  Snowflake,
  CloudRain,
  AlertTriangle,
  Leaf
} from 'lucide-react';
import { SearchBar } from './components/SearchBar';
import { WeatherForecast } from './components/WeatherForecast';
import { TodaySummary } from './components/TodaySummary';
import { FrostForecast } from './components/FrostForecast';
import { RiskIndicator } from './components/RiskIndicator';
import { 
  incrementGlobalCounter, 
  incrementLocalCounter, 
  getGlobalCounter,
  formatVisitCount,
  getFallbackGlobalCount
} from './utils/visitCounter';
import { geocode, fetchForecast, fetchObservations } from './services/weatherAPI';
import { frostCategory, fungalRisk, uvCategory } from './utils/riskCalculations';

interface LocationData {
  name: string;
  lat: number;
  lon: number;
}

function App() {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [meteo, setMeteo] = useState<any>(null);
  const [obs, setObs] = useState<any>(null);
  const [visitCounts, setVisitCounts] = useState({ local: 1, global: 500 });

  // Initialize visit counters
  useEffect(() => {
    const initializeCounters = async () => {
      try {
        console.log('🚀 Iniciando contadores de visitas...');
        
        // Increment local counter
        const localCount = incrementLocalCounter();
        console.log(`📱 Contador local: ${localCount}`);
        
        // Try to increment global counter
        let globalCount = 500;
        try {
          const result = await incrementGlobalCounter();
          if (result !== null) {
            globalCount = result;
            console.log(`✅ Contador global de CountAPI: ${globalCount}`);
          } else {
            throw new Error('CountAPI returned null');
          }
        } catch (error) {
          console.warn('⚠️ CountAPI falló, usando fallback:', error);
          globalCount = getFallbackGlobalCount();
          console.log(`⚠️ Contador fallback: ${globalCount}`);
        }
        
        setVisitCounts({ local: localCount, global: globalCount });
      } catch (error) {
        console.error('❌ Error inicializando contadores:', error);
        setVisitCounts({ local: 1, global: 500 });
      }
    };

    initializeCounters();
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      console.log('🔍 Buscando ubicación:', query);
      const locationData = await geocode(query.trim());
      setLocation(locationData);
      
      console.log('🌤️ Obteniendo datos meteorológicos...');
      const [forecastResult, obsResult] = await Promise.all([
        fetchForecast(locationData.lat, locationData.lon),
        fetchObservations(locationData.lat, locationData.lon).catch(() => null)
      ]);
      
      setMeteo(forecastResult.json);
      setObs(obsResult);
      console.log('✅ Datos meteorológicos obtenidos');
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setLocation(null);
      setMeteo(null);
      setObs(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (location) {
      setLoading(true);
      try {
        const [forecastResult, obsResult] = await Promise.all([
          fetchForecast(location.lat, location.lon, true),
          fetchObservations(location.lat, location.lon, true).catch(() => null)
        ]);
        
        setMeteo(forecastResult.json);
        setObs(obsResult);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al actualizar');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleClear = () => {
    setQuery('');
    setLocation(null);
    setMeteo(null);
    setObs(null);
    setError('');
  };

  // Calculate current UV index
  const getCurrentUV = () => {
    if (!meteo?.hourly?.time) return null;
    
    const now = new Date();
    const { time, uv_index } = meteo.hourly;
    
    let closestIndex = 0;
    let minDiff = Infinity;
    
    for (let i = 0; i < time.length; i++) {
      const diff = Math.abs(new Date(time[i]).getTime() - now.getTime());
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    }
    
    return uv_index?.[closestIndex] || null;
  };

  // Calculate frost bands for next 48 hours
  const getFrostBands = () => {
    if (!meteo?.hourly?.time) return [];
    
    const { time, temperature_2m } = meteo.hourly;
    const now = new Date();
    const bands = [];
    
    for (let i = 0; i < time.length && i < 48; i++) {
      const timestamp = new Date(time[i]);
      if (timestamp < now) continue;
      
      const temp = temperature_2m?.[i];
      if (typeof temp !== 'number') continue;
      
      const category = frostCategory(temp);
      if (category.level !== 'Mínimo') {
        bands.push({
          start: timestamp,
          end: new Date(timestamp.getTime() + 60 * 60 * 1000), // +1 hour
          tmin: temp,
          level: category.level,
          color: category.color,
          tip: category.tip
        });
      }
    }
    
    return bands.slice(0, 10); // Limit to 10 entries
  };

  // Calculate daily rain data
  const getDailyRainData = () => {
    if (!meteo?.daily?.time) return [];
    
    const { time, precipitation_sum, precipitation_probability_max, temperature_2m_min, temperature_2m_max, uv_index_max } = meteo.daily;
    
    return time.slice(0, 5).map((date: string, index: number) => ({
      date,
      pop: precipitation_probability_max?.[index] || null,
      sum: precipitation_sum?.[index] || null,
      tmin: temperature_2m_min?.[index] || null,
      tmax: temperature_2m_max?.[index] || null,
      uvmax: uv_index_max?.[index] || null
    }));
  };

  // Calculate 24h rain accumulation
  const getRain24h = () => {
    if (!meteo?.hourly?.precipitation) return 0;
    
    const now = new Date();
    const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    let total = 0;
    for (let i = 0; i < meteo.hourly.time.length; i++) {
      const timestamp = new Date(meteo.hourly.time[i]);
      if (timestamp >= now && timestamp <= next24h) {
        total += meteo.hourly.precipitation[i] || 0;
      }
    }
    
    return total;
  };

  // Calculate fungal risk from hourly data
  const getFungalRiskData = () => {
    if (!meteo?.hourly?.time) return { level: '—', color: 'bg-gray-200 text-gray-700', tip: 'Sin datos' };
    
    const { time, temperature_2m, relative_humidity_2m, precipitation } = meteo.hourly;
    const now = new Date();
    const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const relevantHours = [];
    for (let i = 0; i < time.length; i++) {
      const timestamp = new Date(time[i]);
      if (timestamp >= now && timestamp <= next24h) {
        relevantHours.push({
          temp: temperature_2m?.[i] || null,
          rh: relative_humidity_2m?.[i] || null,
          rain: precipitation?.[i] || null
        });
      }
    }
    
    return fungalRisk(relevantHours);
  };

  const uvNow = getCurrentUV();
  const frostBands = getFrostBands();
  const dailyRain = getDailyRainData();
  const rain24mm = getRain24h();
  const fungalRiskData = getFungalRiskData();
  const uvRiskData = uvCategory(uvNow);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-emerald-100"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-3 rounded-2xl shadow-lg">
                <Leaf className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
                  AgroGuard
                </h1>
                <p className="text-sm text-gray-600 font-medium">Sistema de Monitoreo Agrícola Mejorado</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2 bg-white/60 px-3 py-2 rounded-lg">
                <Eye className="w-4 h-4 text-emerald-600" />
                <span>Dispositivo: {visitCounts.local}</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/60 px-3 py-2 rounded-lg">
                <Users className="w-4 h-4 text-teal-600" />
                <span>Total: {formatVisitCount(visitCounts.global)}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <SearchBar
          query={query}
          loading={loading}
          onQueryChange={setQuery}
          onSearch={handleSearch}
          onRefresh={handleRefresh}
          onClear={handleClear}
        />

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6"
          >
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">Error:</span>
              <span>{error}</span>
            </div>
          </motion.div>
        )}

        {location && meteo ? (
          <div className="space-y-8">
            {/* Location Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center"
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                📍 {location.name}
              </h2>
              <p className="text-gray-600">
                Coordenadas: {location.lat.toFixed(4)}°, {location.lon.toFixed(4)}°
              </p>
            </motion.div>

            {/* Today's Summary */}
            <TodaySummary meteo={meteo} obs={obs} uvNow={uvNow} />

            {/* Risk Indicators */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              <RiskIndicator
                title="Riesgo de Heladas"
                level={frostBands.length > 0 ? frostBands[0].level : "Bajo"}
                color={frostBands.length > 0 ? frostBands[0].color : "bg-green-500 text-white"}
                tip={frostBands.length > 0 ? frostBands[0].tip : "Sin riesgo inmediato de helada"}
              />
              <RiskIndicator
                title="Riesgo Fúngico"
                level={fungalRiskData.level}
                color={fungalRiskData.color}
                tip={fungalRiskData.tip}
              />
              <RiskIndicator
                title="Índice UV"
                level={uvRiskData.level}
                color={uvRiskData.color}
                tip={uvRiskData.tip}
              />
            </motion.section>

            {/* Weather Forecast */}
            <WeatherForecast dailyRain={dailyRain} rain24mm={rain24mm} />

            {/* Frost Forecast */}
            <FrostForecast frostBands={frostBands} focusNight={true} />
          </div>
        ) : !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center py-16"
          >
            <div className="bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <Leaf className="w-12 h-12 text-emerald-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Bienvenido a AgroGuard
            </h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto text-lg leading-relaxed">
              Selecciona una ubicación en Chile para comenzar a monitorear las condiciones climáticas 
              y recibir alertas importantes para tu actividad agrícola.
            </p>
            
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 max-w-4xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                🌱 Características principales
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div className="flex items-start space-x-4 p-4 bg-red-50 rounded-xl">
                  <Snowflake className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">Alertas de Heladas</h4>
                    <p className="text-sm text-gray-600">Predicciones precisas de temperaturas mínimas y riesgo de heladas</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-xl">
                  <CloudRain className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">Monitoreo de Precipitaciones</h4>
                    <p className="text-sm text-gray-600">Seguimiento detallado de lluvias y humedad relativa</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 p-4 bg-orange-50 rounded-xl">
                  <Sun className="w-6 h-6 text-orange-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">Índice UV</h4>
                    <p className="text-sm text-gray-600">Monitoreo de radiación ultravioleta para protección laboral</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 p-4 bg-green-50 rounded-xl">
                  <Leaf className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">Riesgo Fúngico</h4>
                    <p className="text-sm text-gray-600">Evaluación de condiciones favorables para enfermedades</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-white/80 backdrop-blur-sm border-t border-gray-200 mt-16"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p className="text-lg font-medium">Desarrollado por <strong className="text-emerald-600">MC</strong> • Versión 1.0</p>
            <div className="mt-4 flex items-center justify-center space-x-8 text-sm">
              <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg">
                <Eye className="w-4 h-4 text-emerald-600" />
                <span>Visitas en este dispositivo: <strong>{visitCounts.local}</strong></span>
              </div>
              <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg">
                <Users className="w-4 h-4 text-teal-600" />
                <span>Visitas totales: <strong>{formatVisitCount(visitCounts.global)}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}

export default App;