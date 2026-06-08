import { OSRM_URL } from '../config/mapConfig';

/**
 * Calcula uma rota de carro entre dois pontos usando OSRM.
 * Coordenadas de entrada e saída no formato Leaflet: [lat, lng].
 *
 * Em produção, troque o endpoint (VITE_OSRM_URL) por um OSRM próprio
 * ou um provedor com SLA — o servidor demo não permite uso real.
 *
 * @returns {Promise<{coords: [number, number][], distanceText: string, durationText: string, distance: number, duration: number}>}
 */
export async function fetchRoute(start, end, { signal } = {}) {
  const url =
    `${OSRM_URL}/route/v1/driving/` +
    `${start[1]},${start[0]};${end[1]},${end[0]}` +
    `?overview=full&geometries=geojson`;

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`OSRM respondeu ${res.status}`);

  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) throw new Error('Nenhuma rota encontrada');

  return {
    // GeoJSON vem como [lng, lat]; convertemos para [lat, lng] do Leaflet.
    coords: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    distanceText: `${(route.distance / 1000).toFixed(1)} km`,
    durationText: `${Math.round(route.duration / 60)} min`,
    distance: route.distance,
    duration: route.duration,
  };
}
