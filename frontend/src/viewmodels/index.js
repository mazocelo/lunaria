// Exportação de todos os ViewModels
export { HistoriaViewModel, historiaViewModel } from './Historias/HistoriaViewModel';
export { PersonagemViewModel, personagemViewModel } from './Personagens/PersonagemViewModel';

// Factory para criação de ViewModels
export class ViewModelFactory {
  /**
   * Cria uma instância do ViewModel apropriado
   * @param {string} type - Tipo do ViewModel ('historia', 'personagem')
   * @returns {Object} Instância do ViewModel
   */
  static create(type) {
    switch (type.toLowerCase()) {
      case 'historia':
        return new HistoriaViewModel();
      case 'personagem':
        return new PersonagemViewModel();
      default:
        throw new Error(`Tipo de ViewModel desconhecido: ${type}`);
    }
  }
} 