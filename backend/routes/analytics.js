import express from 'express';
import { authenticateToken, requireSuperAdmin } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import analyticsService from '../services/analyticsService.js';

const router = express.Router();

/**
 * GET /analytics — Dashboard de analytics (superadmin only)
 */
router.get('/', authenticateToken, requireSuperAdmin, asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const data = await analyticsService.getAggregations({ from, to });
  res.json({ success: true, data });
}));

export default router;
