/**
 * Tabuleiro de escolha em tela cheia: divide a tela ao meio.
 *  - Lado ESQUERDO  → NÃO (vermelho, ❌)
 *  - Lado DIREITO   → SIM (verde, ✅)
 *
 * O lado para onde a pessoa olha "acende" (fica grande e brilhante) e a barra
 * de confirmação preenche aquele lado de baixo para cima. Ao confirmar, o lado
 * escolhido pisca e o outro escurece — um retorno visual forte e intencional.
 *
 * Os rótulos respeitam a inversão de lados (Settings.invertSides): nós sempre
 * perguntamos ao gazeEstimator qual resposta cada DIREÇÃO representa, então o
 * lado físico da tela continua coerente com o que o app realmente vai responder.
 */

import type { Answer, Direction } from '../types';
import { directionToAnswer } from '../services/gazeEstimator';

interface Props {
  answer: Answer | null;
  direction: Direction;
  progress: number; // 0 a 1 (confirmação em andamento)
  invertSides: boolean;
  faceDetected: boolean;
}

/** Descreve um dos dois lados do tabuleiro. */
function sideInfo(side: 'left' | 'right', invertSides: boolean) {
  const answer = directionToAnswer(side, invertSides); // 'SIM' | 'NAO'
  const isYes = answer === 'SIM';
  return {
    side,
    answer: answer as Answer,
    isYes,
    label: isYes ? 'SIM' : 'NÃO',
    emoji: isYes ? '✅' : '❌',
  };
}

export function ChoiceBoard({
  answer,
  direction,
  progress,
  invertSides,
  faceDetected,
}: Props) {
  // Ordem na tela: esquerda primeiro, direita depois.
  const sides = [sideInfo('left', invertSides), sideInfo('right', invertSides)];

  // Quando uma resposta foi confirmada, marcamos o lado vencedor.
  const confirmed = answer !== null;

  return (
    <div className="board" aria-live="polite">
      {sides.map((s) => {
        const isActive = !confirmed && direction === s.side;
        const isWinner = confirmed && answer === s.answer;
        const isLoser = confirmed && answer !== s.answer;
        const fill = isActive ? Math.round(progress * 100) : 0;

        const cls = [
          'board__side',
          s.isYes ? 'board__side--yes' : 'board__side--no',
          isActive ? 'is-active' : '',
          isWinner ? 'is-winner' : '',
          isLoser ? 'is-loser' : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <div key={s.side} className={cls}>
            <div className="board__content">
              <span className="board__emoji">{s.emoji}</span>
              <span className="board__label">{s.label}</span>

              {/* Barra de confirmação: só aparece enquanto não há resposta. */}
              {!confirmed && (
                <div className="board__progress">
                  <div
                    className="board__progress-fill"
                    style={{ width: `${fill}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Aviso central quando o rosto não é detectado */}
      {!faceDetected && !confirmed && (
        <div className="board__notice">Rosto não detectado</div>
      )}
    </div>
  );
}
