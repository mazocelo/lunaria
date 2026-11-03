import type { ApiClient } from './ApiClient';

/**
 * Servico de Notificacoes / Novidades. Busca notificacoes, gerencia convites
 * e marca lidos. Sem schema Zod dedicado na Fase 1.
 * TODO Fase 3: criar `notificacaoSchema` em `src/types/api/notificacao.ts`.
 */

interface PaginationParams {
  limit?: number;
  offset?: number;
  [key: string]: string | number | boolean | undefined;
}

interface NotificationListResponse {
  success: boolean;
  data?: unknown;
  resumo?: { total_novidades?: number; [key: string]: unknown };
  [key: string]: unknown;
}

interface MarkResult {
  success: boolean;
  data: unknown;
}

interface UnreadCountResult {
  success: boolean;
  count: number;
}

interface PendingInvitesResult {
  success: boolean;
  convites: unknown[];
  count: number;
}

/**
 * Notificacao minima (campos lidos por validate/group helpers).
 */
interface Notification {
  id: number | string;
  tipo: string;
  criado_em: string;
  [key: string]: unknown;
}

interface GroupedNotifications {
  today: Notification[];
  yesterday: Notification[];
  thisWeek: Notification[];
  older: Notification[];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export class NotificationService {
  private readonly apiClient: ApiClient;
  private readonly baseUrl: string;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
    this.baseUrl = '/novidades';
  }

  async fetchNotifications(params: PaginationParams = {}): Promise<NotificationListResponse> {
    try {
      const queryParams: Record<string, string | number | boolean> = {
        limit: params.limit ?? 20,
        offset: params.offset ?? 0,
      };
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && k !== 'limit' && k !== 'offset') {
          queryParams[k] = v;
        }
      }

      const queryString = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        queryString.append(key, String(value));
      });

      const url = queryString.toString() ? `${this.baseUrl}?${queryString.toString()}` : this.baseUrl;
      const response = await this.apiClient.get(url);

      if (isObject(response) && response.success) {
        return response as NotificationListResponse;
      }
      throw new Error('Resposta inválida da API');
    } catch (error) {
      console.error('NotificationService: Erro ao buscar notificações:', error);
      throw new Error(`Erro ao buscar notificações: ${(error as Error).message}`);
    }
  }

  async markAsRead(notificationId: number | string): Promise<MarkResult> {
    try {
      const response = await this.apiClient.patch(`${this.baseUrl}/${notificationId}/lida`);
      if (isObject(response) && response.success) {
        return { success: true, data: response.data };
      }
      const message =
        (isObject(response) && typeof response.message === 'string' && response.message) ||
        'Erro ao marcar como lida';
      throw new Error(message);
    } catch (error) {
      console.error('NotificationService: Erro ao marcar como lida:', error);
      throw new Error(`Erro ao marcar como lida: ${(error as Error).message}`);
    }
  }

  async markAllAsRead(): Promise<MarkResult> {
    try {
      const response = await this.apiClient.patch(`${this.baseUrl}/marcar-todas-lidas`);
      if (isObject(response) && response.success) {
        return { success: true, data: response.data };
      }
      const message =
        (isObject(response) && typeof response.message === 'string' && response.message) ||
        'Erro ao marcar todas como lidas';
      throw new Error(message);
    } catch (error) {
      console.error('NotificationService: Erro ao marcar todas como lidas:', error);
      throw new Error(`Erro ao marcar todas como lidas: ${(error as Error).message}`);
    }
  }

  async acceptInvite(conviteId: number | string, personagemId: number): Promise<MarkResult> {
    try {
      if (!personagemId) {
        throw new Error('ID do personagem é obrigatório para aceitar convite');
      }
      const response = await this.apiClient.put(`/convites/${conviteId}/aceitar`, {
        personagem_id: personagemId,
      });
      if (isObject(response) && response.success) {
        return { success: true, data: response.data };
      }
      const message =
        (isObject(response) && typeof response.message === 'string' && response.message) ||
        'Erro ao aceitar convite';
      throw new Error(message);
    } catch (error) {
      console.error('NotificationService: Erro ao aceitar convite:', error);
      throw new Error(`Erro ao aceitar convite: ${(error as Error).message}`);
    }
  }

  async rejectInvite(conviteId: number | string): Promise<MarkResult> {
    try {
      const response = await this.apiClient.put(`/convites/${conviteId}/recusar`);
      if (isObject(response) && response.success) {
        return { success: true, data: response.data };
      }
      const message =
        (isObject(response) && typeof response.message === 'string' && response.message) ||
        'Erro ao recusar convite';
      throw new Error(message);
    } catch (error) {
      console.error('NotificationService: Erro ao rejeitar convite:', error);
      throw new Error(`Erro ao rejeitar convite: ${(error as Error).message}`);
    }
  }

  async getUnreadCount(): Promise<UnreadCountResult> {
    try {
      const response = await this.fetchNotifications({ limit: 1 });
      if (response.success) {
        const unreadCount = response.resumo?.total_novidades ?? 0;
        return { success: true, count: unreadCount };
      }
      throw new Error('Erro ao buscar contagem');
    } catch (error) {
      console.error('NotificationService: Erro ao buscar contagem:', error);
      throw new Error(`Erro ao buscar contagem: ${(error as Error).message}`);
    }
  }

  async fetchPendingInvites(params: PaginationParams = {}): Promise<PendingInvitesResult> {
    try {
      const response = await this.fetchNotifications({
        ...params,
        tipo: 'convite_historia',
        status: 'pendente',
      });
      if (response.success) {
        const data = response.data;
        const convites =
          isObject(data) && Array.isArray((data as { convites?: unknown }).convites)
            ? ((data as { convites: unknown[] }).convites)
            : [];
        return { success: true, convites, count: convites.length };
      }
      throw new Error('Erro ao buscar convites');
    } catch (error) {
      console.error('NotificationService: Erro ao buscar convites:', error);
      throw new Error(`Erro ao buscar convites: ${(error as Error).message}`);
    }
  }

  formatNotificationDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Agora há pouco';
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return date.toLocaleDateString('pt-BR');
  }

  validateNotification(notification: unknown): notification is Notification {
    if (!isObject(notification)) return false;
    return (
      notification.id !== undefined &&
      notification.id !== null &&
      typeof notification.tipo === 'string' &&
      typeof notification.criado_em === 'string'
    );
  }

  filterNotificationsByType(notifications: Notification[], type: string): Notification[] {
    return notifications.filter((notif) => notif.tipo === type);
  }

  groupNotificationsByDate(notifications: Notification[]): GroupedNotifications {
    const groups: GroupedNotifications = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: [],
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    notifications.forEach((notif) => {
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
