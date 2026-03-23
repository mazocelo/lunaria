import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { vantagemService, desvantagemService } from '../../../../services/index.js';
import { useTresDetFichaModel } from './ficha-livre.model.js';
import { useMestreFichaLivre } from './hooks/useMestreFichaLivre.js';
import FichaLivreView from './ficha-livre.view.jsx';

export default function TresDetFichaLivre() {
  const navigate = useNavigate();
  const model = useTresDetFichaModel({ navigate });

  // Fetch catalogs
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [vResp, dResp] = await Promise.all([
          vantagemService.getAll({ sistema: 'tresdet' }),
          desvantagemService.getAll({ sistema: 'tresdet' }),
        ]);
        if (cancelled) return;
        model.setVantagensCatalogo(vResp.data || vResp || []);
        model.setDesvantagensCatalogo(dResp.data || dResp || []);
      } catch { /* ignore */ }
      if (!cancelled) model.setCatalogoLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // Build estado for Mestre
  const getEstado = useCallback(() => ({
    nome: model.nome,
    nivel_poder: model.nivelPoder,
    caracteristicas: model.caracteristicas,
    vantagens_ids: model.vantagensIds,
    desvantagens_ids: model.desvantagensIds,
    focus: model.focus,
    historia: model.historia,
  }), [model.nome, model.nivelPoder, model.caracteristicas, model.vantagensIds, model.desvantagensIds, model.focus, model.historia]);

  const mestre = useMestreFichaLivre({ getEstado });

  // Handle Mestre suggestion click
  const mestreOnSugestao = useCallback((sugestao) => {
    if (sugestao.tipo === 'vantagem') model.adicionarVantagem(sugestao.id);
    else if (sugestao.tipo === 'desvantagem') model.adicionarDesvantagem(sugestao.id);
  }, [model.adicionarVantagem, model.adicionarDesvantagem]);

  // Create character (stub -- full implementation depends on backend contract)
  const onCriar = useCallback(async () => {
    model.setSalvando(true);
    model.setError(null);
    try {
      // TODO: integrate with personagem creation endpoint
      await new Promise(r => setTimeout(r, 1500));
      model.limparDraft();
      navigate('/personagens');
    } catch (err) {
      model.setError(err.message || 'Erro ao criar personagem');
    } finally {
      model.setSalvando(false);
    }
  }, [model, navigate]);

  return (
    <FichaLivreView
      {...model}
      onCriar={onCriar}
      mestreMensagens={mestre.mensagens}
      mestreEnviando={mestre.enviando}
      mestreEnviarMensagem={mestre.enviarMensagem}
      mestreOnSugestao={mestreOnSugestao}
    />
  );
}
