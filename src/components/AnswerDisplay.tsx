/**
 * Mostra a resposta confirmada em letras grandes (SIM / NÃO) e, quando não há
 * resposta, exibe a direção atual do olhar como retorno visual.
 */

import type { Answer, Direction } from '../types';

interface Props {
  answer: Answer | null;
  direction: Direction;
  faceDetected: boolean;
}

export function AnswerDisplay({ answer, direction, faceDetected }: Props) {
  if (answer) {
    const isYes = answer === 'SIM';
    return (
      <div className={`answer ${isYes ? 'answer--yes' : 'answer--no'}`}>
        {isYes ? 'SIM' : 'NÃO'}
      </div>
    );
  }

  // Sem resposta ainda: dá um retorno discreto da direção atual.
  let hint = 'Aguardando…';
  if (!faceDetected) hint = 'Rosto não detectado';
  else if (direction === 'left') hint = '⟵ olhando à esquerda';
  else if (direction === 'right') hint = 'olhando à direita ⟶';
  else hint = 'olhando ao centro';

  return <div className="answer answer--idle">{hint}</div>;
}
