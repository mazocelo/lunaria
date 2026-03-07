import express from 'express';
import db from '../database/db.js';

const router = express.Router();

// GET /catalogos/raridades
router.get('/raridades', async (req, res) => {
  try {
    const raridades = await db.prisma.raridades.findMany({ orderBy: { ordem: 'asc' } });
    res.json({ success: true, data: raridades });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /catalogos/categorias-equipamento
router.get('/categorias-equipamento', async (req, res) => {
  try {
    const categorias = await db.prisma.categorias_equipamento.findMany({ orderBy: { ordem: 'asc' } });
    res.json({ success: true, data: categorias });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
