import db from '../Model/index.js';
import {
  parsearBonusEntidade,
  agregarBonusEquipamentos,
  calcularAtributosEfetivos,
  encontrarMelhorArma
} from './bonusHelper.js';

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
            console.warn(`⚠️ Personagem ${id} não encontrado`);
            return null;
          }

          // Buscar vantagens, desvantagens e equipamentos
          const vantagens = await db.Personagem.listarVantagens(personagem.id);
          const desvantagens = await db.Personagem.listarDesvantagens(personagem.id);
          const equipamentos = await db.Personagem.listarEquipamentos(personagem.id);

          // Calcular atributos efetivos com bonus de raça e classe
          const atributosEfetivos = calcularAtributosEfetivos(
            personagem,
            personagem.racas?.bonus,
            personagem.classes?.bonus
          );

          // Mapear equipamentos com dados completos
          const equipamentosMapeados = equipamentos.map(e => ({
            nome: e.equipamento?.nome || e.nome,
            tipo: e.equipamento?.tipo || e.tipo,
            descricao: e.equipamento?.descricao || e.descricao,
            dano_base: e.equipamento?.dano_base || e.dano_base || null,
            bonus: e.equipamento?.bonus || e.bonus || null,
            requisitos: e.equipamento?.requisitos || e.requisitos || null,
            efeito: e.equipamento?.efeito || e.efeito || null,
            elemento: e.equipamento?.elemento || e.elemento
          }));

          // Agregar bonus de equipamentos
          const bonusEquip = agregarBonusEquipamentos(equipamentosMapeados);
          const melhorArma = encontrarMelhorArma(equipamentosMapeados);

          // Encontrar elemento da melhor arma
          let elementoArma = null;
          if (melhorArma) {
            const armaEquip = equipamentosMapeados.find(e => e.dano_base === melhorArma);
            if (armaEquip?.elemento?.length > 0) {
              elementoArma = armaEquip.elemento[0];
            }
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
              elemento: v.vantagem?.elemento || v.elemento,
              usar: v.vantagem?.usar ?? v.usar ?? 0,
              dano_base: v.vantagem?.dano_base || v.dano_base || null,
              efeito: v.vantagem?.efeito || v.efeito || null,
              bonus: v.vantagem?.bonus || v.bonus || null
            })),
            desvantagens: desvantagens.map(d => ({
              nome: d.desvantagem?.nome || d.nome,
              descricao: d.desvantagem?.descricao || d.descricao,
              tipo: d.desvantagem?.tipo || d.tipo,
              elemento: d.desvantagem?.elemento || d.elemento,
              efeito: d.desvantagem?.efeito || d.efeito || null,
              bonus: d.desvantagem?.bonus || d.bonus || null
            })),
            equipamentos: equipamentosMapeados,
            // Informações para o Mestre (formato texto)
            descricaoCompleta: `${personagem.nome} - ${personagem.racas?.nome || 'Humano'} ${personagem.classes?.nome || 'Aventureiro'} Nível ${personagem.nivel || 1}`
          };
        } catch (error) {
          console.error(`❌ Erro ao buscar personagem ${id}:`, error);
          return null;
        }
      })
    );
    
    // Filtrar nulos
    return personagens.filter(Boolean);
  } catch (error) {
    console.error('❌ Erro ao buscar personagens completos:', error);
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

