/**
 * Barra de progresso da confirmação, com marcações em 0/20/40/60/80/100%.
 * A cor muda conforme a direção (verde = SIM, vermelho = NÃO) para reforço
 * visual ao cuidador.
 */

import type { Direction } from '../types';
import { directionToAnswer } from '../services/gazeEstimator';

interface Props {
  progress: number; // 0 a 1
  direction: Direction;
  invertSides: boolean;
}

export function ProgressBar({ progress, direction, invertSides }: Props) {
  const answer = directionToAnswer(direction, invertSides);
  const color = answer === 'SIM' ? '#22c55e' : answer === 'NAO' ? '#ef4444' : '#64748b';
  const percent = Math.round(progress * 100);

  return (
    <div className="progress" aria-label="Progresso da confirmação">
      <div className="progress__track">
        <div
          className="progress__fill"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
        {[0, 20, 40, 60, 80, 100].map((mark) => (
          <span key={mark} className="progress__mark" style={{ left: `${mark}%` }} />
        ))}
      </div>
      <div className="progress__labels">
        {[0, 20, 40, 60, 80, 100].map((mark) => (
          <span key={mark}>{mark}%</span>
        ))}
      </div>
    </div>
  );
}
