import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchRoute } from './routing';

describe('fetchRoute (OSRM)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const okResponse = (route) => ({
    ok: true,
    json: async () => ({ routes: route ? [route] : [] }),
  });

  it('monta a URL no formato lng,lat;lng,lat (ordem do OSRM)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      okResponse({
        distance: 1000,
        duration: 600,
        geometry: { coordinates: [[-38.9, -12.2]] },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    // entrada em [lat, lng]
    await fetchRoute([-12.25, -38.95], [-12.27, -38.94]);

    const calledUrl = fetchMock.mock.calls[0][0];
    // start: lng,lat = -38.95,-12.25  | end: -38.94,-12.27
    expect(calledUrl).toContain('/driving/-38.95,-12.25;-38.94,-12.27');
    expect(calledUrl).toContain('geometries=geojson');
  });

  it('converte coordenadas GeoJSON [lng,lat] -> [lat,lng] do Leaflet', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        okResponse({
          distance: 2500,
          duration: 300,
          geometry: { coordinates: [[-38.9663, -12.2664], [-38.94, -12.27]] },
        })
      )
    );

    const result = await fetchRoute([-12.25, -38.95], [-12.27, -38.94]);

    expect(result.coords).toEqual([
      [-12.2664, -38.9663],
      [-12.27, -38.94],
    ]);
  });

  it('formata distância (km) e duração (min)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        okResponse({
          distance: 5400, // 5.4 km
          duration: 540, // 9 min
          geometry: { coordinates: [[0, 0]] },
        })
      )
    );

    const result = await fetchRoute([0, 0], [1, 1]);
    expect(result.distanceText).toBe('5.4 km');
    expect(result.durationText).toBe('9 min');
    expect(result.distance).toBe(5400);
  });

  it('lança erro quando o OSRM não retorna rota', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse(null)));
    await expect(fetchRoute([0, 0], [1, 1])).rejects.toThrow('Nenhuma rota encontrada');
  });

  it('lança erro em resposta HTTP não-ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    await expect(fetchRoute([0, 0], [1, 1])).rejects.toThrow('503');
  });
});
