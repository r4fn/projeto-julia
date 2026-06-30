/**
 * Assistente de calibração (sobreposição em tela cheia).
 * Conduzido pelo cuidador: a cada etapa, ele orienta o paciente a olhar para
 * o ponto indicado e clica em "Capturar".
 */

import type { CalibrationStep } from '../hooks/useCalibration';

interface Props {
  stepIndex: number;
  totalSteps: number;
  currentStep: CalibrationStep;
  currentLabel: string;
  capturing: boolean;
  faceDetected: boolean;
  onCapture: () => void;
  onCancel: () => void;
}

/** Posição visual do alvo conforme a etapa. */
const TARGET_POSITION: Record<CalibrationStep, string> = {
  center: 'calib__target--center',
  left: 'calib__target--left',
  right: 'calib__target--right',
};

export function CalibrationWizard({
  stepIndex,
  totalSteps,
  currentStep,
  currentLabel,
  capturing,
  faceDetected,
  onCapture,
  onCancel,
}: Props) {
  return (
    <div className="calib">
      <div className="calib__box">
        <p className="calib__step">
          Etapa {stepIndex + 1} de {totalSteps}
        </p>
        <h2 className="calib__instruction">{currentLabel}</h2>

        {/* Alvo grande que o paciente deve olhar. */}
        <div className="calib__stage">
          <div className={`calib__target ${TARGET_POSITION[currentStep]}`} />
        </div>

        {!faceDetected && (
          <p className="calib__warn">⚠️ Rosto não detectado — ajuste a câmera.</p>
        )}

        <div className="calib__actions">
          <button className="btn btn--ghost" onClick={onCancel} disabled={capturing}>
            Cancelar
          </button>
          <button
            className="btn btn--primary"
            onClick={onCapture}
            disabled={capturing || !faceDetected}
          >
            {capturing ? 'Capturando…' : 'Capturar'}
          </button>
        </div>
      </div>
    </div>
  );
}
