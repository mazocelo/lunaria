import db from '../../Model/index.js';

class MestreController {
  criarMestre = async (req, res) => {
    const { nome, descricao, personalidade, modelo, temperatura, max_tokens, tom_narrativo, regras_especiais, imagem, voice_id, voice_provider } = req.body;

    if (!nome || !nome.trim()) {
      return res.status(400).json({ success: false, error: 'Nome é obrigatório' });
    }

    const novoMestre = await db.Mestre.createMestre({
      nome: nome.trim(),
      descricao: descricao || null,
      personalidade: personalidade || null,
      modelo: modelo || undefined,
      temperatura: temperatura !== undefined ? (isNaN(parseFloat(temperatura)) ? 0.9 : parseFloat(temperatura)) : undefined,
      max_tokens: max_tokens !== undefined ? (isNaN(parseInt(max_tokens)) ? 8000 : parseInt(max_tokens)) : undefined,
      tom_narrativo: tom_narrativo || null,
      regras_especiais: regras_especiais || null,
      imagem: imagem || null,
      voice_id: voice_id || null,
      voice_provider: voice_provider || null,
      id_usuario: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Mestre criado com sucesso',
      data: novoMestre
    });
  };

  listarMestres = async (req, res) => {
    const { limit, offset } = req.query;

    if (limit !== undefined) {
      const parsedLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
      const parsedOffset = Math.max(parseInt(offset) || 0, 0);
      const result = await db.Mestre.findByUsuario(req.user.id, {
        limit: parsedLimit,
        offset: parsedOffset
      });
      return res.status(200).json({
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

    const result = await db.Mestre.findByUsuario(req.user.id);
    const data = result.data || result;
    res.status(200).json({
      success: true,
      data,
      pagination: { total: data.length, limit: data.length, offset: 0, hasMore: false }
    });
  };

  obterMestre = async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'ID inválido' });
    }

    const mestre = await db.Mestre.findById(id);

    if (!mestre) {
      return res.status(404).json({ success: false, error: 'Mestre não encontrado' });
    }

    // C2: Verificar ownership - usuario so pode ver seus proprios mestres
    if (mestre.id_usuario !== req.user.id && !['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Acesso negado' });
    }

    res.status(200).json({ success: true, data: mestre });
  };

  atualizarMestre = async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'ID inválido' });
    }

    const mestre = await db.Mestre.findById(id);

    if (!mestre) {
      return res.status(404).json({ success: false, error: 'Mestre não encontrado' });
    }

    if (mestre.id_usuario !== req.user.id && !['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Você só pode editar seus próprios mestres' });
    }

    const { nome, descricao, personalidade, modelo, temperatura, max_tokens, tom_narrativo, regras_especiais, imagem, voice_id, voice_provider } = req.body;

    const dadosAtualizacao = {};
    if (nome !== undefined) dadosAtualizacao.nome = nome;
    if (descricao !== undefined) dadosAtualizacao.descricao = descricao;
    if (personalidade !== undefined) dadosAtualizacao.personalidade = personalidade;
    if (modelo !== undefined) dadosAtualizacao.modelo = modelo;
    if (temperatura !== undefined) dadosAtualizacao.temperatura = isNaN(parseFloat(temperatura)) ? 0.9 : parseFloat(temperatura);
    if (max_tokens !== undefined) dadosAtualizacao.max_tokens = isNaN(parseInt(max_tokens)) ? 8000 : parseInt(max_tokens);
    if (tom_narrativo !== undefined) dadosAtualizacao.tom_narrativo = tom_narrativo;
    if (regras_especiais !== undefined) dadosAtualizacao.regras_especiais = regras_especiais;
    if (imagem !== undefined) dadosAtualizacao.imagem = imagem;
    if (voice_id !== undefined) dadosAtualizacao.voice_id = voice_id;
    if (voice_provider !== undefined) dadosAtualizacao.voice_provider = voice_provider;

    const mestreAtualizado = await db.Mestre.updateMestre(id, dadosAtualizacao);

    res.status(200).json({
      success: true,
      message: 'Mestre atualizado com sucesso',
      data: mestreAtualizado
    });
  };

  excluirMestre = async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'ID inválido' });
    }

    const mestre = await db.Mestre.findById(id);

    if (!mestre) {
      return res.status(404).json({ success: false, error: 'Mestre não encontrado' });
    }

    if (mestre.id_usuario !== req.user.id && !['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Você só pode excluir seus próprios mestres' });
    }

    await db.Mestre.deleteMestre(id);

    res.status(204).send();
  };
}

export default new MestreController();
