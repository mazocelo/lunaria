import express from 'express';
import { authenticateToken, requireSuperAdmin } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import db from '../Model/index.js';
import gerenciadorSessoes from '../redis/sessoes.js';
import { AI_JOB_STATUS } from '../jobs/aiJobs.js';
import { getRoteiroQueue } from '../jobs/roteiroQueue.js';
import { getBullmqPrefix } from '../jobs/connection.js';

const router = express.Router();

// GET /admin/motor/sessoes — listar sessões ativas com estado de turno
router.get('/sessoes', authenticateToken, requireSuperAdmin, asyncHandler(async (req, res) => {
  const sessoes = await gerenciadorSessoes.listarSessoesAtivas();

  const resumo = sessoes.map(s => ({
    id: s.id,
    status: s.status,
    criadaEm: s.criadaEm,
    atualizadaEm: s.atualizadaEm,
    jogadoresCount: Object.keys(s.jogadores || {}).length,
    estadoJogo: {
      fase: s.estadoJogo?.fase || null,
      turnoAtual: s.estadoJogo?.turnoAtual ?? null,
      rodadaAtual: s.estadoJogo?.rodadaAtual ?? null,
      testesPendentesCount: (s.estadoJogo?.testesPendentes || []).length,
      combateAtivo: !!s.estadoJogo?.combate?.ativo
    },
    mensagensCount: (s.mensagens || []).length,
    resumosCount: (s.resumos || []).length
  }));

  res.json({ success: true, data: { sessoes: resumo, total: resumo.length } });
}));

// GET /admin/motor/sessoes/:roomId — dump completo de uma sessão
router.get('/sessoes/:roomId', authenticateToken, requireSuperAdmin, asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const sessao = await gerenciadorSessoes.obterSessao(roomId);

  if (!sessao) {
    return res.status(404).json({ success: false, error: 'Sessao nao encontrada' });
  }

  res.json({
    success: true,
    data: {
      id: sessao.id,
      status: sessao.status,
      criadaEm: sessao.criadaEm,
      atualizadaEm: sessao.atualizadaEm,
      jogadores: sessao.jogadores,
      estadoJogo: sessao.estadoJogo,
      mestreContexto: sessao.mestreContexto || sessao.estadoJogo?.mestreContexto || null,
      resumos: sessao.resumos || [],
      mensagensCount: (sessao.mensagens || []).length,
      ultimasMensagens: (sessao.mensagens || []).slice(-20)
    }
  });
}));

// GET /admin/motor/jobs — consultar ai_jobs com filtro e paginação
router.get('/jobs', authenticateToken, requireSuperAdmin, asyncHandler(async (req, res) => {
  const { status, queue, entity_type, page = '1', limit = '20' } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const where = {};
  if (status) where.status = status;
  if (queue) where.queue = queue;
  if (entity_type) where.entity_type = entity_type;

  const [jobs, total] = await Promise.all([
    db.prisma.ai_jobs.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take: limitNum
    }),
    db.prisma.ai_jobs.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      jobs,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
    }
  });
}));

// POST /admin/motor/jobs/:id/retry — reprocessar job falhado
router.post('/jobs/:id/retry', authenticateToken, requireSuperAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const job = await db.prisma.ai_jobs.findUnique({ where: { id } });

  if (!job) {
    return res.status(404).json({ success: false, error: 'Job nao encontrado' });
  }

  if (job.status !== AI_JOB_STATUS.FAILED) {
    return res.status(400).json({
      success: false,
      error: `Apenas jobs com status "failed" podem ser reprocessados. Status atual: ${job.status}`
    });
  }

  // Reset job para estado de fila
  await db.prisma.ai_jobs.update({
    where: { id },
    data: {
      status: AI_JOB_STATUS.QUEUED,
      last_error: null,
      started_at: null,
      finished_at: null,
      attempts_made: 0,
      bullmq_job_id: null
    }
  });

  // Re-enfileirar no BullMQ (padrão de enqueueRoteiroJob.js:120-134)
  if (job.queue === 'roteiro' && job.request_payload) {
    const queue = getRoteiroQueue();
    const payload = typeof job.request_payload === 'string'
      ? JSON.parse(job.request_payload)
      : job.request_payload;

    await queue.add('generate', {
      aiJobId: job.id,
      historiaId: parseInt(payload.historiaId, 10),
      userId: payload.userId,
      mode: payload.mode
    }, {
      jobId: job.id
    });

    await db.prisma.ai_jobs.update({
      where: { id },
      data: { bullmq_job_id: job.id }
    });
  }

  const updatedJob = await db.prisma.ai_jobs.findUnique({ where: { id } });

  res.json({
    success: true,
    data: { job: updatedJob },
    message: 'Job reenfileirado com sucesso'
  });
}));

// GET /admin/motor/worker/health — verificar se worker esta vivo via Redis heartbeat
router.get('/worker/health', authenticateToken, requireSuperAdmin, asyncHandler(async (req, res) => {
  await gerenciadorSessoes.initialize();
  const redis = gerenciadorSessoes.client;
  const heartbeatKey = `${getBullmqPrefix()}:worker:heartbeat`;

  const raw = await redis.get(heartbeatKey);

  if (!raw) {
    return res.status(503).json({
      success: false,
      data: {
        status: 'offline',
        message: 'Worker heartbeat nao encontrado ou expirado'
      }
    });
  }

  const heartbeat = JSON.parse(raw);
  const ageMs = Date.now() - heartbeat.ts;

  res.json({
    success: true,
    data: {
      status: ageMs < 90_000 ? 'healthy' : 'stale',
      uptime: heartbeat.uptime,
      pid: heartbeat.pid,
      lastHeartbeat: new Date(heartbeat.ts).toISOString(),
      ageMs
    }
  });
}));

export default router;
