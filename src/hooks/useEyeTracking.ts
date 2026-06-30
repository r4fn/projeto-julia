/**
 * Hook central de rastreamento ocular.
 *
 * A cada quadro de vídeo:
 *   1. Roda o FaceLandmarker do MediaPipe.
 *   2. Calcula a razão horizontal do olhar (espaço de exibição) e a suaviza.
 *   3. Classifica a direção (esquerda/centro/direita).
 *   4. Detecta piscadas e estima a confiança.
 *   5. (Opcional) Desenha os pontos no canvas de depuração.
 *
 * Expõe:
 *   - `sample`: estado atual (re-renderiza a UI a cada quadro).
 *   - `latestRef`: ref com a última amostra, para leitura sem causar renders
 *     (usado pela calibração).
 */

import { useEffect, useRef, useState } from 'react';
import type { CalibrationData, GazeSample, Settings } from '../types';
import { getFaceLandmarker } from '../services/faceLandmarker';
import {
  classifyDirection,
  detectBlink,
  estimateConfidence,
  estimateDisplayRatio,
  EYE_LANDMARKS,
} from '../services/gazeEstimator';
import { MovingAverage } from '../utils/smoothing';

const INITIAL_SAMPLE: GazeSample = {
  faceDetected: false,
  ratio: 0.5,
  direction: 'center',
  blink: false,
  confidence: 0,
};

interface Params {
  videoRef: React.RefObject<HTMLVideoElement>;
  overlayRef: React.RefObject<HTMLCanvasElement>;
  calibration: CalibrationData;
  settings: Settings;
  /** Só processa quando true (ex.: câmera pronta). */
  enabled: boolean;
  /**
   * Ref compartilhada onde gravamos a última amostra. É criada pelo App e
   * passada também à calibração, evitando uma dependência circular entre os
   * hooks (calibração precisa ler o olhar; rastreador precisa da calibração).
   */
  latestRef: React.MutableRefObject<GazeSample>;
}

export function useEyeTracking({
  videoRef,
  overlayRef,
  calibration,
  settings,
  enabled,
  latestRef,
}: Params) {
  const [sample, setSample] = useState<GazeSample>(INITIAL_SAMPLE);
  const [modelReady, setModelReady] = useState(false);

  // Refs para que o loop sempre leia os valores mais recentes sem reiniciar.
  const calibrationRef = useRef(calibration);
  const settingsRef = useRef(settings);
  useEffect(() => void (calibrationRef.current = calibration), [calibration]);
  useEffect(() => void (settingsRef.current = settings), [settings]);

  // Média móvel persistente entre quadros.
  const averagerRef = useRef(new MovingAverage(settings.smoothingWindow));
  useEffect(() => {
    averagerRef.current.setWindowSize(settings.smoothingWindow);
  }, [settings.smoothingWindow]);

  useEffect(() => {
    if (!enabled) return;
    let rafId = 0;
    let cancelled = false;
    let lastVideoTime = -1;

    const run = async () => {
      const landmarker = await getFaceLandmarker();
      if (cancelled) return;
      setModelReady(true);

      const loop = () => {
        if (cancelled) return;
        const video = videoRef.current;

        if (video && video.readyState >= 2 && video.currentTime !== lastVideoTime) {
          lastVideoTime = video.currentTime;
          try {
            const result = landmarker.detectForVideo(video, performance.now());
            const faces = result.faceLandmarks;

            if (faces && faces.length > 0) {
              const landmarks = faces[0];
              const rawRatio = estimateDisplayRatio(landmarks);
              const ratio = averagerRef.current.push(rawRatio);
              const blink = detectBlink(result.faceBlendshapes?.[0]?.categories);
              const confidence = estimateConfidence(
                result.faceBlendshapes?.[0]?.categories,
              );
              const direction = classifyDirection(
                ratio,
                calibrationRef.current,
                settingsRef.current,
              );

              const next: GazeSample = {
                faceDetected: true,
                ratio,
                direction,
                blink,
                confidence,
              };
              latestRef.current = next;
              setSample(next);

              drawDebug(overlayRef.current, video, landmarks, settingsRef.current.debugMode);
            } else {
              // Rosto perdido: zera a média para não "lembrar" posições antigas.
              averagerRef.current.reset();
              const next: GazeSample = { ...INITIAL_SAMPLE };
              latestRef.current = next;
              setSample(next);
              clearCanvas(overlayRef.current);
            }
          } catch {
            // Um quadro com erro não deve derrubar o loop.
          }
        }
        rafId = requestAnimationFrame(loop);
      };

      rafId = requestAnimationFrame(loop);
    };

    run();
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [enabled, videoRef, overlayRef]);

  return { sample, latestRef, modelReady };
}

/** Limpa o canvas de depuração. */
function clearCanvas(canvas: HTMLCanvasElement | null) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx?.clearRect(0, 0, canvas.width, canvas.height);
}

/** Desenha os pontos do rosto e destaca os olhos/íris (modo depuração). */
function drawDebug(
  canvas: HTMLCanvasElement | null,
  video: HTMLVideoElement,
  landmarks: { x: number; y: number }[],
  debug: boolean,
) {
  if (!canvas) return;
  if (!debug) {
    clearCanvas(canvas);
    return;
  }
  // Ajusta o tamanho do canvas ao vídeo (uma vez ou quando mudar).
  if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Todos os pontos em verde translúcido.
  ctx.fillStyle = 'rgba(34,197,94,0.6)';
  for (const p of landmarks) {
    ctx.beginPath();
    ctx.arc(p.x * canvas.width, p.y * canvas.height, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Íris em destaque (amarelo).
  ctx.fillStyle = 'rgba(250,204,21,0.95)';
  for (const idx of [EYE_LANDMARKS.RIGHT_EYE.iris, EYE_LANDMARKS.LEFT_EYE.iris]) {
    const p = landmarks[idx];
    if (!p) continue;
    ctx.beginPath();
    ctx.arc(p.x * canvas.width, p.y * canvas.height, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}
