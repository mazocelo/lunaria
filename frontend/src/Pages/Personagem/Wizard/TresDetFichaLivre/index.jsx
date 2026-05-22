import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { vantagemService, desvantagemService, itemTresDetService, apiClient } from '../../../../services/index.js';
import { useTresDetFichaModel } from './ficha-livre.model.js';
import { useMestreFichaLivre } from './hooks/useMestreFichaLivre.js';
import FichaLivreView from './ficha-livre.view.jsx';

export default function TresDetFichaLivre() {
  const navigate = useNavigate();
  const model = useTresDetFichaModel({ navigate });
  const [focusCatalogo, setFocusCatalogo] = useState([]);

  // Fetch catalogs
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [vResp, dResp, fResp, mResp, iResp] = await Promise.all([
          vantagemService.getAll({ sistema: 'tresdet' }),
          desvantagemService.getAll({ sistema: 'tresdet' }),
          apiClient.get('/focus-elementais'),
          apiClient.get('/magias-tresdet'),
          itemTresDetService.getAll(),
        ]);
        if (cancelled) return;
        model.setVantagensCatalogo(vResp.data || vResp || []);
        model.setDesvantagensCatalogo(dResp.data || dResp || []);
        if (fResp?.data) setFocusCatalogo(fResp.data);
        if (mResp?.data) model.setMagiasCatalogo(mResp.data);
        if (iResp?.data) model.setItensCatalogo(iResp.data);
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
    magias_ids: model.magiasIds,
    focus: model.focus,
    historia: model.historia,
  }), [model.nome, model.nivelPoder, model.caracteristicas, model.vantagensIds, model.desvantagensIds, model.magiasIds, model.focus, model.historia]);

  const mestre = useMestreFichaLivre({ getEstado });

  // Handle Mestre suggestion click
  const mestreOnSugestao = useCallback((sugestao) => {
    if (sugestao.tipo === 'vantagem') model.adicionarVantagem(sugestao.id);
    else if (sugestao.tipo === 'desvantagem') model.adicionarDesvantagem(sugestao.id);
  }, [model.adicionarVantagem, model.adicionarDesvantagem]);

  const onCriar = useCallback(async () => {
    model.setSalvando(true);
    model.setError(null);
    try {
      const payload = {
        sistema: 'tresdet',
        nome: model.nome,
        nivelPoder: model.nivelPoder,
        caracteristicas: model.caracteristicas,
        focus: model.focus,
        vantagens: model.vantagensIds.map(Number),
        desvantagens: model.desvantagensIds.map(Number),
        magias_ids: model.magiasIds.map(Number),
        itens: model.equipamentosIds.map(Number),
        background: model.historia,
      };
      const resp = await apiClient.post('/personagens', payload);
      if (!resp.success) throw new Error(resp.message || 'Erro ao criar personagem');
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
      focusCatalogo={focusCatalogo}
    />
  );
}
