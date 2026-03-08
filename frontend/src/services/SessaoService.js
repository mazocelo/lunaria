/**
 * Serviço para buscar historico de sessoes de jogo
 */
export class SessaoService {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.baseUrl = '/sessoes';
  }

  /**
   * Lista sessoes de uma historia (metadata, sem mensagens)
   */
  async getSessoesByHistoria(historiaId) {
    try {
      const response = await this.apiClient.get(`${this.baseUrl}/historia/${historiaId}`);
      if (response.success) {
        return response.data || [];
      }
      throw new Error(response.error || 'Erro ao buscar sessões');
    } catch (error) {
      throw new Error(`Erro ao buscar sessões: ${error.message}`);
    }
  }

  /**
   * Busca historico completo de uma sessao (com mensagens)
   */
  async getSessaoHistorico(sessaoId) {
    try {
      const response = await this.apiClient.get(`${this.baseUrl}/historico/${sessaoId}`);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || 'Erro ao buscar histórico');
    } catch (error) {
      throw new Error(`Erro ao buscar histórico: ${error.message}`);
    }
  }
}
