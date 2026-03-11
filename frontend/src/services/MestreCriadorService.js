export class MestreCriadorService {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.baseUrl = '/mestre-criador';
  }

  /**
   * Interage com o Mestre Criador
   * @param {Object} params
   * @param {string} params.etapa - Etapa atual do wizard
   * @param {Object} params.estado - Estado completo do personagem em construção
   * @param {string} params.mensagemJogador - Mensagem do jogador
   * @param {Array} params.historico - Histórico de mensagens
   * @returns {Object} { mensagem, sugestoes, etapa_proxima, atributos_sugeridos }
   */
  async interagir({ etapa, estado, mensagemJogador, historico }) {
    const response = await this.apiClient.post(`${this.baseUrl}/interagir`, {
      etapa,
      estado,
      mensagemJogador,
      historico,
    });
    if (response.success) return response.data;
    throw new Error(response.data?.message || 'Erro ao interagir com Mestre Criador');
  }
}
