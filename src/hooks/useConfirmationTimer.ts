/**
 * Hook do temporizador de confirmação.
 *
 * Regra: enquanto o olhar permanecer em uma direção (esquerda/direita), a
 * barra de progresso enche de 0% a 100% no tempo configurado. Se voltar ao
 * centro (ou trocar de lado) antes de completar, a contagem zera. Ao completar,
 * dispara a resposta e entra em "cooldown" (período de ignorar novos olhares).
 *
 * Usamos um único loop de requestAnimationFrame com timestamps reais, lendo as
 * direções/config mais recentes via refs — assim o loop nunca reinicia à toa.
 */

import { useEffect, useRef, useState } from 'react';
import type { Answer, Direction, Settings } from '../types';
import { directionToAnswer } from '../services/gazeEstimator';

interface Params {
  direction: Direction;
  settings: Settings;
  /** Só conta quando true (ex.: fora da calibração e com câmera pronta). */
  enabled: boolean;
  onConfirm: (answer: Answer) => void;
}

export function useConfirmationTimer({ direction, settings, enabled, onConfirm }: Params) {
  const [progress, setProgress] = useState(0); // 0 a 1
  const [inCooldown, setInCooldown] = useState(false);

  // Refs para o loop sempre ler valores atuais.
  const directionRef = useRef(direction);
  const settingsRef = useRef(settings);
  const enabledRef = useRef(enabled);
  const onConfirmRef = useRef(onConfirm);
  useEffect(() => void (directionRef.current = direction), [direction]);
  useEffect(() => void (settingsRef.current = settings), [settings]);
  useEffect(() => void (enabledRef.current = enabled), [enabled]);
  useEffect(() => void (onConfirmRef.current = onConfirm), [onConfirm]);

  useEffect(() => {
    let rafId = 0;
    let last = performance.now();
    let held: Direction = 'center';
    let elapsed = 0;
    let cooldownUntil = 0;

    const tick = (now: number) => {
      const dt = now - last;
      last = now;

      const s = settingsRef.current;
      const dir = directionRef.current;

      if (!enabledRef.current) {
        held = 'center';
        elapsed = 0;
        if (progressNonZero(elapsed)) setProgress(0);
        rafId = requestAnimationFrame(tick);
        return;
      }

      // Em cooldown: ignora tudo até o tempo passar.
      if (now < cooldownUntil) {
        setInCooldown(true);
        setProgress(0);
        held = 'center';
        elapsed = 0;
        rafId = requestAnimationFrame(tick);
        return;
      }
      setInCooldown(false);

      if (dir === 'center') {
        held = 'center';
        elapsed = 0;
        setProgress(0);
      } else {
        // Trocou de direção? Reinicia a contagem.
        if (dir !== held) {
          held = dir;
          elapsed = 0;
        } else {
          elapsed += dt;
        }
        const p = Math.min(elapsed / s.confirmationTimeMs, 1);
        setProgress(p);

        if (p >= 1) {
          const answer = directionToAnswer(dir, s.invertSides);
          if (answer) onConfirmRef.current(answer);
          cooldownUntil = now + s.cooldownMs;
          held = 'center';
          elapsed = 0;
          setProgress(0);
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
    // Loop criado uma única vez; depende só de refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { progress, inCooldown };
}

/** Pequeno auxiliar de legibilidade. */
function progressNonZero(elapsed: number): boolean {
  return elapsed > 0;
}
