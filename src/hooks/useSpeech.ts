/**
 * Hook de fala usando a Web Speech API (SpeechSynthesis), gratuita e nativa
 * dos navegadores. Fala "Sim"/"Não" em português.
 *
 * Melhorias de qualidade:
 *  - Ranqueia as vozes para escolher automaticamente a mais NATURAL e FEMININA
 *    em português (ex.: "Google português do Brasil", vozes "Natural/Online").
 *  - Permite ao cuidador escolher manualmente a voz (persistida nas settings).
 *
 * Estrutura pronta para, no futuro, tocar arquivos MP3 em vez da voz sintética
 * (ver comentário em `speak`).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * Dá uma "nota" para cada voz, para escolhermos a melhor automaticamente.
 * Quanto maior, melhor. Critérios: idioma português, motores mais naturais
 * (Google/Natural/Online) e nomes tipicamente femininos em pt-BR.
 */
function scoreVoice(v: SpeechSynthesisVoice): number {
  const name = v.name.toLowerCase();
  const lang = v.lang.toLowerCase().replace('_', '-');
  let score = 0;

  // Idioma
  if (lang.startsWith('pt-br')) score += 100;
  else if (lang.startsWith('pt')) score += 60;

  // Motores costumeiramente mais naturais
  if (name.includes('google')) score += 45; // "Google português do Brasil"
  if (name.includes('natural')) score += 50; // vozes "Online (Natural)" da Microsoft
  if (name.includes('online')) score += 20;

  // Nomes geralmente femininos em pt-BR
  for (const hint of [
    'maria',
    'francisca',
    'luciana',
    'heloisa',
    'helena',
    'camila',
    'female',
    'mulher',
    'feminina',
  ]) {
    if (name.includes(hint)) score += 18;
  }

  return score;
}

/** @param preferredVoiceURI voiceURI escolhido pelo usuário ('' = automático). */
export function useSpeech(preferredVoiceURI: string = '') {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const supported =
    typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Carrega a lista de vozes (que costuma chegar de forma assíncrona).
  useEffect(() => {
    if (!supported) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [supported]);

  // Vozes em português, ordenadas da melhor para a pior. Se não houver
  // nenhuma em pt, devolvemos todas (também ordenadas) para o usuário escolher.
  const rankedVoices = useMemo(() => {
    const pt = voices.filter((v) =>
      v.lang.toLowerCase().replace('_', '-').startsWith('pt'),
    );
    const list = pt.length > 0 ? pt : voices;
    return [...list].sort((a, b) => scoreVoice(b) - scoreVoice(a));
  }, [voices]);

  /** Resolve qual voz usar: a escolhida pelo usuário ou a melhor automática. */
  const resolveVoice = useCallback((): SpeechSynthesisVoice | undefined => {
    if (preferredVoiceURI) {
      const chosen = voices.find((v) => v.voiceURI === preferredVoiceURI);
      if (chosen) return chosen;
    }
    return rankedVoices[0];
  }, [preferredVoiceURI, voices, rankedVoices]);

  /** Fala um texto. (Para usar MP3 no futuro, troque o corpo por um <audio>.) */
  const speak = useCallback(
    (text: string) => {
      if (!supported) return;
      // Cancela falas pendentes para não acumular.
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = resolveVoice();
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        utterance.lang = 'pt-BR';
      }
      utterance.rate = 1; // velocidade natural
      utterance.pitch = 1.05; // leve realce, soa um pouco mais suave
      window.speechSynthesis.speak(utterance);
    },
    [supported, resolveVoice],
  );

  return { speak, supported, voices: rankedVoices };
}
