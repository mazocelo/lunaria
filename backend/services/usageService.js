/**
 * Usage Service — rastreamento de consumo de APIs externas
 *
 * Fire-and-forget para tracking (não bloqueia fluxo principal)
 * Queries síncronas para billing dashboard
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Custos estimados por provider (USD)
const COST_TABLE = {
  groq: {
    input_per_million: 0.11,   // Llama 4 Scout
    output_per_million: 0.34,
  },
  gemini: {
    input_per_million: 0.15,   // Flash
    output_per_million: 0.60,
  },
  elevenlabs: {
    per_1000_chars: 0.30,
  },
  cartesia: {
    per_1000_chars: 0.05,
  },
  leonardo: {
    per_image: 0.02,
  },
  anthropic: {
    input_per_million: 3.00,   // Sonnet 4.5
    output_per_million: 15.00,
  },
};

function estimateCost({ provider, tipo, input_tokens, output_tokens, caracteres }) {
  const table = COST_TABLE[provider];
  if (!table) return 0;

  if ((tipo === 'text' || tipo === 'blueprint') && table.input_per_million) {
    const inputCost = ((input_tokens || 0) / 1_000_000) * table.input_per_million;
    const outputCost = ((output_tokens || 0) / 1_000_000) * table.output_per_million;
    return parseFloat((inputCost + outputCost).toFixed(6));
  }

  if (tipo === 'tts' && table.per_1000_chars) {
    return parseFloat((((caracteres || 0) / 1000) * table.per_1000_chars).toFixed(6));
  }

  if (tipo === 'image' && table.per_image) {
    return table.per_image;
  }

  return 0;
}

async function _queryDailyUsage(userId, from, to) {
  try {
    const where = { user_id: userId };
    if (from || to) {
      where.criado_em = {};
      if (from) where.criado_em.gte = new Date(from);
      if (to) where.criado_em.lte = new Date(to);
    }
    const records = await prisma.api_usage.findMany({
      where,
      select: { criado_em: true, custo_usd: true, input_tokens: true, output_tokens: true },
      orderBy: { criado_em: 'desc' },
      take: 5000,
    });
    const byDay = {};
    for (const r of records) {
      const dia = r.criado_em.toISOString().slice(0, 10);
      if (!byDay[dia]) byDay[dia] = { dia, custo: 0, chamadas: 0, tokens: 0 };
      byDay[dia].custo += r.custo_usd || 0;
      byDay[dia].chamadas += 1;
      byDay[dia].tokens += (r.input_tokens || 0) + (r.output_tokens || 0);
    }
    return Object.values(byDay).sort((a, b) => b.dia.localeCompare(a.dia)).slice(0, 90);
  } catch { return []; }
}

const usageService = {
  /**
   * Track API usage (fire-and-forget)
   * @param {object} params
   * @param {number} params.userId
   * @param {string} params.provider - "groq", "gemini", "elevenlabs", "cartesia", "leonardo"
   * @param {string} params.tipo - "text", "tts", "image"
   * @param {string} [params.modelo]
   * @param {number} [params.input_tokens]
   * @param {number} [params.output_tokens]
   * @param {number} [params.caracteres]
   * @param {number} [params.custo_usd] - override auto-calculated cost
   * @param {number} [params.duracao_ms]
   * @param {object} [params.metadata]
   */
  track({ userId, provider, tipo, modelo, input_tokens, output_tokens, caracteres, custo_usd, duracao_ms, metadata }) {
    const cost = custo_usd ?? estimateCost({ provider, tipo, input_tokens, output_tokens, caracteres });

    prisma.api_usage.create({
      data: {
        user_id: parseInt(userId),
        provider,
        tipo,
        modelo: modelo || null,
        input_tokens: input_tokens || null,
        output_tokens: output_tokens || null,
        caracteres: caracteres || null,
        custo_usd: cost,
        duracao_ms: duracao_ms || null,
        metadata: metadata || {},
      }
    }).catch(err => {
      console.warn('Usage tracking error:', err.message);
    });
  },

  /**
   * Get usage for a specific user
   */
  async getUsageByUser(userId, { from, to } = {}) {
    const where = { user_id: parseInt(userId) };
    if (from || to) {
      where.criado_em = {};
      if (from) where.criado_em.gte = new Date(from);
      if (to) where.criado_em.lte = new Date(to);
    }

    const [porProvider, porTipo, porDia, totais] = await Promise.all([
      prisma.api_usage.groupBy({
        by: ['provider'],
        where,
        _sum: { input_tokens: true, output_tokens: true, caracteres: true, custo_usd: true },
        _count: true,
      }),
      prisma.api_usage.groupBy({
        by: ['tipo'],
        where,
        _sum: { input_tokens: true, output_tokens: true, caracteres: true, custo_usd: true },
        _count: true,
      }),
      _queryDailyUsage(parseInt(userId), from, to),
      prisma.api_usage.aggregate({
        where,
        _sum: { input_tokens: true, output_tokens: true, caracteres: true, custo_usd: true },
        _count: true,
      }),
    ]);

    return {
      totais: {
        chamadas: totais._count,
        input_tokens: totais._sum.input_tokens || 0,
        output_tokens: totais._sum.output_tokens || 0,
        caracteres: totais._sum.caracteres || 0,
        custo_usd: totais._sum.custo_usd || 0,
      },
      porProvider: porProvider.map(p => ({
        provider: p.provider,
        chamadas: p._count,
        input_tokens: p._sum.input_tokens || 0,
        output_tokens: p._sum.output_tokens || 0,
        caracteres: p._sum.caracteres || 0,
        custo_usd: p._sum.custo_usd || 0,
      })),
      porTipo: porTipo.map(t => ({
        tipo: t.tipo,
        chamadas: t._count,
        input_tokens: t._sum.input_tokens || 0,
        output_tokens: t._sum.output_tokens || 0,
        caracteres: t._sum.caracteres || 0,
        custo_usd: t._sum.custo_usd || 0,
      })),
      porDia,
    };
  },

  /**
   * Get global usage (admin)
   */
  async getUsageGlobal({ from, to } = {}) {
    const where = {};
    if (from || to) {
      where.criado_em = {};
      if (from) where.criado_em.gte = new Date(from);
      if (to) where.criado_em.lte = new Date(to);
    }

    const [porProvider, porTipo, porUsuario, totais] = await Promise.all([
      prisma.api_usage.groupBy({
        by: ['provider'],
        where,
        _sum: { input_tokens: true, output_tokens: true, caracteres: true, custo_usd: true },
        _count: true,
      }),
      prisma.api_usage.groupBy({
        by: ['tipo'],
        where,
        _sum: { input_tokens: true, output_tokens: true, caracteres: true, custo_usd: true },
        _count: true,
      }),
      prisma.api_usage.groupBy({
        by: ['user_id'],
        where,
        _sum: { custo_usd: true },
        _count: true,
        orderBy: { _sum: { custo_usd: 'desc' } },
        take: 50,
      }),
      prisma.api_usage.aggregate({
        where,
        _sum: { input_tokens: true, output_tokens: true, caracteres: true, custo_usd: true },
        _count: true,
      }),
    ]);

    // Resolve user names
    const userIds = porUsuario.map(u => u.user_id);
    const users = userIds.length > 0
      ? await prisma.usuarios.findMany({ where: { id: { in: userIds } }, select: { id: true, nome: true } })
      : [];
    const userMap = Object.fromEntries(users.map(u => [u.id, u.nome]));

    return {
      totais: {
        chamadas: totais._count,
        input_tokens: totais._sum.input_tokens || 0,
        output_tokens: totais._sum.output_tokens || 0,
        caracteres: totais._sum.caracteres || 0,
        custo_usd: totais._sum.custo_usd || 0,
      },
      porProvider: porProvider.map(p => ({
        provider: p.provider,
        chamadas: p._count,
        input_tokens: p._sum.input_tokens || 0,
        output_tokens: p._sum.output_tokens || 0,
        caracteres: p._sum.caracteres || 0,
        custo_usd: p._sum.custo_usd || 0,
      })),
      porTipo: porTipo.map(t => ({
        tipo: t.tipo,
        chamadas: t._count,
        custo_usd: t._sum.custo_usd || 0,
      })),
      porUsuario: porUsuario.map(u => ({
        user_id: u.user_id,
        nome: userMap[u.user_id] || 'Desconhecido',
        chamadas: u._count,
        custo_usd: u._sum.custo_usd || 0,
      })),
    };
  },
};

export default usageService;
