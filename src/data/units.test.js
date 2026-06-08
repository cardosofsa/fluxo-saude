import { describe, it, expect } from 'vitest';
import { INITIAL_UNITS, REAL_COORDS, INITIAL_BEDS, INITIAL_HANDOVERS } from './units';

describe('integridade dos dados de unidades', () => {
  it('tem IDs únicos', () => {
    const ids = INITIAL_UNITS.map((u) => u.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('toda unidade tem coordenadas reais correspondentes', () => {
    INITIAL_UNITS.forEach((u) => {
      expect(REAL_COORDS[u.id], `faltam coords para ${u.id}`).toBeDefined();
      const [lat, lng] = REAL_COORDS[u.id];
      // dentro da região de Feira de Santana, BA
      expect(lat).toBeGreaterThan(-12.5);
      expect(lat).toBeLessThan(-12.0);
      expect(lng).toBeGreaterThan(-39.1);
      expect(lng).toBeLessThan(-38.7);
    });
  });

  it('status é sempre um valor conhecido', () => {
    const valid = new Set(['ALTO', 'MÉDIO', 'BAIXO']);
    INITIAL_UNITS.forEach((u) => expect(valid.has(u.status)).toBe(true));
  });

  it('tipo é UPA ou Policlínica', () => {
    INITIAL_UNITS.forEach((u) => expect(['UPA', 'Policlínica']).toContain(u.type));
  });
});

describe('integridade dos leitos e plantões', () => {
  it('leitos têm IDs únicos e status válido', () => {
    const ids = INITIAL_BEDS.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    const valid = new Set(['free', 'observation', 'critical']);
    INITIAL_BEDS.forEach((b) => expect(valid.has(b.status)).toBe(true));
  });

  it('passagens de plantão referenciam um leito existente', () => {
    const bedLabels = new Set(INITIAL_BEDS.map((b) => b.label));
    INITIAL_HANDOVERS.forEach((h) => expect(bedLabels.has(h.bedLabel)).toBe(true));
  });
});
