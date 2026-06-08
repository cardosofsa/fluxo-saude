import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHealthMap } from './useHealthMap';

// activeScreen fora da lista de telas com mapa → o efeito de init faz early-return
// e não tenta instanciar o Leaflet (que exigiria um container dimensionado).
const baseProps = (over = {}) => ({
  units: [{ id: 'mangabeira', name: 'UPA Mangabeira', status: 'BAIXO', waitMinutes: 15 }],
  userLocation: [-12.257, -38.951],
  activeScreen: 'welcome',
  selectedUnitId: 'mangabeira',
  setSelectedUnitId: vi.fn(),
  addLog: vi.fn(),
  ...over,
});

describe('useHealthMap', () => {
  it('estado inicial: sem unidade ativa e sem navegação', () => {
    const { result } = renderHook(() => useHealthMap(baseProps()));
    expect(result.current.wazeActiveUnit).toBeNull();
    expect(result.current.wazeNavigating).toBe(false);
    expect(result.current.wazeProgress).toBe(0);
  });

  it('handleUnitSelectFromList ativa a unidade e sincroniza a seleção', () => {
    const setSelectedUnitId = vi.fn();
    const { result } = renderHook(() => useHealthMap(baseProps({ setSelectedUnitId })));

    act(() => result.current.handleUnitSelectFromList('mangabeira'));

    expect(result.current.wazeActiveUnit).toBe('mangabeira');
    expect(setSelectedUnitId).toHaveBeenCalledWith('mangabeira');
  });

  it('ignora seleção de unidade sem coordenadas conhecidas', () => {
    const setSelectedUnitId = vi.fn();
    const { result } = renderHook(() => useHealthMap(baseProps({ setSelectedUnitId })));

    act(() => result.current.handleUnitSelectFromList('inexistente'));

    expect(result.current.wazeActiveUnit).toBeNull();
    expect(setSelectedUnitId).not.toHaveBeenCalled();
  });

  it('resetRoute limpa a unidade ativa, a navegação e registra log', () => {
    const addLog = vi.fn();
    const { result } = renderHook(() => useHealthMap(baseProps({ addLog })));

    act(() => result.current.handleUnitSelectFromList('mangabeira'));
    act(() => {
      result.current.setWazeNavigating(true);
      result.current.setWazeProgress(40);
    });
    expect(result.current.wazeNavigating).toBe(true);

    act(() => result.current.resetRoute());

    expect(result.current.wazeActiveUnit).toBeNull();
    expect(result.current.wazeNavigating).toBe(false);
    expect(result.current.wazeProgress).toBe(0);
    expect(result.current.wazeDistance).toBe('');
    expect(addLog).toHaveBeenCalledWith('[Mapa] Rota desativada.');
  });
});
