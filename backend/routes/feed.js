import express from 'express';
import feedController from '../controllers/feed/feedController.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Listar feed (query: ?tab=amigos|comunidade&limit&offset)
router.get('/', asyncHandler(feedController.listarFeed));

// Criar post
router.post('/', asyncHandler(feedController.criarPost));

// Deletar post
router.delete('/:id', asyncHandler(feedController.deletarPost));

// Toggle curtida
router.post('/:id/curtir', asyncHandler(feedController.curtir));

// Listar comentarios de um post
router.get('/:id/comentarios', asyncHandler(feedController.listarComentarios));

// Adicionar comentario
router.post('/:id/comentarios', asyncHandler(feedController.comentar));

// Deletar comentario
router.delete('/comentarios/:id', asyncHandler(feedController.deletarComentario));

export default router;
