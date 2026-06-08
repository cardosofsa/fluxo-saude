import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HealthMapView, WazeInstructionBanner, WazeRouteHud } from './HealthMapView';

describe('HealthMapView', () => {
  it('renderiza o ponto de montagem com o id informado', () => {
    const { container } = render(<HealthMapView mapId="meu-mapa" />);
    expect(container.querySelector('#meu-mapa')).toBeInTheDocument();
  });

  it('renderiza overlays passados como children', () => {
    render(
      <HealthMapView mapId="m1">
        <div>overlay-x</div>
      </HealthMapView>
    );
    expect(screen.getByText('overlay-x')).toBeInTheDocument();
  });
});

describe('WazeInstructionBanner', () => {
  it('mostra a instrução de navegação', () => {
    render(<WazeInstructionBanner instruction="Vire à esquerda" />);
    expect(screen.getByText('Vire à esquerda')).toBeInTheDocument();
  });
});

describe('WazeRouteHud', () => {
  it('mostra nome do destino, ETA e distância', () => {
    render(
      <WazeRouteHud variant="home" unitName="UPA Mangabeira" eta="9 min" distance="3.5 km" onReset={() => {}}>
        <button>INICIAR</button>
      </WazeRouteHud>
    );
    expect(screen.getByText('UPA Mangabeira')).toBeInTheDocument();
    expect(screen.getByText('9 min')).toBeInTheDocument();
    expect(screen.getByText('3.5 km')).toBeInTheDocument();
    expect(screen.getByText('INICIAR')).toBeInTheDocument();
  });

  it('usa "..." como fallback quando ETA/distância vazios', () => {
    render(<WazeRouteHud variant="fullscreen" unitName="X" onReset={() => {}} />);
    expect(screen.getAllByText('...').length).toBeGreaterThanOrEqual(2);
  });

  it('mostra o subtítulo só quando informado', () => {
    const { rerender } = render(<WazeRouteHud unitName="X" subtitle="Espera: 10 min" onReset={() => {}} />);
    expect(screen.getByText('Espera: 10 min')).toBeInTheDocument();
    rerender(<WazeRouteHud unitName="X" onReset={() => {}} />);
    expect(screen.queryByText('Espera: 10 min')).not.toBeInTheDocument();
  });

  it('aciona onReset ao clicar no X', () => {
    const onReset = vi.fn();
    render(<WazeRouteHud unitName="X" onReset={onReset} />);
    fireEvent.click(screen.getByRole('button', { name: /encerrar rota/i }));
    expect(onReset).toHaveBeenCalledOnce();
  });

  it('aplica o rótulo conforme a variante', () => {
    const { rerender } = render(<WazeRouteHud variant="home" unitName="X" onReset={() => {}} />);
    expect(screen.getByText('ROTA REAL WAZE')).toBeInTheDocument();
    rerender(<WazeRouteHud variant="fullscreen" unitName="X" onReset={() => {}} />);
    expect(screen.getByText('ROTA ATIVA')).toBeInTheDocument();
  });
});
