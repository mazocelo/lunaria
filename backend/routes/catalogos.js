import express from 'express';
import db from '../Model/index.js';

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

// GET /catalogos/categorias-monstro
router.get('/categorias-monstro', async (req, res) => {
  try {
    const categorias = await db.prisma.categorias_monstro.findMany({ orderBy: { ordem: 'asc' } });
    res.json({ success: true, data: categorias });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /catalogos/habilidades?classe_id=X&nivel=Y
// Retorna habilidades da classe + genéricas (classe_id null)
router.get('/habilidades', async (req, res) => {
  try {
    const { classe_id, nivel } = req.query;
    const where = {};
    if (classe_id) {
      where.OR = [
        { classe_id: parseInt(classe_id) },
        { classe_id: null }
      ];
    }
    if (nivel) where.nivel_requerido = { lte: parseInt(nivel) };
    const habilidades = await db.prisma.habilidades.findMany({
      where,
      orderBy: [{ nivel_requerido: 'asc' }, { nome: 'asc' }],
      include: { classe: { select: { nome: true } } }
    });
    res.json({ success: true, data: habilidades });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
