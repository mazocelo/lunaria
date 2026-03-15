import db from '../Model/index.js';
import logger from './logger.js';
const log = logger.child({ module: 'personagensHelper' });
import {
  agregarBonusEquipamentos,
  encontrarMelhorArma
} from './bonusHelper.js';
import {
  normalizarElementoPrimario,
  normalizarListaElementos,
  normalizarEfeitoCatalogo,
  normalizarRequisitos,
  normalizarUsos,
} from './catalogJsonHelper.js';

/**
 * Busca informações completas dos personagens a partir de IDs
 * @param {Array<number>} personagensIds - Array de IDs dos personagens
 * @returns {Promise<Array<Object>>} Array com dados completos dos personagens
 */
export async function buscarPersonagensCompletos(personagensIds) {
  if (!Array.isArray(personagensIds) || personagensIds.length === 0) {
    return [];
  }
  
  try {
    const personagens = await Promise.all(
      personagensIds.map(async (id) => {
        try {
          const personagem = await db.Personagem.findByIdWithRelations(parseInt(id));
          
          if (!personagem) {
            log.warn({ personagemId: id }, 'Personagem nao encontrado');
            return null;
          }

          // Buscar vantagens, desvantagens, equipamentos e habilidades
          const vantagens = await db.Personagem.listarVantagens(personagem.id);
          const desvantagens = await db.Personagem.listarDesvantagens(personagem.id);
          const equipamentos = await db.Personagem.listarEquipamentos(personagem.id);

          // Buscar habilidades da classe + raciais (filtradas por nível)
          let habilidadesClasse = [];
          let magiasUniversais = [];
          try {
            const nivelAtual = personagem.nivel || 1;
            const promises = [];
            if (personagem.classe_id) promises.push(db.Habilidade.findByClasse(personagem.classe_id));
            if (personagem.raca_id) promises.push(db.Habilidade.findByRaca(personagem.raca_id));
            const results = await Promise.all(promises);
            const merged = results.flat();
            const seen = new Set();
            const todas = merged.filter(h => {
              if (seen.has(h.id)) return false;
              seen.add(h.id);
              return (h.nivel_requerido || 1) <= nivelAtual;
            });
            habilidadesClasse = todas.filter(h => h.classe_id != null || h.raca_id != null);
            magiasUniversais = todas.filter(h =>
              h.classe_id == null && h.raca_id == null && h.escola_magia && h.escola_magia !== 'nenhuma'
            );
          } catch (e) {
            log.warn({ err: e, personagemId: personagem.id }, 'Erro ao buscar habilidades do personagem');
          }

          // Atributos efetivos: DB ja armazena base + bonus de raca/classe
          const atributosEfetivos = {
            forca: personagem.forca || 10,
            inteligencia: personagem.inteligencia || 10,
            carisma: personagem.carisma || 10,
            destreza: personagem.destreza || 10,
            constituicao: personagem.constituicao || 10,
            agilidade: personagem.agilidade || 10
          };

          // Mapear equipamentos com dados completos
          const equipamentosMapeados = equipamentos.map(e => ({
            nome: e.equipamento?.nome || e.nome,
            tipo: e.equipamento?.tipo || e.tipo,
            descricao: e.equipamento?.descricao || e.descricao,
            dano_base: e.equipamento?.dano_base || e.dano_base || null,
            bonus: e.equipamento?.bonus || e.bonus || null,
            requisitos: normalizarRequisitos(e.equipamento?.requisitos || e.requisitos || null),
            efeito: normalizarEfeitoCatalogo(e.equipamento?.efeito || e.efeito || null),
            elemento: normalizarListaElementos(e.equipamento?.elemento || e.elemento) || []
          }));

          // Agregar bonus de equipamentos
          const bonusEquip = agregarBonusEquipamentos(equipamentosMapeados);
          const melhorArma = encontrarMelhorArma(equipamentosMapeados);

          // Encontrar elemento da melhor arma
          let elementoArma = null;
          if (melhorArma) {
            const armaEquip = equipamentosMapeados.find(e => e.dano_base === melhorArma);
            elementoArma = normalizarElementoPrimario(armaEquip?.elemento);
          }

          return {
            id: personagem.id,
            nome: personagem.nome,
            nivel: personagem.nivel || 1,
            classe: personagem.classes?.nome || 'Aventureiro',
            raca: personagem.racas?.nome || 'Humano',
            atributos: atributosEfetivos,
            bonusEquip,
            melhorArma,
            elementoArma,
            background: personagem.background || '',
            vantagens: vantagens.map(v => ({
              nome: v.vantagem?.nome || v.nome,
              descricao: v.vantagem?.descricao || v.descricao,
              tipo: v.vantagem?.tipo || v.tipo,
              elemento: normalizarListaElementos(v.vantagem?.elemento || v.elemento) || [],
              usar: normalizarUsos(v.vantagem?.usar ?? v.usar) ?? 0,
              usos: normalizarUsos(v.vantagem?.usar ?? v.usar) ?? 0,
              dano_base: v.vantagem?.dano_base || v.dano_base || null,
              efeito: normalizarEfeitoCatalogo(v.vantagem?.efeito || v.efeito || null),
              bonus: v.vantagem?.bonus || v.bonus || null
            })),
            desvantagens: desvantagens.map(d => ({
              nome: d.desvantagem?.nome || d.nome,
              descricao: d.desvantagem?.descricao || d.descricao,
              tipo: d.desvantagem?.tipo || d.tipo,
              elemento: normalizarListaElementos(d.desvantagem?.elemento || d.elemento) || [],
              efeito: normalizarEfeitoCatalogo(d.desvantagem?.efeito || d.efeito || null),
              bonus: d.desvantagem?.bonus || d.bonus || null
            })),
            equipamentos: equipamentosMapeados,
            habilidadesClasse: habilidadesClasse.map(h => ({
              id: h.id, nome: h.nome, descricao: h.descricao,
              custo_mana: h.custo_mana || 0, cooldown_turnos: h.cooldown_turnos || 0,
              dano_base: h.dano_base || null, tipo: h.tipo, elemento: normalizarElementoPrimario(h.elemento),
              elementos: normalizarListaElementos(h.elemento) || [],
              escola_magia: h.escola_magia || null, alcance: h.alcance, alvo: h.alvo,
              tempo_conjuracao: h.tempo_conjuracao || 'acao',
              usa_concentracao: h.usa_concentracao || false,
              efeito: normalizarEfeitoCatalogo(h.efeito || null), saving_throw: h.saving_throw || null,
              nivel_requerido: h.nivel_requerido || 1,
              pre_requisito: normalizarRequisitos(h.pre_requisito),
              pre_requisitos: normalizarRequisitos(h.pre_requisito),
            })),
            magias: magiasUniversais.map(m => ({
              id: m.id, nome: m.nome, descricao: m.descricao,
              custo_mana: m.custo_mana || 0, cooldown_turnos: m.cooldown_turnos || 0,
              dano_base: m.dano_base || null, tipo: m.tipo, elemento: normalizarElementoPrimario(m.elemento),
              elementos: normalizarListaElementos(m.elemento) || [],
              escola_magia: m.escola_magia || null, alcance: m.alcance, alvo: m.alvo,
              tempo_conjuracao: m.tempo_conjuracao || 'acao',
              usa_concentracao: m.usa_concentracao || false,
              efeito: normalizarEfeitoCatalogo(m.efeito || null), saving_throw: m.saving_throw || null,
              nivel_requerido: m.nivel_requerido || 1,
              pre_requisito: normalizarRequisitos(m.pre_requisito),
              pre_requisitos: normalizarRequisitos(m.pre_requisito),
            })),
            descricaoCompleta: `${personagem.nome} - ${personagem.racas?.nome || 'Humano'} ${personagem.classes?.nome || 'Aventureiro'} Nível ${personagem.nivel || 1}`
          };
        } catch (error) {
          log.error({ err: error, personagemId: id }, 'Erro ao buscar personagem');
          return null;
        }
      })
    );
    
    // Filtrar nulos
    return personagens.filter(Boolean);
  } catch (error) {
    log.error({ err: error }, 'Erro ao buscar personagens completos');
    return [];
  }
}

