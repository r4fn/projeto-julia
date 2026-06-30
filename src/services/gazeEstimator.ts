/**
 * Lógica de estimativa do olhar a partir dos pontos faciais do MediaPipe.
 *
 * A ideia central é simples e robusta: medimos onde a ÍRIS está dentro do
 * olho, na horizontal, comparando a posição da íris com os cantos do olho.
 *  - íris encostada no canto interno/externo → olhando para um lado
 *  - íris no meio → olhando para o centro
 *
 * Fazemos isso para os dois olhos e tiramos a média, o que reduz erros.
 */

import type {
  Category,
  NormalizedLandmark,
} from '@mediapipe/tasks-vision';
import type { CalibrationData, Direction, Settings } from '../types';
import { clamp } from '../utils/smoothing';

/**
 * Índices dos pontos no modelo Face Mesh do MediaPipe (478 pontos com íris).
 * Para cada olho usamos os dois cantos (interno/externo) e o centro da íris.
 */
const RIGHT_EYE = { cornerA: 33, cornerB: 133, iris: 468 }; // olho à direita na imagem
const LEFT_EYE = { cornerA: 362, cornerB: 263, iris: 473 }; // olho à esquerda na imagem

/** Razão horizontal da íris dentro de um olho (0 = canto menor, 1 = canto maior). */
function eyeHorizontalRatio(
  landmarks: NormalizedLandmark[],
  eye: { cornerA: number; cornerB: number; iris: number },
): number {
  const a = landmarks[eye.cornerA];
  const b = landmarks[eye.cornerB];
  const iris = landmarks[eye.iris];
  if (!a || !b || !iris) return 0.5;

  const minX = Math.min(a.x, b.x);
  const maxX = Math.max(a.x, b.x);
  const width = maxX - minX;
  if (width <= 1e-6) return 0.5; // proteção contra divisão por zero
  return clamp((iris.x - minX) / width, 0, 1);
}

/**
 * Calcula a razão horizontal do olhar no ESPAÇO DE EXIBIÇÃO.
 *
 * O vídeo é espelhado na tela (como um espelho), então invertemos a razão
 * (1 - raw) para que o número combine com o que o cuidador vê:
 *   - valor BAIXO → olhando para a ESQUERDA da tela
 *   - valor ALTO  → olhando para a DIREITA da tela
 */
export function estimateDisplayRatio(landmarks: NormalizedLandmark[]): number {
  const r1 = eyeHorizontalRatio(landmarks, RIGHT_EYE);
  const r2 = eyeHorizontalRatio(landmarks, LEFT_EYE);
  const raw = (r1 + r2) / 2;
  return 1 - raw; // espelhamento
}

/**
 * Detecta piscada usando os blendshapes do MediaPipe.
 * Consideramos piscada quando AMBOS os olhos estão majoritariamente fechados.
 */
export function detectBlink(blendshapes: Category[] | undefined): boolean {
  if (!blendshapes || blendshapes.length === 0) return false;
  const left = blendshapes.find((c) => c.categoryName === 'eyeBlinkLeft');
  const right = blendshapes.find((c) => c.categoryName === 'eyeBlinkRight');
  const ls = left?.score ?? 0;
  const rs = right?.score ?? 0;
  return ls > 0.5 && rs > 0.5;
}

/**
 * Confiança simples da leitura (0 a 1): alta quando os olhos estão abertos.
 * Serve como "indicador de confiança" visual para o cuidador.
 */
export function estimateConfidence(blendshapes: Category[] | undefined): number {
  if (!blendshapes || blendshapes.length === 0) return 0.5;
  const left = blendshapes.find((c) => c.categoryName === 'eyeBlinkLeft');
  const right = blendshapes.find((c) => c.categoryName === 'eyeBlinkRight');
  const openness = 1 - Math.max(left?.score ?? 0, right?.score ?? 0);
  return clamp(openness, 0, 1);
}

/**
 * Classifica a direção (esquerda/centro/direita) a partir da razão suavizada,
 * usando a calibração quando disponível e respeitando a zona morta.
 */
export function classifyDirection(
  ratio: number,
  calibration: CalibrationData,
  settings: Settings,
): Direction {
  // Sem calibração: usamos limiares fixos razoáveis ao redor de 0.5.
  if (!calibration.calibrated) {
    const margin = Math.max(0.12, settings.deadZone);
    if (ratio >= 0.5 + margin) return 'right';
    if (ratio <= 0.5 - margin) return 'left';
    return 'center';
  }

  const { center, left, right } = calibration;

  // Fração da distância calibrada que o olhar precisa cobrir para disparar.
  // Sensibilidade alta → fração baixa → dispara mais cedo.
  const triggerFraction = clamp(1 - settings.sensitivity, 0.2, 0.9);

  // Limiares, garantindo no mínimo a zona morta de distância do centro.
  const leftThreshold =
    center - Math.max(Math.abs(center - left) * triggerFraction, settings.deadZone);
  const rightThreshold =
    center + Math.max(Math.abs(right - center) * triggerFraction, settings.deadZone);

  if (ratio <= leftThreshold) return 'left';
  if (ratio >= rightThreshold) return 'right';
  return 'center';
}

/**
 * Converte uma direção em resposta, respeitando a inversão de lados.
 * Padrão: DIREITA da tela = SIM, ESQUERDA = NÃO.
 */
export function directionToAnswer(
  direction: Direction,
  invertSides: boolean,
): 'SIM' | 'NAO' | null {
  if (direction === 'center') return null;
  const rightAnswer = invertSides ? 'NAO' : 'SIM';
  const leftAnswer = invertSides ? 'SIM' : 'NAO';
  return direction === 'right' ? rightAnswer : leftAnswer;
}

/** Exporta os índices para o overlay de depuração reaproveitar. */
export const EYE_LANDMARKS = { RIGHT_EYE, LEFT_EYE };
