import db from '../../Model/index.js';
import { criarGeradorBackground } from '../../agents/historia/personagem/background/index.js';
import { asyncHandler } from '../../middleware/errorHandler.js';

/**
 * Controller para gerenciar operações de personagem
 */
class PersonagemController {

  /**
   * Configuração dos includes para relacionamentos
   * @returns {Array} - Array de configurações de include
   */
  getIncludesRelacionamentos() {
    return [
      {
        model: db.Classe,
        as: 'classe',
        attributes: ['id', 'nome'],
        required: false
      },
      {
        model: db.Raca,
        as: 'raca',
        attributes: ['id', 'nome'],
        required: false
      }
    ];
  }

  /**
   * Buscar personagem com relacionamentos
   * @param {number} id - ID do personagem
   * @returns {Object} - Dados do personagem com relacionamentos
   */
  async buscarPersonagemComRelacionamentos(id) {
    return await db.Personagem.findByPk(id, {
      include: this.getIncludesRelacionamentos()
    });
  }

  /**
   * Processar dados do personagem para incluir nomes das entidades relacionadas
   * @param {Object} personagem - Objeto do personagem
   * @returns {Object} - Dados processados
   */
  processarDadosPersonagem(personagem) {
    const personagemData = personagem.toJSON();
    
    // Adicionar nome da classe
    if (personagemData.classe) {
      personagemData.classe = personagemData.classe.nome;
    }
    
    // Adicionar nome da raça
    if (personagemData.raca) {
      personagemData.raca = personagemData.raca.nome;
    }
    
    return personagemData;
  }

