import db from '../../Model/index.js';
import { criarGeradorBackground } from '../../agents/historia/personagem/background/index.js';
import { asyncHandler } from '../../middleware/errorHandler.js';

/**
 * Controller para gerenciar operações de personagem
 */
class PersonagemController {
  
  /**
   * Criar um novo personagem
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async criarPersonagem(req, res, next) {
    try {
      console.log('👤 Criando novo personagem:', req.body);
      
      const { 
        nome, 
        nivel, 
        pontos_totais, 
        pontos_iniciais, 
        background, 
        raca_id, 
        classe_id, 
        profissao_id,
        forca,
        inteligencia,
        carisma,
        destreza,
        constituicao,
        sabedoria,
        historia_id,
        jogador_id,
        gerar_background = false,
        temas_disponiveis = []
      } = req.body;
      
      // Validações básicas
      // if (!nome || !historia_id) {
      if (!nome) {
        return res.status(400).json({ 
          error: 'Nome e história são obrigatórios' 
        });
      }
      
      if (nivel && (nivel < 1 || nivel > 20)) {
        return res.status(400).json({ 
          error: 'Nível deve estar entre 1 e 20' 
        });
      }
      
      // Validar atributos (1-20)
      const atributos = { forca, inteligencia, carisma, destreza, constituicao, sabedoria };
      for (const [atributo, valor] of Object.entries(atributos)) {
        if (valor && (valor < 1 || valor > 20)) {
          return res.status(400).json({ 
            error: `${atributo} deve estar entre 1 e 20` 
          });
        }
      }
      
      let backgroundFinal = background;
      
      // Gerar background automaticamente se solicitado
      if (gerar_background && (!background || background.trim() === '')) {
        console.log('📝 Gerando background automático...');
        
        // Buscar informações da história para contexto
        // const historia = await db.Historia.findByPk(historia_id);
        // if (!historia) {
        //   return res.status(404).json({ 
        //     error: 'História não encontrada' 
        //   });
        // }
        
        // Buscar informações da classe se disponível
        let nomeClasse = 'Aventureiro';
        if (classe_id) {
          // Aqui você pode buscar a classe no banco se tiver uma tabela de classes
          // Por enquanto, vamos usar um nome genérico
          nomeClasse = 'Aventureiro';
        }
        
        const geradorBackground = await criarGeradorBackground(temas_disponiveis);
        const resultadoBackground = await geradorBackground.gerarBackground({ 
          nome, 
          classe: nomeClasse, 
          tema: historia.temas 
        });
        
        backgroundFinal = resultadoBackground.background;
        console.log('✅ Background gerado:', backgroundFinal.substring(0, 100) + '...');
      }
      
      // Criar personagem no banco
      const novoPersonagem = await db.Personagem.create({
        nome,
        nivel: nivel || 1,
        pontos_totais: pontos_totais || 0,
        pontos_iniciais: pontos_iniciais || 0,
        background: backgroundFinal || '',
        raca_id: raca_id || null,
        classe_id: classe_id || null,
        profissao_id: profissao_id || null,
        forca: forca || 10,
        inteligencia: inteligencia || 10,
        carisma: carisma || 10,
        destreza: destreza || 10,
        constituicao: constituicao || 10,
        sabedoria: sabedoria || 10,
        // historia_id,
        // jogador_id: jogador_id || null,     
        criado_em: new Date(),
        atualizado_em: new Date()
      });
      
      console.log('✅ Personagem criado:', novoPersonagem.id);
      
      res.status(201).json({
        success: true,
        message: 'Personagem criado com sucesso',
        data: {
          ...novoPersonagem.toJSON(),
          background_gerado: gerar_background && (!background || background.trim() === '')
        }
      });
      
    } catch (error) {
      console.error('❌ Erro ao criar personagem:', error);
      next(error);
    }
  }
  
  /**
   * Listar todos os personagens
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async listarPersonagens(req, res, next) {
    try {
      console.log('📋 Listando personagens...');
      
      const { historia_id, jogador_id, status, limit = 20, offset = 0 } = req.query;
      
      // Construir filtros
      const where = {};
      if (historia_id) where.historia_id = historia_id;
      if (jogador_id) where.jogador_id = jogador_id;
      if (status) where.status = status;
      
      const personagens = await db.Personagem.findAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['criado_em', 'DESC']]
      });
      
      const total = await db.Personagem.count({ where });
      
      console.log(`✅ ${personagens.length} personagens encontrados`);
      
      res.status(200).json({
        success: true,
        data: personagens,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: offset + personagens.length < total
        }
      });
      
    } catch (error) {
      console.error('❌ Erro ao listar personagens:', error);
      next(error);
    }
  }
  
  /**
   * Obter um personagem específico
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async obterPersonagem(req, res, next) {
    try {
      const { id } = req.params;
      
      console.log(`🔍 Buscando personagem ID: ${id}`);
      
      const personagem = await db.Personagem.findByPk(id);
      
      if (!personagem) {
        return res.status(404).json({
          error: 'Personagem não encontrado'
        });
      }
      
      console.log('✅ Personagem encontrado');
      
      res.status(200).json({
        success: true,
        data: personagem
      });
      
    } catch (error) {
      console.error('❌ Erro ao obter personagem:', error);
      next(error);
    }
  }
  
  /**
   * Atualizar um personagem
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async atualizarPersonagem(req, res, next) {
    try {
      const { id } = req.params;
      const dadosAtualizacao = req.body;
      
      console.log(`📝 Atualizando personagem ID: ${id}`, dadosAtualizacao);
      
      const personagem = await db.Personagem.findByPk(id);
      
      if (!personagem) {
        return res.status(404).json({
          error: 'Personagem não encontrado'
        });
      }
      
      // Validar atributos se fornecidos
      const atributos = ['forca', 'inteligencia', 'carisma', 'destreza', 'constituicao', 'sabedoria'];
      for (const atributo of atributos) {
        if (dadosAtualizacao[atributo] && (dadosAtualizacao[atributo] < 1 || dadosAtualizacao[atributo] > 20)) {
          return res.status(400).json({ 
            error: `${atributo} deve estar entre 1 e 20` 
          });
        }
      }
      
      // Atualizar dados
      Object.assign(personagem, dadosAtualizacao, {
        atualizado_em: new Date()
      });
      
      await personagem.save();
      
      console.log('✅ Personagem atualizado com sucesso');
      
      res.status(200).json({
        success: true,
        message: 'Personagem atualizado com sucesso',
        data: personagem
      });
      
    } catch (error) {
      console.error('❌ Erro ao atualizar personagem:', error);
      next(error);
    }
  }
  
  /**
   * Excluir um personagem
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async excluirPersonagem(req, res, next) {
    try {
      const { id } = req.params;
      
      console.log(`🗑️ Excluindo personagem ID: ${id}`);
      
      const personagem = await db.Personagem.findByPk(id);
      
      if (!personagem) {
        return res.status(404).json({
          error: 'Personagem não encontrado'
        });
      }
      
      await personagem.destroy();
      
      console.log('✅ Personagem excluído com sucesso');
      
      res.status(200).json({
        success: true,
        message: 'Personagem excluído com sucesso'
      });
      
    } catch (error) {
      console.error('❌ Erro ao excluir personagem:', error);
      next(error);
    }
  }
  
  /**
   * Gerar background para um personagem
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async gerarBackground(req, res, next) {
    try {
      const { id } = req.params;
      const { temas_disponiveis = [], tipo = 'normal' } = req.body;
      
      console.log(`📝 Gerando background para personagem ID: ${id}`);
      
      const personagem = await db.Personagem.findByPk(id);
      
      if (!personagem) {
        return res.status(404).json({
          error: 'Personagem não encontrado'
        });
      }
      
      // Buscar informações da história
      const historia = await db.Historia.findByPk(personagem.historia_id);
      if (!historia) {
        return res.status(404).json({
          error: 'História não encontrada'
        });
      }
      
      // Buscar nome da classe (implementar quando tiver tabela de classes)
      let nomeClasse = 'Aventureiro';
      if (personagem.classe_id) {
        // Buscar classe no banco
        nomeClasse = 'Aventureiro'; // Placeholder
      }
      
      const geradorBackground = await criarGeradorBackground(temas_disponiveis);
      
      let resultadoBackground;
      if (tipo === 'detalhado') {
        resultadoBackground = await geradorBackground.gerarBackgroundDetalhado({
          nome: personagem.nome,
          classe: nomeClasse,
          tema: historia.temas
        });
      } else {
        resultadoBackground = await geradorBackground.gerarBackground({
          nome: personagem.nome,
          classe: nomeClasse,
          tema: historia.temas
        });
      }
      
      // Atualizar personagem com o novo background
      personagem.background = resultadoBackground.background;
      personagem.atualizado_em = new Date();
      await personagem.save();
      
      console.log('✅ Background gerado e salvo');
      
      res.status(200).json({
        success: true,
        message: 'Background gerado com sucesso',
        data: {
          ...personagem.toJSON(),
          background_gerado: resultadoBackground.background,
          tipo: tipo
        }
      });
      
    } catch (error) {
      console.error('❌ Erro ao gerar background:', error);
      next(error);
    }
  }
  
  /**
   * Listar personagens por história
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async listarPersonagensPorHistoria(req, res, next) {
    try {
      const { historia_id } = req.params;
      const { status, limit = 20, offset = 0 } = req.query;
      
      console.log(`📋 Listando personagens da história ID: ${historia_id}`);
      
      const where = { historia_id };
      if (status) where.status = status;
      
      const personagens = await db.Personagem.findAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['criado_em', 'DESC']]
      });
      
      const total = await db.Personagem.count({ where });
      
      console.log(`✅ ${personagens.length} personagens encontrados na história`);
      
      res.status(200).json({
        success: true,
        data: personagens,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: offset + personagens.length < total
        }
      });
      
    } catch (error) {
      console.error('❌ Erro ao listar personagens por história:', error);
      next(error);
    }
  }
}

export default new PersonagemController(); 