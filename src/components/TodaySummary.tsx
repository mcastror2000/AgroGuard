import React from 'react';
import { motion } from 'framer-motion';
import { Thermometer, Droplets, Sun } from 'lucide-react';
import { dewPointC, fmt } from '../utils/weather';
import { uvCategory } from '../utils/riskCalculations';

interface TodaySummaryProps {
  meteo: any;
  obs: any;
  uvNow: number | null;
}

export function TodaySummary({ meteo, obs, uvNow }: TodaySummaryProps) {
  if (!meteo) return null;

  try {
    const tz = meteo?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const todayISO = new Date().toLocaleDateString('en-CA', { timeZone: tz });
    
    let tmin = null;
    let tmax = null;
    let current = null;

    if (meteo.hourly?.time?.length) {
      const { time, temperature_2m, relative_humidity_2m } = meteo.hourly;
      
      for (let i = 0; i < time.length; i++) {
        const ts = time[i];
        const temp = temperature_2m?.[i];
        
        if (typeof temp !== 'number') continue;
        
        if (ts.startsWith(todayISO)) {
          if (tmin === null || temp < tmin) tmin = temp;
          if (tmax === null || temp > tmax) tmax = temp;
        }
        
        const diff = Math.abs(new Date(ts).getTime() - Date.now());
        if (current === null || diff < current.diff) {
          current = { temp, rh: relative_humidity_2m?.[i], diff };
        }
      }
    }

    const cur = (typeof meteo.current?.temperature_2m === 'number') 
      ? meteo.current.temperature_2m 
      : current?.temp;
    const curRh = (typeof meteo.current?.relative_humidity_2m === 'number') 
      ? meteo.current.relative_humidity_2m 
      : current?.rh;
    const curTd = dewPointC(cur ?? null, curRh ?? null);
    const rain = meteo.current?.precipitation;
    const uvCat = uvCategory(uvNow);

    return (
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-6"
      >
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Thermometer className="w-5 h-5 text-emerald-600" />
          Condiciones Actuales
        </h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-700">
              <Thermometer className="w-4 h-4 text-red-500" />
              <span className="font-medium">Temperatura:</span>
              <span className="text-lg font-bold text-gray-900">{fmt(cur, 1)}°C</span>
            </div>
            
            <div className="flex items-center gap-2 text-gray-700">
              <Droplets className="w-4 h-4 text-blue-500" />
              <span className="font-medium">Humedad:</span>
              <span className="text-lg font-bold text-gray-900">{fmt(curRh, 0)}%</span>
            </div>
            
            <div className="text-sm text-gray-600">
              <span className="font-medium">Punto de rocío:</span> {fmt(curTd, 1)}°C
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-700">
              <Sun className="w-4 h-4 text-yellow-500" />
              <span className="font-medium">Índice UV:</span>
              <span className="text-lg font-bold text-gray-900">{fmt(uvNow, 1)}</span>
            </div>
            
            {uvCat.level !== '—' && (
              <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${uvCat.color}`}>
                {uvCat.level}
              </div>
            )}
            
            <div className="text-sm text-gray-600">
              <span className="font-medium">Precipitación:</span> {fmt(rain, 1)} mm/h
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="text-sm text-gray-700">
              <span className="font-medium">Rango del día:</span>
            </div>
            <div className="text-lg font-bold text-gray-900">
              {fmt(tmin, 1)}°C - {fmt(tmax, 1)}°C
            </div>
            
            {obs && (
              <div className="text-xs text-gray-500 border-t pt-2">
                <div className="font-medium">Estación meteorológica:</div>
                <div>{fmt(obs?.temperature, 1)}°C • {fmt(obs?.humidity, 0)}% HR</div>
                {obs?.station && <div>{obs.station}</div>}
              </div>
            )}
          </div>
        </div>
      </motion.section>
    );
  } catch {
    return null;
  }
}