// Importações primeiro
import { apiClient } from './ApiClient';
import { HistoriaService } from './HistoriaService';
import { PersonagemService } from './PersonagemService';
import { TemaService } from './TemaService';
import { VantagemService } from './VantagemService';
import { RacaService } from './RacaService';
import { ClasseService } from './ClasseService';
import { DesvantagemService } from './DesvantagemService';
import { AuthService } from './AuthService';

// Cliente API base
export { ApiClient, apiClient } from './ApiClient';

// Serviços específicos
export { HistoriaService } from './HistoriaService';
export { PersonagemService } from './PersonagemService';
export { TemaService } from './TemaService';
export { VantagemService } from './VantagemService';
export { RacaService } from './RacaService';
export { ClasseService } from './ClasseService';
export { DesvantagemService } from './DesvantagemService';
export { AuthService } from './AuthService';

// WebSocket Service - SINGLETON RIGOROSO
import { WebSocketService } from './WebSocketService.js';
export { WebSocketService } from './WebSocketService.js';
export const webSocketService = WebSocketService.getInstance();

// Factory para criação de serviços
export class ServiceFactory {
  /**
   * Cria uma instância do serviço apropriado
   * @param {string} type - Tipo do serviço ('historia', 'personagem', 'tema', 'vantagem')
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
      case 'vantagem':
        return new VantagemService(apiClient);
      case 'raca':
        return new RacaService(apiClient);
      case 'classe':
        return new ClasseService(apiClient);
      case 'desvantagem':
        return new DesvantagemService(apiClient);
      case 'auth':
        return new AuthService(apiClient);
      default:
        throw new Error(`Tipo de serviço desconhecido: ${type}`);
    }
  }
}

// Instâncias padrão dos serviços
export const historiaService = new HistoriaService(apiClient);
export const personagemService = new PersonagemService(apiClient);
export const temaService = new TemaService(apiClient); 
export const vantagemService = new VantagemService(apiClient);
export const racaService = new RacaService(apiClient);
export const classeService = new ClasseService(apiClient);
export const desvantagemService = new DesvantagemService(apiClient);
export const authService = new AuthService(apiClient); 