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
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=es&format=json&country_code=${COUNTRY_DEFAULT}`;
  
  const { json } = await fetchJSONWithCache(url, 86400 * 7, bust, { signal }); // 7 days cache
  
  if (!json?.results?.length) {
    throw new Error("No se encontró la ubicación en Chile");
  }
  
  const result = json.results.find((x: any) => x.country_code === COUNTRY_DEFAULT) || json.results[0];
  
  if (!result) {
    throw new Error("Solo se permiten ubicaciones en Chile");
  }
  
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