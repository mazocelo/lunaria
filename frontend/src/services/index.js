// Importações primeiro
import { apiClient } from './ApiClient';
import { HistoriaService } from './HistoriaService';
import { PersonagemService } from './PersonagemService';
import { TemaService } from './TemaService';

// Cliente API base
export { ApiClient, apiClient } from './ApiClient';

// Serviços específicos
export { HistoriaService } from './HistoriaService';
export { PersonagemService } from './PersonagemService';
export { TemaService } from './TemaService';

// Factory para criação de serviços
export class ServiceFactory {
  /**
   * Cria uma instância do serviço apropriado
   * @param {string} type - Tipo do serviço ('historia', 'personagem', 'tema')
   * @param {ApiClient} apiClient - Cliente API
   * @returns {Object} Instância do serviço
   */
  static create(type, apiClient) {
    switch (type.toLowerCase()) {
      case 'historia':
        return new HistoriaService(apiClient);
      case 'personagem':
        return new PersonagemService(apiClient);
      case 'tema':
        return new TemaService(apiClient);
      default:
        throw new Error(`Tipo de serviço desconhecido: ${type}`);
    }
  }
}

// Instâncias padrão dos serviços
export const historiaService = new HistoriaService(apiClient);
export const personagemService = new PersonagemService(apiClient);
export const temaService = new TemaService(apiClient); 