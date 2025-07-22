/**
 * EventEmitter personalizado para gerenciar eventos internos
 * Implementação simples e eficiente
 */
export class EventEmitter {
  constructor() {
    this.events = {};
  }

  /**
   * Adiciona um listener para um evento
   * @param {string} event - Nome do evento
   * @param {Function} callback - Função callback
   */
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  /**
   * Remove um listener específico de um evento
   * @param {string} event - Nome do evento
   * @param {Function} callback - Função callback a ser removida
   */
  off(event, callback) {
    if (!this.events[event]) return;
    
    this.events[event] = this.events[event].filter(cb => cb !== callback);
    
    // Remove o array se estiver vazio
    if (this.events[event].length === 0) {
      delete this.events[event];
    }
  }

  /**
   * Adiciona um listener que será executado apenas uma vez
   * @param {string} event - Nome do evento
   * @param {Function} callback - Função callback
   */
  once(event, callback) {
    const onceWrapper = (...args) => {
      callback(...args);
      this.off(event, onceWrapper);
    };
    this.on(event, onceWrapper);
  }

  /**
   * Emite um evento, chamando todos os listeners
   * @param {string} event - Nome do evento
   * @param {...any} args - Argumentos para passar aos listeners
   */
  emit(event, ...args) {
    if (!this.events[event]) return;
    
    // Cria uma cópia do array para evitar problemas se listeners forem removidos durante a execução
    const listeners = [...this.events[event]];
    
    listeners.forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Erro no listener do evento '${event}':`, error);
      }
    });
  }

  /**
   * Remove todos os listeners de um evento específico
   * @param {string} event - Nome do evento
   */
  removeAllListeners(event) {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }

  /**
   * Retorna o número de listeners para um evento
   * @param {string} event - Nome do evento
   * @returns {number} Número de listeners
   */
  listenerCount(event) {
    return this.events[event] ? this.events[event].length : 0;
  }

  /**
   * Retorna todos os nomes de eventos que têm listeners
   * @returns {string[]} Array com nomes dos eventos
   */
  eventNames() {
    return Object.keys(this.events);
  }
}

/**
 * Função de compatibilidade para ViewModels que usavam MobX
 * Executa uma função e retorna seu resultado
 * @param {Function} fn - Função a ser executada
 * @returns {any} Resultado da função
 */
export const runInAction = (fn) => {
  return fn();
}; 