  /**
   * Criar um novo personagem
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  criarPersonagem = async (req, res, next) => {
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
        forca,
        inteligencia,
        carisma,
        destreza,
        constituicao,
        agilidade,
        historia_id,
        jogador_id,
        sugestao_background = '',
        temas_disponiveis = []
      } = req.body;
      console.log('👤 Dados do personagem:', req.body);

      // Validações básicas
      if (!nome || !historia_id) {
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
      const atributos = { forca, inteligencia, carisma, destreza, constituicao, agilidade };
      for (const [atributo, valor] of Object.entries(atributos)) {
        if (valor && (valor < 1 || valor > 20)) {
          return res.status(400).json({
            error: `${atributo} deve estar entre 1 e 20`
          });
        }
      }

      let backgroundFinal = background;

      // Gerar background automaticamente se solicitado
      console.log('📝 Gerando background automático...', sugestao_background, background);
      if (sugestao_background == 'guiado') {
        console.log('📝 Gerando background automático...');

        // Buscar informações da história para contexto
        const historia = await db.Historia.findByPk(historia_id);
        if (!historia) {
          return res.status(404).json({
            error: 'História não encontrada'
          });
        }

        // Buscar informações da classe se disponível
        let nomeClasse = 'Aventureiro';
        if (classe_id) {
          // Buscar classe no banco
          const classe = await db.Classe.findByPk(classe_id);
          if (classe) {
            nomeClasse = classe.nome;
          }
        }

        const geradorBackground = await criarGeradorBackground(temas_disponiveis);
        const resultadoBackground = await geradorBackground.gerarBackground({
          nome,
          classe: nomeClasse,
          tema: historia.temas,
          sugestao_background: sugestao_background || ''
        });

        backgroundFinal = resultadoBackground.background;
      }
      console.log('✅ Background gerado:', backgroundFinal.substring(0, 100) + '...');

      // Criar personagem no banco
      const novoPersonagem = await db.Personagem.create({
        nome,
        nivel: nivel || 1,
        pontos_totais: pontos_totais || 0,
        pontos_iniciais: pontos_iniciais || 0,
        background: backgroundFinal || '',
        raca_id: raca_id || null,
        classe_id: classe_id || null,
        forca: forca || 10,
        inteligencia: inteligencia || 10,
        carisma: carisma || 10,
        destreza: destreza || 10,
        constituicao: constituicao || 10,
        agilidade: agilidade || 10,
        // historia_id,
        // jogador_id: jogador_id || null,     
        criado_em: new Date(),
        atualizado_em: new Date()
      });

      console.log('✅ Personagem criado:', novoPersonagem.id);

      // Buscar o personagem recém-criado com os relacionamentos
      const personagemCompleto = await this.buscarPersonagemComRelacionamentos(novoPersonagem.id);
      const personagemData = this.processarDadosPersonagem(personagemCompleto);

      res.status(201).json({
        success: true,
        message: 'Personagem criado com sucesso',
        data: {
          ...personagemData,
          background: backgroundFinal
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
  listarPersonagens = async (req, res, next) => {
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
        include: this.getIncludesRelacionamentos(),
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['criado_em', 'DESC']]
      });

      const total = await db.Personagem.count({ where });

      // Processar dados para incluir nomes das entidades relacionadas
      const personagensProcessados = personagens.map(personagem => 
        this.processarDadosPersonagem(personagem)
      );

      console.log(`✅ ${personagens.length} personagens encontrados`);

      res.status(200).json({
        success: true,
        data: personagensProcessados,
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
  obterPersonagem = async (req, res, next) => {
    try {
      const { id } = req.params;

      console.log(`🔍 Buscando personagem ID: ${id}`);

      const personagem = await this.buscarPersonagemComRelacionamentos(id);

      if (!personagem) {
        return res.status(404).json({
          error: 'Personagem não encontrado'
        });
      }

      const personagemData = this.processarDadosPersonagem(personagem);

      console.log('✅ Personagem encontrado');

      res.status(200).json({
        success: true,
        data: personagemData
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
  atualizarPersonagem = async (req, res, next) => {
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
      const atributos = ['forca', 'inteligencia', 'carisma', 'destreza', 'constituicao', 'agilidade'];
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

      // Buscar o personagem atualizado com os relacionamentos
      const personagemCompleto = await this.buscarPersonagemComRelacionamentos(personagem.id);
      const personagemData = this.processarDadosPersonagem(personagemCompleto);

      console.log('✅ Personagem atualizado com sucesso');

      res.status(200).json({
        success: true,
        message: 'Personagem atualizado com sucesso',
        data: personagemData
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
  excluirPersonagem = async (req, res, next) => {
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
  gerarBackground = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { temas_disponiveis = [], tipo = 'normal', sugestao_background = '' } = req.body;

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
        const classe = await db.Classe.findByPk(personagem.classe_id);
        if (classe) {
          nomeClasse = classe.nome;
        }
      }

      const geradorBackground = await criarGeradorBackground(temas_disponiveis);

      let resultadoBackground;
      if (tipo === 'detalhado') {
        resultadoBackground = await geradorBackground.gerarBackgroundDetalhado({
          nome: personagem.nome,
          classe: nomeClasse,
          tema: historia.temas,
          sugestao_background: sugestao_background
        });
      } else {
        resultadoBackground = await geradorBackground.gerarBackground({
          nome: personagem.nome,
          classe: nomeClasse,
          tema: historia.temas,
          sugestao_background: sugestao_background
        });
      }

      // Atualizar personagem com o novo background
      personagem.background = resultadoBackground.background;
      personagem.atualizado_em = new Date();
      await personagem.save();

      // Buscar o personagem atualizado com os relacionamentos
      const personagemCompleto = await this.buscarPersonagemComRelacionamentos(personagem.id);
      const personagemData = this.processarDadosPersonagem(personagemCompleto);

      console.log('✅ Background gerado e salvo');

      res.status(200).json({
        success: true,
        message: 'Background gerado com sucesso',
        data: {
          ...personagemData,
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
  listarPersonagensPorHistoria = async (req, res, next) => {
    try {
      const { historia_id } = req.params;
      const { status, limit = 20, offset = 0 } = req.query;

      console.log(`📋 Listando personagens da história ID: ${historia_id}`);

      const where = { historia_id };
      if (status) where.status = status;

      const personagens = await db.Personagem.findAll({
        where,
        include: this.getIncludesRelacionamentos(),
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['criado_em', 'DESC']]
      });

      const total = await db.Personagem.count({ where });

      // Processar dados para incluir nomes das entidades relacionadas
      const personagensProcessados = personagens.map(personagem => 
        this.processarDadosPersonagem(personagem)
      );

      console.log(`✅ ${personagens.length} personagens encontrados na história`);

      res.status(200).json({
        success: true,
        data: personagensProcessados,
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