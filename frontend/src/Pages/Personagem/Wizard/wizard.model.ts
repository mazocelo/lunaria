
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { usePersonagemStore } from '../../../store/personagem';
import { useVantagemStore } from '../../../store/vantagem';
import { useDesvantagemStore } from '../../../store/desvantagem';
import { useRacaStore } from '../../../store/raca';
import { useClasseStore } from '../../../store/classe';
import { useDraftPersistence, saneamentoDoRascunho, type WizardDraft } from './hooks/useDraftPersistence';
import { useWizardNavigation } from './hooks/useWizardNavigation';
import { useBonusCalculation } from './hooks/useBonusCalculation';
import { usePointSystem } from './hooks/usePointSystem';
import { useChatState } from './hooks/useChatState';
import { useComboPreview } from './hooks/useComboPreview';
import { useMestreInteraction } from './hooks/useMestreInteraction';
import { useCharacterCreation } from './hooks/useCharacterCreation';
import { useCharacterImage } from './hooks/useCharacterImage';
import { useGrimorio } from './hooks/useGrimorio';
import { useWizardInit } from './hooks/useWizardInit';
import { tierDesbloqueado } from '../../../utils/evolucaoHelper';

interface UseWizardModelParams {
  navigate: (path: string) => void;
  sistema?: string;
}

