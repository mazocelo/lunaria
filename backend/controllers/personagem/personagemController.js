
import db from '../../Model/index.js';
import { criarGeradorBackground } from '../../agents/historia/personagem/background/index.js';
import { criarValidadorPersonagem } from '../../agents/historia/personagem/validacao/index.js';
import {
  validarAtributos,
  validarVantagens,
  validarDesvantagens,
  calcularPontosVantagem,
  pontosAtributoTotal,
  xpParaNivel,
  verificarLevelUp,
  tierDesbloqueado,
  maxCustoDesvantagem,
  EVOLUCAO
} from '../../helpers/evolucaoHelper.js';
import logger from '../../helpers/logger.js';
const log = logger.child({ module: 'personagemController' });

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
    const camposInteiros = ['nivel', 'pontos_totais', 'pontos_iniciais', 'raca_id', 'classe_id', 'forca', 'inteligencia', 'carisma', 'destreza', 'constituicao', 'agilidade', 'xp_atual', 'xp_proximo_nivel', 'pontos_atributo_pendentes'];
    
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

    // Buscar todos os relacionamentos em paralelo (evita 4 queries sequenciais)
    const [vantagens, desvantagens, equipamentos, historiasVinculadas] = await Promise.all([
      db.Personagem.listarVantagens(personagemData.id),
      db.Personagem.listarDesvantagens(personagemData.id),
      db.Personagem.listarEquipamentos(personagemData.id),
      db.Personagem.listarHistoriasPersonagem(personagemData.id).catch(err => {
        log.error({ err: err }, 'Erro ao processar histórias');
        return [];
      })
    ]);

    if (vantagens.length > 0) {
      personagemData.vantagens = vantagens.map(v => ({
        id: v.vantagem.id,
        nome: v.vantagem.nome,
        descricao: v.vantagem.descricao,
        custo: v.vantagem.custo,
        tipo: v.vantagem.tipo,
        nivel: v.vantagem.nivel,
        elemento: v.vantagem.elemento,
        bonus: v.vantagem.bonus,
      }));
    }

    if (desvantagens.length > 0) {
      personagemData.desvantagens = desvantagens.map(d => ({
        id: d.desvantagem.id,
        nome: d.desvantagem.nome,
        descricao: d.desvantagem.descricao,
        custo: d.desvantagem.custo,
        tipo: d.desvantagem.tipo,
        nivel: d.desvantagem.nivel,
        elemento: d.desvantagem.elemento,
        bonus: d.desvantagem.bonus,
      }));
    }

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

    // Processar histórias vinculadas
    personagemData.historias = historiasVinculadas.map(vinculo => ({
      id: vinculo.historias.id,
      nome: vinculo.historias.nome,
      papel: vinculo.papel || 'jogador'
    }));

    if (historiasVinculadas.length > 0 && historiasVinculadas[0].historias) {
      personagemData.historia_nome = historiasVinculadas[0].historias.nome;
      personagemData.historia_id = historiasVinculadas[0].historias.id;
    } else {
      personagemData.historias = [];
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
      log.info('Criando novo personagem');

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
        vantagens,
        desvantagens,
        equipamentos,
        sugestao_background = '',
        historias, // Array de IDs de histórias para vincular
        imagem
      } = req.body;
      // Validacoes basicas
      if (!nome) {
        return res.status(400).json({ success: false, error: 'Nome e obrigatorio' });
      }

      const nivelEfetivo = nivel || 1;
      if (nivelEfetivo < 1 || nivelEfetivo > EVOLUCAO.NIVEL_MAX) {
        return res.status(400).json({ success: false, error: `Nivel deve estar entre 1 e ${EVOLUCAO.NIVEL_MAX}` });
      }

      // Validar atributos (range individual + total de pontos)
      const atributos = {
        forca: forca || 10, inteligencia: inteligencia || 10, carisma: carisma || 10,
        destreza: destreza || 10, constituicao: constituicao || 10, agilidade: agilidade || 10
      };
      const validacaoAtributos = validarAtributos(atributos, nivelEfetivo);
      if (!validacaoAtributos.valido) {
        return res.status(400).json({ success: false, error: validacaoAtributos.erros.join('; ') });
      }

      // Buscar raca e classe para validar orcamento de vantagens
      let racaCusto = 0;
      let classeCusto = 0;
      if (raca_id) {
        const raca = await db.Raca.findById(parseInt(raca_id));
        if (!raca) return res.status(400).json({ success: false, error: `Raca com ID ${raca_id} nao encontrada` });
        racaCusto = raca.custo || 0;
      }
      if (classe_id) {
        const classe = await db.Classe.findById(parseInt(classe_id));
        if (!classe) return res.status(400).json({ success: false, error: `Classe com ID ${classe_id} nao encontrada` });
        classeCusto = classe.custo || 0;
      }

      // Validar desvantagens (tier + limite de custo)
      let custoDesvantagensAceitas = 0;
      if (desvantagens && Array.isArray(desvantagens) && desvantagens.length > 0) {
        const desvantagensObjetos = await Promise.all(
          desvantagens.map(id => db.Desvantagem.findById(parseInt(id)))
        );
        const desvantagensValidas = desvantagensObjetos.filter(d => d !== null);
        const idsNaoEncontrados = desvantagens.filter((id, i) => !desvantagensObjetos[i]);
        if (idsNaoEncontrados.length > 0) {
          return res.status(400).json({ success: false, error: `Desvantagens nao encontradas: ${idsNaoEncontrados.join(', ')}` });
        }
        const validacaoDesv = validarDesvantagens(desvantagensValidas, nivelEfetivo);
        if (!validacaoDesv.valido) {
          return res.status(400).json({ success: false, error: validacaoDesv.erros.join('; ') });
        }
        custoDesvantagensAceitas = validacaoDesv.custoTotal;
      }

      // Validar vantagens (tier + orcamento)
      if (vantagens && Array.isArray(vantagens) && vantagens.length > 0) {
        const vantagensObjetos = await Promise.all(
          vantagens.map(id => db.Vantagem.findById(parseInt(id)))
        );
        const idsNaoEncontrados = vantagens.filter((id, i) => !vantagensObjetos[i]);
        if (idsNaoEncontrados.length > 0) {
          return res.status(400).json({ success: false, error: `Vantagens nao encontradas: ${idsNaoEncontrados.join(', ')}` });
        }
        const vantagensValidas = vantagensObjetos.filter(v => v !== null);
        const pontosDisponiveis = calcularPontosVantagem(nivelEfetivo, racaCusto, classeCusto, custoDesvantagensAceitas);
        const validacaoVant = validarVantagens(vantagensValidas, pontosDisponiveis, nivelEfetivo);
        if (!validacaoVant.valido) {
          return res.status(400).json({ success: false, error: validacaoVant.erros.join('; ') });
        }
      }

      // Background é enviado pelo frontend (pode ser vazio, será gerado sob demanda via POST /:id/background)
      const backgroundFinal = background || '';

      // Preparar dados do personagem
      const pontosIniciais = calcularPontosVantagem(nivelEfetivo, racaCusto, classeCusto, 0);
      const dadosPersonagem = this.converterCamposNumericos({
        nome,
        nivel: nivelEfetivo,
        pontos_totais: 0,
        pontos_iniciais: pontosIniciais,
        background: backgroundFinal || '',
        raca_id: raca_id || null,
        classe_id: classe_id || null,
        forca: forca || 10,
        inteligencia: inteligencia || 10,
        carisma: carisma || 10,
        destreza: destreza || 10,
        constituicao: constituicao || 10,
        agilidade: agilidade || 10,
        xp_atual: 0,
        xp_proximo_nivel: xpParaNivel(nivelEfetivo),
        pontos_atributo_pendentes: 0,
        id_usuario: req.user?.id || null,
        ...(imagem ? { imagem } : {})
      });

      // Criar personagem no banco
      const novoPersonagem = await db.Personagem.createPersonagem(dadosPersonagem);

      log.info({ novoPersonagem_id: novoPersonagem.id }, 'Personagem criado');

      // Criar vínculos em transação (atômico)
      await db.prisma.$transaction(async (tx) => {
        // Histórias
        if (historias && Array.isArray(historias) && historias.length > 0) {
          for (const historia_id of historias) {
            const historia = await tx.historias.findUnique({ where: { id: parseInt(historia_id) } });
            if (historia) {
              await tx.historias_personagens.create({
                data: { personagem_id: novoPersonagem.id, historia_id: parseInt(historia_id), papel: 'jogador' }
              });
            }
          }
        }

        // Vantagens
        if (vantagens && Array.isArray(vantagens) && vantagens.length > 0) {
          await tx.personagem_vantagem.createMany({
            data: vantagens.map(vid => ({ personagem_id: novoPersonagem.id, vantagem_id: parseInt(vid) }))
          });
        }

        // Desvantagens
        if (desvantagens && Array.isArray(desvantagens) && desvantagens.length > 0) {
          await tx.personagem_desvantagem.createMany({
            data: desvantagens.map(did => ({ personagem_id: novoPersonagem.id, desvantagem_id: parseInt(did) }))
          });
        }

        // Equipamentos
        if (equipamentos && Array.isArray(equipamentos) && equipamentos.length > 0) {
          await tx.personagem_equipamento.createMany({
            data: equipamentos.map(eid => ({ personagem_id: novoPersonagem.id, equipamento_id: parseInt(eid) }))
          });
        }
      });

      // Buscar o personagem recém-criado com os relacionamentos
      const personagemCompleto = await this.buscarPersonagemComRelacionamentos(novoPersonagem.id);
      const personagemData = await this.processarDadosPersonagem(personagemCompleto);

      // Auto-evento no feed
      db.FeedPost.createAutoEvent(req.user.id, 'personagem_criado', { nome: novoPersonagem.nome }, 'personagem', novoPersonagem.id);

      res.status(201).json({
        success: true,
        message: 'Personagem criado com sucesso',
        data: {
          ...personagemData,
          background: backgroundFinal
        }
      });

    } catch (error) {
      log.error({ err: error }, 'Erro ao criar personagem');
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
      log.info('Listando personagens...', req.user ? `para usuário ${req.user.id}` : 'público');

      const { id_usuario, status, limit = 20, offset = 0, todos = false } = req.query;

      // Buscar todos os personagens com relacionamentos
      let personagens = await db.Personagem.findAllPersonagens();

      // Se o usuário estiver logado e não for solicitada listagem pública, filtrar por usuário
      if (req.user && req.user.id && todos !== 'true') {
        personagens = personagens.filter(p => p.id_usuario === req.user.id);
      }

      // Aplicar filtros manualmente
      if (id_usuario) {
        personagens = personagens.filter(p => p.id_usuario === parseInt(id_usuario));
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

      log.info({ personagensProcessados_length: personagensProcessados.length }, 'personagens encontrados');

      res.status(200).json({
        success: true,
        data: personagensProcessados,
        pagination: {
          total: personagens.length,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: startIndex + personagensProcessados.length < personagens.length
        },
        filtrado_por_usuario: req.user && req.user.id && todos !== 'true' ? req.user.id : null
      });

    } catch (error) {
      log.error({ err: error }, 'Erro ao listar personagens');
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

      log.info({ id: id }, 'Buscando personagem ID');

      const personagem = await this.buscarPersonagemComRelacionamentos(parseInt(id));

      if (!personagem) {
        return res.status(404).json({
          success: false,
          error: 'Personagem não encontrado'
        });
      }

      // Verificar se usuário tem permissão para ver este personagem
      if (req.user && req.user.id && personagem.id_usuario && personagem.id_usuario !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Você não tem permissão para acessar este personagem'
        });
      }

      const personagemData = await this.processarDadosPersonagem(personagem);

      log.info('Personagem encontrado');

      res.status(200).json({
        success: true,
        data: personagemData
      });

    } catch (error) {
      log.error({ err: error }, 'Erro ao obter personagem');
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
      const { vantagens, desvantagens, equipamentos, historias, ...dadosAtualizacao } = req.body;

      log.info({ id, dadosAtualizacao }, 'Atualizando personagem');

      const personagem = await db.Personagem.findPersonagemById(parseInt(id));

      if (!personagem) {
        return res.status(404).json({
          success: false,
          error: 'Personagem não encontrado'
        });
      }

      // Verificar se usuário tem permissão para atualizar este personagem
      if (req.user && req.user.id && personagem.id_usuario && personagem.id_usuario !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Você só pode atualizar seus próprios personagens'
        });
      }

      // Remover campos que não podem ser atualizados ou são calculados
      delete dadosAtualizacao.id;
      delete dadosAtualizacao.id_usuario;
      delete dadosAtualizacao.classe; // nome, não ID
      delete dadosAtualizacao.raca; // nome, não ID
      delete dadosAtualizacao.historia_nome; // calculado
      delete dadosAtualizacao.historia_id; // calculado
      delete dadosAtualizacao.historias; // array, calculado
      delete dadosAtualizacao.created_at;
      delete dadosAtualizacao.updated_at;
      delete dadosAtualizacao.criado_em;
      delete dadosAtualizacao.atualizado_em;
      delete dadosAtualizacao.atributos; // objeto, não enviamos direto
      delete dadosAtualizacao.pontos_iniciais;
      delete dadosAtualizacao.pontos_totais;
      delete dadosAtualizacao.sugestao_background; // não existe no schema
      delete dadosAtualizacao.classe_id; // classe não pode ser alterada
      delete dadosAtualizacao.raca_id; // raça não pode ser alterada
      delete dadosAtualizacao.hp; // não existe no schema
      delete dadosAtualizacao.hp_maximo; // não existe no schema
      delete dadosAtualizacao.equipamentos; // gerenciado via relacionamento personagem_equipamento
      delete dadosAtualizacao.nivel; // gerenciado pelo sistema de evolução
      delete dadosAtualizacao.xp_atual; // gerenciado pelo sistema de evolução
      delete dadosAtualizacao.xp_proximo_nivel; // gerenciado pelo sistema de evolução
      delete dadosAtualizacao.pontos_atributo_pendentes; // gerenciado pelo sistema de evolução

      // Validar atributos se fornecidos
      const atributos = ['forca', 'inteligencia', 'carisma', 'destreza', 'constituicao', 'agilidade'];
      for (const atributo of atributos) {
        if (dadosAtualizacao[atributo] && (dadosAtualizacao[atributo] < 1 || dadosAtualizacao[atributo] > 20)) {
          return res.status(400).json({
            error: `${atributo} deve estar entre 1 e 20`
          });
        }
      }

      // Converter campos numéricos para inteiros (incluindo classe_id e raca_id)
      const dadosConvertidos = this.converterCamposNumericos(dadosAtualizacao);

      // Atualizar dados usando o método update do Prisma
      // Os campos classe_id e raca_id são atualizados diretamente
      await db.Personagem.updatePersonagem(parseInt(id), dadosConvertidos);

      // Gerenciar vinculos em transacao (atomico)
      await db.prisma.$transaction(async (tx) => {
        // Vantagens
        if (vantagens !== undefined) {
          await tx.personagem_vantagem.deleteMany({ where: { personagem_id: parseInt(id) } });
          if (Array.isArray(vantagens) && vantagens.length > 0) {
            await tx.personagem_vantagem.createMany({
              data: vantagens.map(vid => ({ personagem_id: parseInt(id), vantagem_id: parseInt(vid) }))
            });
          }
        }

        // Desvantagens
        if (desvantagens !== undefined) {
          await tx.personagem_desvantagem.deleteMany({ where: { personagem_id: parseInt(id) } });
          if (Array.isArray(desvantagens) && desvantagens.length > 0) {
            await tx.personagem_desvantagem.createMany({
              data: desvantagens.map(did => ({ personagem_id: parseInt(id), desvantagem_id: parseInt(did) }))
            });
          }
        }

        // Equipamentos
        if (equipamentos !== undefined) {
          await tx.personagem_equipamento.deleteMany({ where: { personagem_id: parseInt(id) } });
          if (Array.isArray(equipamentos) && equipamentos.length > 0) {
            await tx.personagem_equipamento.createMany({
              data: equipamentos.map(eid => ({ personagem_id: parseInt(id), equipamento_id: parseInt(eid) }))
            });
          }
        }

        // Historias
        if (historias !== undefined) {
          await tx.historias_personagens.deleteMany({ where: { personagem_id: parseInt(id) } });
          if (Array.isArray(historias) && historias.length > 0) {
            for (const historia_id of historias) {
              const historia = await tx.historias.findUnique({ where: { id: parseInt(historia_id) } });
              if (historia) {
                await tx.historias_personagens.create({
                  data: { personagem_id: parseInt(id), historia_id: parseInt(historia_id), papel: 'jogador' }
                });
              }
            }
          }
        }
      });

      // Buscar o personagem atualizado com os relacionamentos
      const personagemCompleto = await this.buscarPersonagemComRelacionamentos(parseInt(id));
      const personagemData = await this.processarDadosPersonagem(personagemCompleto);

      log.info('Personagem atualizado com sucesso');

      res.status(200).json({
        success: true,
        message: 'Personagem atualizado com sucesso',
        data: personagemData
      });

    } catch (error) {
      log.error({ err: error }, 'Erro ao atualizar personagem');
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

      log.info({ id: id }, 'Excluindo personagem ID');

      const personagem = await db.Personagem.findPersonagemById(parseInt(id));

      if (!personagem) {
        return res.status(404).json({
          success: false,
          error: 'Personagem não encontrado'
        });
      }

      // Verificar se usuário tem permissão para excluir este personagem
      if (req.user && req.user.id && personagem.id_usuario && personagem.id_usuario !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Você só pode excluir seus próprios personagens'
        });
      }

      await db.Personagem.deletePersonagem(parseInt(id));

      res.status(204).send();

    } catch (error) {
      log.error({ err: error }, 'Erro ao excluir personagem');
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Restaurar um personagem soft-deleted
   */
  restaurarPersonagem = async (req, res, next) => {
    try {
      const { id } = req.params;

      const personagem = await db.Personagem.restorePersonagem(parseInt(id));

      res.status(200).json({
        success: true,
        message: 'Personagem restaurado com sucesso',
        data: personagem
      });
    } catch (error) {
      log.error({ err: error }, 'Erro ao restaurar personagem');
      res.status(500).json({
        success: false,
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
      const { sugestao_background = '' } = req.body;

      log.info({ id: id }, 'Gerando background para personagem ID');

      // Buscar personagem completo com todos os relacionamentos
      const personagemCompleto = await this.buscarPersonagemComRelacionamentos(parseInt(id));
      if (!personagemCompleto) {
        return res.status(404).json({ success: false, error: 'Personagem não encontrado' });
      }

      const personagemData = await this.processarDadosPersonagem(personagemCompleto);

      // Extrair nomes de raça e classe
      const nomeRaca = personagemData.raca || personagemCompleto.racas?.nome || 'Humano';
      const nomeClasse = personagemData.classe || personagemCompleto.classes?.nome || 'Aventureiro';

      // Buscar temas das histórias vinculadas
      const historiasVinculadas = await db.Personagem.listarHistoriasPersonagem(parseInt(id));
      const historia = historiasVinculadas.length > 0 ? historiasVinculadas[0].historias : null;
      const temas = historia?.temas || ['aventura', 'fantasia'];

      // Buscar temas completos
      const temasCompletos = await Promise.all(
        (Array.isArray(temas) ? temas : []).map(t =>
          typeof t === 'string' ? db.Temas.findByNome(t) : t
        )
      );
      const temasFiltrados = temasCompletos.filter(t => t !== null);

      // Preparar vantagens e desvantagens completas
      const vantagensCompletas = (personagemData.vantagens || []).map(v => ({
        nome: v.nome,
        descricao: v.descricao || ''
      }));
      const desvantagensCompletas = (personagemData.desvantagens || []).map(d => ({
        nome: d.nome,
        descricao: d.descricao || ''
      }));

      // Preparar equipamentos
      const equipamentosNomes = (personagemData.equipamentos || [])
        .map(e => `${e.nome}${e.descricao ? ` (${e.descricao.substring(0, 80)})` : ''}`)
        .join(', ') || 'Nenhum';

      const geradorBackground = await criarGeradorBackground(temasFiltrados);

      const resultadoBackground = await geradorBackground.gerarBackground({
        nome: personagemCompleto.nome,
        classe: nomeClasse,
        raca: nomeRaca,
        tema: temasFiltrados,
        sugestao_background: sugestao_background || '',
        vantagens: vantagensCompletas,
        desvantagens: desvantagensCompletas,
        nivel: personagemCompleto.nivel || 1,
        forca: personagemCompleto.forca || 10,
        inteligencia: personagemCompleto.inteligencia || 10,
        carisma: personagemCompleto.carisma || 10,
        destreza: personagemCompleto.destreza || 10,
        constituicao: personagemCompleto.constituicao || 10,
        agilidade: personagemCompleto.agilidade || 10,
        equipamentos: equipamentosNomes,
        userId: req.user?.id
      });

      // Atualizar personagem com o novo background
      await db.Personagem.updatePersonagem(parseInt(id), {
        background: resultadoBackground.background,
        atualizado_em: new Date()
      });

      // Buscar o personagem atualizado
      const personagemAtualizado = await this.buscarPersonagemComRelacionamentos(parseInt(id));
      const dadosFinais = await this.processarDadosPersonagem(personagemAtualizado);

      log.info('Background gerado e salvo');

      res.status(200).json({
        success: true,
        message: 'Background gerado com sucesso',
        data: {
          ...dadosFinais,
          background_gerado: resultadoBackground.background
        }
      });

    } catch (error) {
      log.error({ err: error }, 'Erro ao gerar background');
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
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

      log.info({ historia_id: historia_id }, 'Listando personagens da história ID');

      // Verificar se a história existe
      const historia = await db.Historia.findById(parseInt(historia_id));
      if (!historia) {
        return res.status(404).json({
          error: 'História não encontrada'
        });
      }

      // Buscar personagens vinculados à história através da tabela historias_personagens
      const vinculosPersonagens = await db.Personagem.listarPersonagensHistoriaByUsuario(historia_id, req.user.id);
      
      let personagens = vinculosPersonagens.map(vinculo => ({
        ...vinculo.personagens,
        papel: vinculo.papel // Adicionar o papel do personagem na história
      }));
      
      // Se há termo de busca, filtrar pelos nomes e backgrounds
      if (search) {
        personagens = personagens.filter(p => 
          p.nome.toLowerCase().includes(search.toLowerCase()) ||
          (p.background && p.background.toLowerCase().includes(search.toLowerCase()))
        );
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

      log.info({ personagensProcessados_length: personagensProcessados.length, historia_nome: historia.nome }, 'personagens encontrados para a história ""');

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
        message: `Personagens vinculados à história "${historia.nome}" através da tabela historias_personagens.`
      });

    } catch (error) {
      log.error({ err: error }, 'Erro ao listar personagens por história');
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

      log.info({ vantagem_id: vantagem_id, id: id }, 'Adicionando vantagem ao personagem');

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

      log.info('Vantagem adicionada com sucesso');

      res.status(200).json({
        success: true,
        message: 'Vantagem adicionada com sucesso'
      });

    } catch (error) {
      log.error({ err: error }, 'Erro ao adicionar vantagem');
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

      log.info({ vantagem_id: vantagem_id, id: id }, 'Removendo vantagem do personagem');

      // Verificar se o personagem existe
      const personagem = await db.Personagem.findPersonagemById(parseInt(id));
      if (!personagem) {
        return res.status(404).json({
          error: 'Personagem não encontrado'
        });
      }

      // Remover vantagem do personagem
      await db.Personagem.removerVantagem(id, vantagem_id);

      log.info('Vantagem removida com sucesso');

      res.status(200).json({
        success: true,
        message: 'Vantagem removida com sucesso'
      });

    } catch (error) {
      log.error({ err: error }, 'Erro ao remover vantagem');
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

      log.info({ id: id }, 'Listando vantagens do personagem');

      // Verificar se o personagem existe
      const personagem = await db.Personagem.findPersonagemById(parseInt(id));
      if (!personagem) {
        return res.status(404).json({
          error: 'Personagem não encontrado'
        });
      }

      // Listar vantagens do personagem
      const vantagens = await db.Personagem.listarVantagens(id);

      log.info({ vantagens_length: vantagens.length }, 'vantagens encontradas');

      res.status(200).json({
        success: true,
        data: vantagens
      });

    } catch (error) {
      log.error({ err: error }, 'Erro ao listar vantagens');
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

      log.info({ desvantagem_id: desvantagem_id, id: id }, 'Adicionando desvantagem ao personagem');

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

      log.info('Desvantagem adicionada com sucesso');

      res.status(200).json({
        success: true,
        message: 'Desvantagem adicionada com sucesso'
      });

    } catch (error) {
      log.error({ err: error }, 'Erro ao adicionar desvantagem');
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

      log.info({ desvantagem_id: desvantagem_id, id: id }, 'Removendo desvantagem do personagem');

      // Verificar se o personagem existe
      const personagem = await db.Personagem.findPersonagemById(parseInt(id));
      if (!personagem) {
        return res.status(404).json({
          error: 'Personagem não encontrado'
        });
      }

      // Remover desvantagem do personagem
      await db.Personagem.removerDesvantagem(id, desvantagem_id);

      log.info('Desvantagem removida com sucesso');

      res.status(200).json({
        success: true,
        message: 'Desvantagem removida com sucesso'
      });

    } catch (error) {
      log.error({ err: error }, 'Erro ao remover desvantagem');
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

      log.info({ id: id }, 'Listando desvantagens do personagem');

      // Verificar se o personagem existe
      const personagem = await db.Personagem.findPersonagemById(parseInt(id));
      if (!personagem) {
        return res.status(404).json({
          error: 'Personagem não encontrado'
        });
      }

      // Listar desvantagens do personagem
      const desvantagens = await db.Personagem.listarDesvantagens(id);

      log.info({ desvantagens_length: desvantagens.length }, 'desvantagens encontradas');

      res.status(200).json({
        success: true,
        data: desvantagens
      });

    } catch (error) {
      log.error({ err: error }, 'Erro ao listar desvantagens');
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

      log.info({ equipamento_id: equipamento_id, id: id }, 'Adicionando equipamento ao personagem');

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

      log.info('Equipamento adicionado com sucesso');

      res.status(200).json({
        success: true,
        message: 'Equipamento adicionado com sucesso'
      });

    } catch (error) {
      log.error({ err: error }, 'Erro ao adicionar equipamento');
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

      log.info({ equipamento_id: equipamento_id, id: id }, 'Removendo equipamento do personagem');

      // Verificar se o personagem existe
      const personagem = await db.Personagem.findPersonagemById(parseInt(id));
      if (!personagem) {
        return res.status(404).json({
          error: 'Personagem não encontrado'
        });
      }

      // Remover equipamento do personagem
      await db.Personagem.removerEquipamento(id, equipamento_id);

      log.info('Equipamento removido com sucesso');

      res.status(200).json({
        success: true,
        message: 'Equipamento removido com sucesso'
      });

    } catch (error) {
      log.error({ err: error }, 'Erro ao remover equipamento');
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

      log.info({ id: id }, 'Listando equipamentos do personagem');

      // Verificar se o personagem existe
      const personagem = await db.Personagem.findPersonagemById(parseInt(id));
      if (!personagem) {
        return res.status(404).json({
          error: 'Personagem não encontrado'
        });
      }

      // Listar equipamentos do personagem
      const equipamentos = await db.Personagem.listarEquipamentos(id);

      log.info({ equipamentos_length: equipamentos.length }, 'equipamentos encontrados');

      res.status(200).json({
        success: true,
        data: equipamentos
      });

    } catch (error) {
      log.error({ err: error }, 'Erro ao listar equipamentos');
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  // ===== MÉTODOS PARA GERENCIAR VÍNCULOS COM HISTÓRIAS =====

  /**
   * Vincular personagem a uma história
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  vincularHistoria = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { historia_id, papel } = req.body;

      log.info({ id: id, historia_id: historia_id }, 'Vinculando personagem à história');

      if (!historia_id) {
        return res.status(400).json({
          error: 'ID da história é obrigatório'
        });
      }

      // Verificar se o personagem existe
      const personagem = await db.Personagem.findPersonagemById(parseInt(id));
      if (!personagem) {
        return res.status(404).json({
          error: 'Personagem não encontrado'
        });
      }

      // Verificar se a história existe
      const historia = await db.Historia.findById(parseInt(historia_id));
      if (!historia) {
        return res.status(404).json({
          error: 'História não encontrada'
        });
      }

      // Verificar se o vínculo já existe
      const vinculosExistentes = await db.Personagem.listarHistoriasPersonagem(parseInt(id));
      const vinculoExiste = vinculosExistentes.some(v => v.historia_id === parseInt(historia_id));
      
      if (vinculoExiste) {
        return res.status(400).json({
          error: 'Personagem já está vinculado a esta história'
        });
      }

      // Criar vínculo
      await db.Personagem.vincularHistoria(id, historia_id, papel || 'jogador');

      log.info('Vínculo criado com sucesso');

      res.status(200).json({
        success: true,
        message: 'Personagem vinculado à história com sucesso'
      });

    } catch (error) {
      log.error({ err: error }, 'Erro ao vincular personagem à história');
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Desvincular personagem de uma história
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  desvincularHistoria = async (req, res, next) => {
    try {
      const { id, historia_id } = req.params;

      log.info({ id: id, historia_id: historia_id }, 'Desvinculando personagem da história');

      // Verificar se o personagem existe
      const personagem = await db.Personagem.findPersonagemById(parseInt(id));
      if (!personagem) {
        return res.status(404).json({
          error: 'Personagem não encontrado'
        });
      }

      // Desvincular
      await db.Personagem.desvincularHistoria(id, historia_id);

      log.info('Vínculo removido com sucesso');

      res.status(200).json({
        success: true,
        message: 'Personagem desvinculado da história com sucesso'
      });

    } catch (error) {
      log.error({ err: error }, 'Erro ao desvincular personagem da história');
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Listar histórias do personagem
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  listarHistoriasPersonagem = async (req, res, next) => {
    try {
      const { id } = req.params;

      log.info({ id: id }, 'Listando histórias do personagem');

      // Verificar se o personagem existe
      const personagem = await db.Personagem.findPersonagemById(parseInt(id));
      if (!personagem) {
        return res.status(404).json({
          error: 'Personagem não encontrado'
        });
      }

      // Listar histórias do personagem
      const historias = await db.Personagem.listarHistoriasPersonagem(id);

      log.info({ historias_length: historias.length }, 'histórias encontradas');

      res.status(200).json({
        success: true,
        data: historias
      });

    } catch (error) {
      log.error({ err: error }, 'Erro ao listar histórias do personagem');
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  };

  // ===== SISTEMA DE EVOLUCAO =====

  /**
   * Adicionar XP a um personagem (chamado apos combate)
   * POST /personagens/:id/ganhar-xp
   * Body: { xp: number }
   */
  ganharXP = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { xp } = req.body;

      if (!xp || xp <= 0) {
        return res.status(400).json({ success: false, error: 'XP deve ser um numero positivo' });
      }

      const personagem = await db.Personagem.findPersonagemById(parseInt(id));
      if (!personagem) {
        return res.status(404).json({ success: false, error: 'Personagem nao encontrado' });
      }

      const xpAtual = (personagem.xp_atual || 0) + parseInt(xp);
      const nivelAtual = personagem.nivel || 1;

      // Verificar se pode subir de nivel
      const resultado = verificarLevelUp(nivelAtual, xpAtual);

      if (resultado.podeEvoluir) {
        const ganhos = resultado.ganhos;
        await db.Personagem.updatePersonagem(parseInt(id), {
          xp_atual: ganhos.xpRestante,
          xp_proximo_nivel: ganhos.xpProximoNivel,
          nivel: ganhos.novoNivel,
          pontos_atributo_pendentes: (personagem.pontos_atributo_pendentes || 0) + ganhos.pontosAtributo,
          pontos_totais: (personagem.pontos_totais || 0) + ganhos.pontosAtributo,
          atualizado_em: new Date()
        });

        return res.status(200).json({
          success: true,
          levelUp: true,
          message: `Level up! Nivel ${nivelAtual} -> ${ganhos.novoNivel}`,
          data: {
            novoNivel: ganhos.novoNivel,
            xpRestante: ganhos.xpRestante,
            xpProximoNivel: ganhos.xpProximoNivel,
            pontosAtributoGanhos: ganhos.pontosAtributo,
            pontosVantagemGanhos: ganhos.pontosVantagem,
            novoTier: ganhos.novoTier,
            tierMudou: ganhos.tierMudou,
            novoMaxDesvantagem: ganhos.novoMaxDesvantagem
          }
        });
      }

      // Sem level up, so atualizar XP
      await db.Personagem.updatePersonagem(parseInt(id), {
        xp_atual: xpAtual,
        atualizado_em: new Date()
      });

      return res.status(200).json({
        success: true,
        levelUp: false,
        message: `+${xp} XP ganho`,
        data: {
          xpAtual,
          xpProximoNivel: personagem.xp_proximo_nivel || xpParaNivel(nivelAtual),
          nivelAtual
        }
      });

    } catch (error) {
      log.error({ err: error }, 'Erro ao adicionar XP');
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }

  /**
   * Distribuir pontos de atributo pendentes
   * POST /personagens/:id/distribuir-pontos
   * Body: { forca: +1, destreza: +1 } (incrementos, nao valores absolutos)
   */
  distribuirPontos = async (req, res, next) => {
    try {
      const { id } = req.params;
      const incrementos = req.body;

      const personagem = await db.Personagem.findPersonagemById(parseInt(id));
      if (!personagem) {
        return res.status(404).json({ success: false, error: 'Personagem nao encontrado' });
      }

      if (req.user && req.user.id && personagem.id_usuario && personagem.id_usuario !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Voce so pode atualizar seus proprios personagens' });
      }

      const pendentes = personagem.pontos_atributo_pendentes || 0;
      if (pendentes <= 0) {
        return res.status(400).json({ success: false, error: 'Nenhum ponto de atributo pendente para distribuir' });
      }

      const statsNomes = ['forca', 'inteligencia', 'carisma', 'destreza', 'constituicao', 'agilidade'];
      let totalGasto = 0;
      const novosStats = {};

      for (const stat of statsNomes) {
        const inc = parseInt(incrementos[stat]) || 0;
        if (inc < 0) {
          return res.status(400).json({ success: false, error: `Incremento de ${stat} nao pode ser negativo` });
        }
        if (inc > 0) {
          const novoValor = (personagem[stat] || 10) + inc;
          if (novoValor > EVOLUCAO.STAT_MAX) {
            return res.status(400).json({ success: false, error: `${stat} excederia o maximo de ${EVOLUCAO.STAT_MAX} (atual: ${personagem[stat]}, incremento: ${inc})` });
          }
          novosStats[stat] = novoValor;
          totalGasto += inc;
        }
      }

      if (totalGasto === 0) {
        return res.status(400).json({ success: false, error: 'Nenhum incremento fornecido' });
      }

      if (totalGasto > pendentes) {
        return res.status(400).json({ success: false, error: `Pontos insuficientes: ${totalGasto} solicitados, ${pendentes} disponiveis` });
      }

      await db.Personagem.updatePersonagem(parseInt(id), {
        ...novosStats,
        pontos_atributo_pendentes: pendentes - totalGasto,
        atualizado_em: new Date()
      });

      res.status(200).json({
        success: true,
        message: `${totalGasto} pontos distribuidos`,
        data: {
          pontosRestantes: pendentes - totalGasto,
          statsAtualizados: novosStats
        }
      });

    } catch (error) {
      log.error({ err: error }, 'Erro ao distribuir pontos');
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }

  /**
   * Obter informacoes de evolucao do personagem
   * GET /personagens/:id/evolucao
   */
  obterEvolucao = async (req, res, next) => {
    try {
      const { id } = req.params;

      const personagem = await db.Personagem.findPersonagemById(parseInt(id));
      if (!personagem) {
        return res.status(404).json({ success: false, error: 'Personagem nao encontrado' });
      }

      const nivel = personagem.nivel || 1;
      const xpAtual = personagem.xp_atual || 0;
      const xpProximoNivel = personagem.xp_proximo_nivel || xpParaNivel(nivel);

      // Buscar raca/classe para calcular orcamento
      let racaCusto = 0, classeCusto = 0;
      if (personagem.raca_id) {
        const raca = await db.Raca.findById(personagem.raca_id);
        racaCusto = raca?.custo || 0;
      }
      if (personagem.classe_id) {
        const classe = await db.Classe.findById(personagem.classe_id);
        classeCusto = classe?.custo || 0;
      }

      // Buscar vantagens e desvantagens atuais
      const vantagensAtuais = await db.Personagem.listarVantagens(parseInt(id));
      const desvantagensAtuais = await db.Personagem.listarDesvantagens(parseInt(id));
      const custoVantagensUsado = vantagensAtuais.reduce((sum, v) => sum + Math.abs(v.vantagem.custo || 0), 0);
      const custoDesvantagensUsado = desvantagensAtuais.reduce((sum, d) => sum + Math.abs(d.desvantagem.custo || 0), 0);

      const pontosVantagemTotal = calcularPontosVantagem(nivel, racaCusto, classeCusto, custoDesvantagensUsado);
      const maxDesv = maxCustoDesvantagem(nivel);

      res.status(200).json({
        success: true,
        data: {
          nivel,
          xpAtual,
          xpProximoNivel,
          progressoXP: Math.min(100, Math.round((xpAtual / xpProximoNivel) * 100)),
          pontosAtributoPendentes: personagem.pontos_atributo_pendentes || 0,
          pontosAtributoTotal: pontosAtributoTotal(nivel),
          vantagens: {
            pontosTotal: pontosVantagemTotal,
            pontosUsados: custoVantagensUsado,
            pontosDisponiveis: pontosVantagemTotal - custoVantagensUsado,
            tier: tierDesbloqueado(nivel)
          },
          desvantagens: {
            maxCusto: maxDesv,
            custoUsado: custoDesvantagensUsado,
            custoDisponivel: maxDesv - custoDesvantagensUsado,
            tier: tierDesbloqueado(nivel)
          }
        }
      });

    } catch (error) {
      log.error({ err: error }, 'Erro ao obter evolucao');
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }

  /**
   * Validar coerência narrativa do personagem via IA
   * POST /:id/validar-coerencia
   */
  validarCoerencia = async (req, res, next) => {
    try {
      const { id } = req.params;

      const personagemCompleto = await this.buscarPersonagemComRelacionamentos(parseInt(id));
      if (!personagemCompleto) {
        return res.status(404).json({ success: false, error: 'Personagem não encontrado' });
      }

      const personagemData = await this.processarDadosPersonagem(personagemCompleto);

      const nomeRaca = personagemData.raca || personagemCompleto.racas?.nome || 'Humano';
      const nomeClasse = personagemData.classe || personagemCompleto.classes?.nome || 'Aventureiro';

      const vantagensTexto = (personagemData.vantagens || [])
        .map(v => `${v.nome}: ${v.descricao || ''}`)
        .join('\n') || 'Nenhuma';

      const desvantagensTexto = (personagemData.desvantagens || [])
        .map(d => `${d.nome}: ${d.descricao || ''}`)
        .join('\n') || 'Nenhuma';

      const equipamentosTexto = (personagemData.equipamentos || [])
        .map(e => e.nome)
        .join(', ') || 'Nenhum';

      const validador = await criarValidadorPersonagem();
      const resultado = await validador.validar({
        nome: personagemCompleto.nome,
        classe: nomeClasse,
        raca: nomeRaca,
        nivel: personagemCompleto.nivel || 1,
        forca: personagemCompleto.forca || 10,
        inteligencia: personagemCompleto.inteligencia || 10,
        carisma: personagemCompleto.carisma || 10,
        destreza: personagemCompleto.destreza || 10,
        constituicao: personagemCompleto.constituicao || 10,
        agilidade: personagemCompleto.agilidade || 10,
        vantagens: vantagensTexto,
        desvantagens: desvantagensTexto,
        equipamentos: equipamentosTexto,
        background: personagemCompleto.background || '',
        userId: req.user?.id
      });

      res.status(200).json({
        success: true,
        data: resultado
      });

    } catch (error) {
      log.error({ err: error }, 'Erro ao validar coerência');
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
}

export default new PersonagemController(); 