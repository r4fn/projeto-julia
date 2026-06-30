/**
 * Hook responsável por solicitar e gerenciar o acesso à câmera.
 *
 * Retorna uma ref para o elemento <video>, além de estados de prontidão e erro.
 * Importante: o acesso à câmera só funciona em contexto seguro (HTTPS) ou em
 * http://localhost. Por isso recomendamos GitHub Pages (HTTPS) para uso real.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export type CameraStatus = 'idle' | 'requesting' | 'ready' | 'error';

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    setStatus('requesting');
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // câmera frontal
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });
      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) {
        throw new Error('Elemento de vídeo não encontrado.');
      }
      video.srcObject = stream;
      await video.play();
      setStatus('ready');
    } catch (err) {
      // Mensagens amigáveis para os erros mais comuns.
      let message = 'Não foi possível acessar a câmera.';
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          message = 'Permissão da câmera negada. Autorize o acesso e tente novamente.';
        } else if (err.name === 'NotFoundError') {
          message = 'Nenhuma câmera foi encontrada neste dispositivo.';
        } else if (err.name === 'NotReadableError') {
          message = 'A câmera está em uso por outro aplicativo.';
        } else {
          message = `Erro ao acessar a câmera: ${err.name}.`;
        }
      } else if (err instanceof Error) {
        // Inclui o detalhe para facilitar o diagnóstico de casos inesperados.
        message = `Não foi possível acessar a câmera: ${err.message}`;
      }
      setError(message);
      setStatus('error');
    }
  }, []);

  /** Encerra a câmera e libera o hardware. */
  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus('idle');
  }, []);

  // Garante que a câmera seja liberada ao desmontar.
  useEffect(() => () => stop(), [stop]);

  return { videoRef, status, error, start, stop, ready: status === 'ready' };
}
