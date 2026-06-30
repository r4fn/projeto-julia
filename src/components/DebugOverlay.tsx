/**
 * Painel de depuração (texto). Mostra números úteis para entender o que o
 * detector está "enxergando" — razão, direção, confiança, piscada.
 * O desenho dos pontos do rosto é feito no canvas dentro de useEyeTracking.
 */

import type { GazeSample } from '../types';

interface Props {
  sample: GazeSample;
  progress: number;
}

export function DebugOverlay({ sample, progress }: Props) {
  return (
    <div className="debug">
      <h3 className="debug__title">Depuração</h3>
      <ul className="debug__list">
        <li>
          <span>Rosto</span>
          <strong>{sample.faceDetected ? 'sim' : 'não'}</strong>
        </li>
        <li>
          <span>Razão (0 esq · 1 dir)</span>
          <strong>{sample.ratio.toFixed(3)}</strong>
        </li>
        <li>
          <span>Direção</span>
          <strong>{sample.direction}</strong>
        </li>
        <li>
          <span>Confiança</span>
          <strong>{(sample.confidence * 100).toFixed(0)}%</strong>
        </li>
        <li>
          <span>Piscada</span>
          <strong>{sample.blink ? 'sim' : 'não'}</strong>
        </li>
        <li>
          <span>Progresso</span>
          <strong>{(progress * 100).toFixed(0)}%</strong>
        </li>
      </ul>
    </div>
  );
}
