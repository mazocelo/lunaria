import express from 'express';
import { gerarImagem } from '../controllers/imageController.js';

const router = express.Router();

router.post('/generate', gerarImagem);

export default router;
