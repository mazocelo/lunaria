import db from '../../Model/index.js';
import logger from '../../helpers/logger.js';
import { normalizarJsonCatalogo } from '../../helpers/catalogJsonHelper.js';
const log = logger.child({ module: 'magiasTresDetController' });

class MagiasTresDetController {
  async listarMagias(req, res) {
    try {
      const { escola, tipo } = req.query;

      if (escola || tipo) {
        const data = await db.MagiasTresDet.buscarFiltrado({ escola, tipo });
        return res.json({ success: true, data });
      }

      const data = await db.MagiasTresDet.buscarTodos();
      res.json({ success: true, data });
    } catch (error) {
      log.error({ err: error }, 'Erro ao listar magias 3D&T');
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }

  async obterMagia(req, res) {
    try {
      const { id } = req.params;
      const magia = await db.MagiasTresDet.buscarPorId(parseInt(id));
      if (!magia) return res.status(404).json({ success: false, error: 'Magia nao encontrada' });
      res.json({ success: true, data: magia });
    } catch (error) {
      log.error({ err: error }, 'Erro ao obter magia 3D&T');
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }

  async criarMagia(req, res) {
    try {
      const { nome, descricao, escola, custo_pm, alcance, duracao } = req.body;

      if (!nome?.trim()) return res.status(400).json({ success: false, error: 'Nome e obrigatorio' });
      if (!descricao?.trim()) return res.status(400).json({ success: false, error: 'Descricao e obrigatoria' });
      if (!escola?.trim()) return res.status(400).json({ success: false, error: 'Escola e obrigatoria' });
      if (!custo_pm?.trim()) return res.status(400).json({ success: false, error: 'Custo PM e obrigatorio' });
      if (!alcance?.trim()) return res.status(400).json({ success: false, error: 'Alcance e obrigatorio' });
      if (!duracao?.trim()) return res.status(400).json({ success: false, error: 'Duracao e obrigatoria' });

      const existe = await db.MagiasTresDet.buscarPorNomeExato(nome);
      if (existe) return res.status(400).json({ success: false, error: 'Ja existe uma magia com este nome' });

      const dados = {
        nome: nome.trim(),
        descricao: descricao.trim(),
        escola: escola.trim(),
        custo_pm: custo_pm.trim(),
        alcance: alcance.trim(),
        duracao: duracao.trim(),
        tipo: req.body.tipo || 'dano',
        exigencias: req.body.exigencias || null,
        // Colunas Json: persiste sempre objeto/array (nunca string JSON).
        focus_requisito: normalizarJsonCatalogo(req.body.focus_requisito),
        efeito: normalizarJsonCatalogo(req.body.efeito),
        nivel_minimo: parseInt(req.body.nivel_minimo) || 1,
      };

      const magia = await db.MagiasTresDet.criar(dados);
      res.status(201).json({ success: true, message: 'Magia criada com sucesso', data: magia });
    } catch (error) {
      log.error({ err: error }, 'Erro ao criar magia 3D&T');
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }

  async atualizarMagia(req, res) {
    try {
      const { id } = req.params;
      const magia = await db.MagiasTresDet.buscarPorId(parseInt(id));
      if (!magia) return res.status(404).json({ success: false, error: 'Magia nao encontrada' });

      const dados = { ...req.body };

      // Trim string fields
      if (dados.nome !== undefined) dados.nome = dados.nome.trim();
      if (dados.descricao !== undefined) dados.descricao = dados.descricao.trim();
      if (dados.escola !== undefined) dados.escola = dados.escola.trim();
      if (dados.custo_pm !== undefined) dados.custo_pm = dados.custo_pm.trim();
      if (dados.alcance !== undefined) dados.alcance = dados.alcance.trim();
      if (dados.duracao !== undefined) dados.duracao = dados.duracao.trim();
      if (dados.exigencias !== undefined) dados.exigencias = dados.exigencias?.trim() || null;
      if (dados.nivel_minimo !== undefined) dados.nivel_minimo = parseInt(dados.nivel_minimo) || 1;
      // Colunas Json: nunca persistir string JSON.
      if (dados.focus_requisito !== undefined) dados.focus_requisito = normalizarJsonCatalogo(dados.focus_requisito);
      if (dados.efeito !== undefined) dados.efeito = normalizarJsonCatalogo(dados.efeito);

      const atualizado = await db.MagiasTresDet.atualizar(parseInt(id), dados);
      res.json({ success: true, message: 'Magia atualizada com sucesso', data: atualizado });
    } catch (error) {
      log.error({ err: error }, 'Erro ao atualizar magia 3D&T');
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }

  async deletarMagia(req, res) {
    try {
      const { id } = req.params;
      const magia = await db.MagiasTresDet.buscarPorId(parseInt(id));
      if (!magia) return res.status(404).json({ success: false, error: 'Magia nao encontrada' });

      await db.MagiasTresDet.deletar(parseInt(id));
      res.status(204).send();
    } catch (error) {
      log.error({ err: error }, 'Erro ao deletar magia 3D&T');
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
}

export default new MagiasTresDetController();
