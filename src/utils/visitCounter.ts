// Contador de visitas persistente
const VISIT_COUNTER_KEY = "agroguard:visit_counter";
const SESSION_KEY = "agroguard:session_visited";

export function incrementVisitCounter(): number {
  try {
    // Verificar si ya se contó una visita en esta sesión
    const hasVisitedThisSession = sessionStorage.getItem(SESSION_KEY);
    
    // Solo incrementar si no se ha visitado en esta sesión
    if (!hasVisitedThisSession) {
      const currentCount = getVisitCount();
      const newCount = currentCount + 1;
      
      localStorage.setItem(VISIT_COUNTER_KEY, newCount.toString());
      sessionStorage.setItem(SESSION_KEY, "true");
      
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