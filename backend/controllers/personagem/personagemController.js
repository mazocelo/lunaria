
import db from '../../Model/index.js';
import { criarGeradorBackground } from '../../agents/historia/personagem/background/index.js';
import { asyncHandler } from '../../middleware/errorHandler.js';

/**
 * Controller para gerenciar operações de personagem
 */
class PersonagemController {

  /**
   * Buscar personagem com relacionamentos
   * @param {number} id - ID do personagem
   * @returns {Object} - Dados do personagem com relacionamentos
   */
  async buscarPersonagemComRelacionamentos(id) {
    return await db.Personagem.findByIdWithRelations(id);
  }

  /**
   * Processar dados do personagem para incluir nomes das entidades relacionadas
   * @param {Object} personagem - Objeto do personagem
   * @returns {Object} - Dados processados
   */
  processarDadosPersonagem(personagem) {
    const personagemData = { ...personagem };
    
    // Adicionar nome da classe
    if (personagemData.classes) {
      personagemData.classe = personagemData.classes.nome;
    }
    
    // Adicionar nome da raça
    if (personagemData.racas) {
      personagemData.raca = personagemData.racas.nome;
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
        vantagens,
        desvantagens,
        sugestao_background = '',
         
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
        const historia = await db.Historia.findById(parseInt(historia_id));
        if (!historia) {
          return res.status(404).json({
            error: 'História não encontrada'
          });
        }

        // Buscar informações da classe se disponível
        let nomeClasse = 'Aventureiro';
        if (classe_id) {
          // Buscar classe no banco
          const classe = await db.Classe.findById(parseInt(classe_id));
          if (classe) {
            nomeClasse = classe.nome;
          }
        }

        let nomeRaca = 'Humano';
        if (raca_id) {
          const raca = await db.Raca.findById(parseInt(raca_id));
          if (raca) {
            nomeRaca = raca.nome;
          }
        }
        let vantagensArray = [];
        let desvantagensArray = [];
        if(vantagens) {
          // Buscar vantagens por IDs
          vantagensArray = await Promise.all(
            vantagens.map(id => db.Vantagem.findById(parseInt(id)))
          );
          vantagensArray = vantagensArray.filter(v => v !== null);
        }
        if(desvantagens) {
          // Buscar desvantagens por IDs
          desvantagensArray = await Promise.all(
            desvantagens.map(id => db.Desvantagem.findById(parseInt(id)))
          );
          desvantagensArray = desvantagensArray.filter(d => d !== null);
        }

        // Buscar temas por nomes (historia.temas contém nomes, não IDs)
        const temas = await Promise.all(
          historia.temas.map(nome => db.Temas.findByNome(nome))
        );
        const temasFiltrados = temas.filter(t => t !== null);
        const geradorBackground = await criarGeradorBackground();
        const resultadoBackground = await geradorBackground.gerarBackground({
          nome,
          classe: nomeClasse,
          raca: nomeRaca,
          tema: historia.temas,
          sugestao_background: sugestao_background || '',
          vantagens: vantagensArray,
          desvantagens: desvantagensArray
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
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
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

      // Buscar todos os personagens com relacionamentos
      let personagens = await db.Personagem.findAll();

      // Aplicar filtros manualmente
      if (historia_id) {
        personagens = personagens.filter(p => p.historia_id === parseInt(historia_id));
      }
      if (jogador_id) {
        personagens = personagens.filter(p => p.jogador_id === parseInt(jogador_id));
      }
      if (status) {
        personagens = personagens.filter(p => p.status === status);
      }
      
      // Ordenar por data de criação (mais recente primeiro)
      personagens.sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em));
      
      // Aplicar paginação
      const startIndex = parseInt(offset) || 0;
      const endIndex = startIndex + parseInt(limit || 50);
      const personagensPaginados = personagens.slice(startIndex, endIndex);
      
      // Processar dados para incluir nomes das entidades relacionadas
      const personagensProcessados = personagensPaginados.map(personagem => 
        this.processarDadosPersonagem(personagem)
      );

      console.log(`✅ ${personagensProcessados.length} personagens encontrados`);

      res.status(200).json({
        success: true,
        data: personagensProcessados,
        pagination: {
          total: personagens.length,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: startIndex + personagensProcessados.length < personagens.length
        }
      });

    } catch (error) {
      console.error('❌ Erro ao listar personagens:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
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
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
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

      const personagem = await db.Personagem.findById(parseInt(id));

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

      // Atualizar dados usando o método update do Prisma
      await db.Personagem.update(parseInt(id), {
        ...dadosAtualizacao,
        atualizado_em: new Date()
      });

      // Buscar o personagem atualizado com os relacionamentos
      const personagemCompleto = await this.buscarPersonagemComRelacionamentos(parseInt(id));
      const personagemData = this.processarDadosPersonagem(personagemCompleto);

      console.log('✅ Personagem atualizado com sucesso');

      res.status(200).json({
        success: true,
        message: 'Personagem atualizado com sucesso',
        data: personagemData
      });

    } catch (error) {
      console.error('❌ Erro ao atualizar personagem:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
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

      const personagem = await db.Personagem.findById(parseInt(id));

      if (!personagem) {
        return res.status(404).json({
          error: 'Personagem não encontrado'
        });
      }

      await db.Personagem.delete(parseInt(id));

      console.log('✅ Personagem excluído com sucesso');

      res.status(200).json({
        success: true,
        message: 'Personagem excluído com sucesso'
      });

    } catch (error) {
      console.error('❌ Erro ao excluir personagem:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
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
      const { temas_disponiveis = [], sugestao_background = '' } = req.body;

      console.log(`📝 Gerando background para personagem ID: ${id}`);

      const personagem = await db.Personagem.findById(parseInt(id));

      if (!personagem) {
        return res.status(404).json({
          error: 'Personagem não encontrado'
        });
      }

      // Buscar informações da história
      const historia = await db.Historia.findById(parseInt(personagem.historia_id));
      if (!historia) {
        return res.status(404).json({
          error: 'História não encontrada'
        });
      }

      // Buscar nome da classe
      let nomeClasse = 'Aventureiro';
      if (personagem.classe_id) {
        const classe = await db.Classe.findById(parseInt(personagem.classe_id));
        if (classe) {
          nomeClasse = classe.nome;
        }
      }

      // Buscar nome da raça
      let nomeRaca = 'Humano';
      if (personagem.raca_id) {
        const raca = await db.Raca.findById(parseInt(personagem.raca_id));
        if (raca) {
          nomeRaca = raca.nome;
        }
      }

      const geradorBackground = await criarGeradorBackground(temas_disponiveis);

      const resultadoBackground = await geradorBackground.gerarBackground({
        nome: personagem.nome,
        classe: nomeClasse,
        raca: nomeRaca,
        tema: historia.temas,
        sugestao_background: sugestao_background
      });

      // Atualizar personagem com o novo background
      await db.Personagem.update(parseInt(id), {
        background: resultadoBackground.background,
        atualizado_em: new Date()
      });

      // Buscar o personagem atualizado com os relacionamentos
      const personagemCompleto = await this.buscarPersonagemComRelacionamentos(parseInt(id));
      const personagemData = this.processarDadosPersonagem(personagemCompleto);

      console.log('✅ Background gerado e salvo');

      res.status(200).json({
        success: true,
        message: 'Background gerado com sucesso',
        data: {
          ...personagemData,
          background_gerado: resultadoBackground.background
        }
      });

    } catch (error) {
      console.error('❌ Erro ao gerar background:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
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

      // Buscar todos os personagens e filtrar por história
      let personagens = await db.Personagem.findMany();
      
      // Filtrar por história
      personagens = personagens.filter(p => p.historia_id === parseInt(historia_id));
      
      // Filtrar por status se fornecido
      if (status) {
        personagens = personagens.filter(p => p.status === status);
      }
      
      // Ordenar por data de criação (mais recente primeiro)
      personagens.sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em));
      
      // Aplicar paginação
      const startIndex = parseInt(offset) || 0;
      const endIndex = startIndex + parseInt(limit || 50);
      const personagensPaginados = personagens.slice(startIndex, endIndex);

      // Processar dados para incluir nomes das entidades relacionadas
      const personagensProcessados = personagensPaginados.map(personagem => 
        this.processarDadosPersonagem(personagem)
      );

      console.log(`✅ ${personagensProcessados.length} personagens encontrados na história`);

      res.status(200).json({
        success: true,
        data: personagensProcessados,
        pagination: {
          total: personagens.length,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: startIndex + personagensProcessados.length < personagens.length
        }
      });

    } catch (error) {
      console.error('❌ Erro ao listar personagens por história:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }
}

export default new PersonagemController(); 