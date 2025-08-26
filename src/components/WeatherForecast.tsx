import React from 'react';
import { motion } from 'framer-motion';
import { Cloud, CloudRain, Sun } from 'lucide-react';
import { fmt } from '../utils/weather';

interface DailyData {
  date: string;
  pop: number | null;
  sum: number | null;
  tmin: number | null;
  tmax: number | null;
  uvmax: number | null;
}

interface WeatherForecastProps {
  dailyRain: DailyData[];
  rain24mm: number;
}

export function WeatherForecast({ dailyRain, rain24mm }: WeatherForecastProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6"
    >
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <CloudRain className="w-5 h-5 text-blue-500" />
        Pronóstico Meteorológico (próximos 5 días)
      </h2>
      
      <div className="mb-4 p-4 bg-blue-50 rounded-xl">
        <div className="flex items-center gap-2 text-blue-800">
          <Cloud className="w-4 h-4" />
          <span className="font-medium">Próximas 24 horas:</span>
          <span className="font-bold">
            lluvia acumulada aproximada {fmt(rain24mm, 1)} mm
          </span>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600 border-b border-gray-200">
              <th scope="col" className="py-3 pr-6 font-semibold">Fecha</th>
              <th scope="col" className="py-3 pr-6 font-semibold">Prob. Lluvia</th>
              <th scope="col" className="py-3 pr-6 font-semibold">Precipitación</th>
              <th scope="col" className="py-3 pr-6 font-semibold">Temperatura</th>
              <th scope="col" className="py-3 font-semibold">UV Máximo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {dailyRain.map((day, index) => {
              const isToday = new Date(day.date).toDateString() === new Date().toDateString();
              
              return (
                <tr 
                  key={index} 
                  className={`hover:bg-gray-50 transition-colors ${
                    isToday ? 'bg-amber-50 font-semibold' : ''
                  }`}
                >
                  <td className="py-3 pr-6">
                    <div className={`${isToday ? 'text-amber-800' : 'text-gray-700'}`}>
                      {new Date(day.date).toLocaleDateString('es-ES', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                      {isToday && <span className="ml-2 text-xs">(HOY)</span>}
                    </div>
                  </td>
                  <td className="py-3 pr-6">
                    <div className="flex items-center gap-2">
                      {day.pop && day.pop > 50 && <CloudRain className="w-4 h-4 text-blue-500" />}
                      <span className="font-medium">{fmt(day.pop, 0)}%</span>
                    </div>
                  </td>
                  <td className="py-3 pr-6 font-medium">
                    {fmt(day.sum, 1)} mm
                  </td>
                  <td className="py-3 pr-6">
                    <span className="text-blue-600 font-medium">{fmt(day.tmin, 1)}°</span>
                    <span className="mx-1 text-gray-400">/</span>
                    <span className="text-red-600 font-medium">{fmt(day.tmax, 1)}°</span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <Sun className="w-4 h-4 text-yellow-500" />
                      <span className="font-medium">{fmt(day.uvmax, 1)}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
            
            {!dailyRain.length && (
              <tr>
                <td className="py-6 text-gray-500 text-center" colSpan={5}>
                  Sin datos de pronóstico disponibles.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.section>
  );
}