
import db from '../../Model/index.js';
import { criarGeradorBackground } from '../../agents/historia/personagem/background/index.js';
import { criarValidadorPersonagem } from '../../agents/historia/personagem/validacao/index.js';
import {
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
import { validarAtributosCriacao } from '../../helpers/criacaoPersonagemHelper.js';
import { buildFinalizacaoBase } from '../../helpers/finalizacaoInicialHelper.js';
import { buildFinalizacaoPreviewBase } from '../../helpers/finalizacaoPreviewHelper.js';
import criarFinalizacaoInicialAgent from '../../agents/Personagem/finalizacao/FinalizacaoInicialAgent.js';
import { parsearBonusEntidade } from '../../helpers/bonusHelper.js';
import { getAtributosMap, LUNARIA_ATTRS, getAttrNamesForSystem } from '../../helpers/atributosHelper.js';
import { sanitizeCharacterName, sanitizePromptInput } from '../../helpers/sanitize.js';
import { criarPersonagemTresDet } from '../../services/personagemTresDetService.js';
import logger from '../../helpers/logger.js';
const log = logger.child({ module: 'personagemController' });

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeRelationIds(rawIds, fieldName) {
  if (rawIds === undefined || rawIds === null) {
    return [];
  }

  if (!Array.isArray(rawIds)) {
    throw createHttpError(400, `${fieldName} deve ser um array de IDs`);
  }

  const parsedIds = rawIds.map(value => Number(value));
  const invalidIds = rawIds.filter((_, index) => !Number.isInteger(parsedIds[index]) || parsedIds[index] <= 0);

  if (invalidIds.length > 0) {
    throw createHttpError(400, `${fieldName} contem IDs invalidos: ${invalidIds.join(', ')}`);
  }

  return [...new Set(parsedIds)];
}

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
    const camposInteiros = ['nivel', 'pontos_totais', 'pontos_iniciais', 'raca_id', 'classe_id', 'xp_atual', 'xp_proximo_nivel', 'pontos_atributo_pendentes'];
    
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

    // Expor atributos como mapa flat para consumo pelo frontend
    if (personagemData.atributos_personagem) {
      const attrMap = getAtributosMap(personagemData);
      if (personagemData.sistema === 'tresdet') {
        personagemData.atributos = {
          F: attrMap.F ?? 0,
          H: attrMap.H ?? 0,
          R: attrMap.R ?? 0,
          A: attrMap.A ?? 0,
          PdF: attrMap.PdF ?? 0,
        };
      } else {
        personagemData.atributos = {
          forca: attrMap.forca ?? 10,
          inteligencia: attrMap.inteligencia ?? 10,
          carisma: attrMap.carisma ?? 10,
          destreza: attrMap.destreza ?? 10,
          constituicao: attrMap.constituicao ?? 10,
          agilidade: attrMap.agilidade ?? 10,
        };
      }
    }

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
        usar: v.vantagem.usar,
        usos: v.vantagem.usos,
        dano_base: v.vantagem.dano_base,
        efeito: v.vantagem.efeito,
        custo_mana: v.vantagem.custo_mana,
        cooldown_turnos: v.vantagem.cooldown_turnos,
        escola_magia: v.vantagem.escola_magia,
        alcance: v.vantagem.alcance,
        alvo: v.vantagem.alvo,
        usa_concentracao: v.vantagem.usa_concentracao,
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
        elemento: e.equipamento.elemento,
        dano_base: e.equipamento.dano_base,
        raridade_rel: e.equipamento.raridade_rel || null,
        categoria_rel: e.equipamento.categoria_rel || null,
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

    // Buscar habilidades de classe/raça e magias
    let habilidadesClasse = [];
    let magias = [];
    try {
      const nivelAtual = personagemData.nivel || 1;
      const habPromises = [];
      if (personagemData.classe_id) habPromises.push(db.HabilidadeMagia.findByClasse(personagemData.classe_id));
      if (personagemData.raca_id) habPromises.push(db.HabilidadeMagia.findByRaca(personagemData.raca_id));
      if (habPromises.length > 0) {
        const habResults = await Promise.all(habPromises);
        const merged = habResults.flat();
        const seen = new Set();
        const todas = merged.filter(h => {
          if (seen.has(h.id)) return false;
          seen.add(h.id);
          return (h.nivel_requerido || 1) <= nivelAtual;
        });
        magias = todas.filter(h => h.escola_magia && h.escola_magia !== 'nenhuma');
        habilidadesClasse = todas.filter(h => !h.escola_magia || h.escola_magia === 'nenhuma');
      }
    } catch (err) {
      log.warn({ err, personagemId: personagemData.id }, 'Erro ao buscar habilidades do personagem');
    }

    const mapHabilidade = (h) => ({
      id: h.id, nome: h.nome, descricao: h.descricao,
      custo_mana: h.custo_mana || 0, cooldown_turnos: h.cooldown_turnos || 0,
      dano_base: h.dano_base || null, tipo: h.tipo,
      escola_magia: h.escola_magia || null, alcance: h.alcance || null, alvo: h.alvo || null,
      usa_concentracao: h.usa_concentracao || false,
      elemento: h.elemento || null, nivel_requerido: h.nivel_requerido || 1,
    });
    personagemData.habilidadesClasse = habilidadesClasse.map(mapHabilidade);
    personagemData.magias = magias.map(mapHabilidade);

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

      // --- Despacho por sistema ---
      if (req.body.sistema === 'tresdet') {
        const personagem = await criarPersonagemTresDet(req.body, req.user?.id);
        const personagemCompleto = await this.buscarPersonagemComRelacionamentos(personagem.id);
        const personagemData = await this.processarDadosPersonagem(personagemCompleto);
        db.FeedPost.createAutoEvent(req.user.id, 'personagem_criado', { nome: personagem.nome }, 'personagem', personagem.id);
        return res.status(201).json({ success: true, message: 'Personagem criado com sucesso', data: personagemData });
      }

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
        imagem,
        sistema
      } = req.body;
      const vantagemIds = normalizeRelationIds(vantagens, 'vantagens');
      const desvantagemIds = normalizeRelationIds(desvantagens, 'desvantagens');
      const equipamentoIds = normalizeRelationIds(equipamentos, 'equipamentos');
      const historiaIds = normalizeRelationIds(historias, 'historias');

      // Sanitizar campos de texto controlados pelo usuario
      const nomeSanitizado = sanitizeCharacterName(nome);
      const backgroundSanitizado = sanitizePromptInput(background, 2000);

      // Validacoes basicas
      if (!nomeSanitizado) {
        return res.status(400).json({ success: false, error: 'Nome e obrigatorio' });
      }

      const nivelEfetivo = nivel || 1;
      if (nivelEfetivo < 1 || nivelEfetivo > EVOLUCAO.NIVEL_MAX) {
        return res.status(400).json({ success: false, error: `Nivel deve estar entre 1 e ${EVOLUCAO.NIVEL_MAX}` });
      }

      // Validar atributos de criacao com a regra oficial do wizard/simple create
      const atributos = {
        forca: forca || 10, inteligencia: inteligencia || 10, carisma: carisma || 10,
        destreza: destreza || 10, constituicao: constituicao || 10, agilidade: agilidade || 10
      };
      const validacaoAtributos = validarAtributosCriacao(atributos);
      if (!validacaoAtributos.valido) {
        return res.status(400).json({ success: false, error: validacaoAtributos.erros.join('; ') });
      }

      // Buscar raca e classe para validar orcamento de vantagens e aplicar bonus
      let racaCusto = 0;
      let classeCusto = 0;
      let racaBonusRaw = null;
      let classeBonusRaw = null;
      let bonusVantagemIds = [];
      let bonusDesvantagemIds = [];

      if (raca_id) {
        const raca = await db.Raca.findById(parseInt(raca_id));
        if (!raca) return res.status(400).json({ success: false, error: `Raca com ID ${raca_id} nao encontrada` });
        racaCusto = raca.custo || 0;
        racaBonusRaw = raca.bonus || null;
        const racaBonus = JSON.parse(racaBonusRaw || 'null') || {};
        bonusVantagemIds.push(...(racaBonus.vantagens || []).map(v => v?.id).filter(id => Number.isInteger(id) && id > 0));
        bonusDesvantagemIds.push(...(racaBonus.desvantagens || []).map(d => d?.id).filter(id => Number.isInteger(id) && id > 0));
      }
      if (classe_id) {
        const classe = await db.Classe.findById(parseInt(classe_id));
        if (!classe) return res.status(400).json({ success: false, error: `Classe com ID ${classe_id} nao encontrada` });
        classeCusto = classe.custo || 0;
        classeBonusRaw = classe.bonus || null;
        const classeBonus = JSON.parse(classeBonusRaw || 'null') || {};
        bonusVantagemIds.push(...(classeBonus.vantagens || []).map(v => v?.id).filter(id => Number.isInteger(id) && id > 0));
        bonusDesvantagemIds.push(...(classeBonus.desvantagens || []).map(d => d?.id).filter(id => Number.isInteger(id) && id > 0));
      }

      // Validar que IDs bonus existem no banco (filtrar silenciosamente os invalidos)
      if (bonusVantagemIds.length > 0) {
        const existentes = await db.prisma.vantagens.findMany({ where: { id: { in: bonusVantagemIds }, sistema: 'lunaria' }, select: { id: true } });
        const idsValidos = new Set(existentes.map(v => v.id));
        bonusVantagemIds = bonusVantagemIds.filter(id => idsValidos.has(id));
      }
      if (bonusDesvantagemIds.length > 0) {
        const existentes = await db.prisma.desvantagens.findMany({ where: { id: { in: bonusDesvantagemIds }, sistema: 'lunaria' }, select: { id: true } });
        const idsValidos = new Set(existentes.map(d => d.id));
        bonusDesvantagemIds = bonusDesvantagemIds.filter(id => idsValidos.has(id));
      }

      // Validar desvantagens (tier + limite de custo)
      let custoDesvantagensAceitas = 0;
      if (desvantagemIds.length > 0) {
        const desvantagensObjetos = await Promise.all(
          desvantagemIds.map(id => db.Desvantagem.findById(id))
        );
        const desvantagensValidas = desvantagensObjetos.filter(d => d !== null);
        const idsNaoEncontrados = desvantagemIds.filter((id, i) => !desvantagensObjetos[i]);
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
      if (vantagemIds.length > 0) {
        const vantagensObjetos = await Promise.all(
          vantagemIds.map(id => db.Vantagem.findById(id))
        );
        const idsNaoEncontrados = vantagemIds.filter((id, i) => !vantagensObjetos[i]);
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
      const backgroundFinal = backgroundSanitizado || '';

      // Aplicar bonus de atributos da raca/classe sobre os valores base
      const bonusAttrRaca = parsearBonusEntidade(racaBonusRaw);
      const bonusAttrClasse = parsearBonusEntidade(classeBonusRaw);

      // Calcular atributos efetivos (base + bonus raca/classe)
      const atributosEfetivos = {
        forca: (forca || 10) + bonusAttrRaca.forca + bonusAttrClasse.forca,
        inteligencia: (inteligencia || 10) + bonusAttrRaca.inteligencia + bonusAttrClasse.inteligencia,
        carisma: (carisma || 10) + bonusAttrRaca.carisma + bonusAttrClasse.carisma,
        destreza: (destreza || 10) + bonusAttrRaca.destreza + bonusAttrClasse.destreza,
        constituicao: (constituicao || 10) + bonusAttrRaca.constituicao + bonusAttrClasse.constituicao,
        agilidade: (agilidade || 10) + bonusAttrRaca.agilidade + bonusAttrClasse.agilidade,
      };

      // Preparar dados do personagem
      const sistemaEfetivo = ['lunaria', 'tresdet', 'dnd5e'].includes(sistema) ? sistema : 'lunaria';
      const pontosIniciais = calcularPontosVantagem(nivelEfetivo, racaCusto, classeCusto, 0);
      const dadosPersonagem = this.converterCamposNumericos({
        nome: nomeSanitizado,
        nivel: nivelEfetivo,
        pontos_totais: 0,
        pontos_iniciais: pontosIniciais,
        background: backgroundFinal || '',
        raca_id: raca_id || null,
        classe_id: classe_id || null,
        xp_atual: 0,
        xp_proximo_nivel: xpParaNivel(nivelEfetivo),
        pontos_atributo_pendentes: 0,
        id_usuario: req.user?.id || null,
        criado_em: new Date(),
        sistema: sistemaEfetivo,
        ...(imagem ? { imagem } : {})
      });

      // Criar personagem + vinculos em transacao unica (atomico)
      const novoPersonagem = await db.prisma.$transaction(async (tx) => {
        if (equipamentoIds.length > 0) {
          const equipamentosExistentes = await tx.equipamentos.findMany({
            where: { id: { in: equipamentoIds } },
            select: { id: true }
          });
          const idsEncontrados = new Set(equipamentosExistentes.map(equipamento => equipamento.id));
          const idsInvalidos = equipamentoIds.filter(id => !idsEncontrados.has(id));
          if (idsInvalidos.length > 0) {
            throw createHttpError(400, `Equipamentos nao encontrados: ${idsInvalidos.join(', ')}`);
          }
        }

        if (historiaIds.length > 0) {
          const historiasExistentes = await tx.historias.findMany({
            where: { id: { in: historiaIds }, deleted_at: null },
            select: { id: true }
          });
          const idsEncontrados = new Set(historiasExistentes.map(historia => historia.id));
          const idsInvalidos = historiaIds.filter(id => !idsEncontrados.has(id));
          if (idsInvalidos.length > 0) {
            throw createHttpError(400, `Historias nao encontradas: ${idsInvalidos.join(', ')}`);
          }
        }

        const personagem = await tx.personagens.create({ data: dadosPersonagem });

        // Atributos (sistema-aware)
        const attrNames = getAttrNamesForSystem(sistemaEfetivo);
        const defaultAttrVal = sistemaEfetivo === 'tresdet' ? 0 : 10;
        await tx.atributos_personagem.createMany({
          data: attrNames.map(nome => ({
            personagem_id: personagem.id,
            nome,
            valor: atributosEfetivos[nome] ?? defaultAttrVal
          }))
        });

        // Historias
        if (historiaIds.length > 0) {
          await tx.historias_personagens.createMany({
            data: historiaIds.map(hid => ({ personagem_id: personagem.id, historia_id: hid, papel: 'jogador' }))
          });
        }

        // Vantagens (usuario + bonus raca/classe, deduplicado)
        const allVantagemIds = [...new Set([...vantagemIds, ...bonusVantagemIds])];
        if (allVantagemIds.length > 0) {
          await tx.personagem_vantagem.createMany({
            data: allVantagemIds.map(vantagemId => ({ personagem_id: personagem.id, vantagem_id: vantagemId }))
          });
        }

        // Desvantagens (usuario + bonus raca/classe, deduplicado)
        const allDesvantagemIds = [...new Set([...desvantagemIds, ...bonusDesvantagemIds])];
        if (allDesvantagemIds.length > 0) {
          await tx.personagem_desvantagem.createMany({
            data: allDesvantagemIds.map(desvantagemId => ({ personagem_id: personagem.id, desvantagem_id: desvantagemId }))
          });
        }

        // Equipamentos
        if (equipamentoIds.length > 0) {
          await tx.personagem_equipamento.createMany({
            data: equipamentoIds.map(eid => ({ personagem_id: personagem.id, equipamento_id: eid }))
          });
        }

        return personagem;
      });

      log.info({ novoPersonagem_id: novoPersonagem.id }, 'Personagem criado');

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
      if (error?.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      }

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

      // Extrair e validar atributos (vao para atributos_personagem, nao para personagens)
      const attrNamesUpdate = getAttrNamesForSystem(personagem.sistema || 'lunaria');
      const atributosMudar = {};
      for (const atributo of attrNamesUpdate) {
        if (dadosAtualizacao[atributo] !== undefined) {
          const val = parseInt(dadosAtualizacao[atributo]);
          if (val < 1 || val > 20) {
            return res.status(400).json({
              error: `${atributo} deve estar entre 1 e 20`
            });
          }
          atributosMudar[atributo] = val;
          delete dadosAtualizacao[atributo];
        }
      }

      // Converter campos numéricos para inteiros (incluindo classe_id e raca_id)
      const dadosConvertidos = this.converterCamposNumericos(dadosAtualizacao);

      // Validar tier de vantagens/desvantagens ANTES de persistir qualquer coisa
      const nivelPersonagem = personagem.nivel || 1;
      const tierPermitido = tierDesbloqueado(nivelPersonagem);

      if (Array.isArray(vantagens) && vantagens.length > 0) {
        const vantagensDB = await Promise.all(
          vantagens.map(vid => db.Vantagem.findById(parseInt(vid)))
        );
        for (const v of vantagensDB) {
          if (v && (v.nivel || 1) > tierPermitido) {
            return res.status(400).json({
              error: `Vantagem "${v.nome}" requer tier ${v.nivel}, mas personagem so tem tier ${tierPermitido} (nivel ${nivelPersonagem})`
            });
          }
        }
      }

      if (Array.isArray(desvantagens) && desvantagens.length > 0) {
        const desvantagensDB = await Promise.all(
          desvantagens.map(did => db.Desvantagem.findById(parseInt(did)))
        );
        for (const d of desvantagensDB) {
          if (d && (d.nivel || 1) > tierPermitido) {
            return res.status(400).json({
              error: `Desvantagem "${d.nome}" requer tier ${d.nivel}, mas personagem so tem tier ${tierPermitido} (nivel ${nivelPersonagem})`
            });
          }
        }
      }

      // Validar historias antes da transacao (erro 400 limpo)
      if (historias !== undefined && Array.isArray(historias) && historias.length > 0) {
        const historiasExistentes = await db.prisma.historias.findMany({
          where: { id: { in: historias.map(h => parseInt(h)) } },
          select: { id: true },
        });
        const idsExistentes = new Set(historiasExistentes.map(h => h.id));
        const idsInvalidos = historias.filter(h => !idsExistentes.has(parseInt(h)));
        if (idsInvalidos.length > 0) {
          return res.status(400).json({
            success: false,
            error: `Historias nao encontradas: ${idsInvalidos.join(', ')}`,
          });
        }
      }

      // Atualizar dados + vinculos em transacao unica (atomico)
      await db.prisma.$transaction(async (tx) => {
        // Atualizar campos escalares do personagem
        if (Object.keys(dadosConvertidos).length > 0) {
          await tx.personagens.update({ where: { id: parseInt(id) }, data: dadosConvertidos });
        }

        // Atualizar atributos na tabela atributos_personagem
        for (const [nome, valor] of Object.entries(atributosMudar)) {
          await tx.atributos_personagem.upsert({
            where: { personagem_id_nome: { personagem_id: parseInt(id), nome } },
            update: { valor },
            create: { personagem_id: parseInt(id), nome, valor }
          });
        }

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

        // Historias (ja validadas antes da transacao)
        if (historias !== undefined) {
          await tx.historias_personagens.deleteMany({ where: { personagem_id: parseInt(id) } });
          if (Array.isArray(historias) && historias.length > 0) {
            await tx.historias_personagens.createMany({
              data: historias.map(historia_id => ({
                personagem_id: parseInt(id),
                historia_id: parseInt(historia_id),
                papel: 'jogador',
              })),
            });
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

      const attrMap = getAtributosMap(personagemCompleto);
      const resultadoBackground = await geradorBackground.gerarBackground({
        nome: personagemCompleto.nome,
        classe: nomeClasse,
        raca: nomeRaca,
        tema: temasFiltrados,
        sugestao_background: sugestao_background || '',
        vantagens: vantagensCompletas,
        desvantagens: desvantagensCompletas,
        nivel: personagemCompleto.nivel || 1,
        forca: attrMap.forca ?? 10,
        inteligencia: attrMap.inteligencia ?? 10,
        carisma: attrMap.carisma ?? 10,
        destreza: attrMap.destreza ?? 10,
        constituicao: attrMap.constituicao ?? 10,
        agilidade: attrMap.agilidade ?? 10,
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

      // Validar tier
      const tier = tierDesbloqueado(personagem.nivel || 1);
      if ((vantagem.nivel || 1) > tier) {
        return res.status(400).json({
          error: `Vantagem "${vantagem.nome}" requer tier ${vantagem.nivel}, mas personagem so tem tier ${tier} (nivel ${personagem.nivel || 1})`
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

      // Validar tier
      const tier = tierDesbloqueado(personagem.nivel || 1);
      if ((desvantagem.nivel || 1) > tier) {
        return res.status(400).json({
          error: `Desvantagem "${desvantagem.nome}" requer tier ${desvantagem.nivel}, mas personagem so tem tier ${tier} (nivel ${personagem.nivel || 1})`
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

      // Listar equipamentos do personagem (retorna [{ equipamento }])
      const raw = await db.Personagem.listarEquipamentos(id);
      const equipamentos = raw.map(e => e.equipamento);

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

      const personagem = await db.Personagem.findByIdWithRelations(parseInt(id));
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

      const attrMap = getAtributosMap(personagem);
      const statsNomes = ['forca', 'inteligencia', 'carisma', 'destreza', 'constituicao', 'agilidade'];
      let totalGasto = 0;
      const novosStats = {};

      for (const stat of statsNomes) {
        const inc = parseInt(incrementos[stat]) || 0;
        if (inc < 0) {
          return res.status(400).json({ success: false, error: `Incremento de ${stat} nao pode ser negativo` });
        }
        if (inc > 0) {
          const valorAtual = attrMap[stat] ?? 10;
          const novoValor = valorAtual + inc;
          if (novoValor > EVOLUCAO.STAT_MAX) {
            return res.status(400).json({ success: false, error: `${stat} excederia o maximo de ${EVOLUCAO.STAT_MAX} (atual: ${valorAtual}, incremento: ${inc})` });
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

      // Update atributos_personagem rows and pendentes in a single transaction
      await db.prisma.$transaction(async (tx) => {
        for (const [nome, valor] of Object.entries(novosStats)) {
          await tx.atributos_personagem.upsert({
            where: { personagem_id_nome: { personagem_id: parseInt(id), nome } },
            update: { valor },
            create: { personagem_id: parseInt(id), nome, valor }
          });
        }
        await tx.personagens.update({
          where: { id: parseInt(id) },
          data: { pontos_atributo_pendentes: pendentes - totalGasto, atualizado_em: new Date() }
        });
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
      const validAttrMap = getAtributosMap(personagemCompleto);
      const resultado = await validador.validar({
        nome: personagemCompleto.nome,
        classe: nomeClasse,
        raca: nomeRaca,
        nivel: personagemCompleto.nivel || 1,
        forca: validAttrMap.forca ?? 10,
        inteligencia: validAttrMap.inteligencia ?? 10,
        carisma: validAttrMap.carisma ?? 10,
        destreza: validAttrMap.destreza ?? 10,
        constituicao: validAttrMap.constituicao ?? 10,
        agilidade: validAttrMap.agilidade ?? 10,
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

  finalizacaoInicial = async (req, res, next) => {
    try {
      const { id } = req.params;
      const base = await buildFinalizacaoBase(parseInt(id));
      const agent = await criarFinalizacaoInicialAgent();
      const resultado = await agent.gerarFinalizacao(base, req.user?.id);

      res.status(200).json({
        success: true,
        data: {
          personagem_id: base.snapshot.personagem_id,
          snapshot: base.snapshot,
          fala_personagem: resultado.fala_personagem,
          leitura_ficha: resultado.leitura_ficha,
          combo: resultado.combo,
          catalogo_editavel: base.catalogo_editavel,
          meta: base.meta,
        },
      });
    } catch (error) {
      log.error({ err: error }, 'Erro na finalizacao inicial');
      if (error.message === 'personagemId invalido') {
        return res.status(400).json({ success: false, error: 'ID de personagem invalido' });
      }
      if (error.message?.includes('nao encontrado')) {
        return res.status(404).json({ success: false, error: error.message });
      }
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }

  finalizacaoPreview = async (req, res, next) => {
    try {
      const tentativa = req.body?.tentativa == null ? 0 : parseInt(req.body.tentativa, 10);
      if (Number.isNaN(tentativa) || tentativa < 0 || tentativa > 3) {
        return res.status(400).json({ success: false, error: 'Tentativa deve ser entre 0 e 3' });
      }

      const base = await buildFinalizacaoPreviewBase(req.body?.draft);
      const agent = await criarFinalizacaoInicialAgent();
      const comboAnterior = req.body?.combo_anterior || req.body?.comboAnterior || [];

      const resultado = tentativa > 0
        ? await agent.regenerarFinalizacao(base, tentativa, comboAnterior, req.user?.id)
        : await agent.gerarFinalizacao(base, req.user?.id);

      res.status(200).json({
        success: true,
        data: {
          snapshot: base.snapshot,
          fala_personagem: resultado.fala_personagem,
          leitura_ficha: resultado.leitura_ficha,
          combo: resultado.combo,
          catalogo_editavel: base.catalogo_editavel,
          meta: base.meta,
        },
      });
    } catch (error) {
      log.error({ err: error }, 'Erro na finalizacao preview');
      if (error.statusCode) {
        return res.status(error.statusCode).json({ success: false, error: error.message });
      }
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }

  regenerarEquipamentosFinalizacao = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { tentativa, equipamentos_anteriores } = req.body;

      const tentativaNum = parseInt(tentativa);
      if (!tentativaNum || tentativaNum < 1 || tentativaNum > 3) {
        return res.status(400).json({ success: false, error: 'Tentativa deve ser entre 1 e 3' });
      }

      const anteriores = Array.isArray(equipamentos_anteriores) ? equipamentos_anteriores : [];

      const base = await buildFinalizacaoBase(parseInt(id));
      const agent = await criarFinalizacaoInicialAgent();
      const equipamentos = await agent.regenerarEquipamentos(base, tentativaNum, anteriores, req.user?.id);

      res.status(200).json({
        success: true,
        data: { equipamentos },
      });
    } catch (error) {
      log.error({ err: error }, 'Erro ao regenerar equipamentos');
      if (error.message === 'personagemId invalido') {
        return res.status(400).json({ success: false, error: 'ID de personagem invalido' });
      }
      if (error.message?.includes('nao encontrado')) {
        return res.status(404).json({ success: false, error: error.message });
      }
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
  async aprenderMagias(req, res) {
    const personagemId = parseInt(req.params.id, 10);
    if (isNaN(personagemId)) {
      return res.status(400).json({ success: false, error: 'ID de personagem invalido' });
    }

    const { habilidade_ids, origem = 'criacao' } = req.body;
    if (!Array.isArray(habilidade_ids) || habilidade_ids.length === 0) {
      return res.status(400).json({ success: false, error: 'habilidade_ids deve ser um array com pelo menos um ID' });
    }

    const resultados = await Promise.all(
      habilidade_ids.map(id => db.HmPersonagem.aprender(personagemId, parseInt(id, 10), origem))
    );

    res.status(200).json({ success: true, count: resultados.length });
  }
}

export default new PersonagemController();
