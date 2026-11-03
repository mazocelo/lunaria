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

  async criarItem(req, res) {
    try {
      const { nome, tipo } = req.body;
      if (!nome || !nome.trim()) return res.status(400).json({ success: false, error: 'Nome e obrigatorio' });
      if (!tipo || !tipo.trim()) return res.status(400).json({ success: false, error: 'Tipo e obrigatorio' });

      const existe = await db.ItensTresDet.buscarPorNome(nome);
      if (existe) return res.status(400).json({ success: false, error: 'Ja existe um item com este nome' });

      const dados = {
        nome: nome.trim(),
        tipo: tipo.trim(),
        descricao: req.body.descricao || null,
        custo_pe: req.body.custo_pe != null ? parseInt(req.body.custo_pe) : 0,
        preco_moedas: req.body.preco_moedas != null ? parseInt(req.body.preco_moedas) : 0,
        poderes: req.body.poderes || null,
        efeito: req.body.efeito || null,
        empilhavel: req.body.empilhavel ?? false,
        raridade: req.body.raridade || null,
        imagem: req.body.imagem || null,
        magia_vinculada: req.body.magia_vinculada || null,
      };

      const item = await db.ItensTresDet.criar(dados);
      res.status(201).json({ success: true, message: 'Item criado com sucesso', data: item });
    } catch (error) {
      log.error({ err: error }, 'Erro ao criar item 3D&T');
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }

  async atualizarItem(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ success: false, error: 'ID invalido' });
      }

      const item = await db.ItensTresDet.buscarPorId(id);
      if (!item) return res.status(404).json({ success: false, error: 'Item nao encontrado' });

      const dados = {};
      if (req.body.nome !== undefined) dados.nome = req.body.nome.trim();
      if (req.body.tipo !== undefined) dados.tipo = req.body.tipo.trim();
      if (req.body.descricao !== undefined) dados.descricao = req.body.descricao || null;
      if (req.body.custo_pe !== undefined) dados.custo_pe = parseInt(req.body.custo_pe) || 0;
      if (req.body.preco_moedas !== undefined) dados.preco_moedas = parseInt(req.body.preco_moedas) || 0;
      if (req.body.poderes !== undefined) dados.poderes = req.body.poderes || null;
      if (req.body.efeito !== undefined) dados.efeito = req.body.efeito || null;
      if (req.body.empilhavel !== undefined) dados.empilhavel = req.body.empilhavel;
      if (req.body.raridade !== undefined) dados.raridade = req.body.raridade || null;
      if (req.body.imagem !== undefined) dados.imagem = req.body.imagem || null;
      if (req.body.magia_vinculada !== undefined) dados.magia_vinculada = req.body.magia_vinculada || null;

      const atualizado = await db.ItensTresDet.atualizar(id, dados);
      res.json({ success: true, message: 'Item atualizado com sucesso', data: atualizado });
    } catch (error) {
      log.error({ err: error }, 'Erro ao atualizar item 3D&T');
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }

  async deletarItem(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ success: false, error: 'ID invalido' });
      }

      const item = await db.ItensTresDet.buscarPorId(id);
      if (!item) return res.status(404).json({ success: false, error: 'Item nao encontrado' });

      await db.ItensTresDet.deletar(id);
      res.status(204).send();
    } catch (error) {
      log.error({ err: error }, 'Erro ao deletar item 3D&T');
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
}

export default new ItensTresDetController();
