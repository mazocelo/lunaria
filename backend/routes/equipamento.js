import express from 'express';
import equipamentoController from '../controllers/equipamento/equipamentoController.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticateToken, requireSuperAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', asyncHandler(equipamentoController.listarEquipamentos));
router.get('/buscar', asyncHandler(equipamentoController.buscarEquipamentos));
router.get('/:id', asyncHandler(equipamentoController.obterEquipamento));
router.post('/', authenticateToken, requireSuperAdmin, asyncHandler(equipamentoController.criarEquipamento));
router.put('/:id', authenticateToken, requireSuperAdmin, asyncHandler(equipamentoController.atualizarEquipamento));
router.delete('/:id', authenticateToken, requireSuperAdmin, asyncHandler(equipamentoController.deletarEquipamento));

export default router;
