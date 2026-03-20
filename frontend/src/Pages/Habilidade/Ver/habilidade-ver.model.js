import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { habilidadeService } from '../../../services/index.js';
import { formatObjectDisplay } from '../../../components/shared';

/**
 * Model: estado, sincronizacao, normalizacao e metodos da entidade.
 * Tudo que diz respeito aos DADOS da habilidade vive aqui.
 */
export const useHabilidadeVerModel = () => {
  const { id } = useParams();
  const [raw, setRaw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Fetch ---
  const carregar = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    habilidadeService.getById(id)
      .then(res => setRaw(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { carregar(); }, [carregar]);

  // --- Normalizacao da entidade ---
  const habilidade = raw ? normalizarHabilidade(raw) : null;

  return { id, habilidade, loading, error, setError, recarregar: carregar };
};

/**
 * Normaliza dados crus da API em formato limpo pra consumo.
 * Resolve relacoes, converte snake_case, trata arrays e JSON.
 */
function normalizarHabilidade(h) {
  return {
    id: h.id,
    nome: h.nome,
    descricao: h.descricao,
    imagem: h.imagem,

    // Campos simples (snake_case -> camelCase)
    categoria: h.categoria,
    tipo: h.tipo,
    elemento: h.elemento,
    usaConcentracao: h.usa_concentracao,

    nivelRequerido: h.nivel_requerido,
    custoMana: h.custo_mana,
    danoBase: h.dano_base,

    alvo: h.alvo,
    alcance: h.alcance,
    tempoConjuracao: h.tempo_conjuracao,

    cooldownTurnos: h.cooldown_turnos,
    usosPorDescanso: h.usos_por_descanso,

    escolaMagia: h.escola_magia,
    savingThrow: h.saving_throw,

    // Relacoes resolvidas
    classeNome: h.classe?.nome || null,
    racaNome: h.raca?.nome || null,

    // Objetos complexos (formatados para exibicao)
    areaEfeito: formatObjectDisplay(h.area_efeito),
    componenteMaterial: formatObjectDisplay(h.componente_material),
    preRequisitoItems: formatObjectDisplay(h.pre_requisitos ?? h.pre_requisito),
    efeito: formatObjectDisplay(h.efeito),
    escalamento: formatObjectDisplay(h.escalamento),

    // Receitas normalizadas (snake_case -> camelCase, relacoes resolvidas)
    receitas: Array.isArray(h.receitas) ? h.receitas.map(r => ({
      nome: r.nome,
      nivelRequerido: r.nivel_requerido,
      tempo: r.tempo,
      dificuldade: r.dificuldade,
      ingredientes: (r.ingredientes_rel || []).map(ri => ({
        nome: ri.ingrediente?.nome || ri.nome || '?',
        quantidade: ri.quantidade || 1,
      })),
      ferramentas: (r.ferramentas_rel || []).map(rf => ({
        nome: rf.ferramenta?.nome || rf.nome || '?',
      })),
    })) : [],
  };
}