/**
 * Formata personagens para passar ao MestreAgent
 * @param {Array} jogadoresArray - Array de jogadores da sessão
 * @param {Object} personagensCompletos - Mapa de personagens completos {personagemId: dados}
 * @returns {Array<Object>} Array formatado para o Mestre
 */
export function formatarPersonagensParaMestre(jogadoresArray, personagensCompletos = {}) {
  if (!Array.isArray(jogadoresArray)) {
    return [];
  }

  return jogadoresArray.map(jogador => {
    const personagemId = jogador.personagemId;
    const personagemCompleto = personagensCompletos[personagemId];

    if (personagemCompleto) {
      return {
        nome: personagemCompleto.nome,
        classe: personagemCompleto.classe,
        raca: personagemCompleto.raca,
        nivel: personagemCompleto.nivel,
        atributos: personagemCompleto.atributos,
        background: personagemCompleto.background,
        vantagens: personagemCompleto.vantagens || [],
        desvantagens: personagemCompleto.desvantagens || [],
        equipamentos: personagemCompleto.equipamentos || [],
        habilidadesClasse: personagemCompleto.habilidadesClasse || [],
        magias: personagemCompleto.magias || [],
        jogador: jogador.username || jogador.nome,
        descricao: personagemCompleto.descricaoCompleta
      };
    }

    // Fallback se não tiver dados completos
    return {
      nome: jogador.personagemNome || jogador.username || 'Aventureiro',
      classe: 'Aventureiro',
      raca: 'Humano',
      nivel: 1,
      jogador: jogador.username || jogador.nome
    };
  }).filter(Boolean);
}

export default {
  buscarPersonagensCompletos,
  formatarPersonagensParaMestre
};

