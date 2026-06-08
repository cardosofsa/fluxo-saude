// Configuração central do mapa (Leaflet + OSM/OSRM).
// Tudo que é endpoint/segredo vem de variáveis de ambiente (ver .env.example).

// Centro padrão: Feira de Santana, BA.
export const MAP_DEFAULTS = {
  center: [-12.2664, -38.9663],
  zoom: 13,
  followZoom: 14,
};

// Localização inicial do usuário enquanto o GPS não responde (Praça da Matriz, Feira de Santana).
export const DEFAULT_USER_LOCATION = [-12.2664, -38.9663];

// Tiles. Padrão: Carto "light" (gratuito, limpo para mapas urbanos).
// Para tema escuro use: https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png
export const TILE_URL =
  import.meta.env.VITE_TILE_URL ||
  'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> ' +
  '&copy; <a href="https://carto.com/attributions">CARTO</a>';

export const TILE_OPTIONS = {
  maxZoom: 20,
  subdomains: 'abcd',
};

// Servidor de roteamento. O demo público só serve para DESENVOLVIMENTO.
// Em produção: rode OSRM via Docker ou use OpenRouteService/MapTiler e defina VITE_OSRM_URL.
export const OSRM_URL =
  import.meta.env.VITE_OSRM_URL || 'https://router.project-osrm.org';

// Cor do pino conforme a lotação da unidade.
export const statusColor = (status) =>
  status === 'ALTO' ? '#EF4444' : status === 'MÉDIO' ? '#F59E0B' : '#10B981';
