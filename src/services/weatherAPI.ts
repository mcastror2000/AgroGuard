import { fetchJSONWithCache } from '../utils/cache';

const COUNTRY_DEFAULT = "CL";

export interface LocationData {
  name: string;
  lat: number;
  lon: number;
}

export async function geocode(
  query: string,
  bust = false,
  signal?: AbortSignal
): Promise<LocationData> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=es&format=json`;
  
  const { json } = await fetchJSONWithCache(url, 86400 * 7, bust, { signal }); // 7 days cache
  
  if (!json?.results?.length) {
    throw new Error("Ubicación no encontrada. Ingrese una localidad cercana");
  }
  
  // Filtrar solo resultados de Chile
  const chileResults = json.results.filter((x: any) => x.country_code === COUNTRY_DEFAULT);
  
  if (!chileResults.length) {
    throw new Error("Ubicación no encontrada. Ingrese una localidad cercana");
  }
  
  // Tomar el primer resultado chileno
  const result = chileResults[0];
  
  const name = [result.name, result.admin1, result.country]
    .filter(Boolean)
    .join(", ");
    
  return {
    name,
    lat: +result.latitude,
    lon: +result.longitude
  };
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