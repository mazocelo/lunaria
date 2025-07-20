
import db from '../../Model/index.js';
import { criarGeradorBackground } from '../../agents/historia/personagem/background/index.js';

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
   * Converter campos numéricos para inteiros
   * @param {Object} dados - Dados a serem convertidos
   * @returns {Object} - Dados convertidos
   */
  converterCamposNumericos(dados) {
    const dadosConvertidos = { ...dados };
    
    // Converter campos que devem ser inteiros
    const camposInteiros = ['nivel', 'pontos_totais', 'pontos_iniciais', 'raca_id', 'classe_id', 'forca', 'inteligencia', 'carisma', 'destreza', 'constituicao', 'agilidade'];
    
    camposInteiros.forEach(campo => {
      if (dadosConvertidos[campo] !== undefined && dadosConvertidos[campo] !== null) {
        dadosConvertidos[campo] = parseInt(dadosConvertidos[campo]);
      }
    });
    
    return dadosConvertidos;
  }

  /**
   * Processar dados do personagem para incluir nomes das entidades relacionadas
   * @param {Object} personagem - Objeto do personagem
   * @returns {Object} - Dados processados
   */
  async processarDadosPersonagem(personagem) {
    const personagemData = { ...personagem };
    
    // Adicionar nome da classe
    if (personagemData.classes) {
      personagemData.classe = personagemData.classes.nome;
    }
    
    // Adicionar nome da raça
    if (personagemData.racas) {
      personagemData.raca = personagemData.racas.nome;
    }

    // Processar vantagens (buscar separadamente)
    const vantagens = await db.Personagem.listarVantagens(personagemData.id);
    if (vantagens.length > 0) {
      personagemData.vantagens = vantagens.map(v => ({
        id: v.vantagem.id,
        nome: v.vantagem.nome,
        descricao: v.vantagem.descricao,
        custo: v.vantagem.custo,
        tipo: v.vantagem.tipo,
        nivel: v.vantagem.nivel,
        elemento: v.vantagem.elemento
      }));
    }

    // Processar desvantagens (buscar separadamente)
    const desvantagens = await db.Personagem.listarDesvantagens(personagemData.id);
    if (desvantagens.length > 0) {
      personagemData.desvantagens = desvantagens.map(d => ({
        id: d.desvantagem.id,
        nome: d.desvantagem.nome,
        descricao: d.desvantagem.descricao,
        custo: d.desvantagem.custo,
        tipo: d.desvantagem.tipo,
        nivel: d.desvantagem.nivel,
        elemento: d.desvantagem.elemento
      }));
    }

    // Processar equipamentos (buscar separadamente)
    const equipamentos = await db.Personagem.listarEquipamentos(personagemData.id);
    if (equipamentos.length > 0) {
      personagemData.equipamentos = equipamentos.map(e => ({
        id: e.equipamento.id,
        nome: e.equipamento.nome,
        descricao: e.equipamento.descricao,
        tipo: e.equipamento.tipo,
        bonus: e.equipamento.bonus,
        elemento: e.equipamento.elemento
      }));
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
        equipamentos,
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
          tema: temasFiltrados,
          sugestao_background: sugestao_background || '',
          vantagens: vantagensArray,
          desvantagens: desvantagensArray
        });

        backgroundFinal = resultadoBackground.background;
      }
      console.log('✅ Background gerado:', backgroundFinal.substring(0, 100) + '...');

      // Preparar dados do personagem
      const dadosPersonagem = this.converterCamposNumericos({
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
        agilidade: agilidade || 10
      });

      // Criar personagem no banco
      const novoPersonagem = await db.Personagem.createPersonagem(dadosPersonagem);

      console.log('✅ Personagem criado:', novoPersonagem.id);

      // Criar vínculos com vantagens se fornecidas
      if (vantagens && Array.isArray(vantagens) && vantagens.length > 0) {
        console.log('🔗 Criando vínculos com vantagens:', vantagens);
        for (const vantagem_id of vantagens) {
          try {
            await db.Personagem.adicionarVantagem(novoPersonagem.id, vantagem_id);
          } catch (error) {
            console.warn(`⚠️ Erro ao adicionar vantagem ${vantagem_id}:`, error.message);
          }
        }
      }

      // Criar vínculos com desvantagens se fornecidas
      if (desvantagens && Array.isArray(desvantagens) && desvantagens.length > 0) {
        console.log('🔗 Criando vínculos com desvantagens:', desvantagens);
        for (const desvantagem_id of desvantagens) {
          try {
            await db.Personagem.adicionarDesvantagem(novoPersonagem.id, desvantagem_id);
          } catch (error) {
            console.warn(`⚠️ Erro ao adicionar desvantagem ${desvantagem_id}:`, error.message);
          }
        }
      }

      // Criar vínculos com equipamentos se fornecidos
      if (equipamentos && Array.isArray(equipamentos) && equipamentos.length > 0) {
        console.log('🔗 Criando vínculos com equipamentos:', equipamentos);
        for (const equipamento_id of equipamentos) {
          try {
            await db.Personagem.adicionarEquipamento(novoPersonagem.id, equipamento_id);
          } catch (error) {
            console.warn(`⚠️ Erro ao adicionar equipamento ${equipamento_id}:`, error.message);
          }
        }
      }

      // Buscar o personagem recém-criado com os relacionamentos
      const personagemCompleto = await this.buscarPersonagemComRelacionamentos(novoPersonagem.id);
      const personagemData = await this.processarDadosPersonagem(personagemCompleto);

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
      let personagens = await db.Personagem.findAllPersonagens();

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
      const personagensProcessados = await Promise.all(
        personagensPaginados.map(personagem => 
          this.processarDadosPersonagem(personagem)
        )
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

      const personagem = await this.buscarPersonagemComRelacionamentos(parseInt(id));

      if (!personagem) {
        return res.status(404).json({
          error: 'Personagem não encontrado'
        });
      }

      const personagemData = await this.processarDadosPersonagem(personagem);

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
      const { vantagens, desvantagens, equipamentos, ...dadosAtualizacao } = req.body;

      console.log(`📝 Atualizando personagem ID: ${id}`, dadosAtualizacao);

      const personagem = await db.Personagem.findPersonagemById(parseInt(id));

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

      // Converter campos numéricos para inteiros
      const dadosConvertidos = this.converterCamposNumericos(dadosAtualizacao);

      // Atualizar dados usando o método update do Prisma
      await db.Personagem.updatePersonagem(parseInt(id), {
        ...dadosConvertidos
      });

      // Gerenciar vínculos com vantagens se fornecidas
      if (vantagens !== undefined) {
        console.log('🔗 Atualizando vínculos com vantagens:', vantagens);
        
        // Remover todas as vantagens atuais
        const vantagensAtuais = await db.Personagem.listarVantagens(id);
        for (const vinculo of vantagensAtuais) {
          try {
            await db.Personagem.removerVantagem(id, vinculo.vantagem.id);
          } catch (error) {
            console.warn(`⚠️ Erro ao remover vantagem ${vinculo.vantagem.id}:`, error.message);
          }
        }
        
        // Adicionar novas vantagens
        if (Array.isArray(vantagens) && vantagens.length > 0) {
          for (const vantagem_id of vantagens) {
            try {
              await db.Personagem.adicionarVantagem(id, vantagem_id);
            } catch (error) {
              console.warn(`⚠️ Erro ao adicionar vantagem ${vantagem_id}:`, error.message);
            }
          }
        }
      }

      // Gerenciar vínculos com desvantagens se fornecidas
      if (desvantagens !== undefined) {
        console.log('🔗 Atualizando vínculos com desvantagens:', desvantagens);
        
        // Remover todas as desvantagens atuais
        const desvantagensAtuais = await db.Personagem.listarDesvantagens(id);
        for (const vinculo of desvantagensAtuais) {
          try {
            await db.Personagem.removerDesvantagem(id, vinculo.desvantagem.id);
          } catch (error) {
            console.warn(`⚠️ Erro ao remover desvantagem ${vinculo.desvantagem.id}:`, error.message);
          }
        }
        
        // Adicionar novas desvantagens
        if (Array.isArray(desvantagens) && desvantagens.length > 0) {
          for (const desvantagem_id of desvantagens) {
            try {
              await db.Personagem.adicionarDesvantagem(id, desvantagem_id);
            } catch (error) {
              console.warn(`⚠️ Erro ao adicionar desvantagem ${desvantagem_id}:`, error.message);
            }
          }
        }
      }

      // Gerenciar vínculos com equipamentos se fornecidos
      if (equipamentos !== undefined) {
        console.log('🔗 Atualizando vínculos com equipamentos:', equipamentos);
        
        // Remover todos os equipamentos atuais
        const equipamentosAtuais = await db.Personagem.listarEquipamentos(id);
        for (const vinculo of equipamentosAtuais) {
          try {
            await db.Personagem.removerEquipamento(id, vinculo.equipamento.id);
          } catch (error) {
            console.warn(`⚠️ Erro ao remover equipamento ${vinculo.equipamento.id}:`, error.message);
          }
        }
        
        // Adicionar novos equipamentos
        if (Array.isArray(equipamentos) && equipamentos.length > 0) {
          for (const equipamento_id of equipamentos) {
            try {
              await db.Personagem.adicionarEquipamento(id, equipamento_id);
            } catch (error) {
              console.warn(`⚠️ Erro ao adicionar equipamento ${equipamento_id}:`, error.message);
            }
          }
        }
      }

      // Buscar o personagem atualizado com os relacionamentos
      const personagemCompleto = await this.buscarPersonagemComRelacionamentos(parseInt(id));
      const personagemData = await this.processarDadosPersonagem(personagemCompleto);

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

      const personagem = await db.Personagem.findPersonagemById(parseInt(id));

      if (!personagem) {
        return res.status(404).json({
          error: 'Personagem não encontrado'
        });
      }

      await db.Personagem.deletePersonagem(parseInt(id));

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

      const personagem = await db.Personagem.findPersonagemById(parseInt(id));

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
      await db.Personagem.updatePersonagem(parseInt(id), {
        background: resultadoBackground.background,
        atualizado_em: new Date()
      });

      // Buscar o personagem atualizado com os relacionamentos
      const personagemCompleto = await this.buscarPersonagemComRelacionamentos(parseInt(id));
      const personagemData = await this.processarDadosPersonagem(personagemCompleto);

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
      const { status, limit = 20, offset = 0, search } = req.query;

      console.log(`📋 Listando personagens da história ID: ${historia_id}`);

      // Verificar se a história existe
      const historia = await db.Historia.findById(parseInt(historia_id));
      if (!historia) {
        return res.status(404).json({
          error: 'História não encontrada'
        });
      }

      // Buscar personagens que podem estar relacionados à história
      let personagens = [];
      
      if (search) {
        // Se há termo de busca, usar o método de busca
        personagens = await db.Personagem.search(search);
      } else {
        // Buscar todos os personagens
        personagens = await db.Personagem.findAllPersonagens();
      }
      
      // Filtrar por status se fornecido
      if (status) {
        personagens = personagens.filter(p => p.status === status);
      }
      
      // Ordenar por nome
      personagens.sort((a, b) => a.nome.localeCompare(b.nome));
      
      // Aplicar paginação
      const startIndex = parseInt(offset) || 0;
      const endIndex = startIndex + parseInt(limit || 50);
      const personagensPaginados = personagens.slice(startIndex, endIndex);

      // Processar dados para incluir nomes das entidades relacionadas
      const personagensProcessados = await Promise.all(
        personagensPaginados.map(personagem => 
          this.processarDadosPersonagem(personagem)
        )
      );

      console.log(`✅ ${personagensProcessados.length} personagens encontrados para a história "${historia.nome}"`);

      res.status(200).json({
        success: true,
        data: personagensProcessados,
        historia: {
          id: historia.id,
          nome: historia.nome,
          temas: historia.temas,
          status: historia.status
        },
        pagination: {
          total: personagens.length,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: startIndex + personagensProcessados.length < personagens.length
        },
        message: 'Nota: Como não há relação direta entre personagens e histórias no schema atual, todos os personagens são retornados. Use o parâmetro "search" para filtrar por nome ou background.'
      });

    } catch (error) {
      console.error('❌ Erro ao listar personagens por história:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }
  
  // ===== MÉTODOS PARA GERENCIAR VÍNCULOS COM VANTAGENS =====

  /**
   * Adicionar vantagem ao personagem
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  adicionarVantagem = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { vantagem_id } = req.body;

      console.log(`➕ Adicionando vantagem ${vantagem_id} ao personagem ${id}`);

      if (!vantagem_id) {
        return res.status(400).json({
          error: 'ID da vantagem é obrigatório'
        });
      }

      // Verificar se o personagem existe
      const personagem = await db.Personagem.findPersonagemById(parseInt(id));
      if (!personagem) {
        return res.status(404).json({
          error: 'Personagem não encontrado'
        });
      }

      // Verificar se a vantagem existe
      const vantagem = await db.Vantagem.findById(parseInt(vantagem_id));
      if (!vantagem) {
        return res.status(404).json({
          error: 'Vantagem não encontrada'
        });
      }

      // Adicionar vantagem ao personagem
      await db.Personagem.adicionarVantagem(id, vantagem_id);

      console.log('✅ Vantagem adicionada com sucesso');

      res.status(200).json({
        success: true,
        message: 'Vantagem adicionada com sucesso'
      });

    } catch (error) {
      console.error('❌ Erro ao adicionar vantagem:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Remover vantagem do personagem
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  removerVantagem = async (req, res, next) => {
    try {
      const { id, vantagem_id } = req.params;

      console.log(`➖ Removendo vantagem ${vantagem_id} do personagem ${id}`);

      // Verificar se o personagem existe
      const personagem = await db.Personagem.findPersonagemById(parseInt(id));
      if (!personagem) {
        return res.status(404).json({
          error: 'Personagem não encontrado'
        });
      }

      // Remover vantagem do personagem
      await db.Personagem.removerVantagem(id, vantagem_id);

      console.log('✅ Vantagem removida com sucesso');

      res.status(200).json({
        success: true,
        message: 'Vantagem removida com sucesso'
      });

    } catch (error) {
      console.error('❌ Erro ao remover vantagem:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Listar vantagens do personagem
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  listarVantagens = async (req, res, next) => {
    try {
      const { id } = req.params;

      console.log(`📋 Listando vantagens do personagem ${id}`);

      // Verificar se o personagem existe
      const personagem = await db.Personagem.findPersonagemById(parseInt(id));
      if (!personagem) {
        return res.status(404).json({
          error: 'Personagem não encontrado'
        });
      }

      // Listar vantagens do personagem
      const vantagens = await db.Personagem.listarVantagens(id);

      console.log(`✅ ${vantagens.length} vantagens encontradas`);

      res.status(200).json({
        success: true,
        data: vantagens
      });

    } catch (error) {
      console.error('❌ Erro ao listar vantagens:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  // ===== MÉTODOS PARA GERENCIAR VÍNCULOS COM DESVANTAGENS =====

  /**
   * Adicionar desvantagem ao personagem
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  adicionarDesvantagem = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { desvantagem_id } = req.body;

      console.log(`➕ Adicionando desvantagem ${desvantagem_id} ao personagem ${id}`);

      if (!desvantagem_id) {
        return res.status(400).json({
          error: 'ID da desvantagem é obrigatório'
        });
      }

      // Verificar se o personagem existe
      const personagem = await db.Personagem.findPersonagemById(parseInt(id));
      if (!personagem) {
        return res.status(404).json({
          error: 'Personagem não encontrado'
        });
      }

      // Verificar se a desvantagem existe
      const desvantagem = await db.Desvantagem.findById(parseInt(desvantagem_id));
      if (!desvantagem) {
        return res.status(404).json({
          error: 'Desvantagem não encontrada'
        });
      }

      // Adicionar desvantagem ao personagem
      await db.Personagem.adicionarDesvantagem(id, desvantagem_id);

      console.log('✅ Desvantagem adicionada com sucesso');

      res.status(200).json({
        success: true,
        message: 'Desvantagem adicionada com sucesso'
      });

    } catch (error) {
      console.error('❌ Erro ao adicionar desvantagem:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Remover desvantagem do personagem
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  removerDesvantagem = async (req, res, next) => {
    try {
      const { id, desvantagem_id } = req.params;

      console.log(`➖ Removendo desvantagem ${desvantagem_id} do personagem ${id}`);

      // Verificar se o personagem existe
      const personagem = await db.Personagem.findPersonagemById(parseInt(id));
      if (!personagem) {
        return res.status(404).json({
          error: 'Personagem não encontrado'
        });
      }

      // Remover desvantagem do personagem
      await db.Personagem.removerDesvantagem(id, desvantagem_id);

      console.log('✅ Desvantagem removida com sucesso');

      res.status(200).json({
        success: true,
        message: 'Desvantagem removida com sucesso'
      });

    } catch (error) {
      console.error('❌ Erro ao remover desvantagem:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Listar desvantagens do personagem
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  listarDesvantagens = async (req, res, next) => {
    try {
      const { id } = req.params;

      console.log(`📋 Listando desvantagens do personagem ${id}`);

      // Verificar se o personagem existe
      const personagem = await db.Personagem.findPersonagemById(parseInt(id));
      if (!personagem) {
        return res.status(404).json({
          error: 'Personagem não encontrado'
        });
      }

      // Listar desvantagens do personagem
      const desvantagens = await db.Personagem.listarDesvantagens(id);

      console.log(`✅ ${desvantagens.length} desvantagens encontradas`);

      res.status(200).json({
        success: true,
        data: desvantagens
      });

    } catch (error) {
      console.error('❌ Erro ao listar desvantagens:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  // ===== MÉTODOS PARA GERENCIAR VÍNCULOS COM EQUIPAMENTOS =====

  /**
   * Adicionar equipamento ao personagem
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  adicionarEquipamento = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { equipamento_id } = req.body;

      console.log(`➕ Adicionando equipamento ${equipamento_id} ao personagem ${id}`);

      if (!equipamento_id) {
        return res.status(400).json({
          error: 'ID do equipamento é obrigatório'
        });
      }

      // Verificar se o personagem existe
      const personagem = await db.Personagem.findPersonagemById(parseInt(id));
      if (!personagem) {
        return res.status(404).json({
          error: 'Personagem não encontrado'
        });
      }

      // Verificar se o equipamento existe
      const equipamento = await db.Equipamento.findById(parseInt(equipamento_id));
      if (!equipamento) {
        return res.status(404).json({
          error: 'Equipamento não encontrado'
        });
      }

      // Adicionar equipamento ao personagem
      await db.Personagem.adicionarEquipamento(id, equipamento_id);

      console.log('✅ Equipamento adicionado com sucesso');

      res.status(200).json({
        success: true,
        message: 'Equipamento adicionado com sucesso'
      });

    } catch (error) {
      console.error('❌ Erro ao adicionar equipamento:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Remover equipamento do personagem
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  removerEquipamento = async (req, res, next) => {
    try {
      const { id, equipamento_id } = req.params;

      console.log(`➖ Removendo equipamento ${equipamento_id} do personagem ${id}`);

      // Verificar se o personagem existe
      const personagem = await db.Personagem.findPersonagemById(parseInt(id));
      if (!personagem) {
        return res.status(404).json({
          error: 'Personagem não encontrado'
        });
      }

      // Remover equipamento do personagem
      await db.Personagem.removerEquipamento(id, equipamento_id);

      console.log('✅ Equipamento removido com sucesso');

      res.status(200).json({
        success: true,
        message: 'Equipamento removido com sucesso'
      });

    } catch (error) {
      console.error('❌ Erro ao remover equipamento:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Listar equipamentos do personagem
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  listarEquipamentos = async (req, res, next) => {
    try {
      const { id } = req.params;

      console.log(`📋 Listando equipamentos do personagem ${id}`);

      // Verificar se o personagem existe
      const personagem = await db.Personagem.findPersonagemById(parseInt(id));
      if (!personagem) {
        return res.status(404).json({
          error: 'Personagem não encontrado'
        });
      }

      // Listar equipamentos do personagem
      const equipamentos = await db.Personagem.listarEquipamentos(id);

      console.log(`✅ ${equipamentos.length} equipamentos encontrados`);

      res.status(200).json({
        success: true,
        data: equipamentos
      });

    } catch (error) {
      console.error('❌ Erro ao listar equipamentos:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  };
}

export default new PersonagemController(); 