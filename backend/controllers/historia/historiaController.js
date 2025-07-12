import db from '../../Model/index.js';
import criadorCompleto from '../../agents/historia/Criador.js';
import criarGeradorPrologo from '../../agents/historia/GeradorPrologo.js';
import criarMestreRPG from '../../agents/historia/MestreRPG.js';
import { asyncHandler } from '../../middleware/errorHandler.js';

/**
 * Controller para gerenciar operações de história
 */
class HistoriaController {
  
  /**
   * Criar uma nova história com prólogo gerado automaticamente
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async criarHistoria(req, res, next) {
    try {
      console.log('📝 Criando nova história:', req.body);
      
      const { nome, tema, maximo_de_participantes, descricao, genero, temas_disponiveis } = req.body;
      
      // Validações básicas
      if (!nome || !tema) {
        return res.status(400).json({ 
          error: 'Nome e tema são obrigatórios' 
        });
      }
      
      if (maximo_de_participantes && (maximo_de_participantes < 1 || maximo_de_participantes > 10)) {
        return res.status(400).json({ 
          error: 'Máximo de participantes deve estar entre 1 e 10' 
        });
      }
      
      // Obter temas disponíveis do banco ou usar os fornecidos
      let temasParaUsar = temas_disponiveis || [];
      if (!temas_disponiveis || temas_disponiveis.length === 0) {
        // Buscar temas do banco de dados
        const temasDB = await db.Temas.findAll({
          where: { status: 'ativo' },
          attributes: ['nome']
        });
        temasParaUsar = temasDB.map(t => t.nome);
      }
      
      console.log(`🎲 Usando ${temasParaUsar.length} temas para geração de prólogo`);
      
      // Gerar prólogo automaticamente
      const geradorPrologo = await criarGeradorPrologo(temasParaUsar);
      const resultadoPrologo = await geradorPrologo.gerarPrologo({ tema });
      
      // Criar história no banco com prólogo
      const novaHistoria = await db.Agent.create({
        nome,
        tema,
        maximo_de_participantes: maximo_de_participantes || 5,
        descricao: descricao || '',
        prologo: resultadoPrologo.prologo,
        genero: genero || this.determinarGenero(tema),
        status: 'ativa',
        criada_em: new Date(),
        atualizada_em: new Date(),
        metadata: JSON.stringify({
          prologoGeradoEm: new Date().toISOString(),
          temasUtilizados: resultadoPrologo.temasUtilizados
        })
      });
      
      console.log('✅ História criada com prólogo gerado automaticamente:', novaHistoria.id);
      
      res.status(201).json({
        success: true,
        message: 'História criada com prólogo gerado automaticamente',
        data: {
          ...novaHistoria.toJSON(),
          prologo: resultadoPrologo.prologo,
          temas_utilizados: resultadoPrologo.temasUtilizados
        }
      });
      
    } catch (error) {
      console.error('❌ Erro ao criar história:', error);
      next(error);
    }
  }
  
  /**
   * Listar todas as histórias
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async listarHistorias(req, res, next) {
    try {
      console.log('📋 Listando histórias...');
      
      const { status, tema, limit = 20, offset = 0 } = req.query;
      
      // Construir filtros
      const where = {};
      if (status) where.status = status;
      if (tema) where.tema = tema;
      
      const historias = await db.Agent.findAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['criada_em', 'DESC']]
      });
      
      const total = await db.Agent.count({ where });
      
      console.log(`✅ ${historias.length} histórias encontradas`);
      
      res.status(200).json({
        success: true,
        data: historias,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: offset + historias.length < total
        }
      });
      
    } catch (error) {
      console.error('❌ Erro ao listar histórias:', error);
      next(error);
    }
  }
  
  /**
   * Obter uma história específica
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async obterHistoria(req, res, next) {
    try {
      const { id } = req.params;
      
      console.log(`🔍 Buscando história ID: ${id}`);
      
      const historia = await db.Agent.findByPk(id);
      
      if (!historia) {
        return res.status(404).json({
          error: 'História não encontrada'
        });
      }
      
      console.log('✅ História encontrada');
      
      res.status(200).json({
        success: true,
        data: historia
      });
      
    } catch (error) {
      console.error('❌ Erro ao obter história:', error);
      next(error);
    }
  }
  
  /**
   * Atualizar uma história
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async atualizarHistoria(req, res, next) {
    try {
      const { id } = req.params;
      const dadosAtualizacao = req.body;
      
      console.log(`📝 Atualizando história ID: ${id}`, dadosAtualizacao);
      
      const historia = await db.Agent.findByPk(id);
      
      if (!historia) {
        return res.status(404).json({
          error: 'História não encontrada'
        });
      }
      
      // Atualizar dados
      Object.assign(historia, dadosAtualizacao, {
        atualizada_em: new Date()
      });
      
      await historia.save();
      
      console.log('✅ História atualizada com sucesso');
      
      res.status(200).json({
        success: true,
        message: 'História atualizada com sucesso',
        data: historia
      });
      
    } catch (error) {
      console.error('❌ Erro ao atualizar história:', error);
      next(error);
    }
  }
  
  /**
   * Excluir uma história
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async excluirHistoria(req, res, next) {
    try {
      const { id } = req.params;
      
      console.log(`🗑️ Excluindo história ID: ${id}`);
      
      const historia = await db.Agent.findByPk(id);
      
      if (!historia) {
        return res.status(404).json({
          error: 'História não encontrada'
        });
      }
      
      await historia.destroy();
      
      console.log('✅ História excluída com sucesso');
      
      res.status(200).json({
        success: true,
        message: 'História excluída com sucesso'
      });
      
    } catch (error) {
      console.error('❌ Erro ao excluir história:', error);
      next(error);
    }
  }
  
  /**
   * Gerar história com prólogo usando IA
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async gerarHistoriaComIA(req, res, next) {
    try {
      const { tema, nome, descricao, maximo_de_participantes, temas_disponiveis } = req.body;
      
      console.log('🤖 Gerando história com IA:', { tema, nome, temas_disponiveis: temas_disponiveis?.length || 0 });
      
      if (!tema) {
        return res.status(400).json({
          success: false,
          error: 'Tema é obrigatório para gerar história com IA'
        });
      }
      
      // Obter temas disponíveis do banco ou usar os fornecidos
      let temasParaUsar = temas_disponiveis || [];
      if (!temas_disponiveis || temas_disponiveis.length === 0) {
        // Buscar temas do banco de dados
        const temasDB = await db.Temas.findAll({
          where: { status: 'ativo' },
          attributes: ['nome']
        });
        temasParaUsar = temasDB.map(t => t.nome);
      }
      
      console.log(`🎲 Usando ${temasParaUsar.length} temas para geração`);
      
      // Usar o gerador de prólogo diretamente
      const geradorPrologo = await criarGeradorPrologo(temasParaUsar);
      
      // Gerar história completa com prólogo
      const historiaGerada = await geradorPrologo.criarHistoriaCompleta({
        tema,
        nome: nome || `Aventura em ${tema}`,
        descricao: descricao || ''
      });
      
      // Salvar no banco de dados
      const novaHistoria = await db.Agent.create({
        nome: historiaGerada.nome,
        tema: historiaGerada.tema,
        descricao: historiaGerada.descricao,
        prologo: historiaGerada.prologo,
        maximo_de_participantes: maximo_de_participantes || 5,
        genero: this.determinarGenero(tema),
        status: 'ativa',
        criada_em: new Date(),
        atualizada_em: new Date(),
        metadata: JSON.stringify(historiaGerada.metadata)
      });
      
      console.log('✅ História gerada com IA e salva:', novaHistoria.id);
      
      res.status(201).json({
        success: true,
        message: 'História gerada com IA com sucesso',
        data: {
          ...novaHistoria.toJSON(),
          elementos: historiaGerada.elementos,
          temas_utilizados: historiaGerada.metadata.temasUtilizados
        }
      });
      
    } catch (error) {
      console.error('❌ Erro ao gerar história com IA:', error);
      next(error);
    }
  }
  

  
  /**
   * Gerar aventura completa com mestre de RPG
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async gerarAventuraCompleta(req, res, next) {
    try {
      const { tema, nome, descricao, personagens, temas_disponiveis } = req.body;
      
      console.log('🎮 Gerando aventura completa:', { tema, nome, personagens: personagens?.length || 0 });
      
      if (!tema) {
        return res.status(400).json({
          success: false,
          error: 'Tema é obrigatório para gerar aventura'
        });
      }
      
      // Obter temas disponíveis do banco ou usar os fornecidos
      let temasParaUsar = temas_disponiveis || [];
      if (!temas_disponiveis || temas_disponiveis.length === 0) {
        const temasDB = await db.Temas.findAll({
          where: { status: 'ativo' },
          attributes: ['nome']
        });
        temasParaUsar = temasDB.map(t => t.nome);
      }
      
      console.log(`🎲 Usando ${temasParaUsar.length} temas e ${personagens?.length || 0} personagens`);
      
      // Usar o criador completo com agentes separados
      const criador = await criadorCompleto(temasParaUsar, personagens || []);
      
      // Gerar aventura completa
      const aventuraCompleta = await criador.criarAventuraCompleta({
        tema,
        nome: nome || `Aventura em ${tema}`,
        descricao: descricao || '',
        personagens: personagens || []
      });
      
      // Salvar no banco de dados
      const novaHistoria = await db.Agent.create({
        nome: aventuraCompleta.nome,
        tema: aventuraCompleta.tema,
        descricao: aventuraCompleta.descricao,
        prologo: aventuraCompleta.prologo,
        maximo_de_participantes: personagens?.length || 5,
        genero: this.determinarGenero(tema),
        status: 'ativa',
        criada_em: new Date(),
        atualizada_em: new Date(),
        metadata: JSON.stringify(aventuraCompleta.metadata)
      });
      
      console.log('✅ Aventura completa gerada e salva:', novaHistoria.id);
      
      res.status(201).json({
        success: true,
        message: 'Aventura completa gerada com sucesso',
        data: {
          ...novaHistoria.toJSON(),
          personagens: aventuraCompleta.personagens,
          sessao: aventuraCompleta.sessao,
          elementos: aventuraCompleta.elementos,
          temas_utilizados: aventuraCompleta.metadata.temasUtilizados,
          agentes: aventuraCompleta.metadata.agentes
        }
      });
      
    } catch (error) {
      console.error('❌ Erro ao gerar aventura completa:', error);
      next(error);
    }
  }







  /**
   * Determinar gênero baseado no tema
   * @param {string} tema - Tema da história
   * @returns {string} Gênero determinado
   */
  determinarGenero(tema) {
    const temaLower = tema.toLowerCase();
    
    if (temaLower.includes('fantasia') || temaLower.includes('medieval')) {
      return 'fantasia';
    } else if (temaLower.includes('sci-fi') || temaLower.includes('espacial')) {
      return 'sci-fi';
    } else if (temaLower.includes('horror') || temaLower.includes('assombrado')) {
      return 'horror';
    } else if (temaLower.includes('cyberpunk') || temaLower.includes('futuro')) {
      return 'cyberpunk';
    } else if (temaLower.includes('western') || temaLower.includes('velho oeste')) {
      return 'western';
    } else {
      return 'aventura';
    }
  }
  

}

export default new HistoriaController(); 