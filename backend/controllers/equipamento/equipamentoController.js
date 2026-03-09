import db from '../../Model/index.js';

class EquipamentoController {
  async listarEquipamentos(req, res) {
    try {
      const { limit, offset } = req.query;

      // Se limit foi enviado, paginar; senao retorna tudo
      if (limit !== undefined) {
        const parsedLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
        const parsedOffset = Math.max(parseInt(offset) || 0, 0);
        const result = await db.Equipamento.findPaginated({ limit: parsedLimit, offset: parsedOffset });
        return res.json({
          success: true,
          data: result.data,
          pagination: {
            total: result.total,
            limit: parsedLimit,
            offset: parsedOffset,
            hasMore: parsedOffset + result.data.length < result.total
          }
        });
      }

      const data = await db.Equipamento.findAll();
      res.json({
        success: true,
        data,
        pagination: { total: data.length, limit: data.length, offset: 0, hasMore: false }
      });
    } catch (error) {
      console.error('Erro ao listar equipamentos:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }

  async obterEquipamento(req, res) {
    try {
      const { id } = req.params;
      const equipamento = await db.Equipamento.findById(parseInt(id));
      if (!equipamento) return res.status(404).json({ success: false, error: 'Equipamento nao encontrado' });
      res.json({ success: true, data: equipamento });
    } catch (error) {
      console.error('Erro ao obter equipamento:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }

  async criarEquipamento(req, res) {
    try {
      const { nome } = req.body;
      if (!nome || !nome.trim()) return res.status(400).json({ success: false, error: 'Nome e obrigatorio' });

      const existe = await db.Equipamento.findByNome(nome);
      if (existe) return res.status(400).json({ success: false, error: 'Ja existe um equipamento com este nome' });

      const equipamento = await db.Equipamento.create(req.body);
      res.status(201).json({ success: true, message: 'Equipamento criado com sucesso', data: equipamento });
    } catch (error) {
      console.error('Erro ao criar equipamento:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }

  async atualizarEquipamento(req, res) {
    try {
      const { id } = req.params;
      const equipamento = await db.Equipamento.findById(parseInt(id));
      if (!equipamento) return res.status(404).json({ success: false, error: 'Equipamento nao encontrado' });

      const atualizado = await db.Equipamento.update(parseInt(id), req.body);
      res.json({ success: true, message: 'Equipamento atualizado com sucesso', data: atualizado });
    } catch (error) {
      console.error('Erro ao atualizar equipamento:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }

  async deletarEquipamento(req, res) {
    try {
      const { id } = req.params;
      const equipamento = await db.Equipamento.findById(parseInt(id));
      if (!equipamento) return res.status(404).json({ success: false, error: 'Equipamento nao encontrado' });

      await db.Equipamento.delete(parseInt(id));
      res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar equipamento:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }

  async buscarEquipamentos(req, res) {
    try {
      const { termo } = req.query;
      if (!termo) return res.status(400).json({ success: false, error: 'Parametro termo e obrigatorio' });

      const equipamentos = await db.Equipamento.search(termo);
      res.json({ success: true, data: equipamentos, total: equipamentos.length });
    } catch (error) {
      console.error('Erro ao buscar equipamentos:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
}

export default new EquipamentoController();
