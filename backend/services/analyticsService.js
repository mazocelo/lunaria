/**
 * Analytics Service — fire-and-forget event tracking
 *
 * Usage: analyticsService.track('ai_response', { duration_ms: 1200, fallback: false }, userId);
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const analyticsService = {
  /**
   * Track an analytics event (non-blocking)
   * @param {string} tipo - Event type (e.g., 'ai_response', 'sessao_inicio', 'level_up')
   * @param {object} dados - Event data (JSON)
   * @param {number|null} userId - Optional user ID
   */
  track(tipo, dados = {}, userId = null) {
    prisma.analytics_eventos.create({
      data: {
        tipo,
        dados,
        user_id: userId ? parseInt(userId) : null,
      }
    }).catch(err => {
      console.warn('⚠️ Analytics: Erro ao salvar evento:', err.message);
    });
  },

  /**
   * Query aggregated analytics (for admin dashboard)
   */
  async getAggregations({ from, to } = {}) {
    const where = {};
    if (from || to) {
      where.criado_em = {};
      if (from) where.criado_em.gte = new Date(from);
      if (to) where.criado_em.lte = new Date(to);
    }

    const [totalEventos, eventosPorTipo, eventosRecentes] = await Promise.all([
      prisma.analytics_eventos.count({ where }),
      prisma.analytics_eventos.groupBy({
        by: ['tipo'],
        _count: true,
        where,
        orderBy: { _count: { tipo: 'desc' } },
        take: 20,
      }),
      prisma.analytics_eventos.findMany({
        where,
        orderBy: { criado_em: 'desc' },
        take: 50,
      }),
    ]);

    return {
      totalEventos,
      porTipo: eventosPorTipo.map(e => ({ tipo: e.tipo, count: e._count })),
      recentes: eventosRecentes,
    };
  },
};

export default analyticsService;
