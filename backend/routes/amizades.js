import express from 'express';
import amizadeController from '../controllers/amizade/amizadeController.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Listar amigos
router.get('/', asyncHandler(amizadeController.listarAmigos));

// Listar solicitacoes pendentes recebidas
router.get('/pendentes', asyncHandler(amizadeController.listarPendentes));

// Sugestoes baseadas em historias em comum
router.get('/sugestoes', asyncHandler(amizadeController.listarSugestoes));

// Pesquisar usuarios por nome ou email
router.get('/pesquisar', asyncHandler(amizadeController.pesquisarUsuarios));

// Enviar solicitacao de amizade
router.post('/', asyncHandler(amizadeController.enviarSolicitacao));

// Aceitar solicitacao
router.put('/:id/aceitar', asyncHandler(amizadeController.aceitarSolicitacao));

// Rejeitar solicitacao
router.put('/:id/rejeitar', asyncHandler(amizadeController.rejeitarSolicitacao));

// Bloquear usuario
router.put('/:id/bloquear', asyncHandler(amizadeController.bloquearUsuario));

// Remover amizade
router.delete('/:id', asyncHandler(amizadeController.removerAmizade));

export default router;
