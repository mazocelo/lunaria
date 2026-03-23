import db from '../../Model/index.js';
import logger from '../../helpers/logger.js';
const log = logger.child({ module: 'itensTresDetController' });

class ItensTresDetController {
  async listarItens(req, res) {
    try {
      const itens = await db.ItensTresDet.buscarTodos();
      res.json({ success: true, data: itens });
    } catch (error) {
      log.error({ err: error }, 'Erro ao listar itens 3D&T');
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }

  async obterItem(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ success: false, error: 'ID invalido' });
      }

      const item = await db.ItensTresDet.buscarPorId(id);
      if (!item) return res.status(404).json({ success: false, error: 'Item nao encontrado' });

      res.json({ success: true, data: item });
    } catch (error) {
      log.error({ err: error }, 'Erro ao obter item 3D&T');
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
}

export default new ItensTresDetController();
