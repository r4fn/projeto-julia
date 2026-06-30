/**
 * Hook de calibração assistida (conduzida pelo cuidador).
 *
 * Fluxo: olhar para o CENTRO → ESQUERDA → DIREITA. Em cada etapa o cuidador
 * clica em "Capturar"; coletamos várias amostras (~1s) e tiramos a média para
 * reduzir ruído. Ao final, salvamos no LocalStorage.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CalibrationData, GazeSample } from '../types';
import { loadJSON, saveJSON } from '../utils/storage';

const STORAGE_KEY = 'projeto-julia:calibration';

const DEFAULT_CALIBRATION: CalibrationData = {
  center: 0.5,
  left: 0.35,
  right: 0.65,
  calibrated: false,
};

/** Etapas da calibração, na ordem em que são apresentadas. */
export const CALIBRATION_STEPS = ['center', 'left', 'right'] as const;
export type CalibrationStep = (typeof CALIBRATION_STEPS)[number];

const STEP_LABELS: Record<CalibrationStep, string> = {
  center: 'Peça para olhar para o ✕ no CENTRO',
  left: 'Peça para olhar para o ✕ na borda ESQUERDA',
  right: 'Peça para olhar para o ✕ na borda DIREITA',
};

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** @param latestRef ref com a última amostra do rastreador (para ler a razão). */
export function useCalibration(latestRef: React.RefObject<GazeSample>) {
  const [calibration, setCalibration] = useState<CalibrationData>(() =>
    loadJSON<CalibrationData>(STORAGE_KEY, DEFAULT_CALIBRATION),
  );
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [capturing, setCapturing] = useState(false);

  // Acumula os valores capturados durante o fluxo atual.
  const draftRef = useRef<Partial<Record<CalibrationStep, number>>>({});

  useEffect(() => {
    saveJSON(STORAGE_KEY, calibration);
  }, [calibration]);

  const start = useCallback(() => {
    draftRef.current = {};
    setStepIndex(0);
    setIsCalibrating(true);
  }, []);

  const cancel = useCallback(() => {
    setIsCalibrating(false);
    setCapturing(false);
  }, []);

  /** Captura a etapa atual: coleta ~1s de amostras e avança. */
  const captureCurrent = useCallback(async () => {
    if (capturing) return;
    setCapturing(true);
    const samples: number[] = [];
    const total = 25; // ~1s a 40ms por amostra
    for (let i = 0; i < total; i++) {
      const s = latestRef.current;
      if (s && s.faceDetected) samples.push(s.ratio);
      await delay(40);
    }
    setCapturing(false);

    const avg =
      samples.length > 0 ? samples.reduce((a, b) => a + b, 0) / samples.length : null;

    const step = CALIBRATION_STEPS[stepIndex];
    if (avg != null) {
      draftRef.current[step] = avg;
    }

    // Última etapa? Finaliza.
    if (stepIndex >= CALIBRATION_STEPS.length - 1) {
      const d = draftRef.current;
      setCalibration({
        center: d.center ?? DEFAULT_CALIBRATION.center,
        left: d.left ?? DEFAULT_CALIBRATION.left,
        right: d.right ?? DEFAULT_CALIBRATION.right,
        calibrated: true,
      });
      setIsCalibrating(false);
    } else {
      setStepIndex((i) => i + 1);
    }
  }, [capturing, latestRef, stepIndex]);

  const currentStep = CALIBRATION_STEPS[stepIndex];

  return {
    calibration,
    isCalibrating,
    stepIndex,
    currentStep,
    currentLabel: STEP_LABELS[currentStep],
    totalSteps: CALIBRATION_STEPS.length,
    capturing,
    start,
    cancel,
    captureCurrent,
  };
}
