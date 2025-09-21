// Contador de visitas persistente
const VISIT_COUNTER_KEY = "agroguard:visit_counter";
const SESSION_KEY = "agroguard:session_visited";
const DEVICE_ID_KEY = "agroguard:device_id";
const GLOBAL_COUNTER_URL = "https://api.countapi.xyz/hit/agroguard-app/visits";
const GLOBAL_COUNTER_GET_URL = "https://api.countapi.xyz/get/agroguard-app/visits";

// Generar un ID único para este dispositivo/navegador
function getOrCreateDeviceId(): string {
  try {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = 'dev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  } catch {
    return 'dev_unknown';
  }
}

// Contador global usando servicio gratuito
export async function incrementGlobalCounter(): Promise<number | null> {
  try {
    const response = await fetch(GLOBAL_COUNTER_URL);
    if (!response.ok) throw new Error('Network error');
    
    const data = await response.json();
    return data.value || null;
  } catch (error) {
    console.warn('No se pudo actualizar el contador global:', error);
    return null;
  }
}

export async function getGlobalCounter(): Promise<number | null> {
  try {
    const response = await fetch(GLOBAL_COUNTER_GET_URL);
    if (!response.ok) throw new Error('Network error');
    
    const data = await response.json();
    return data.value || null;
  } catch (error) {
    console.warn('No se pudo obtener el contador global:', error);
    return null;
  }
}

export function incrementVisitCounter(): number {
  try {
    // Verificar si ya se contó una visita en esta sesión del navegador
    const hasVisitedThisSession = sessionStorage.getItem(SESSION_KEY);
    
    // Solo incrementar el contador local si no se ha visitado en esta sesión
    if (!hasVisitedThisSession) {
      const currentCount = getVisitCount();
      const newCount = currentCount + 1;
      
      localStorage.setItem(VISIT_COUNTER_KEY, newCount.toString());
      sessionStorage.setItem(SESSION_KEY, "true");
      
      return newCount;
    }
    
    // Si ya visitó en esta sesión, devolver el contador actual sin incrementar
    return getVisitCount();
  } catch {
    return 1;
  }
}

export function getVisitCount(): number {
  try {
    const count = localStorage.getItem(VISIT_COUNTER_KEY);
    return count ? parseInt(count, 10) || 1 : 1;
  } catch {
    return 1;
  }
}


// Función para formatear el número de visitas
export function formatVisitCount(count: number): string {
  if (count < 1000) {
    return count.toString();
  } else if (count < 1000000) {
    return `${(count / 1000).toFixed(1)}k`;
  } else {
    return `${(count / 1000000).toFixed(1)}M`;
  }
}