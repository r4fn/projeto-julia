/**
 * Hook de configurações: carrega do LocalStorage, fornece valores padrão e
 * salva automaticamente qualquer alteração.
 */

import { useCallback, useEffect, useState } from 'react';
import type { Settings } from '../types';
import { loadJSON, saveJSON } from '../utils/storage';

const STORAGE_KEY = 'projeto-julia:settings';

/** Valores padrão pensados para tolerar movimentos lentos. */
export const DEFAULT_SETTINGS: Settings = {
  confirmationTimeMs: 3000,
  cooldownMs: 2000,
  sensitivity: 0.5,
  deadZone: 0.08,
  smoothingWindow: 8,
  audioEnabled: true,
  voiceURI: '', // automático: escolhe a melhor voz disponível

  showVideo: true,
  invertSides: false,
  debugMode: false,
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() =>
    loadJSON<Settings>(STORAGE_KEY, DEFAULT_SETTINGS),
  );

  // Persiste sempre que mudar.
  useEffect(() => {
    saveJSON(STORAGE_KEY, settings);
  }, [settings]);

  /** Atualiza uma única chave das configurações. */
  const update = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  /** Restaura os padrões. */
  const reset = useCallback(() => setSettings(DEFAULT_SETTINGS), []);

  return { settings, update, reset };
}
