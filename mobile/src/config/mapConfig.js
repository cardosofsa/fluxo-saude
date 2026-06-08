// Config do mapa/rotas para o app nativo (Expo).
// Variáveis EXPO_PUBLIC_* são embutidas no bundle pelo Expo.

export const MAP_DEFAULTS = { center: [-12.2664, -38.9663], zoom: 13, followZoom: 14 };
export const DEFAULT_USER_LOCATION = [-12.257, -38.951]; // Feira de Santana, BA

export const OSRM_URL =
  process.env.EXPO_PUBLIC_OSRM_URL || 'https://router.project-osrm.org';

export const statusColor = (status) =>
  status === 'ALTO' ? '#EF4444' : status === 'MÉDIO' ? '#F59E0B' : '#10B981';
