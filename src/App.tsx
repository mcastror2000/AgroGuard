import React, { useState, useEffect } from 'react';
import { Cloud, Droplets, Thermometer, Wind, Eye, Users } from 'lucide-react';
import SearchBar from './components/SearchBar';
import WeatherForecast from './components/WeatherForecast';
import TodaySummary from './components/TodaySummary';
import FrostForecast from './components/FrostForecast';
import RiskIndicator from './components/RiskIndicator';
import { getVisitCounts } from './utils/visitCounter';

function App() {
  const [location, setLocation] = useState('');
  const [visitCounts, setVisitCounts] = useState({ local: 0, global: 0 });

  useEffect(() => {
    const loadVisitCounts = async () => {
      try {
        const counts = await getVisitCounts();
        setVisitCounts(counts);
      } catch (error) {
        console.error('Error loading visit counts:', error);
        setVisitCounts({ local: 1, global: 500 });
      }
    };

    loadVisitCounts();
  }, []);

  const handleLocationSelect = (selectedLocation: string) => {
    setLocation(selectedLocation);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-green-600 p-2 rounded-lg">
                <Cloud className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AgroGuard</h1>
                <p className="text-sm text-gray-600">Monitoreo Agrícola Inteligente</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4" />
                <span>Visitas en este dispositivo: {visitCounts.local}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Visitas totales: {formatNumber(visitCounts.global)}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <div className="mb-8">
          <SearchBar onLocationSelect={handleLocationSelect} />
        </div>

        {location ? (
          <div className="space-y-8">
            {/* Today's Summary */}
            <TodaySummary location={location} />

            {/* Risk Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <RiskIndicator
                title="Riesgo de Heladas"
                risk="alto"
                icon={<Thermometer className="w-6 h-6" />}
                description="Temperaturas bajo 2°C esperadas"
                recommendation="Activar sistemas de protección"
              />
              <RiskIndicator
                title="Riesgo de Sequía"
                risk="medio"
                icon={<Droplets className="w-6 h-6" />}
                description="Precipitaciones por debajo del promedio"
                recommendation="Monitorear humedad del suelo"
              />
              <RiskIndicator
                title="Condiciones de Viento"
                risk="bajo"
                icon={<Wind className="w-6 h-6" />}
                description="Vientos moderados esperados"
                recommendation="Condiciones favorables para aplicaciones"
              />
            </div>

            {/* Weather Forecast */}
            <WeatherForecast location={location} />

            {/* Frost Forecast */}
            <FrostForecast location={location} />
          </div>
        ) : (
          <div className="text-center py-16">
            <Cloud className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Bienvenido a AgroGuard
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Selecciona una ubicación para comenzar a monitorear las condiciones climáticas 
              y recibir alertas importantes para tu actividad agrícola.
            </p>
            <div className="bg-white rounded-lg shadow-sm p-6 max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Características principales:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="flex items-start space-x-3">
                  <Thermometer className="w-5 h-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-medium text-gray-900">Alertas de Heladas</h4>
                    <p className="text-sm text-gray-600">Predicciones precisas de temperaturas mínimas</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Droplets className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <h4 className="font-medium text-gray-900">Monitoreo de Precipitaciones</h4>
                    <p className="text-sm text-gray-600">Seguimiento de lluvias y humedad</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Wind className="w-5 h-5 text-gray-600 mt-1" />
                  <div>
                    <h4 className="font-medium text-gray-900">Condiciones de Viento</h4>
                    <p className="text-sm text-gray-600">Información para aplicaciones agrícolas</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Cloud className="w-5 h-5 text-purple-600 mt-1" />
                  <div>
                    <h4 className="font-medium text-gray-900">Pronóstico Extendido</h4>
                    <p className="text-sm text-gray-600">Planificación a 7 días</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>Desarrollado por <strong>MC</strong> • Versión 1.0</p>
            <div className="mt-2 flex items-center justify-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4" />
                <span>Visitas en este dispositivo: {visitCounts.local}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Visitas totales: {formatNumber(visitCounts.global)}</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;