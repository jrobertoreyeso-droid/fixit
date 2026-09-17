/**
 * Calcula la distancia en kilómetros entre 2 puntos geográficos
 * usando la fórmula de Haversine.
 * 
 * @param {Object} punto1 - { lat, lng }
 * @param {Object} punto2 - { lat, lng }
 * @returns {number} Distancia en km
 */
export function calcularDistancia(punto1, punto2) {
  if (!punto1 || !punto2) return null;
  if (typeof punto1.lat !== 'number' || typeof punto2.lat !== 'number') return null;

  const R = 6371; // Radio de la Tierra en km
  const dLat = toRad(punto2.lat - punto1.lat);
  const dLng = toRad(punto2.lng - punto1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(punto1.lat)) *
    Math.cos(toRad(punto2.lat)) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distancia = R * c;

  return distancia;
}

function toRad(grados) {
  return grados * (Math.PI / 180);
}

/**
 * Formatea la distancia para mostrar al usuario.
 * Ej: 2.3 → "2.3 km" | 0.5 → "500 m"
 */
export function formatearDistancia(km) {
  if (km == null) return '';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

/**
 * Ordena un array de solicitudes por distancia desde una ubicación dada.
 * Las solicitudes sin ubicación se van al final.
 */
export function ordenarPorDistancia(solicitudes, ubicacionTecnico) {
  if (!ubicacionTecnico) return solicitudes;

  return [...solicitudes].sort((a, b) => {
    const distA = calcularDistancia(ubicacionTecnico, a.ubicacion);
    const distB = calcularDistancia(ubicacionTecnico, b.ubicacion);

    if (distA == null) return 1;
    if (distB == null) return -1;

    return distA - distB;
  });
}

/**
 * Filtra solicitudes dentro de un radio máximo (km).
 */
export function filtrarPorRadio(solicitudes, ubicacionTecnico, radioKm = 20) {
  if (!ubicacionTecnico) return solicitudes;

  return solicitudes.filter(sol => {
    const dist = calcularDistancia(ubicacionTecnico, sol.ubicacion);
    if (dist == null) return true; // sin ubicación → la dejamos pasar
    return dist <= radioKm;
  });
}