// Contador de visitas usando CountAPI - servicio gratuito
const SESSION_KEY = "agroguard:session_visited";
const LOCAL_COUNTER_KEY = "agroguard:local_visits";

// CountAPI - Servicio gratuito de contadores
const COUNTAPI_BASE = "https://api.countapi.xyz";
const COUNTER_NAMESPACE = "agroguard-app";
const COUNTER_KEY = "global-visits";

// Función para incrementar contador global usando CountAPI
export async function incrementGlobalCounter(): Promise<number | null> {
  try {
    console.log('🔄 Incrementando contador global con CountAPI...');
    
    // Primero intentar crear el contador con valor inicial 500 (solo funciona si no existe)
    try {
      const createResponse = await fetch(
        `${COUNTAPI_BASE}/create?namespace=${COUNTER_NAMESPACE}&key=${COUNTER_KEY}&value=500`,
        { 
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        }
      );
      
      if (createResponse.ok) {
        const createData = await createResponse.json();
        console.log('🆕 Contador creado con valor inicial:', createData);
      }
    } catch (createError) {
      console.log('ℹ️ Contador ya existe o error al crear:', createError);
    }
    
    // Ahora incrementar el contador
    const hitResponse = await fetch(
      `${COUNTAPI_BASE}/hit/${COUNTER_NAMESPACE}/${COUNTER_KEY}`,
      { 
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      }
    );
    
    if (!hitResponse.ok) {
      throw new Error(`CountAPI hit error: ${hitResponse.status}`);
    }
    
    const hitData = await hitResponse.json();
    console.log('📊 Respuesta de CountAPI:', hitData);
    
    if (hitData && typeof hitData.value === 'number') {
      console.log(`✅ Contador global incrementado a: ${hitData.value}`);
      return hitData.value;
    } else {
      throw new Error('Respuesta inválida de CountAPI');
    }
  } catch (error) {
    console.error('❌ Error con CountAPI:', error);
    return null;
  }
}

// Función para obtener contador global sin incrementar
export async function getGlobalCounter(): Promise<number | null> {
  try {
    console.log('📊 Obteniendo contador global de CountAPI...');
    
    const response = await fetch(
      `${COUNTAPI_BASE}/get/${COUNTER_NAMESPACE}/${COUNTER_KEY}`,
      { 
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      }
    );
    
    if (!response.ok) {
      throw new Error(`CountAPI get error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📊 Respuesta de obtener contador:', data);
    
    if (data && typeof data.value === 'number') {
      console.log(`📊 Contador global actual: ${data.value}`);
      return data.value;
    } else {
      throw new Error('Respuesta inválida de CountAPI');
    }
  } catch (error) {
    console.error('❌ Error al obtener contador de CountAPI:', error);
    return null;
  }
}

// Contador local (por dispositivo)
export function incrementLocalCounter(): number {
  try {
    // Verificar si ya se contó una visita en esta sesión
    const hasVisitedThisSession = sessionStorage.getItem(SESSION_KEY);
    
    if (!hasVisitedThisSession) {
      // Nueva sesión: incrementar contador local
      const currentCount = getLocalCount();
      const newCount = currentCount + 1;
      
      localStorage.setItem(LOCAL_COUNTER_KEY, newCount.toString());
      sessionStorage.setItem(SESSION_KEY, "true");
      
      console.log(`📱 Contador local incrementado a: ${newCount}`);
      return newCount;
    }
    
    // Si ya visitó en esta sesión, devolver el contador actual
    const currentCount = getLocalCount();
    console.log(`📱 Misma sesión, contador local: ${currentCount}`);
    return currentCount;
  } catch (error) {
    console.error('❌ Error con contador local:', error);
    return 1;
  }
}

export function getLocalCount(): number {
  try {
    const count = localStorage.getItem(LOCAL_COUNTER_KEY);
    return count ? parseInt(count, 10) || 1 : 1;
  } catch {
    return 1;
  }
}

// Función para formatear números
export function formatVisitCount(count: number): string {
  if (count < 1000) {
    return count.toString();
  } else if (count < 1000000) {
    return `${(count / 1000).toFixed(1)}k`;
  } else {
    return `${(count / 1000000).toFixed(1)}M`;
  }
}

// Función de fallback si CountAPI falla completamente
export function getFallbackGlobalCount(): number {
  const fallbackKey = 'agroguard:global_fallback';
  try {
    let fallbackCount = parseInt(localStorage.getItem(fallbackKey) || '500');
    
    // Verificar si es una nueva sesión para incrementar fallback
    const hasVisitedThisSession = sessionStorage.getItem(SESSION_KEY);
    if (!hasVisitedThisSession) {
      fallbackCount += 1;
      localStorage.setItem(fallbackKey, fallbackCount.toString());
      console.log(`⚠️ Fallback incrementado a: ${fallbackCount}`);
    }
    
    return fallbackCount;
  } catch {
    return 500;
  }
}