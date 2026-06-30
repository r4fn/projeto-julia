/**
 * Exibe o vídeo da câmera (espelhado, como um espelho) e, por cima, o canvas
 * de depuração com os pontos detectados.
 */

import type { RefObject } from 'react';

interface Props {
  videoRef: RefObject<HTMLVideoElement>;
  overlayRef: RefObject<HTMLCanvasElement>;
  /** Esconde visualmente o vídeo (mas mantém o processamento rodando). */
  hidden: boolean;
}

export function CameraView({ videoRef, overlayRef, hidden }: Props) {
  return (
    <div className={`camera ${hidden ? 'camera--hidden' : ''}`}>
      {/* O vídeo e o canvas são espelhados via CSS (scaleX(-1)). */}
      <video ref={videoRef} className="camera__video" playsInline muted />
      <canvas ref={overlayRef} className="camera__overlay" />
    </div>
  );
}
