// Exportação de todos os modelos de domínio compartilhados
export { Historia } from './Historia';
export { Personagem } from './Personagem';
export { Raca } from './Raca';
export { Classe } from './Classe';
export { VantagemDesvantagem } from './VantagemDesvantagem';

// Factory para criação de modelos
export class ModelFactory {
  /**
   * Cria uma instância do modelo apropriado baseado no tipo
   * @param {string} type - Tipo do modelo ('historia', 'personagem', 'raca', 'classe', 'vantagem-desvantagem')
   * @param {Object} data - Dados para inicializar o modelo
   * @returns {Object} Instância do modelo
   */
  static create(type, data = {}) {
    switch (type.toLowerCase()) {
      case 'historia':
        return new Historia(data);
      case 'personagem':
        return new Personagem(data);
      case 'raca':
        return new Raca(data);
      case 'classe':
        return new Classe(data);
      case 'vantagem-desvantagem':
        return new VantagemDesvantagem(data);
      default:
        throw new Error(`Tipo de modelo desconhecido: ${type}`);
    }
  }

  /**
   * Cria uma instância do modelo a partir de dados da API
   * @param {string} type - Tipo do modelo
   * @param {Object} apiData - Dados da API
   * @returns {Object} Instância do modelo
   */
  static fromAPI(type, apiData) {
    switch (type.toLowerCase()) {
      case 'historia':
        return Historia.fromAPI(apiData);
      case 'personagem':
        return Personagem.fromAPI(apiData);
      case 'raca':
        return Raca.fromApi(apiData);
      case 'classe':
        return Classe.fromApi(apiData);
      case 'vantagem-desvantagem':
        return VantagemDesvantagem.fromApi(apiData);
      default:
        throw new Error(`Tipo de modelo desconhecido: ${type}`);
    }
  }
} 