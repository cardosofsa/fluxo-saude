import { OSRM_URL } from '../config/mapConfig';

/**
 * Rota de carro entre dois pontos (OSRM). Entrada/saída em [lat, lng].
 */
export async function fetchRoute(start, end) {
  const url =
    `${OSRM_URL}/route/v1/driving/` +
    `${start[1]},${start[0]};${end[1]},${end[0]}` +
    `?overview=full&geometries=geojson`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM respondeu ${res.status}`);
  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) throw new Error('Nenhuma rota encontrada');

  return {
    coords: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    distanceText: `${(route.distance / 1000).toFixed(1)} km`,
    durationText: `${Math.round(route.duration / 60)} min`,
    distance: route.distance,
    duration: route.duration,
  };
}
