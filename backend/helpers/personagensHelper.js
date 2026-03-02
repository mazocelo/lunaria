import db from '../Model/index.js';

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

          return {
            id: personagem.id,
            nome: personagem.nome,
            nivel: personagem.nivel || 1,
            classe: personagem.classes?.nome || 'Aventureiro',
            raca: personagem.racas?.nome || 'Humano',
            atributos: {
              forca: personagem.forca || 10,
              inteligencia: personagem.inteligencia || 10,
              carisma: personagem.carisma || 10,
              destreza: personagem.destreza || 10,
              constituicao: personagem.constituicao || 10,
              agilidade: personagem.agilidade || 10
            },
            background: personagem.background || '',
            vantagens: vantagens.map(v => ({
              nome: v.vantagem?.nome || v.nome,
              descricao: v.vantagem?.descricao || v.descricao,
              tipo: v.vantagem?.tipo || v.tipo,
              elemento: v.vantagem?.elemento || v.elemento
            })),
            desvantagens: desvantagens.map(d => ({
              nome: d.desvantagem?.nome || d.nome,
              descricao: d.desvantagem?.descricao || d.descricao,
              tipo: d.desvantagem?.tipo || d.tipo
            })),
            equipamentos: equipamentos.map(e => ({
              nome: e.equipamento?.nome || e.nome,
              tipo: e.equipamento?.tipo || e.tipo,
              descricao: e.equipamento?.descricao || e.descricao
            })),
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

