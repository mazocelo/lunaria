import express from 'express';
import mestreController from '../controllers/mestre/mestreController.js';

const router = express.Router();

// POST / - Criar mestre
router.post('/', mestreController.criarMestre);

// GET / - Listar mestres do usuário
router.get('/', mestreController.listarMestres);

// GET /:id - Obter mestre por ID
router.get('/:id', mestreController.obterMestre);

// PUT /:id - Atualizar mestre
router.put('/:id', mestreController.atualizarMestre);

// DELETE /:id - Excluir mestre (soft delete)
router.delete('/:id', mestreController.excluirMestre);

export default router;
