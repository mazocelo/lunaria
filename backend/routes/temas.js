import express from 'express';
import temasController from '../controllers/temas/temasController.js';
import { authenticateToken, requireSuperAdmin } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

router.get('/', asyncHandler(temasController.listarTemas));
router.get('/:id', asyncHandler(temasController.obterTema));
router.post('/', authenticateToken, requireSuperAdmin, asyncHandler(temasController.criarTema));
router.put('/:id', authenticateToken, requireSuperAdmin, asyncHandler(temasController.atualizarTema));
router.delete('/:id', authenticateToken, requireSuperAdmin, asyncHandler(temasController.deletarTema));

export default router;
