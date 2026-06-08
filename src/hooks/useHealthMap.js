import { useState, useRef, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MAP_DEFAULTS,
  TILE_URL,
  TILE_ATTRIBUTION,
  TILE_OPTIONS,
  statusColor,
} from '../config/mapConfig';
import { fetchRoute } from '../services/routing';
import { REAL_COORDS } from '../data/units';

const MAP_SCREENS = ['patient_map', 'patient_unit_details'];
const CONTAINER_ID = {
  patient_map: 'full-leaflet-waze-map',
  patient_unit_details: 'details-leaflet-map',
};

/**
 * Encapsula todo o mapa Leaflet do Fluxo Saúde: inicialização por tela,
 * marcadores (usuário + unidades), cálculo de rota (OSRM) e navegação
 * turn-by-turn. Mantém os refs internos — o componente só consome estado.
 */
export function useHealthMap({ units, userLocation, activeScreen, selectedUnitId, setSelectedUnitId, addLog }) {
  const mapRef = useRef(null);
  const routeLineRef = useRef(null);
  const carMarkerRef = useRef(null);
  const markersRef = useRef({});
  const userMarkerRef = useRef(null);
  const hasCenteredRef = useRef(false);
  const hasCenteredGPSRef = useRef(false);

  const [wazeActiveUnit, setWazeActiveUnit] = useState(null);
  const [wazeNavigating, setWazeNavigating] = useState(false);
  const [wazeProgress, setWazeProgress] = useState(0);
  const [wazeInstruction, setWazeInstruction] = useState(
    'Selecione uma unidade no mapa ou lista para iniciar a rota'
  );
  const [wazeRouteCoords, setWazeRouteCoords] = useState([]);
  const [wazeDistance, setWazeDistance] = useState('');
  const [wazeDuration, setWazeDuration] = useState('');
  // Vira true quando a instância Leaflet existe; dispara o desenho de
  // marcadores/rota (que de outra forma rodariam antes do mapa existir).
  const [mapReady, setMapReady] = useState(false);

  // Unidade-alvo da rota: na tela de detalhes é a selecionada; senão, a ativa no mapa.
  const routingUnitId =
    activeScreen === 'patient_unit_details' ? selectedUnitId : wazeActiveUnit;

  const clearRoute = () => {
    if (routeLineRef.current && mapRef.current) {
      try { mapRef.current.removeLayer(routeLineRef.current); } catch { /* noop */ }
    }
    routeLineRef.current = null;
  };

  const clearCar = () => {
    if (carMarkerRef.current && mapRef.current) {
      try { mapRef.current.removeLayer(carMarkerRef.current); } catch { /* noop */ }
    }
    carMarkerRef.current = null;
  };

  // Limpa a rota ativa e zera o estado de navegação (usado pelo botão "X").
  const resetRoute = () => {
    setWazeActiveUnit(null);
    setWazeNavigating(false);
    setWazeProgress(0);
    setWazeRouteCoords([]);
    setWazeDistance('');
    setWazeDuration('');
    setWazeInstruction('Selecione uma unidade no mapa ou lista para iniciar a rota');
    clearRoute();
    clearCar();
    addLog('[Mapa] Rota desativada.');
  };

  // Busca a rota via OSRM e desenha a polyline no mapa Leaflet.
  const drawRoute = async (startCoords, endCoords, unitId) => {
    const unitName = units.find((u) => u.id === unitId)?.name || 'destino';
    try {
      addLog(`[Rota] Calculando trajeto até ${unitName}...`);
      const { coords, distanceText, durationText } = await fetchRoute(startCoords, endCoords);

      setWazeRouteCoords(coords);
      setWazeDistance(distanceText);
      setWazeDuration(durationText);
      setWazeInstruction('Toque em INICIAR ROTA para começar 🚀');
      addLog(`[Rota] ${unitName}: ${distanceText} • ${durationText}.`);

      if (!mapRef.current) return;
      clearRoute();
      const polyline = L.polyline(coords, { color: '#22D3EE', weight: 6, opacity: 0.85 }).addTo(mapRef.current);
      routeLineRef.current = polyline;
      mapRef.current.fitBounds(polyline.getBounds(), { padding: [40, 40] });
    } catch (err) {
      console.error('Falha ao calcular rota OSRM:', err);
      addLog(`[Rota] Não foi possível calcular o trajeto até ${unitName}.`);
      const straight = [startCoords, endCoords];
      setWazeRouteCoords(straight);
      setWazeDistance('—');
      setWazeDuration('—');
      if (mapRef.current) {
        clearRoute();
        routeLineRef.current = L.polyline(straight, {
          color: '#22D3EE',
          weight: 4,
          opacity: 0.6,
          dashArray: '6 8',
        }).addTo(mapRef.current);
      }
    }
  };

  // Seleção de unidade pela lista (sincroniza mapa + rota).
  const handleUnitSelectFromList = (unitId) => {
    const targetCoords = REAL_COORDS[unitId];
    if (!targetCoords) return;
    setWazeActiveUnit(unitId);
    setSelectedUnitId(unitId);
    if (mapRef.current) {
      mapRef.current.panTo(targetCoords);
      mapRef.current.setZoom(MAP_DEFAULTS.followZoom);
    }
  };

  // Navegação turn-by-turn (move o carro ao longo da rota calculada).
  useEffect(() => {
    if (!(wazeNavigating && wazeActiveUnit && wazeRouteCoords.length > 0)) return;
    const timer = setInterval(() => {
      setWazeProgress((prev) => {
        const next = prev + 4;
        const lastIndex = wazeRouteCoords.length - 1;
        const coordIndex = Math.min(lastIndex, Math.floor((next / 100) * wazeRouteCoords.length));
        const currentCoord = wazeRouteCoords[Math.max(0, coordIndex)];

        if (mapRef.current && currentCoord) {
          if (carMarkerRef.current) {
            carMarkerRef.current.setLatLng(currentCoord);
          } else {
            const carIcon = L.divIcon({
              className: 'waze-car-icon',
              html: '<div class="waze-car-inner"></div>',
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            });
            carMarkerRef.current = L.marker(currentCoord, { icon: carIcon }).addTo(mapRef.current);
          }
          mapRef.current.panTo(currentCoord);
        }

        if (next >= 100) {
          clearInterval(timer);
          setWazeInstruction('Você chegou ao seu destino! 🏁');
          addLog(`[Rota] Trajeto concluído até ${units.find((u) => u.id === wazeActiveUnit)?.name}.`);
          return 100;
        }

        if (next < 25) setWazeInstruction('Siga em frente na via principal ⬆️');
        else if (next < 50) setWazeInstruction('Em 150m, mantenha-se à esquerda ⬅️');
        else if (next < 75) setWazeInstruction('Siga na faixa da direita, trânsito livre 🟢');
        else setWazeInstruction('Chegando! Entre pelo acesso de emergência ➡️');
        return next;
      });
    }, 500);
    return () => clearInterval(timer);
  }, [wazeNavigating, wazeActiveUnit, wazeRouteCoords, units, addLog]);

  // Inicializa o mapa Leaflet na tela ativa (uma instância por vez).
  useEffect(() => {
    if (!MAP_SCREENS.includes(activeScreen)) return;
    const mapContainerId = CONTAINER_ID[activeScreen];

    const timer = setTimeout(() => {
      const container = document.getElementById(mapContainerId);
      if (!container) return;

      if (mapRef.current) {
        try { mapRef.current.remove(); } catch { /* noop */ }
      }
      mapRef.current = null;
      routeLineRef.current = null;
      carMarkerRef.current = null;
      userMarkerRef.current = null;

      const map = L.map(mapContainerId, {
        zoomControl: false,
        attributionControl: false,
        doubleClickZoom: false,
      }).setView(userLocation, MAP_DEFAULTS.zoom);
      L.tileLayer(TILE_URL, TILE_OPTIONS).addTo(map);
      mapRef.current = map;
      hasCenteredRef.current = false;
      // O container pode ainda não ter o tamanho final no momento da init
      // (troca de tela/layout). Recalcula as dimensões antes de desenhar.
      requestAnimationFrame(() => {
        try { map.invalidateSize(); } catch { /* noop */ }
      });
      setMapReady(true);
      addLog(`[Mapa] Leaflet inicializado (${activeScreen.replace('patient_', '')}).`);
    }, 200);

    return () => {
      clearTimeout(timer);
      setMapReady(false);
      if (mapRef.current) {
        try { mapRef.current.remove(); } catch { /* noop */ }
      }
      mapRef.current = null;
      routeLineRef.current = null;
      carMarkerRef.current = null;
      userMarkerRef.current = null;
      hasCenteredRef.current = false;
      hasCenteredGPSRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeScreen]);

  // Redesenha usuário e pinos das unidades quando algo muda.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || typeof map.addLayer !== 'function') return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(userLocation);
    } else {
      const userIcon = L.divIcon({
        className: 'waze-user-icon',
        html: '<div class="pulse-user-dot"></div><div class="pulse-user-inner"></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      userMarkerRef.current = L.marker(userLocation, { icon: userIcon })
        .addTo(map)
        .bindPopup('<b>Sua Localização Atual</b>');
    }

    const isDefault = userLocation[0] === -12.2664 && userLocation[1] === -38.9663;
    if (!hasCenteredRef.current || (!hasCenteredGPSRef.current && !isDefault)) {
      map.setView(userLocation, MAP_DEFAULTS.followZoom);
      hasCenteredRef.current = true;
      if (!isDefault) {
        hasCenteredGPSRef.current = true;
      }
    }

    Object.values(markersRef.current).forEach((m) => {
      try { map.removeLayer(m); } catch { /* noop */ }
    });
    markersRef.current = {};

    units.forEach((unit) => {
      const coords = REAL_COORDS[unit.id] || userLocation;
      const color = statusColor(unit.status);
      const isTarget = unit.id === routingUnitId;

      const unitIcon = L.divIcon({
        className: 'waze-unit-pin',
        html: `<div class="pin-pulse" style="background-color: ${color}40; display: ${isTarget ? 'block' : 'none'}"></div>
               <div class="pin-core" style="background-color: ${color}; display: flex; align-items: center; justify-content: center; color: white; border-radius: 50%; width: 28px; height: 28px; border: 2.5px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3)">
                 <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display: block">
                   <path d="M3 21h18"></path>
                   <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"></path>
                   <path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"></path>
                   <path d="M10 9h4"></path>
                   <path d="M12 7v4"></path>
                 </svg>
               </div>
               <div class="pin-tooltip" style="border: ${isTarget ? '2px solid #22D3EE' : '1px solid rgba(255,255,255,0.2)'}">${unit.waitMinutes}m</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const marker = L.marker(coords, { icon: unitIcon }).addTo(map);
      marker.on('click', () => {
        setWazeActiveUnit(unit.id);
        setSelectedUnitId(unit.id);
      });
      markersRef.current[unit.id] = marker;
    });

    if (!routingUnitId) clearRoute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, activeScreen, units, wazeActiveUnit, routingUnitId, userLocation[0], userLocation[1]]);

  // Calcula e desenha a rota automaticamente quando a unidade-alvo ou a localização do usuário muda.
  useEffect(() => {
    if (!mapReady || !routingUnitId) {
      clearRoute();
      return;
    }
    const destCoords = REAL_COORDS[routingUnitId];
    if (destCoords) {
      drawRoute(userLocation, destCoords, routingUnitId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, routingUnitId, userLocation[0], userLocation[1]]);



  return {
    wazeActiveUnit,
    setWazeActiveUnit,
    wazeNavigating,
    setWazeNavigating,
    wazeProgress,
    setWazeProgress,
    wazeInstruction,
    wazeDistance,
    wazeDuration,
    handleUnitSelectFromList,
    resetRoute,
  };
}
