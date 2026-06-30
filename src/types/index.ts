/**
 * Tipos centrais do Projeto Julia.
 * Mantemos todos os tipos compartilhados aqui para facilitar a manutenção.
 */

/** Direção do olhar que conseguimos distinguir. */
export type Direction = 'left' | 'center' | 'right';

/** Resposta final dada ao usuário. */
export type Answer = 'SIM' | 'NAO';

/**
 * Dados de calibração, expressos no "espaço de exibição" (display space),
 * ou seja, já considerando o espelhamento do vídeo:
 *  - valor BAIXO  = olhando para a ESQUERDA da tela
 *  - valor ALTO   = olhando para a DIREITA da tela
 * Cada valor varia aproximadamente entre 0 e 1.
 */
export interface CalibrationData {
  center: number;
  left: number;
  right: number;
  /** Indica se uma calibração válida já foi realizada. */
  calibrated: boolean;
}

/** Configurações ajustáveis pelo cuidador, persistidas no LocalStorage. */
export interface Settings {
  /** Tempo (ms) que o olhar deve permanecer em um lado para confirmar. */
  confirmationTimeMs: number;
  /** Tempo (ms) de espera após uma resposta antes de aceitar outra. */
  cooldownMs: number;
  /**
   * Sensibilidade do detector (0 a 1).
   * Quanto MAIOR, mais fácil disparar (basta olhar um pouco para o lado).
   */
  sensitivity: number;
  /**
   * Zona morta central (0 a ~0.3). Faixa ao redor do centro onde nada é
   * detectado, evitando respostas acidentais por pequenos movimentos.
   */
  deadZone: number;
  /** Tamanho da janela de suavização (nº de amostras na média móvel). */
  smoothingWindow: number;
  /** Liga/desliga a fala da resposta (Web Speech API). */
  audioEnabled: boolean;
  /**
   * Voz escolhida para a fala (voiceURI da Web Speech API).
   * Vazio ('') = automático: o app escolhe a voz mais natural disponível.
   */
  voiceURI: string;
  /** Mostra/esconde o vídeo da câmera. */
  showVideo: boolean;
  /**
   * Inverte o mapeamento lado→resposta.
   * Padrão: direita da tela = SIM, esquerda = NÃO.
   * Se ativado: direita = NÃO, esquerda = SIM.
   */
  invertSides: boolean;
  /** Modo de depuração: desenha os pontos do rosto/olhos sobre o vídeo. */
  debugMode: boolean;
}

/** Amostra de leitura produzida a cada quadro pelo rastreador. */
export interface GazeSample {
  /** Houve um rosto detectado neste quadro? */
  faceDetected: boolean;
  /** Razão horizontal já no espaço de exibição (0 esquerda → 1 direita). */
  ratio: number;
  /** Direção classificada a partir da razão + calibração. */
  direction: Direction;
  /** O usuário está piscando (ambos os olhos fechados)? */
  blink: boolean;
  /** Confiança da leitura (0 a 1) — útil como indicador visual. */
  confidence: number;
}
