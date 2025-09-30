import React from 'react';
import { motion } from 'framer-motion';
import { Snowflake } from 'lucide-react';
import { fmt } from '../utils/weather';

interface FrostBand {
  start: Date;
  end: Date;
  tmin: number;
  level: string;
  color: string;
  tip: string;
}

interface FrostForecastProps {
  frostBands: FrostBand[];
  focusNight: boolean;
}

export function FrostForecast({ frostBands, focusNight }: FrostForecastProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-6"
    >
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Snowflake className="w-5 h-5 text-blue-500" />
        Pronóstico de Heladas (próximas 48h{focusNight ? " - solo período nocturno" : ""})
      </h2>
      
      {focusNight && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
          <strong>Modo nocturno activo:</strong> Mostrando solo datos entre 18:00 y 08:00
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600 border-b border-gray-200">
              <th scope="col" className="py-3 pr-6 font-semibold">Período (4h)</th>
              <th scope="col" className="py-3 pr-6 font-semibold">Temp. Mínima</th>
              <th scope="col" className="py-3 pr-6 font-semibold">Nivel de Riesgo</th>
              <th scope="col" className="py-3 font-semibold">Recomendación</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {frostBands.map((band, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 pr-6 text-gray-700">
                  <div className="font-medium">
                    {band.start.toLocaleDateString('es-ES', {
                      weekday: 'short',
                      month: 'short', 
                      day: 'numeric'
                    })}
                  </div>
                  <div className="text-xs text-gray-500">
                    {band.start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - 
                    {band.end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </td>
                <td className="py-3 pr-6">
                  <span className="text-lg font-bold text-gray-900">
                    {fmt(band.tmin, 1)}°C
                  </span>
                </td>
                <td className="py-3 pr-6">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${band.color}`}>
                    {band.level}
                  </span>
                </td>
                <td className="py-3 text-gray-600">
                  {band.tip}
                </td>
              </tr>
            ))}
            
            {!frostBands.length && (
              <tr>
                <td className="py-8 text-gray-500 text-center" colSpan={4}>
                  <div className="space-y-2">
                    <div>Sin datos suficientes para el pronóstico de heladas.</div>
                    <div className="text-xs">Intenta desactivar el "modo nocturno" o busca otra ubicación.</div>
                  </div>
                  Sin datos suficientes para el pronóstico de las próximas 48 horas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.section>
  );
}