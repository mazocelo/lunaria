import express from 'express';
import itensTresDetController from '../controllers/itensTresdet/itensTresDetController.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticateToken, requireSuperAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', asyncHandler(itensTresDetController.listarItens));
router.get('/:id', asyncHandler(itensTresDetController.obterItem));
router.post('/', authenticateToken, requireSuperAdmin, asyncHandler(itensTresDetController.criarItem));
router.put('/:id', authenticateToken, requireSuperAdmin, asyncHandler(itensTresDetController.atualizarItem));
router.delete('/:id', authenticateToken, requireSuperAdmin, asyncHandler(itensTresDetController.deletarItem));

export default router;