export const useWizardModel = ({ navigate, sistema = 'lunaria' }: UseWizardModelParams) => {
  const isTresdet = sistema === 'tresdet';
  const isDnd5e = sistema === 'dnd5e';
  const recarregarPersonagens = usePersonagemStore(s => s.recarregarPersonagens);

  // --- Zustand store subscriptions ---
  const racas = useRacaStore(s => s.racas);
  const racasCarregadas = useRacaStore(s => s.racasCarregadas);
  const racasLoading = useRacaStore(s => s.loading);
  const racasErro = useRacaStore(s => s.error);
  const racasSistema = useRacaStore(s => s.sistemaCarregado);
  const racasIncompletas = useRacaStore(s => s.hasMore);
  const carregarRacas = useRacaStore(s => s.carregarRacas);
  const classes = useClasseStore(s => s.classes);
  const classesCarregadas = useClasseStore(s => s.classesCarregadas);
  const classesLoading = useClasseStore(s => s.loading);
  const classesErro = useClasseStore(s => s.error);
  const classesSistema = useClasseStore(s => s.sistemaCarregado);
  const classesIncompletas = useClasseStore(s => s.hasMore);
  const carregarClasses = useClasseStore(s => s.carregarClasses);
  const vantagens = useVantagemStore(s => s.vantagens);
  const vantagensCarregadas = useVantagemStore(s => s.vantagensCarregadas);
  const carregarVantagens = useVantagemStore(s => s.carregarVantagens);
  const desvantagens = useDesvantagemStore(s => s.desvantagens);
  const desvantagensCarregadas = useDesvantagemStore(s => s.desvantagensCarregadas);
  const carregarDesvantagens = useDesvantagemStore(s => s.carregarDesvantagens);

  // Catálogos combinados
  const racasDisponiveis = racas || [];
  const classesDisponiveis = classes || [];
  const tierCriacao = tierDesbloqueado(1);
  const vantagensDisponiveis = useMemo(() => {
    const todas = [...(vantagens || []), ...(desvantagens || [])];
    return todas.filter(item => (item.nivel || 1) <= tierCriacao);
  }, [vantagens, desvantagens]);

  // --- Draft ---
  const { draftInicial, draftRestaurado, setDraftRestaurado, salvarDraft, limparDraft } = useDraftPersistence(sistema);

  const draftAny = draftInicial as Record<string, unknown> | null;
  // --- Personagem state ---
  const [nome, setNome] = useState<string>((draftAny?.nome as string | undefined) || '');
  const [racaId, setRacaId] = useState<number | string | null>((draftAny?.racaId as number | string | null | undefined) || null);
  const [racaNome, setRacaNome] = useState<string>((draftAny?.racaNome as string | undefined) || '');
  const [classeId, setClasseId] = useState<number | string | null>((draftAny?.classeId as number | string | null | undefined) || null);
  const [classeNome, setClasseNome] = useState<string>((draftAny?.classeNome as string | undefined) || '');
  const [background, setBackground] = useState<string>((draftAny?.background as string | undefined) || '');

  // --- 3D&T-specific state ---
  const [tresdetCaracteristicas, setTresdetCaracteristicas] = useState<Record<string, number>>(
    (draftAny?.tresdetCaracteristicas as Record<string, number> | undefined) || { F: 0, H: 0, R: 0, A: 0, PdF: 0 }
  );
  const [tresdetCaracteristicasConfirmadas, setTresdetCaracteristicasConfirmadas] = useState<boolean>(
    (draftAny?.tresdetCaracteristicasConfirmadas as boolean | undefined) || false
  );
  const [tresdetVantagensIds, setTresdetVantagensIds] = useState<string[]>(
    (draftAny?.tresdetVantagensIds as string[] | undefined) || []
  );
  const [tresdetVantagensConfirmadas, setTresdetVantagensConfirmadas] = useState<boolean>(
    (draftAny?.tresdetVantagensConfirmadas as boolean | undefined) || false
  );
  const [tresdetDesvantagensIds, setTresdetDesvantagensIds] = useState<string[]>(
    (draftAny?.tresdetDesvantagensIds as string[] | undefined) || []
  );
  const [tresdetDesvantagensConfirmadas, setTresdetDesvantagensConfirmadas] = useState<boolean>(
    (draftAny?.tresdetDesvantagensConfirmadas as boolean | undefined) || false
  );
  const tresdetPontosTotais = 5;

  const setTresdetCaracteristica = useCallback((key: string, valor: number) => {
    setTresdetCaracteristicas(prev => ({ ...prev, [key]: Math.max(0, Math.min(5, valor)) }));
    setTresdetCaracteristicasConfirmadas(false);
  }, []);

  const confirmarTresdetCaracteristicas = useCallback(() => {
    setTresdetCaracteristicasConfirmadas(true);
  }, []);

  const toggleTresdetVantagem = useCallback((id: number | string) => {
    setTresdetVantagensIds(prev =>
      prev.includes(String(id))
        ? prev.filter(v => v !== String(id))
        : [...prev, String(id)]
    );
    setTresdetVantagensConfirmadas(false);
  }, []);

  const confirmarTresdetVantagens = useCallback(() => {
    setTresdetVantagensConfirmadas(true);
  }, []);

  const toggleTresdetDesvantagem = useCallback((id: number | string) => {
    setTresdetDesvantagensIds(prev =>
      prev.includes(String(id))
        ? prev.filter(v => v !== String(id))
        : [...prev, String(id)]
    );
    setTresdetDesvantagensConfirmadas(false);
  }, []);

  const confirmarTresdetDesvantagens = useCallback(() => {
    setTresdetDesvantagensConfirmadas(true);
  }, []);

  // --- D&D 5e-specific state ---
  // Wizard D&D 5e tem 7 etapas: sem etapa de magias/spells. Equipamentos e
  // spellcasting ficam como divida do E-1.
  const [dndAbilityScores, setDndAbilityScores] = useState<Record<string, number>>(
    (draftAny?.dndAbilityScores as Record<string, number> | undefined) || {}
  );
  const [dndAbilitiesConfirmed, setDndAbilitiesConfirmed] = useState<boolean>(
    (draftAny?.dndAbilitiesConfirmed as boolean | undefined) || false
  );
  const [dndSkillProficiencies, setDndSkillProficiencies] = useState<string[]>(
    (draftAny?.dndSkillProficiencies as string[] | undefined) || []
  );
  const [dndSkillsConfirmed, setDndSkillsConfirmed] = useState<boolean>(
    (draftAny?.dndSkillsConfirmed as boolean | undefined) || false
  );

  const setDndAbilityScore = useCallback((key: string, value: number | null) => {
    setDndAbilityScores(prev => {
      const next = { ...prev };
      if (value == null) {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
    setDndAbilitiesConfirmed(false);
  }, []);

  const resetDndAbilityScores = useCallback(() => {
    setDndAbilityScores({});
    setDndAbilitiesConfirmed(false);
  }, []);

  /** "Começar do zero": D&D volta ao estado inicial. */
  const resetarDnd = useCallback(() => {
    setDndAbilityScores({});
    setDndAbilitiesConfirmed(false);
    setDndSkillProficiencies([]);
    setDndSkillsConfirmed(false);
  }, []);

  const confirmarDndAbilities = useCallback(() => {
    setDndAbilitiesConfirmed(true);
  }, []);

  const toggleDndSkill = useCallback((skillId: string) => {
    setDndSkillProficiencies(prev =>
      prev.includes(skillId)
        ? prev.filter(s => s !== skillId)
        : [...prev, skillId]
    );
    setDndSkillsConfirmed(false);
  }, []);

  const confirmarDndSkills = useCallback(() => {
    setDndSkillsConfirmed(true);
  }, []);

  // --- Sub-hooks: point system & bonus ---
  const pointSystem = usePointSystem({
    draftInicial, vantagensDisponiveis,
    vantagensStore: vantagens, desvantagensStore: desvantagens,
    racaId, classeId, racasDisponiveis, classesDisponiveis,
  });
  const bonusCalc = useBonusCalculation({
    draftInicial, racaId, classeId,
    vantagensIds: pointSystem.vantagensIds,
    desvantagensIds: pointSystem.desvantagensIds,
    racasDisponiveis, classesDisponiveis, vantagensDisponiveis,
  });

  // --- Chat State ---
  const chat = useChatState();
  const { mensagens, setMensagens, inputTexto, setInputTexto,
    enviando, setEnviando, enviandoRef,
    sugestoes, setSugestoes, error, setError, chatEndRef } = chat;

  // --- estadoRef / mensagensRef (always-fresh snapshots) ---
  const estadoRef = useRef<Record<string, unknown>>({});
  const racaSelecionada = racaId ? racas.find(r => String(r.id) === String(racaId)) as { vantagens?: Array<{ nome?: string } | string>; desvantagens?: Array<{ nome?: string } | string>; [key: string]: unknown } | undefined : null;
  const classeSelecionada = classeId ? classes.find(c => String(c.id) === String(classeId)) as { vantagens?: Array<{ nome?: string } | string>; desvantagens?: Array<{ nome?: string } | string>; [key: string]: unknown } | undefined : null;
  estadoRef.current = {
    nome, racaId, racaNome, classeId, classeNome, background,
    vantagensIds: pointSystem.vantagensIds, vantagensNomes: pointSystem.vantagensNomes,
    desvantagensIds: pointSystem.desvantagensIds, desvantagensNomes: pointSystem.desvantagensNomes,
    atributosBase: bonusCalc.atributosBase, atributosFinal: bonusCalc.atributosFinal,
    vantagensDaRaca: racaSelecionada?.vantagens?.map((v) => (typeof v === 'string' ? v : (v?.nome || v))) || [],
    desvantagensDaRaca: racaSelecionada?.desvantagens?.map((d) => (typeof d === 'string' ? d : (d?.nome || d))) || [],
    vantagensDaClasse: classeSelecionada?.vantagens?.map((v) => (typeof v === 'string' ? v : (v?.nome || v))) || [],
    desvantagensDaClasse: classeSelecionada?.desvantagens?.map((d) => (typeof d === 'string' ? d : (d?.nome || d))) || [],
    tresdetCaracteristicas,
    tresdetVantagensIds,
    tresdetDesvantagensIds,
    dndAbilityScores,
    dndAbilitiesConfirmed,
    dndSkillProficiencies,
    dndSkillsConfirmed,
  };
  const mensagensRef = useRef<typeof mensagens>([]);
  mensagensRef.current = mensagens;

  // --- getEstado / getHistorico ---
  const getEstado = useCallback(() => {
    const s = estadoRef.current as Record<string, unknown>;
    const base: Record<string, unknown> = {
      nome: s.nome, raca_id: s.racaId, raca_nome: s.racaNome,
      classe_id: s.classeId, classe_nome: s.classeNome, background: s.background,
      vantagens_ids: s.vantagensIds, vantagens_nomes: s.vantagensNomes,
      desvantagens_ids: s.desvantagensIds, desvantagens_nomes: s.desvantagensNomes,
      atributos: s.atributosFinal,
      vantagens_da_raca: s.vantagensDaRaca, desvantagens_da_raca: s.desvantagensDaRaca,
      vantagens_da_classe: s.vantagensDaClasse, desvantagens_da_classe: s.desvantagensDaClasse,
    };
    if (isTresdet) {
      base.caracteristicas = s.tresdetCaracteristicas;
      base.tresdet_vantagens_ids = s.tresdetVantagensIds;
      base.tresdet_desvantagens_ids = s.tresdetDesvantagensIds;
    }
    if (isDnd5e) {
      base.dnd_ability_scores = s.dndAbilityScores;
      base.dnd_skill_proficiencies = s.dndSkillProficiencies;
    }
    return base;
  }, [isTresdet, isDnd5e]);
  const getHistorico = useCallback(() => {
    const messages = mensagensRef.current ?? [];
    return messages.filter(m => m.role !== 'sistema').map(m => ({
      role: m.role === 'mestre' ? 'assistant' : 'user',
      content: m.content,
    }));
  }, []);

  // --- Sub-hooks: combo preview, grimorio & navigation ---
  const comboPreview = useComboPreview({
    nome, racaId, classeId, background,
    bonusAplicados: bonusCalc.bonusAplicados,
    pontosCriacaoRestantes: pointSystem.pontosCriacaoRestantes,
    vantagensIds: pointSystem.vantagensIds, desvantagensIds: pointSystem.desvantagensIds,
    atributosBase: bonusCalc.atributosBase,
    estadoRef: estadoRef as unknown as Parameters<typeof useComboPreview>[0]['estadoRef'],
  });
  const grimorio = useGrimorio({
    racaId, racasDisponiveis,
    selecionadasIniciais: draftInicial?.grimorioSelecionadas,
    confirmadoInicial: draftInicial?.grimorioConfirmado ?? false,
  });
  const characterImage = useCharacterImage(draftInicial?.imageUrl ?? null);

  // Build navigation buildState com extras 3D&T e D&D 5e
  const navBuildState = useMemo(() => ({
    nome, racaId, classeId, background,
    vantagensIds: pointSystem.vantagensIds, desvantagensIds: pointSystem.desvantagensIds,
    skipVantagens: pointSystem.skipVantagens, skipDesvantagens: pointSystem.skipDesvantagens,
    bonusAplicados: bonusCalc.bonusAplicados, comboPreviewData: comboPreview.comboPreviewData,
    grimorioSelecionado: grimorio.grimorioSelecionado,
    caracteristicasDistribuidas: tresdetCaracteristicasConfirmadas,
    vantagensSelecionadas: tresdetVantagensConfirmadas,
    desvantagensSelecionadas: tresdetDesvantagensConfirmadas,
    magiasSelecionadas: grimorio.grimorioSelecionado,
    dndAbilitiesConfirmed,
    dndSkillsConfirmed,
  }), [
    nome, racaId, classeId, background,
    pointSystem.vantagensIds, pointSystem.desvantagensIds,
    pointSystem.skipVantagens, pointSystem.skipDesvantagens,
    bonusCalc.bonusAplicados, comboPreview.comboPreviewData,
    grimorio.grimorioSelecionado,
    tresdetCaracteristicasConfirmadas, tresdetVantagensConfirmadas, tresdetDesvantagensConfirmadas,
    dndAbilitiesConfirmed, dndSkillsConfirmed,
  ]);

  const navigation = useWizardNavigation(draftInicial, navBuildState, sistema);

  // --- Orchestration effects ---

  // Invalidate bonusAplicados when build changes (Lunaria only)
  const buildDepsRef = useRef({ racaId, classeId,
    vantagensIds: pointSystem.vantagensIds, desvantagensIds: pointSystem.desvantagensIds });
  useEffect(() => {
    if (isTresdet || isDnd5e) return;
    const prev = buildDepsRef.current;
    const changed = prev.racaId !== racaId || prev.classeId !== classeId
      || prev.vantagensIds !== pointSystem.vantagensIds
      || prev.desvantagensIds !== pointSystem.desvantagensIds;
    buildDepsRef.current = { racaId, classeId,
      vantagensIds: pointSystem.vantagensIds, desvantagensIds: pointSystem.desvantagensIds };
    if (!changed || navigation.etapaAtual === 'boas_vindas') return;
    if (bonusCalc.bonusAplicados) {
      bonusCalc.setBonusAplicados(false);
      if (navigation.etapaAtual === 'resumo') bonusCalc.setBonusInvalidado(true);
    }
  }, [racaId, classeId, pointSystem.vantagensIds, pointSystem.desvantagensIds,
      navigation.etapaAtual, bonusCalc.bonusAplicados, isTresdet, isDnd5e]);

  // Auto-load combo preview on equipamentos stage
  useEffect(() => {
    if (navigation.etapaAtual !== 'equipamentos') return;
    if (!comboPreview.podeGerarPreview || comboPreview.comboPreviewLoading) return;
    if (comboPreview.jaCarregouBuildAtual()) return;
    comboPreview.carregarComboPreview(0, []);
  }, [navigation.etapaAtual, comboPreview.podeGerarPreview,
      comboPreview.comboPreviewLoading, comboPreview.comboPreviewData,
      comboPreview.comboPreviewBuildKey, comboPreview.carregarComboPreview,
      comboPreview.jaCarregouBuildAtual]);

  // Auto-load grimorio na etapa grimorio (Lunaria) / magias (3D&T); auto-pula se nao usa magia
  const grimorioStageId = isTresdet ? 'magias' : 'grimorio';
  useEffect(() => {
    if (navigation.etapaAtual !== grimorioStageId) return;
    if (isTresdet) {
      // No 3D&T, pula a etapa de magias se o heroi nao comprou vantagens magicas.
      const temMagia = tresdetVantagensIds.length > 0;
      if (!temMagia) {
        grimorio.confirmarGrimorio();
        navigation.avancarEtapa();
      }
      return;
    }
    if (!classeId) return;
    if (grimorio.devePularGrimorio) {
      grimorio.confirmarGrimorio();
      navigation.avancarEtapa();
      return;
    }
    grimorio.carregarGrimorio(classeId);
  }, [navigation.etapaAtual, classeId, grimorio.devePularGrimorio, grimorioStageId,
      isTresdet, tresdetVantagensIds]);

  // Auto-pula grimorio so apos o GET /slots responder (grimorioCarregado): sem a
  // guarda, o effect rodaria no mount com slots=0 inicial e pularia indevidamente.
  // O skip depende de grimorioCarregado, nao de !grimorioSelecionado, porque
  // carregarGrimorio ja marca grimorioSelecionado quando ha 0 slots.
  useEffect(() => {
    if (isTresdet) return;
    if (navigation.etapaAtual !== 'grimorio') return;
    if (grimorio.grimorioLoading) return;
    if (!grimorio.grimorioCarregado) return;
    if (grimorio.grimorioSlots === 0) {
      grimorio.confirmarGrimorio();
      navigation.avancarEtapa();
    }
  }, [navigation.etapaAtual, grimorio.grimorioLoading, grimorio.grimorioCarregado,
      grimorio.grimorioSlots, isTresdet]);

  // Reset grimorio when class changes (Lunaria only)
  useEffect(() => {
    if (isTresdet) return;
    grimorio.resetGrimorio();
  }, [classeId, isTresdet]);

  // Load catalogs on mount (3D&T busca catalogos nos proprios blocos).
  // D&D 5e usa racas/classes mas nao vantagens/desvantagens.
  // racas/classes sao filtradas por sistema: o catalogo do wizard D&D mostra
  // racas/classes de D&D. carregarRacas/carregarClasses recarregam sozinhos
  // quando o sistema do cache difere do solicitado.
  useEffect(() => {
    if (isTresdet) return;
    // Lunaria e o default do backend: passa null para nao filtrar.
    const sistemaCatalogo = isDnd5e ? 'dnd5e' : null;
    const loadAll = async () => {
      const promises: Array<Promise<unknown>> = [
        carregarRacas(false, sistemaCatalogo),
        carregarClasses(false, sistemaCatalogo),
      ];
      if (!isDnd5e) {
        if (!vantagensCarregadas) promises.push(carregarVantagens());
        if (!desvantagensCarregadas) promises.push(carregarDesvantagens());
      }
      await Promise.all(promises);
    };
    // O erro fica na store (catalogoErro); aqui só evita a rejeição não tratada.
    loadAll().catch(() => {});
  }, [isTresdet, isDnd5e]);

  // Estado do catálogo de raça/classe para a tela: antes da 1ª carga conta como carregando.
  const catalogoCarregando = {
    raca: racasLoading || (!racasCarregadas && !racasErro),
    classe: classesLoading || (!classesCarregadas && !classesErro),
  };
  const catalogoErro = { raca: racasErro, classe: classesErro };
  const recarregarCatalogo = useCallback((tipo: 'raca' | 'classe') => {
    const sistemaCatalogo = isDnd5e ? 'dnd5e' : null;
    const carga = tipo === 'raca' ? carregarRacas(true, sistemaCatalogo) : carregarClasses(true, sistemaCatalogo);
    carga.catch(() => {});
  }, [isDnd5e, carregarRacas, carregarClasses]);

  // Rascunho restaurado com raça/classe que não existe no catálogo do sistema: cai e volta à etapa.
  // Espera o catálogo do próprio sistema carregar por inteiro (o cache pode ser do outro sistema).
  const rascunhoSaneadoRef = useRef(!draftInicial || isTresdet);
  useEffect(() => {
    if (rascunhoSaneadoRef.current) return;
    const sistemaCatalogo = isDnd5e ? 'dnd5e' : null;
    const racasProntas = racasCarregadas && !racasLoading && !racasErro && racasSistema === sistemaCatalogo && !racasIncompletas;
    const classesProntas = classesCarregadas && !classesLoading && !classesErro && classesSistema === sistemaCatalogo && !classesIncompletas;
    if (!racasProntas || !classesProntas) return;
    rascunhoSaneadoRef.current = true;
    const s = saneamentoDoRascunho({ racaId, classeId }, racas.map(r => r.id), classes.map(c => c.id));
    if (s.zerarRaca) { setRacaId(null); setRacaNome(''); }
    if (s.zerarClasse) { setClasseId(null); setClasseNome(''); }
    if (s.voltarPara) {
      const ids = navigation.etapas.map(e => e.id);
      if (ids.indexOf(navigation.etapaAtual) > ids.indexOf(s.voltarPara)) navigation.registrarVisita(s.voltarPara);
    }
  }, [racasCarregadas, racasLoading, racasErro, racasSistema, racasIncompletas,
      classesCarregadas, classesLoading, classesErro, classesSistema, classesIncompletas, isDnd5e]);

  // Draft save
  useEffect(() => {
    const draft: WizardDraft = {
      etapaAtual: navigation.etapaAtual,
      nome, racaId, racaNome, classeId, classeNome, background,
      vantagensIds: pointSystem.vantagensIds, vantagensNomes: pointSystem.vantagensNomes,
      desvantagensIds: pointSystem.desvantagensIds, desvantagensNomes: pointSystem.desvantagensNomes,
      atributosBase: bonusCalc.atributosBase, bonusAplicados: bonusCalc.bonusAplicados,
      skipVantagens: pointSystem.skipVantagens, skipDesvantagens: pointSystem.skipDesvantagens,
      etapasVisitadas: navigation.etapasVisitadas, etapasConcluidas: navigation.etapasConcluidas,
      grimorioSelecionadas: grimorio.grimorioSelecionadas, grimorioConfirmado: grimorio.grimorioSelecionado,
      imageUrl: characterImage.imageUrl,
    };
    if (isTresdet) {
      draft.tresdetCaracteristicas = tresdetCaracteristicas;
      draft.tresdetCaracteristicasConfirmadas = tresdetCaracteristicasConfirmadas;
      draft.tresdetVantagensIds = tresdetVantagensIds;
      draft.tresdetVantagensConfirmadas = tresdetVantagensConfirmadas;
      draft.tresdetDesvantagensIds = tresdetDesvantagensIds;
      draft.tresdetDesvantagensConfirmadas = tresdetDesvantagensConfirmadas;
    }
    if (isDnd5e) {
      draft.dndAbilityScores = dndAbilityScores;
      draft.dndAbilitiesConfirmed = dndAbilitiesConfirmed;
      draft.dndSkillProficiencies = dndSkillProficiencies;
      draft.dndSkillsConfirmed = dndSkillsConfirmed;
    }
    salvarDraft(draft);
  }, [navigation.etapaAtual, nome, racaId, classeId, background,
      pointSystem.vantagensIds, pointSystem.desvantagensIds,
      bonusCalc.atributosBase, bonusCalc.bonusAplicados,
      pointSystem.skipVantagens, pointSystem.skipDesvantagens,
      navigation.etapasVisitadas, navigation.etapasConcluidas,
      tresdetCaracteristicas, tresdetCaracteristicasConfirmadas,
      tresdetVantagensIds, tresdetVantagensConfirmadas,
      tresdetDesvantagensIds, tresdetDesvantagensConfirmadas, isTresdet,
      dndAbilityScores, dndAbilitiesConfirmed,
      dndSkillProficiencies, dndSkillsConfirmed, isDnd5e,
      grimorio.grimorioSelecionadas, grimorio.grimorioSelecionado, characterImage.imageUrl]);

  // --- Sub-hooks: mestre interaction, character creation, wizard init ---
  const mestreInteraction = useMestreInteraction({
    setMensagens, setEnviando, enviandoRef, setSugestoes, setError, setInputTexto,
    navigation, nome, setNome, racaId, classeId, background, setBackground,
    setRacaId, setRacaNome, setClasseId, setClasseNome,
    pointSystem, bonusCalc, getEstado, getHistorico,
    estadoRef: estadoRef as unknown as Parameters<typeof useMestreInteraction>[0]['estadoRef'],
    sistema,
  });
  const characterCreation = useCharacterCreation({
    getEstado: getEstado as unknown as Parameters<typeof useCharacterCreation>[0]['getEstado'],
    navigate, comboPreviewData: comboPreview.comboPreviewData as Parameters<typeof useCharacterCreation>[0]['comboPreviewData'],
    comboPreviewLoading: comboPreview.comboPreviewLoading,
    navigation, bonusCalc, pointSystem,
    estadoRef: estadoRef as unknown as Parameters<typeof useCharacterCreation>[0]['estadoRef'],
    setError, limparDraft, recarregarPersonagens,
    imageUrl: characterImage.imageUrl,
    grimorioSelecionadas: grimorio.grimorioSelecionadas,
    sistema,
  });
  const { resetarTudo, descartarDraft } = useWizardInit({
    chat, navigation, nome, racaId: racaId as number | string | null,
    setNome, setRacaId, setRacaNome, setClasseId, setClasseNome, setBackground,
    pointSystem, bonusCalc, creation: characterCreation as unknown as Parameters<typeof useWizardInit>[0]['creation'],
    draftInicial, limparDraft, setDraftRestaurado,
    getEstado: getEstado as unknown as Parameters<typeof useWizardInit>[0]['getEstado'],
    comboPreview, resetarDnd, resetGrimorio: grimorio.resetGrimorio, resetImage: characterImage.resetImage, sistema,
  });

  // Grimorio: confirmar selecao e avancar
  const confirmarEAvancarGrimorio = useCallback(() => {
    grimorio.confirmarGrimorio();
    navigation.avancarEtapa();
  }, [grimorio.confirmarGrimorio, navigation.avancarEtapa]);

  // D&D 5e: o slug em ingles da classe (ex.: wizard, barbarian) casa com as
  // chaves de CLASS_SKILL_OPTIONS consumidas pelo DnDSkillsBlock. As classes
  // D&D ja sao cadastradas com nome em ingles, entao o slug e o nome normalizado.
  const classeNomeExposto = useMemo(
    () => (isDnd5e ? (classeNome || '').toLowerCase().trim() : classeNome),
    [isDnd5e, classeNome],
  );

  // --- Return ---
  return {
    // Sistema
    sistema,
    isTresdet,
    isDnd5e,
    // Navigation
    etapas: navigation.etapas, etapaAtual: navigation.etapaAtual,
    etapaIndex: navigation.etapaIndex, etapasVisitadas: navigation.etapasVisitadas,
    etapasConcluidas: navigation.etapasConcluidas,
    avancarComMestre: mestreInteraction.avancarComMestre,
    pularEtapa: mestreInteraction.pularEtapa,
    navegarParaEtapa: navigation.navegarParaEtapa,
    avancarEtapa: navigation.avancarEtapa,
    // Chat
    mensagens, inputTexto, setInputTexto, enviando, sugestoes, chatEndRef,
    // Atributos
    atributosBase: bonusCalc.atributosBase, atributosFinal: bonusCalc.atributosFinal,
    atributosSugeridos: bonusCalc.atributosSugeridos,
    bonusAplicados: bonusCalc.bonusAplicados, bonusDetalhes: bonusCalc.bonusDetalhes,
    bonusFontes: bonusCalc.bonusFontes, bonusInvalidado: bonusCalc.bonusInvalidado,
    pontosDistribuidos: bonusCalc.pontosDistribuidos,
    pontosRestantes: bonusCalc.pontosRestantes, pontosTotais: bonusCalc.pontosTotais,
    attrMin: bonusCalc.attrMin, attrMax: bonusCalc.attrMax,
    confirmarAtributos: bonusCalc.confirmarAtributos, setAtributo: bonusCalc.setAtributo,
    aplicarAtributosSugeridos: mestreInteraction.aplicarSugestaoAtributos,
    // Personagem
    // classeNome: slug em ingles quando D&D 5e (casa com CLASS_SKILL_OPTIONS).
    nome, racaId, racaNome, classeId, classeNome: classeNomeExposto, background,
    /** Grava o nome digitado na etapa Nome (o Continuar confirma o rascunho). */
    definirNome: setNome,
    vantagensIds: pointSystem.vantagensIds, vantagensNomes: pointSystem.vantagensNomes,
    desvantagensIds: pointSystem.desvantagensIds, desvantagensNomes: pointSystem.desvantagensNomes,
    skipVantagens: pointSystem.skipVantagens, setSkipVantagens: pointSystem.setSkipVantagens,
    skipDesvantagens: pointSystem.skipDesvantagens, setSkipDesvantagens: pointSystem.setSkipDesvantagens,
    // Pontos de criação
    pontosCriacaoTotal: pointSystem.pontosCriacaoTotal,
    pontosCriacaoRestantes: pointSystem.pontosCriacaoRestantes,
    pontosGastos: pointSystem.pontosGastos, pontosVantagem: pointSystem.pontosVantagem,
    pontosDesvantagem: pointSystem.pontosDesvantagem,
    custoRaca: pointSystem.custoRaca, custoClasse: pointSystem.custoClasse,
    maxCustoDesvantagem: pointSystem.maxCustoDesvantagem,
    // Catálogos
    racasDisponiveis, classesDisponiveis, vantagensDisponiveis,
    catalogoCarregando, catalogoErro, recarregarCatalogo,
    // Actions
    enviarMensagem: mestreInteraction.enviarMensagem,
    selecionarSugestao: mestreInteraction.selecionarSugestao,
    removerSelecao: pointSystem.removerSelecao,
    salvarPersonagem: characterCreation.salvarPersonagem,
    clearError: chat.clearError,
    // Draft
    draftRestaurado, resetarTudo, descartarDraft,
    // Async
    salvando: characterCreation.salvando, error,
    // Resolutiva / Criacao
    comboPreviewData: comboPreview.comboPreviewData,
    comboPreviewLoading: comboPreview.comboPreviewLoading,
    comboPreviewErro: comboPreview.comboPreviewErro,
    comboPreviewTentativa: comboPreview.comboPreviewTentativa,
    comboPreviewBuildKey: comboPreview.comboPreviewBuildKey,
    podeGerarPreview: comboPreview.podeGerarPreview,
    regenerarComboPreview: comboPreview.regenerarComboPreview,
    recarregarComboPreview: comboPreview.recarregarComboPreview,
    creationFlowStatus: characterCreation.creationFlowStatus,
    creationResultModalOpen: characterCreation.creationResultModalOpen,
    creationResultData: characterCreation.creationResultData,
    fecharResultadoCriacao: characterCreation.fecharResultadoCriacao,
    irParaPersonagens: characterCreation.irParaPersonagens,
    verFichaCriada: characterCreation.verFichaCriada,
    // Character image
    imageUrl: characterImage.imageUrl,
    imageLoading: characterImage.imageLoading,
    imageError: characterImage.imageError,
    gerarImagem: characterImage.gerarImagem,
    resetImage: characterImage.resetImage,
    // Grimorio
    grimorioMagias: grimorio.grimorioMagias,
    grimorioSlots: grimorio.grimorioSlots,
    grimorioSelecionadas: grimorio.grimorioSelecionadas,
    grimorioLoading: grimorio.grimorioLoading,
    grimorioError: grimorio.grimorioError,
    grimorioSelecionado: grimorio.grimorioSelecionado,
    toggleGrimorioMagia: grimorio.toggleGrimorioMagia,
    confirmarGrimorio: confirmarEAvancarGrimorio,
    // 3D&T-specific
    tresdetCaracteristicas,
    tresdetCaracteristicasConfirmadas,
    tresdetPontosTotais,
    setTresdetCaracteristica,
    confirmarTresdetCaracteristicas,
    tresdetVantagensIds,
    tresdetVantagensConfirmadas,
    toggleTresdetVantagem,
    confirmarTresdetVantagens,
    tresdetDesvantagensIds,
    tresdetDesvantagensConfirmadas,
    toggleTresdetDesvantagem,
    confirmarTresdetDesvantagens,
    // D&D 5e-specific
    dndAbilityScores,
    dndAbilitiesConfirmed,
    setDndAbilityScore,
    resetDndAbilityScores,
    confirmarDndAbilities,
    dndSkillProficiencies,
    dndSkillsConfirmed,
    toggleDndSkill,
    confirmarDndSkills,
    navigate,
  };
};

export type WizardModel = ReturnType<typeof useWizardModel>;
