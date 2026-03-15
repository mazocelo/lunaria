import db from '../../Model/index.js';
import logger from '../../helpers/logger.js';
import { serializarBonusEntidade, serializarClasseOuRaca } from '../../helpers/catalogJsonHelper.js';

const log = logger.child({ module: 'classeController' });

function validateBonusPayload(body = {}) {
  const raw = body.bonus !== undefined ? body.bonus : body.atributos_bonus;
  if (raw === undefined || raw === null || raw === '') return { value: null };
  const serialized = serializarBonusEntidade(raw);
  if (!serialized) return { error: 'bonus/atributos_bonus deve ser um objeto JSON valido' };
  return { value: serialized };
}

class ClasseController {
  async criarClasse(req, res) {
    try {
      log.info({ body: req.body }, 'Criando nova classe');

      const { nome, custo = 0, descricao = null } = req.body;

      if (!nome) {
        return res.status(400).json({ error: 'Nome e obrigatorio' });
      }
      if (custo < 0) {
        return res.status(400).json({ error: 'Custo deve ser maior ou igual a 0' });
      }

      const classeExistente = await db.Classe.findByNome(nome);
      if (classeExistente) {
        return res.status(400).json({ error: 'Ja existe uma classe com este nome' });
      }

      const bonus = validateBonusPayload(req.body);
      if (bonus.error) return res.status(400).json({ error: bonus.error });

      const novaClasse = await db.Classe.create({
        nome,
        custo,
        descricao,
        bonus: bonus.value,
      });

      res.status(201).json({
        success: true,
        message: 'Classe criada com sucesso',
        data: serializarClasseOuRaca(novaClasse)
      });
    } catch (error) {
      log.error({ err: error }, 'Erro ao criar classe');
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async listarClasses(req, res) {
    try {
      const { limit, offset } = req.query;

      if (limit !== undefined) {
        const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
        const parsedOffset = Math.max(parseInt(offset, 10) || 0, 0);
        const result = await db.Classe.findPaginated({ limit: parsedLimit, offset: parsedOffset });
        return res.status(200).json({
          success: true,
          data: result.data.map(serializarClasseOuRaca),
          pagination: {
            total: result.total,
            limit: parsedLimit,
            offset: parsedOffset,
            hasMore: parsedOffset + result.data.length < result.total
          }
        });
      }

      const data = await db.Classe.findAll();
      res.status(200).json({
        success: true,
        data: data.map(serializarClasseOuRaca),
        pagination: { total: data.length, limit: data.length, offset: 0, hasMore: false }
      });
    } catch (error) {
      log.error({ err: error }, 'Erro ao listar classes');
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async obterClasse(req, res) {
    try {
      const classe = await db.Classe.findById(parseInt(req.params.id, 10));
      if (!classe) {
        return res.status(404).json({ error: 'Classe nao encontrada' });
      }

      res.status(200).json({
        success: true,
        data: serializarClasseOuRaca(classe)
      });
    } catch (error) {
      log.error({ err: error }, 'Erro ao obter classe');
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async buscarClasses(req, res) {
    try {
      const { termo } = req.query;

      if (!termo) {
        return res.status(400).json({ error: 'Termo de busca e obrigatorio' });
      }

      const classes = await db.Classe.search(termo);
      res.status(200).json({
        success: true,
        data: classes.map(serializarClasseOuRaca),
        total: classes.length
      });
    } catch (error) {
      log.error({ err: error }, 'Erro ao buscar classes');
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async atualizarClasse(req, res) {
    try {
      const { id } = req.params;
      const classe = await db.Classe.findById(parseInt(id, 10));
      if (!classe) {
        return res.status(404).json({ success: false, error: 'Classe nao encontrada' });
      }

      const { nome, custo, descricao } = req.body;
      const dados = {};
      if (nome !== undefined) dados.nome = nome;
      if (custo !== undefined) dados.custo = custo;
      if (descricao !== undefined) dados.descricao = descricao;
      if (req.body.bonus !== undefined || req.body.atributos_bonus !== undefined) {
        const bonus = validateBonusPayload(req.body);
        if (bonus.error) return res.status(400).json({ success: false, error: bonus.error });
        dados.bonus = bonus.value;
      }

      const atualizada = await db.Classe.update(parseInt(id, 10), dados);
      res.json({
        success: true,
        message: 'Classe atualizada com sucesso',
        data: serializarClasseOuRaca(atualizada)
      });
    } catch (error) {
      log.error({ err: error }, 'Erro ao atualizar classe');
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }

  async deletarClasse(req, res) {
    try {
      const { id } = req.params;
      const classe = await db.Classe.findById(parseInt(id, 10));
      if (!classe) {
        return res.status(404).json({ success: false, error: 'Classe nao encontrada' });
      }
      await db.Classe.delete(parseInt(id, 10));
      res.status(204).send();
    } catch (error) {
      log.error({ err: error }, 'Erro ao deletar classe');
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
}

export default new ClasseController();
