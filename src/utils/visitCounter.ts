// Contador de visitas persistente
const VISIT_COUNTER_KEY = "agroguard:visit_counter";
const SESSION_KEY = "agroguard:session_visited";
const DEVICE_ID_KEY = "agroguard:device_id";

// Usando Firebase Realtime Database público (sin autenticación)
const FIREBASE_URL = "https://agroguard-counter-default-rtdb.firebaseio.com";

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

// Contador global usando Firebase - INCREMENTA CON CADA VISITA
export async function incrementGlobalCounter(): Promise<number | null> {
  try {
    // Primero obtenemos el contador actual
    const getResponse = await fetch(`${FIREBASE_URL}/counter.json`);
    let currentCount = 500; // Empezar desde 500 si no existe
    
    if (getResponse.ok) {
      const data = await getResponse.json();
      currentCount = data?.count || 500;
    }
    
    // Incrementamos el contador
    const newCount = currentCount + 1;
    
    // Actualizamos el contador
    const updateResponse = await fetch(`${FIREBASE_URL}/counter.json`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        count: newCount,
        lastUpdated: new Date().toISOString(),
        lastDevice: getOrCreateDeviceId()
      })
    });
    
    if (updateResponse.ok) {
      return newCount;
    }
    throw new Error('Update failed');
  } catch (error) {
    console.warn('No se pudo actualizar el contador global:', error);
    
    // Fallback: usar localStorage para simular contador global
    const fallbackKey = 'agroguard:global_fallback';
    try {
      let fallbackCount = parseInt(localStorage.getItem(fallbackKey) || '500');
      fallbackCount += 1;
      localStorage.setItem(fallbackKey, fallbackCount.toString());
      return fallbackCount;
    } catch {
      return 500;
    }
  }
}

export async function getGlobalCounter(): Promise<number | null> {
  try {
    const response = await fetch(`${FIREBASE_URL}/counter.json`);
    if (!response.ok) throw new Error('Network error');
    
    const data = await response.json();
    return data?.count || 500;
  } catch (error) {
    console.warn('No se pudo obtener el contador global:', error);
    
    // Fallback: usar localStorage
    const fallbackKey = 'agroguard:global_fallback';
    try {
      return parseInt(localStorage.getItem(fallbackKey) || '500');
    } catch {
      return 500;
    }
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