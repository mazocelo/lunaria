import express from 'express';
import usageService from '../services/usageService.js';
import logger from '../helpers/logger.js';
const log = logger.child({ module: 'billing' });

const router = express.Router();

/**
 * GET /billing/usage
 * Retorna consumo do usuário logado
 * Query: ?from=2026-01-01&to=2026-03-10
 */
router.get('/usage', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'Não autenticado' });

    const { from, to } = req.query;
    const data = await usageService.getUsageByUser(userId, { from, to });

    res.json({ success: true, data });
  } catch (error) {
    log.error({ err: error }, 'Billing usage error');
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /billing/global
 * Retorna consumo global (admin only)
 * Query: ?from=2026-01-01&to=2026-03-10
 */
router.get('/global', async (req, res) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    if (!userId) return res.status(401).json({ success: false, error: 'Não autenticado' });
    if (role !== 'admin' && role !== 'superadmin') return res.status(403).json({ success: false, error: 'Acesso restrito a administradores' });

    const { from, to } = req.query;
    const data = await usageService.getUsageGlobal({ from, to });

    res.json({ success: true, data });
  } catch (error) {
    log.error({ err: error }, 'Billing global error');
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
