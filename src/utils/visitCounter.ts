// Contador de visitas persistente usando CountAPI
const VISIT_COUNTER_KEY = "agroguard:visit_counter";
const SESSION_KEY = "agroguard:session_visited";

// CountAPI - Servicio gratuito de contadores
const COUNTAPI_BASE = "https://api.countapi.xyz";
const COUNTER_NAMESPACE = "agroguard";
const COUNTER_KEY = "total-visits";

// Contador global usando CountAPI - INCREMENTA CON CADA VISITA
export async function incrementGlobalCounter(): Promise<number | null> {
  try {
    console.log('🆕 Incrementando contador global con CountAPI...');
    
    // Usar CountAPI para incrementar el contador
    const response = await fetch(`${COUNTAPI_BASE}/hit/${COUNTER_NAMESPACE}/${COUNTER_KEY}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`CountAPI error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && typeof data.value === 'number') {
      console.log(`✅ Contador global incrementado a: ${data.value}`);
      return data.value;
    } else {
      throw new Error('Invalid response from CountAPI');
    }
  } catch (error) {
    console.error('❌ Error con CountAPI:', error);
    
    // Fallback: usar localStorage para simular contador global
    const fallbackKey = 'agroguard:global_fallback';
    try {
      let fallbackCount = parseInt(localStorage.getItem(fallbackKey) || '500');
      fallbackCount += 1;
      localStorage.setItem(fallbackKey, fallbackCount.toString());
      console.log(`⚠️ Usando fallback: contador = ${fallbackCount}`);
      return fallbackCount;
    } catch {
      console.error('❌ Fallback también falló');
      return 500;
    }
  }
}

export async function getGlobalCounter(): Promise<number | null> {
  try {
    console.log('📊 Obteniendo contador global de CountAPI...');
    
    const response = await fetch(`${COUNTAPI_BASE}/get/${COUNTER_NAMESPACE}/${COUNTER_KEY}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`CountAPI error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && typeof data.value === 'number') {
      console.log(`📊 Contador global obtenido: ${data.value}`);
      return data.value;
    } else {
      throw new Error('Invalid response from CountAPI');
    }
  } catch (error) {
    console.error('❌ Error al obtener contador de CountAPI:', error);
    
    // Fallback: usar localStorage
    const fallbackKey = 'agroguard:global_fallback';
    try {
      const fallbackCount = parseInt(localStorage.getItem(fallbackKey) || '500');
      console.log(`⚠️ Usando fallback para obtener: ${fallbackCount}`);
      return fallbackCount;
    } catch {
      console.error('❌ Fallback de obtención también falló');
      return 500;
    }
  }
}

// Inicializar contador en CountAPI con valor inicial de 500
export async function initializeGlobalCounter(): Promise<void> {
  try {
    console.log('🔧 Inicializando contador en CountAPI...');
    
    // Crear/configurar el contador con valor inicial de 500
    const response = await fetch(`${COUNTAPI_BASE}/create?namespace=${COUNTER_NAMESPACE}&key=${COUNTER_KEY}&value=500`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Contador inicializado:', data);
    } else {
      console.log('ℹ️ Contador ya existe o error al inicializar');
    }
  } catch (error) {
    console.log('ℹ️ No se pudo inicializar contador:', error);
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