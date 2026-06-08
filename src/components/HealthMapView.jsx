import { Navigation } from 'lucide-react';

/**
 * Ponto de montagem do mapa Leaflet + camada de overlays.
 * O Leaflet é inicializado imperativamente (via useHealthMap) no elemento
 * com id={mapId}; aqui só garantimos o container posicionado e os overlays.
 */
export function HealthMapView({ mapId, className, style, mapStyle, children }) {
  // flexShrink: 0 impede que o mapa colapse dentro de containers flex-column
  // com rolagem (ex.: .screen-inner-content), preservando a altura definida.
  return (
    <div className={className} style={{ position: 'relative', flexShrink: 0, ...style }}>
      {children}
      <div id={mapId} style={mapStyle} />
    </div>
  );
}

/** Faixa superior com a instrução de navegação turn-by-turn (estilo Waze). */
export function WazeInstructionBanner({ instruction }) {
  return (
    <div
      className="waze-hud-top"
      style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        backgroundColor: '#059669', color: 'white', padding: '8px 12px',
        display: 'flex', alignItems: 'center', gap: '8px', zIndex: 1000,
        fontSize: '0.72rem', fontWeight: 'bold',
        borderBottom: '1px solid rgba(255,255,255,0.2)',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        borderTopLeftRadius: '14px', borderTopRightRadius: '14px',
      }}
    >
      <Navigation style={{ width: '14px', height: '14px', transform: 'rotate(45deg)' }} />
      <span>{instruction}</span>
    </div>
  );
}

const HUD_VARIANTS = {
  home: {
    card: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.96)', borderTop: '1px solid rgba(255,255,255,0.1)',
      padding: '10px 14px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '6px',
      borderBottomLeftRadius: '14px', borderBottomRightRadius: '14px',
    },
    label: 'ROTA REAL WAZE',
    name: { fontSize: '0.78rem', fontWeight: '800', color: 'white' },
    eta: { fontSize: '0.8rem', fontWeight: '800', color: '#22D3EE' },
    dist: { fontSize: '0.7rem', color: '#E2E8F0', opacity: 0.8 },
    reset: { width: '34px', height: '34px', minWidth: '34px', minHeight: '34px' },
  },
  fullscreen: {
    card: {
      position: 'absolute', bottom: 12, left: 12, right: 12,
      backgroundColor: 'rgba(15, 23, 42, 0.96)', border: '1px solid rgba(255,255,255,0.1)',
      padding: '14px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '8px',
      borderRadius: '14px', boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
    },
    label: 'ROTA ATIVA',
    name: { fontSize: '0.85rem', fontWeight: '800', color: 'white' },
    eta: { fontSize: '0.9rem', fontWeight: '900', color: '#22D3EE' },
    dist: { fontSize: '0.7rem', color: '#94A3B8' },
    reset: { width: '36px', height: '36px', minWidth: '36px', minHeight: '36px' },
  },
};

/**
 * Card flutuante de rota ativa (nome do destino, ETA, distância e ações).
 * `variant` controla as pequenas diferenças visuais entre a home e o mapa
 * em tela cheia. As ações (iniciar navegação, ver detalhes, etc.) vêm como
 * children — assim cada tela mantém seus botões específicos.
 */
export function WazeRouteHud({ variant = 'home', unitName, subtitle, eta, distance, onReset, children }) {
  const v = HUD_VARIANTS[variant] || HUD_VARIANTS.home;
  return (
    <div className="waze-hud-bottom" style={v.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.55rem', fontWeight: 'bold', color: '#94A3B8', textTransform: 'uppercase' }}>{v.label}</span>
          <span style={v.name}>{unitName}</span>
          {subtitle && <span style={{ fontSize: '0.65rem', color: '#94A3B8', marginTop: '2px' }}>{subtitle}</span>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span style={v.eta}>{eta || '...'}</span>
          <span style={v.dist}>{distance || '...'}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '4px', alignItems: 'center' }}>
        {children}
        <button
          className="btn-phone-logout"
          style={{ ...v.reset, borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', border: 'none', margin: 0, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '800' }}
          onClick={onReset}
          aria-label="Encerrar rota"
        >
          X
        </button>
      </div>
    </div>
  );
}
