import express from 'express';
import mestreController from '../controllers/mestre/mestreController.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateMestreCriacao, validateMestreAtualizacao, handleValidationErrors, validateIdParam } from '../helpers/validators.js';

const router = express.Router();

// POST / - Criar mestre
router.post('/', validateMestreCriacao, handleValidationErrors, asyncHandler(mestreController.criarMestre));

// GET / - Listar mestres do usuário
router.get('/', asyncHandler(mestreController.listarMestres));

// GET /:id - Obter mestre por ID
router.get('/:id', validateIdParam, handleValidationErrors, asyncHandler(mestreController.obterMestre));

// PUT /:id - Atualizar mestre
router.put('/:id', validateIdParam, validateMestreAtualizacao, handleValidationErrors, asyncHandler(mestreController.atualizarMestre));

// DELETE /:id - Excluir mestre (soft delete)
router.delete('/:id', validateIdParam, handleValidationErrors, asyncHandler(mestreController.excluirMestre));

export default router;
