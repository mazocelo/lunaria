import db from '../../Model/index.js';

class TemasController {
  async listarTemas(req, res) {
    try {
      const temas = await db.Temas.findAll();
      res.json({ success: true, data: temas, total: temas.length });
    } catch (error) {
      console.error('❌ Erro ao listar temas:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }

  async obterTema(req, res) {
    try {
      const { id } = req.params;
      const tema = await db.Temas.findById(parseInt(id));
      if (!tema) {
        return res.status(404).json({ success: false, error: 'Tema não encontrado' });
      }
      res.json({ success: true, data: tema });
    } catch (error) {
      console.error('❌ Erro ao obter tema:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }

  async criarTema(req, res) {
    try {
      const { nome, descricao } = req.body;
      if (!nome) {
        return res.status(400).json({ success: false, error: 'Nome é obrigatório' });
      }

      const existe = await db.Temas.exists(nome);
      if (existe) {
        return res.status(400).json({ success: false, error: 'Já existe um tema com este nome' });
      }

      const novoTema = await db.Temas.create({ nome, descricao: descricao || null });
      res.status(201).json({ success: true, message: 'Tema criado com sucesso', data: novoTema });
    } catch (error) {
      console.error('❌ Erro ao criar tema:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }

  async atualizarTema(req, res) {
    try {
      const { id } = req.params;
      const tema = await db.Temas.findById(parseInt(id));
      if (!tema) {
        return res.status(404).json({ success: false, error: 'Tema não encontrado' });
      }

      const { nome, descricao } = req.body;
      const dados = {};
      if (nome !== undefined) dados.nome = nome;
      if (descricao !== undefined) dados.descricao = descricao;

      const atualizado = await db.Temas.update(parseInt(id), dados);
      res.json({ success: true, message: 'Tema atualizado com sucesso', data: atualizado });
    } catch (error) {
      console.error('❌ Erro ao atualizar tema:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }

  async deletarTema(req, res) {
    try {
      const { id } = req.params;
      const tema = await db.Temas.findById(parseInt(id));
      if (!tema) {
        return res.status(404).json({ success: false, error: 'Tema não encontrado' });
      }
      await db.Temas.delete(parseInt(id));
      res.status(204).send();
    } catch (error) {
      console.error('❌ Erro ao deletar tema:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
}

export default new TemasController();
