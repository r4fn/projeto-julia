/**
 * Pequena camada de acesso ao LocalStorage, com tolerância a erros.
 * Em alguns navegadores (modo privado, permissões) o LocalStorage pode
 * lançar exceção — por isso tudo aqui é protegido com try/catch.
 */

/** Lê e desserializa um valor JSON do LocalStorage. */
export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return { ...fallback, ...(JSON.parse(raw) as Partial<T>) };
  } catch {
    return fallback;
  }
}

/** Serializa e grava um valor no LocalStorage. */
export function saveJSON<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Silencioso: persistência é um "bônus", não pode quebrar o app.
  }
}
