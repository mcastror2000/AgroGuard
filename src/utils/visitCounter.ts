// Contador de visitas persistente
const VISIT_COUNTER_KEY = "agroguard:visit_counter";
const SESSION_KEY = "agroguard:session_id";

export function incrementVisitCounter(): number {
  try {
    // Generar ID de sesión único para evitar contar múltiples veces en la misma sesión
    const currentSessionId = generateSessionId();
    const lastSessionId = localStorage.getItem(SESSION_KEY);
    
    // Solo incrementar si es una nueva sesión
    if (currentSessionId !== lastSessionId) {
      const currentCount = getVisitCount();
      const newCount = currentCount + 1;
      
      localStorage.setItem(VISIT_COUNTER_KEY, newCount.toString());
      localStorage.setItem(SESSION_KEY, currentSessionId);
      
      return newCount;
    }
    
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

function generateSessionId(): string {
  // Generar ID basado en timestamp y random para identificar sesiones únicas
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  return `${timestamp}-${random}`;
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