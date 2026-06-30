/**
 * Utilitários de suavização e matemática auxiliar.
 *
 * O olhar de uma pessoa (ainda mais com movimentos lentos/trêmulos) gera um
 * sinal "ruidoso". A média móvel reduz esse ruído para evitar oscilações que
 * causariam detecções acidentais.
 */

/** Limita um número a um intervalo [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Média móvel simples de tamanho fixo. */
export class MovingAverage {
  private buffer: number[] = [];

  constructor(private windowSize: number) {}

  /** Adiciona um valor e retorna a média atual. */
  push(value: number): number {
    this.buffer.push(value);
    while (this.buffer.length > this.windowSize) {
      this.buffer.shift();
    }
    return this.value();
  }

  /** Média atual (0 se ainda não há amostras). */
  value(): number {
    if (this.buffer.length === 0) return 0;
    const sum = this.buffer.reduce((acc, v) => acc + v, 0);
    return sum / this.buffer.length;
  }

  /** Ajusta o tamanho da janela em tempo de execução. */
  setWindowSize(size: number): void {
    this.windowSize = Math.max(1, Math.round(size));
    while (this.buffer.length > this.windowSize) {
      this.buffer.shift();
    }
  }

  /** Esvazia o histórico (ex.: ao recalibrar). */
  reset(): void {
    this.buffer = [];
  }
}
