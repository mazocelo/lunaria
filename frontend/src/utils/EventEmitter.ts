/**
 * EventEmitter personalizado para gerenciar eventos internos
 * Implementação simples e eficiente
 */
type Listener = (...args: unknown[]) => void;

export class EventEmitter {
  private events: Record<string, Listener[]> = {};

  /**
   * Adiciona um listener para um evento
   */
  on(event: string, callback: Listener): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  /**
   * Remove um listener específico de um evento
   */
  off(event: string, callback: Listener): void {
    if (!this.events[event]) return;

    this.events[event] = this.events[event].filter((cb) => cb !== callback);

    // Remove o array se estiver vazio
    if (this.events[event].length === 0) {
      delete this.events[event];
    }
  }

  /**
   * Adiciona um listener que será executado apenas uma vez
   */
  once(event: string, callback: Listener): void {
    const onceWrapper: Listener = (...args) => {
      callback(...args);
      this.off(event, onceWrapper);
    };
    this.on(event, onceWrapper);
  }

  /**
   * Emite um evento, chamando todos os listeners
   */
  emit(event: string, ...args: unknown[]): void {
    if (!this.events[event]) return;

    // Cria uma cópia do array para evitar problemas se listeners forem removidos durante a execução
    const listeners = [...this.events[event]];

    listeners.forEach((callback) => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Erro no listener do evento '${event}':`, error);
      }
    });
  }

  /**
   * Remove todos os listeners de um evento específico (ou todos se sem evento)
   */
  removeAllListeners(event?: string): void {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }

  /**
   * Retorna o número de listeners para um evento
   */
  listenerCount(event: string): number {
    return this.events[event] ? this.events[event].length : 0;
  }

  /**
   * Retorna todos os nomes de eventos que têm listeners
   */
  eventNames(): string[] {
    return Object.keys(this.events);
  }
}

/**
 * Função de compatibilidade para ViewModels que usavam MobX.
 * Executa uma função e retorna seu resultado.
 */
export const runInAction = <T>(fn: () => T): T => {
  return fn();
};
