import express from 'express';
import equipamentoController from '../controllers/equipamento/equipamentoController.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireSuperAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', asyncHandler(equipamentoController.listarEquipamentos));
router.get('/buscar', asyncHandler(equipamentoController.buscarEquipamentos));
router.get('/:id', asyncHandler(equipamentoController.obterEquipamento));
router.post('/', requireSuperAdmin, asyncHandler(equipamentoController.criarEquipamento));
router.put('/:id', requireSuperAdmin, asyncHandler(equipamentoController.atualizarEquipamento));
router.delete('/:id', requireSuperAdmin, asyncHandler(equipamentoController.deletarEquipamento));

export default router;
