import db from '../../Model/index.js';

class MestreController {
  criarMestre = async (req, res, next) => {
    try {
      const { nome, descricao, personalidade, modelo, temperatura, max_tokens, tom_narrativo, regras_especiais, imagem } = req.body;

      if (!nome) {
        return res.status(400).json({ success: false, error: 'Nome é obrigatório' });
      }

      const novoMestre = await db.Mestre.createMestre({
        nome,
        descricao: descricao || null,
        personalidade: personalidade || null,
        modelo: modelo || undefined,
        temperatura: temperatura !== undefined ? parseFloat(temperatura) : undefined,
        max_tokens: max_tokens !== undefined ? parseInt(max_tokens) : undefined,
        tom_narrativo: tom_narrativo || null,
        regras_especiais: regras_especiais || null,
        imagem: imagem || null,
        id_usuario: req.user.id
      });

      res.status(201).json({
        success: true,
        message: 'Mestre criado com sucesso',
        data: novoMestre
      });
    } catch (error) {
      console.error('Erro ao criar mestre:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  };

  listarMestres = async (req, res, next) => {
    try {
      const mestres = await db.Mestre.findByUsuario(req.user.id);
      res.status(200).json({ success: true, data: mestres });
    } catch (error) {
      console.error('Erro ao listar mestres:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  };

  obterMestre = async (req, res, next) => {
    try {
      const { id } = req.params;
      const mestre = await db.Mestre.findById(parseInt(id));

      if (!mestre) {
        return res.status(404).json({ success: false, error: 'Mestre não encontrado' });
      }

      res.status(200).json({ success: true, data: mestre });
    } catch (error) {
      console.error('Erro ao obter mestre:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  };

  atualizarMestre = async (req, res, next) => {
    try {
      const { id } = req.params;
      const mestre = await db.Mestre.findById(parseInt(id));

      if (!mestre) {
        return res.status(404).json({ success: false, error: 'Mestre não encontrado' });
      }

      if (mestre.id_usuario !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Você só pode editar seus próprios mestres' });
      }

      const { nome, descricao, personalidade, modelo, temperatura, max_tokens, tom_narrativo, regras_especiais, imagem } = req.body;

      const dadosAtualizacao = {};
      if (nome !== undefined) dadosAtualizacao.nome = nome;
      if (descricao !== undefined) dadosAtualizacao.descricao = descricao;
      if (personalidade !== undefined) dadosAtualizacao.personalidade = personalidade;
      if (modelo !== undefined) dadosAtualizacao.modelo = modelo;
      if (temperatura !== undefined) dadosAtualizacao.temperatura = parseFloat(temperatura);
      if (max_tokens !== undefined) dadosAtualizacao.max_tokens = parseInt(max_tokens);
      if (tom_narrativo !== undefined) dadosAtualizacao.tom_narrativo = tom_narrativo;
      if (regras_especiais !== undefined) dadosAtualizacao.regras_especiais = regras_especiais;
      if (imagem !== undefined) dadosAtualizacao.imagem = imagem;

      const mestreAtualizado = await db.Mestre.updateMestre(parseInt(id), dadosAtualizacao);

      res.status(200).json({
        success: true,
        message: 'Mestre atualizado com sucesso',
        data: mestreAtualizado
      });
    } catch (error) {
      console.error('Erro ao atualizar mestre:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  };

  excluirMestre = async (req, res, next) => {
    try {
      const { id } = req.params;
      const mestre = await db.Mestre.findById(parseInt(id));

      if (!mestre) {
        return res.status(404).json({ success: false, error: 'Mestre não encontrado' });
      }

      if (mestre.id_usuario !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Você só pode excluir seus próprios mestres' });
      }

      await db.Mestre.deleteMestre(parseInt(id));

      res.status(200).json({
        success: true,
        message: 'Mestre excluído com sucesso'
      });
    } catch (error) {
      console.error('Erro ao excluir mestre:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  };
}

export default new MestreController();
