/**
 * 🔔 Serviço de Notificações
 * 
 * Responsável por:
 * - Buscar notificações da API
 * - Gerenciar convites
 * - Marcar notificações como lidas
 * - Aceitar/rejeitar convites
 */
export class NotificationService {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.baseUrl = '/novidades';
  }

  /**
   * 🎯 Buscar todas as novidades do usuário
   * @param {Object} params - Parâmetros de busca
   * @param {number} params.limit - Limite de resultados
   * @param {number} params.offset - Offset para paginação
   * @returns {Promise<Object>} Resposta com notificações
   */
  async fetchNotifications(params = {}) {
    try {
      const queryParams = {
        limit: params.limit || 20,
        offset: params.offset || 0,
        ...params
      };


      // Construir URL com query params usando URLSearchParams
      const queryString = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryString.append(key, value);
        }
      });

      const url = queryString.toString() ? `${this.baseUrl}?${queryString.toString()}` : this.baseUrl;

      const response = await this.apiClient.get(url);

      // Verificação mais robusta da estrutura de resposta - PADRÃO UNIFICADO
      if (response.success) {
        return response
      }
      else {
        throw new Error('Resposta inválida da API');
      }

    } catch (error) {
      console.error('❌ NotificationService: Erro ao buscar notificações:', error);
      throw new Error(`Erro ao buscar notificações: ${error.message}`);
    }
  }

  /**
   * 🎯 Marcar notificação como lida
   * @param {number} notificationId - ID da notificação
   * @returns {Promise<Object>} Resultado da operação
   */
  async markAsRead(notificationId) {
    try {

      const response = await this.apiClient.patch(`${this.baseUrl}/${notificationId}/lida`);

      // Verificação mais robusta da estrutura de resposta - PADRÃO UNIFICADO
      if (response.data) {
        if (response.data.success !== undefined) {
          if (response.data.success) {
            return { success: true, data: response.data.data };
          } else {
            throw new Error(response.data?.message || 'Erro desconhecido');
          }
        } else {
          return { success: true, data: response.data };
        }
      } else {
        throw new Error('Resposta inválida da API');
      }
    } catch (error) {
      console.error('❌ NotificationService: Erro ao marcar como lida:', error);
      throw new Error(`Erro ao marcar como lida: ${error.message}`);
    }
  }

  /**
   * 🎯 Marcar todas as notificações como lidas
   * @returns {Promise<Object>} Resultado da operação
   */
  async markAllAsRead() {
    try {

      const response = await this.apiClient.patch(`${this.baseUrl}/marcar-todas-lidas`);

      // Verificação mais robusta da estrutura de resposta - PADRÃO UNIFICADO
      if (response.data) {
        if (response.data.success !== undefined) {
          if (response.data.success) {
            return { success: true, data: response.data.data };
          } else {
            throw new Error(response.data?.message || 'Erro desconhecido');
          }
        } else {
          return { success: true, data: response.data };
        }
      } else {
        throw new Error('Resposta inválida da API');
      }
    } catch (error) {
      console.error('❌ NotificationService: Erro ao marcar todas como lidas:', error);
      throw new Error(`Erro ao marcar todas como lidas: ${error.message}`);
    }
  }

  /**
   * 🎯 Aceitar convite de história
   * @param {number} conviteId - ID do convite
   * @param {number} personagemId - ID do personagem
   * @returns {Promise<Object>} Resultado da operação
   */
  async acceptInvite(conviteId, personagemId) {
    try {

      if (!personagemId) {
        throw new Error('ID do personagem é obrigatório para aceitar convite');
      }

      const response = await this.apiClient.put(`/convites/${conviteId}/aceitar`, {
        personagem_id: personagemId
      });

      // Verificação mais robusta da estrutura de resposta - PADRÃO UNIFICADO
      if (response.data) {
        if (response.data.success !== undefined) {
          if (response.data.success) {
            return {
              success: true,
              data: response.data.data || {
                historiaId: conviteId,
                redirectTo: `/jogo/${conviteId}`
              }
            };
          } else {
            throw new Error(response.data?.message || 'Erro desconhecido');
          }
        } else {
          return {
            success: true,
            data: response.data || {
              historiaId: conviteId,
              redirectTo: `/jogo/${conviteId}`
            }
          };
        }
      } else {
        throw new Error('Resposta inválida da API');
      }
    } catch (error) {
      console.error('❌ NotificationService: Erro ao aceitar convite:', error);
      throw new Error(`Erro ao aceitar convite: ${error.message}`);
    }
  }

  /**
   * 🎯 Rejeitar convite de história
   * @param {number} conviteId - ID do convite
   * @returns {Promise<Object>} Resultado da operação
   */
  async rejectInvite(conviteId) {
    try {

      const response = await this.apiClient.put(`/convites/${conviteId}/rejeitar`);

      // Verificação mais robusta da estrutura de resposta - PADRÃO UNIFICADO
      if (response.data) {
        if (response.data.success !== undefined) {
          if (response.data.success) {
            return { success: true, data: response.data.data };
          } else {
            throw new Error(response.data?.message || 'Erro desconhecido');
          }
        } else {
          return { success: true, data: response.data };
        }
      } else {
        throw new Error('Resposta inválida da API');
      }
    } catch (error) {
      console.error('❌ NotificationService: Erro ao rejeitar convite:', error);
      throw new Error(`Erro ao rejeitar convite: ${error.message}`);
    }
  }

  /**
   * 🎯 Obter contagem de notificações não lidas
   * @returns {Promise<Object>} Contagem de notificações
   */
  async getUnreadCount() {
    try {
      // Usar o endpoint principal com limite mínimo para otimizar
      const response = await this.fetchNotifications({ limit: 1 });

      if (response.success) {
        const unreadCount = response.resumo?.total_novidades || 0;
        return { success: true, count: unreadCount };
      } else {
        throw new Error('Erro ao buscar contagem');
      }
    } catch (error) {
      console.error('❌ NotificationService: Erro ao buscar contagem:', error);
      throw new Error(`Erro ao buscar contagem: ${error.message}`);
    }
  }

  /**
   * 🎯 Buscar apenas convites pendentes
   * @param {Object} params - Parâmetros de busca
   * @returns {Promise<Object>} Convites pendentes
   */
  async fetchPendingInvites(params = {}) {
    try {

      const response = await this.fetchNotifications({
        ...params,
        tipo: 'convite_historia',
        status: 'pendente'
      });

      if (response.success) {
        const convites = response.data?.convites || [];
        return {
          success: true,
          convites,
          count: convites.length
        };
      } else {
        throw new Error('Erro ao buscar convites');
      }
    } catch (error) {
      console.error('❌ NotificationService: Erro ao buscar convites:', error);
      throw new Error(`Erro ao buscar convites: ${error.message}`);
    }
  }

  /**
   * 🎯 Utilitário para formatar data de notificação
   * @param {string} dateString - Data em formato string
   * @returns {string} Data formatada
   */
  formatNotificationDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Agora há pouco';
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return date.toLocaleDateString('pt-BR');
  }

  /**
   * 🎯 Validar se notificação é válida
   * @param {Object} notification - Notificação a ser validada
   * @returns {boolean} True se válida
   */
  validateNotification(notification) {
    return (
      notification &&
      notification.id &&
      notification.tipo &&
      notification.criado_em
    );
  }

  /**
   * 🎯 Filtrar notificações por tipo
   * @param {Array} notifications - Lista de notificações
   * @param {string} type - Tipo a filtrar
   * @returns {Array} Notificações filtradas
   */
  filterNotificationsByType(notifications, type) {
    return notifications.filter(notif => notif.tipo === type);
  }

  /**
   * 🎯 Agrupar notificações por data
   * @param {Array} notifications - Lista de notificações
   * @returns {Object} Notificações agrupadas por data
   */
  groupNotificationsByDate(notifications) {
    const groups = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: []
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    notifications.forEach(notif => {
      const notifDate = new Date(notif.criado_em);
      const notifDay = new Date(notifDate.getFullYear(), notifDate.getMonth(), notifDate.getDate());

      if (notifDay.getTime() === today.getTime()) {
        groups.today.push(notif);
      } else if (notifDay.getTime() === yesterday.getTime()) {
        groups.yesterday.push(notif);
      } else if (notifDay >= weekAgo) {
        groups.thisWeek.push(notif);
      } else {
        groups.older.push(notif);
      }
    });

    return groups;
  }
}

export default NotificationService;