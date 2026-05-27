import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { vantagemService, desvantagemService, itemTresDetService, apiClient } from '../../../../services/index';
import { useTresDetFichaModel } from './ficha-livre.model';
import { useMestreFichaLivre } from './hooks/useMestreFichaLivre';
import FichaLivreView from './ficha-livre.view';

interface CatalogoResp {
  data?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

interface FocusCatalogoItem {
  nome: string;
  label: string;
  emoji?: string;
  descricao?: string;
}

export default function TresDetFichaLivre() {
  const navigate = useNavigate();
  const model = useTresDetFichaModel({ navigate });
  const [focusCatalogo, setFocusCatalogo] = useState<FocusCatalogoItem[]>([]);

  // Fetch catalogs
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [vResp, dResp, fResp, mResp, iResp] = await Promise.all([
          vantagemService.getAll({ sistema: 'tresdet' }) as unknown as Promise<CatalogoResp | Array<Record<string, unknown>>>,
          desvantagemService.getAll({ sistema: 'tresdet' }) as unknown as Promise<CatalogoResp | Array<Record<string, unknown>>>,
          apiClient.get('/focus-elementais') as Promise<CatalogoResp | null>,
          apiClient.get('/magias-tresdet') as Promise<CatalogoResp | null>,
          itemTresDetService.getAll() as unknown as Promise<CatalogoResp | Array<Record<string, unknown>>>,
        ]);
        if (cancelled) return;
        const vData = Array.isArray(vResp) ? vResp : (vResp?.data || []);
        const dData = Array.isArray(dResp) ? dResp : (dResp?.data || []);
        model.setVantagensCatalogo(vData);
        model.setDesvantagensCatalogo(dData);
        if (fResp?.data) setFocusCatalogo(fResp.data as unknown as FocusCatalogoItem[]);
        if (mResp?.data) model.setMagiasCatalogo(mResp.data);
        if (iResp && !Array.isArray(iResp) && iResp.data) model.setItensCatalogo(iResp.data);
      } catch { /* ignore */ }
      if (!cancelled) model.setCatalogoLoading(false);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const mestreOnSugestao = useCallback((sugestao: { tipo?: string; id?: number | string; [key: string]: unknown }) => {
    if (sugestao.id == null) return;
    if (sugestao.tipo === 'vantagem') model.adicionarVantagem(sugestao.id);
    else if (sugestao.tipo === 'desvantagem') model.adicionarDesvantagem(sugestao.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const resp = await apiClient.post('/personagens', payload) as { success?: boolean; message?: string } | null;
      if (!resp?.success) throw new Error(resp?.message || 'Erro ao criar personagem');
      model.limparDraft();
      navigate('/personagens');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar personagem';
      model.setError(message);
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
