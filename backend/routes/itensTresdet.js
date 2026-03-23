import express from 'express';
import itensTresDetController from '../controllers/itensTresdet/itensTresDetController.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

router.get('/', asyncHandler(itensTresDetController.listarItens));
router.get('/:id', asyncHandler(itensTresDetController.obterItem));

export default router;
