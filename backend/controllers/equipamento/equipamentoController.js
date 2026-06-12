import db from '../../Model/index.js';
import { BonusEquipSchema, RequisitosEquipSchema, VinculoSchema, validateJson } from '../../helpers/jsonSchemas.js';
import { normalizarBonusCombate, normalizarRequisitos } from '../../helpers/catalogJsonHelper.js';
import { getAvailableSystems } from '../../game-systems/index.js';
import logger from '../../helpers/logger.js';
const log = logger.child({ module: 'equipamentoController' });

function serializeEquipamento(item) {
  return {
    ...item,
    bonus: normalizarBonusCombate(item?.bonus) || item?.bonus || {},
    requisitos: normalizarRequisitos(item?.requisitos),
  };
}

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
          data: result.data.map(serializeEquipamento),
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
        data: data.map(serializeEquipamento),
        pagination: { total: data.length, limit: data.length, offset: 0, hasMore: false }
      });
    } catch (error) {
      log.error({ err: error }, 'Erro ao listar equipamentos');
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }

  async obterEquipamento(req, res) {
    try {
      const { id } = req.params;
      const equipamento = await db.Equipamento.findById(parseInt(id));
      if (!equipamento) return res.status(404).json({ success: false, error: 'Equipamento nao encontrado' });
      res.json({ success: true, data: serializeEquipamento(equipamento) });
    } catch (error) {
      log.error({ err: error }, 'Erro ao obter equipamento');
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }

  async criarEquipamento(req, res) {
    try {
      const { nome } = req.body;
      if (!nome || !nome.trim()) return res.status(400).json({ success: false, error: 'Nome e obrigatorio' });

      const sistema = req.body.sistema || 'lunaria';
      if (!getAvailableSystems().includes(sistema)) {
        return res.status(400).json({ success: false, error: `sistema invalido. Use um de: ${getAvailableSystems().join(', ')}` });
      }

      const existe = await db.Equipamento.findByNome(nome, sistema);
      if (existe) return res.status(400).json({ success: false, error: 'Ja existe um equipamento com este nome' });

      // Validar campos JSON
      const dados = { ...req.body };
      if (dados.bonus !== undefined) {
        const v = validateJson(BonusEquipSchema, dados.bonus);
        if (!v.success) return res.status(400).json({ success: false, error: `bonus invalido: ${v.error}` });
        dados.bonus = normalizarBonusCombate(v.data) || v.data;
      }
      if (dados.requisitos !== undefined) {
        const v = validateJson(RequisitosEquipSchema, dados.requisitos);
        if (!v.success) return res.status(400).json({ success: false, error: `requisitos invalido: ${v.error}` });
        dados.requisitos = normalizarRequisitos(v.data);
      }
      if (dados.vinculo !== undefined) {
        const v = validateJson(VinculoSchema, dados.vinculo);
        if (!v.success) return res.status(400).json({ success: false, error: `vinculo invalido: ${v.error}` });
        dados.vinculo = v.data;
      }

      const equipamento = await db.Equipamento.create(dados);
      res.status(201).json({ success: true, message: 'Equipamento criado com sucesso', data: serializeEquipamento(equipamento) });
    } catch (error) {
      log.error({ err: error }, 'Erro ao criar equipamento');
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }

  async atualizarEquipamento(req, res) {
    try {
      const { id } = req.params;
      const equipamento = await db.Equipamento.findById(parseInt(id));
      if (!equipamento) return res.status(404).json({ success: false, error: 'Equipamento nao encontrado' });

      // Validar campos JSON
      const dados = { ...req.body };
      if (dados.bonus !== undefined) {
        const v = validateJson(BonusEquipSchema, dados.bonus);
        if (!v.success) return res.status(400).json({ success: false, error: `bonus invalido: ${v.error}` });
        dados.bonus = normalizarBonusCombate(v.data) || v.data;
      }
      if (dados.requisitos !== undefined) {
        const v = validateJson(RequisitosEquipSchema, dados.requisitos);
        if (!v.success) return res.status(400).json({ success: false, error: `requisitos invalido: ${v.error}` });
        dados.requisitos = normalizarRequisitos(v.data);
      }
      if (dados.vinculo !== undefined) {
        const v = validateJson(VinculoSchema, dados.vinculo);
        if (!v.success) return res.status(400).json({ success: false, error: `vinculo invalido: ${v.error}` });
        dados.vinculo = v.data;
      }

      const atualizado = await db.Equipamento.update(parseInt(id), dados);
      res.json({ success: true, message: 'Equipamento atualizado com sucesso', data: serializeEquipamento(atualizado) });
    } catch (error) {
      log.error({ err: error }, 'Erro ao atualizar equipamento');
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
      log.error({ err: error }, 'Erro ao deletar equipamento');
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
      log.error({ err: error }, 'Erro ao buscar equipamentos');
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
}

export default new EquipamentoController();
