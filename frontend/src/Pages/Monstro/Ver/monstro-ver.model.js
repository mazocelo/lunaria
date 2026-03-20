import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { monstroService } from '../../../services/index.js';
import { getRaridadeConfig, formatJson } from '../../../components/shared';

/**
 * Model: estado + sincronizacao + normalizacao dos dados da entidade.
 * Retorna dados ja tratados, prontos pra consumo pelo ViewModel.
 */
export const useMonstroVerModel = () => {
  const { id } = useParams();
  const [monstro, setMonstro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    monstroService.getById(id)
      .then(res => setMonstro(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  // --- Normalizacao da entidade ---
  const m = monstro;
  const raridade = m?.raridade_rel?.nome || 'Comum';
  const raridadeConfig = m ? getRaridadeConfig(raridade) : null;

  return {
    loading,
    error,
    setError,
    // Dados normalizados da entidade
    monstro: m ? {
      id: m.id,
      nome: m.nome,
      imagem: m.imagem,
      descricao: m.descricao,
      raridade,
      raridadeConfig,
      categoria: m.categoria_rel?.nome || null,
      nivelMin: m.nivel_min,
      nivelMax: m.nivel_max,
      // Atributos
      forca: m.forca || 0,
      inteligencia: m.inteligencia || 0,
      destreza: m.destreza || 0,
      constituicao: m.constituicao || 0,
      agilidade: m.agilidade || 0,
      carisma: m.carisma || 0,
      // Combate
      hpBase: m.hp_base,
      ataqueBase: m.ataque_base,
      defesaBase: m.defesa_base,
      danoBase: m.dano_base,
      xpBase: m.xp_base,
      // Arrays normalizados
      tipos: Array.isArray(m.tipo) ? m.tipo : [],
      elementos: Array.isArray(m.elemento) ? m.elemento : [],
      temas: Array.isArray(m.temas) ? m.temas : [],
      habilidades: formatJson(m.habilidades),
    } : null,
  };
};
