import { describe, it, expect } from 'vitest';
import { statusColor, MAP_DEFAULTS, DEFAULT_USER_LOCATION, TILE_URL, OSRM_URL } from './mapConfig';

describe('statusColor', () => {
  it('mapeia lotação ALTO/MÉDIO/BAIXO para as cores corretas', () => {
    expect(statusColor('ALTO')).toBe('#EF4444');
    expect(statusColor('MÉDIO')).toBe('#F59E0B');
    expect(statusColor('BAIXO')).toBe('#10B981');
  });

  it('usa verde (BAIXO) como padrão para status desconhecido', () => {
    expect(statusColor('QUALQUER')).toBe('#10B981');
    expect(statusColor(undefined)).toBe('#10B981');
  });
});

describe('config do mapa', () => {
  it('centro padrão é Feira de Santana, BA', () => {
    expect(MAP_DEFAULTS.center[0]).toBeCloseTo(-12.27, 1);
    expect(MAP_DEFAULTS.center[1]).toBeCloseTo(-38.97, 1);
  });

  it('localização inicial do usuário é uma coordenada [lat, lng] válida', () => {
    expect(DEFAULT_USER_LOCATION).toHaveLength(2);
    expect(DEFAULT_USER_LOCATION[0]).toBeGreaterThan(-13);
    expect(DEFAULT_USER_LOCATION[0]).toBeLessThan(-12);
  });

  it('endpoints têm fallback definido', () => {
    expect(TILE_URL).toContain('{z}');
    expect(OSRM_URL).toMatch(/^https?:\/\//);
  });
});
