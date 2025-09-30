import { fetchJSONWithCache } from '../utils/cache';

const COUNTRY_DEFAULT = "CL";

// Regiones de Chile para ayudar en la búsqueda
export const CHILE_REGIONS = [
  "Arica y Parinacota", "Tarapacá", "Antofagasta", "Atacama", "Coquimbo",
  "Valparaíso", "Metropolitana", "O'Higgins", "Maule", "Ñuble", "Biobío",
  "La Araucanía", "Los Ríos", "Los Lagos", "Aysén", "Magallanes"
];

export interface LocationData {
  name: string;
  lat: number;
  lon: number;
  admin1?: string; // Región
  admin2?: string; // Comuna/Provincia
  population?: number;
}

export interface SearchResult extends LocationData {
  relevanceScore: number;
  type: 'city' | 'town' | 'village' | 'administrative';
}
export async function geocode(
  query: string,
  bust = false,
  signal?: AbortSignal
): Promise<LocationData> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=20&language=es&format=json`;
  
  const { json } = await fetchJSONWithCache(url, 86400 * 7, bust, { signal }); // 7 days cache
  
  if (!json?.results?.length) {
    throw new Error("Ubicación no encontrada. Ingrese una localidad cercana");
  }
  
  // Filtrar solo resultados de Chile
  const chileResults = json.results.filter((x: any) => x.country_code === COUNTRY_DEFAULT);
  
  if (!chileResults.length) {
    throw new Error("Ubicación no encontrada. Ingrese una localidad cercana");
  }
  
  // Ordenar resultados por relevancia (población, tipo de lugar, etc.)
  const sortedResults = chileResults.sort((a: any, b: any) => {
    // Priorizar ciudades sobre pueblos
    const aScore = (a.population || 0) + (a.feature_code === 'PPLA' ? 100000 : 0);
    const bScore = (b.population || 0) + (b.feature_code === 'PPLA' ? 100000 : 0);
    return bScore - aScore;
  });
  
  const result = sortedResults[0];
  
  const name = [result.name, result.admin1, result.country]
    .filter(Boolean)
    .join(", ");
    
  return {
    name,
    lat: +result.latitude,
    lon: +result.longitude,
    admin1: result.admin1,
    admin2: result.admin2,
    population: result.population
  };
}

export async function searchLocations(
  query: string,
  bust = false,
  signal?: AbortSignal
): Promise<SearchResult[]> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=20&language=es&format=json`;
  
  const { json } = await fetchJSONWithCache(url, 86400 * 7, bust, { signal });
  
  if (!json?.results?.length) {
    return [];
  }
  
  // Filtrar y procesar resultados de Chile
  const chileResults = json.results
    .filter((x: any) => x.country_code === COUNTRY_DEFAULT)
    .map((result: any) => {
      const name = [result.name, result.admin1].filter(Boolean).join(", ");
      
      // Calcular score de relevancia
      let relevanceScore = result.population || 0;
      if (result.feature_code === 'PPLA') relevanceScore += 100000; // Capital regional
      if (result.feature_code === 'PPLA2') relevanceScore += 50000; // Capital provincial
      if (result.feature_code === 'PPL') relevanceScore += 10000; // Ciudad
      
      // Determinar tipo
      let type: 'city' | 'town' | 'village' | 'administrative' = 'village';
      if (result.population > 100000) type = 'city';
      else if (result.population > 10000) type = 'town';
      else if (result.feature_code?.includes('ADM')) type = 'administrative';
      
      return {
        name,
        lat: +result.latitude,
        lon: +result.longitude,
        admin1: result.admin1,
        admin2: result.admin2,
        population: result.population,
        relevanceScore,
        type
      };
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 10);
  
  return chileResults;
}
export async function fetchForecast(
  lat: number,
  lon: number,
  bust = false,
  signal?: AbortSignal
) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    hourly: [
      "temperature_2m",
      "relative_humidity_2m",
      "precipitation",
      "precipitation_probability",
      "uv_index"
    ].join(","),
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "precipitation"
    ].join(","),
    past_days: "1",
    forecast_days: "5",
    daily: [
      "temperature_2m_min",
      "temperature_2m_max",
      "precipitation_sum",
      "precipitation_probability_max",
      "uv_index_max"
    ].join(","),
    timezone: "auto"
  });
  
  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
  return await fetchJSONWithCache(url, 600, bust, { signal }); // 10 min cache
}

export async function fetchObservations(
  lat: number,
  lon: number,
  bust = false,
  signal?: AbortSignal
) {
  const url = `https://api.open-meteo.com/v1/metar?latitude=${lat}&longitude=${lon}&count=1`;
  
  try {
    const { json } = await fetchJSONWithCache(url, 300, bust, { signal }); // 5 min cache
    return json?.data?.[0] || null;
  } catch {
    return null;
  }
}