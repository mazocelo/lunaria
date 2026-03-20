import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { monstroService } from '../../../services/index.js';
import { formatJson } from '../../../components/shared';

/**
 * Model: estado, sincronizacao, normalizacao e metodos da entidade.
 * Tudo que diz respeito aos DADOS do monstro vive aqui.
 */
export const useMonstroVerModel = () => {
  const { id } = useParams();
  const [raw, setRaw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Fetch ---
  const carregar = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    monstroService.getById(id)
      .then(res => setRaw(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { carregar(); }, [carregar]);

  // --- Normalizacao da entidade ---
  const monstro = raw ? normalizarMonstro(raw) : null;

  return { id, monstro, loading, error, setError, recarregar: carregar };
};

/**
 * Normaliza dados crus da API em formato limpo pra consumo.
 * Resolve relacoes, converte snake_case, trata arrays e JSON.
 */
function normalizarMonstro(m) {
  const habilidadesRaw = formatJson(m.habilidades);

  return {
    id: m.id,
    nome: m.nome,
    imagem: m.imagem,
    descricao: m.descricao,

    // Relacoes resolvidas
    raridade: m.raridade_rel?.nome || 'Comum',
    categoria: m.categoria_rel?.nome || null,

    // Nivel
    nivelMin: m.nivel_min,
    nivelMax: m.nivel_max,

    // Atributos (default 0)
    atributos: {
      forca: m.forca || 0,
      inteligencia: m.inteligencia || 0,
      destreza: m.destreza || 0,
      constituicao: m.constituicao || 0,
      agilidade: m.agilidade || 0,
      carisma: m.carisma || 0,
    },

    // Combate
    combate: {
      hpBase: m.hp_base,
      ataqueBase: m.ataque_base,
      defesaBase: m.defesa_base,
      danoBase: m.dano_base || null,
      xpBase: m.xp_base,
    },

    // Arrays normalizados (nunca undefined)
    tipos: Array.isArray(m.tipo) ? m.tipo : [],
    elementos: Array.isArray(m.elemento) ? m.elemento : [],
    temas: Array.isArray(m.temas) ? m.temas : [],

    // Habilidades normalizadas
    habilidades: normalizarHabilidades(habilidadesRaw),
  };
}

/**
 * Normaliza habilidades de qualquer formato (array, object, string)
 * em array uniforme de { nome, descricao, dano }.
 */
function normalizarHabilidades(hab) {
  if (!hab) return null;
  if (Array.isArray(hab)) {
    return hab.map(h => {
      if (typeof h === 'object') return { nome: h.nome || null, descricao: h.descricao || null, dano: h.dano || null };
      return { nome: null, descricao: String(h), dano: null };
    });
  }
  if (typeof hab === 'object') {
    return Object.entries(hab).map(([k, v]) => ({
      nome: k, descricao: typeof v === 'object' ? JSON.stringify(v) : String(v), dano: null,
    }));
  }
  return [{ nome: null, descricao: String(hab), dano: null }];
}
