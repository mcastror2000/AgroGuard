import { dewPointC } from './weather';

export interface RiskCategory {
  level: string;
  color: string;
  tip: string;
}

export function frostCategory(tmin: number | null): RiskCategory {
  if (tmin === null || tmin === undefined) {
    return {
      level: "—",
      color: "bg-gray-200 text-gray-700",
      tip: "Sin datos"
    };
  }
  
  const t = Number(tmin);
  if (t <= 0) return {
    level: "Alto",
    color: "bg-red-600 text-white",
    tip: "Helada probable. Planifica medidas de protección"
  };
  if (t <= 2) return {
    level: "Medio",
    color: "bg-orange-500 text-white",
    tip: "Riesgo moderado; monitorea de cerca"
  };
  if (t <= 4) return {
    level: "Bajo",
    color: "bg-yellow-400 text-gray-900",
    tip: "Posible helada débil; mantente vigilante"
  };
  
  return {
    level: "Mínimo",
    color: "bg-green-500 text-white",
    tip: "Sin riesgo inmediato de helada"
  };
}

export interface HourlyData {
  temp: number | null;
  rh: number | null;
  rain: number | null;
  [key: string]: any;
}

export function fungalRisk(hours: HourlyData[]): RiskCategory {
  if (!hours || hours.length === 0) {
    return {
      level: "—",
      color: "bg-gray-200 text-gray-700",
      tip: "Sin datos disponibles"
    };
  }
  
  const enriched = hours.map(h => {
    const td = dewPointC(h.temp, h.rh);
    const nearCond = (typeof td === 'number') ? ((h.temp! - td) <= 1.0) : false;
    const leafWet = (h.rh! >= 90) || (h.rain && h.rain > 0);
    return { ...h, td, nearCond, leafWet };
  });
  
  const wetHours = enriched.filter(h => h.leafWet || h.nearCond).length;
  const highRiskHours = enriched.filter(h => 
    h.rh! >= 85 && h.temp! >= 12 && h.temp! <= 25
  ).length;
  const mediumRiskHours = enriched.filter(h => 
    h.rh! >= 80 && h.temp! >= 10 && h.temp! <= 28
  ).length;
  
  if (highRiskHours >= 8 || wetHours >= 8) {
    return {
      level: "Alto",
      color: "bg-red-600 text-white",
      tip: "Muchas horas con condiciones favorables para hongos"
    };
  }
  
  if (mediumRiskHours >= 4 || wetHours >= 4) {
    return {
      level: "Medio",
      color: "bg-orange-500 text-white",
      tip: "Varias horas favorables; reforzar vigilancia"
    };
  }
  
  return {
    level: "Bajo",
    color: "bg-yellow-400 text-gray-900",
    tip: "Riesgo limitado de infección por hongos"
  };
}

export function uvCategory(uv: number | null): RiskCategory {
  if (uv === null || uv === undefined || Number.isNaN(+uv)) {
    return {
      level: "—",
      color: "bg-gray-200 text-gray-700",
      tip: "Sin datos de UV disponibles"
    };
  }
  
  const u = +uv;
  if (u < 3) return {
    level: "Bajo",
    color: "bg-green-500 text-white",
    tip: "Exposición segura; tareas normales al aire libre"
  };
  if (u < 6) return {
    level: "Moderado",
    color: "bg-yellow-400 text-gray-900",
    tip: "Protección básica; evitar exposición prolongada al mediodía"
  };
  if (u < 8) return {
    level: "Alto",
    color: "bg-orange-500 text-white",
    tip: "Limitar exposición; usar sombrero y EPP"
  };
  if (u < 11) return {
    level: "Muy alto",
    color: "bg-red-600 text-white",
    tip: "Evitar trabajos prolongados bajo el sol directo"
  };
  
  return {
    level: "Extremo",
    color: "bg-purple-700 text-white",
    tip: "Reprogramar tareas para áreas con sombra"
  };
}