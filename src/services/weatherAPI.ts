import { fetchJSONWithCache } from '../utils/cache';

const COUNTRY_DEFAULT = "CL";

// Regiones de Chile para ayudar en la búsqueda
export const CHILE_REGIONS = [
  "Arica y Parinacota", "Tarapacá", "Antofagasta", "Atacama", "Coquimbo",
  "Valparaíso", "Metropolitana", "O'Higgins", "Maule", "Ñuble", "Biobío",
  "La Araucanía", "Los Ríos", "Los Lagos", "Aysén", "Magallanes"
];

// Ciudades principales de Chile con mejor cobertura meteorológica
const MAJOR_CITIES = [
  "Santiago", "Valparaíso", "Concepción", "La Serena", "Antofagasta",
  "Temuco", "Rancagua", "Talca", "Arica", "Iquique", "Copiapó",
  "Ovalle", "Quillota", "Curicó", "Chillán", "Los Ángeles", "Osorno",
  "Valdivia", "Puerto Montt", "Coyhaique", "Punta Arenas"
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
  // Crear variaciones de búsqueda más inteligentes
  const searchVariations = [
    query.trim(),
    query.replace(/región\s+/gi, '').trim(), // "Región Metropolitana" -> "Metropolitana"
    query.replace(/\s+región$/gi, '').trim(), // "Metropolitana Región" -> "Metropolitana"
    query.split(',')[0].trim(), // Tomar solo la primera parte si hay comas
    query.replace(/\s+/g, '+').trim() // Reemplazar espacios con +
  ].filter((v, i, arr) => arr.indexOf(v) === i && v.length >= 2); // Eliminar duplicados y muy cortos
  
  let bestResult = null;
  let allResults: any[] = [];
  
  // Intentar cada variación hasta encontrar resultados
  for (const variation of searchVariations) {
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(variation)}&count=20&language=es&format=json`;
      const { json } = await fetchJSONWithCache(url, 86400 * 7, bust, { signal });
      
      if (json?.results?.length) {
        const chileResults = json.results.filter((x: any) => x.country_code === COUNTRY_DEFAULT);
        if (chileResults.length) {
          allResults = [...allResults, ...chileResults];
          if (!bestResult) bestResult = chileResults[0];
        }
      }
    } catch (error) {
      // Continuar con la siguiente variación
      continue;
    }
  }
  
  // Si no encontramos nada, intentar búsquedas de fallback
  if (!allResults.length) {
    const fallbackSearches = [
      'Santiago', // Fallback principal
      'Valparaíso', // Segundo fallback
      query.split(' ')[0] // Primera palabra del query
    ];
    
    for (const fallback of fallbackSearches) {
      if (fallback.length < 2) continue;
      
      try {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(fallback)}&count=10&language=es&format=json`;
        const { json } = await fetchJSONWithCache(url, 86400 * 7, bust, { signal });
        
        if (json?.results?.length) {
          const chileResults = json.results.filter((x: any) => x.country_code === COUNTRY_DEFAULT);
          if (chileResults.length) {
            allResults = chileResults;
            bestResult = chileResults[0];
            break;
          }
        }
      } catch {
        continue;
      }
    }
  }
  
  if (!allResults.length) {
    throw new Error(`No se encontraron datos meteorológicos para "${query}". La base de datos meteorológica tiene cobertura limitada. Intenta con ciudades principales como "Santiago", "Valparaíso", "Concepción" o "Temuco".`);
  }
  
  // Ordenar resultados por relevancia (población, tipo de lugar, etc.)
  const sortedResults = allResults.sort((a: any, b: any) => {
    // Priorizar ciudades sobre pueblos
    const aScore = (a.population || 0) + (a.feature_code === 'PPLA' ? 100000 : 0);
    const bScore = (b.population || 0) + (b.feature_code === 'PPLA' ? 100000 : 0);
    return bScore - aScore;
  });
  
  const result = bestResult || sortedResults[0];
  
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
  if (query.length < 2) return [];
  
  // Crear variaciones de búsqueda más inteligentes
  const searchVariations = [
    query.trim(),
    query.replace(/región\s+/gi, '').trim(),
    query.replace(/\s+región$/gi, '').trim(),
    query.split(',')[0].trim()
  ].filter((v, i, arr) => arr.indexOf(v) === i && v.length >= 2);
  
  let allResults: any[] = [];
  
  // Intentar cada variación
  for (const variation of searchVariations) {
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(variation)}&count=15&language=es&format=json`;
      const { json } = await fetchJSONWithCache(url, 86400 * 7, bust, { signal });
      
      if (json?.results?.length) {
        const chileResults = json.results.filter((x: any) => x.country_code === COUNTRY_DEFAULT);
        allResults = [...allResults, ...chileResults];
      }
    } catch {
      continue;
    }
  }
  
  // Eliminar duplicados y procesar resultados
  const uniqueResults = allResults.filter((result, index, arr) => 
    arr.findIndex(r => r.latitude === result.latitude && r.longitude === result.longitude) === index
  );
  
  const processedResults = uniqueResults
    .map((result: any) => {
      const name = [result.name, result.admin1].filter(Boolean).join(", ");
      
      // Calcular score de relevancia mejorado
      let relevanceScore = result.population || 0;
      
      // Bonus por tipo de lugar
      if (result.feature_code === 'PPLA') relevanceScore += 100000; // Capital regional
      if (result.feature_code === 'PPLA2') relevanceScore += 50000; // Capital provincial  
      if (result.feature_code === 'PPL') relevanceScore += 10000; // Ciudad
      
      // Bonus por coincidencia exacta o parcial con el query
      const queryLower = query.toLowerCase();
      const nameLower = result.name.toLowerCase();
      if (nameLower === queryLower) relevanceScore += 50000;
      else if (nameLower.includes(queryLower)) relevanceScore += 25000;
      else if (queryLower.includes(nameLower)) relevanceScore += 15000;
      
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
    .slice(0, 8);
  
  return processedResults;
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