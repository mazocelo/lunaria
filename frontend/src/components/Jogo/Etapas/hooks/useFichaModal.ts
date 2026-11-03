import { useState, useCallback } from 'react';
import { personagemService } from '../../../../services';

interface PersonagemDados {
  id?: number | string;
  nome?: string;
  [key: string]: unknown;
}

interface UserBasico {
  id?: number | string;
}

interface JogadorInfo {
  userId?: number | string;
  personagemId?: number | string;
  personagem_id?: number | string;
  username?: string;
  personagemNome?: string;
  personagem?: string;
}

export const useFichaModal = (personagemSelecionado: PersonagemDados | null | undefined, user: UserBasico | null | undefined) => {
  const [fichaModalAberta, setFichaModalAberta] = useState(false);
  const [fichaSelecionada, setFichaSelecionada] = useState<PersonagemDados | null>(null);
  const [fichaCarregando, setFichaCarregando] = useState(false);
  const [fichaErro, setFichaErro] = useState<string | null>(null);
  const [tituloFicha, setTituloFicha] = useState('Ficha do Personagem');
  const [fichasCache, setFichasCache] = useState<Record<string, PersonagemDados>>({});

  const fecharFichaModal = useCallback(() => {
    setFichaModalAberta(false);
    setFichaErro(null);
    setFichaSelecionada(null);
    setFichaCarregando(false);
  }, []);

  const abrirFichaLocal = useCallback((dados: PersonagemDados, titulo: string = 'Ficha do Personagem') => {
    setTituloFicha(titulo);
    setFichaErro(null);
    setFichaSelecionada(dados);
    setFichaCarregando(false);
    setFichaModalAberta(true);
  }, []);

  const carregarFichaRemota = useCallback(async (personagemId: number | string | null | undefined, titulo: string) => {
    if (!personagemId) {
      setTituloFicha(titulo);
      setFichaErro('Personagem nao informado para esta ficha.');
      setFichaSelecionada(null);
      setFichaCarregando(false);
      setFichaModalAberta(true);
      return;
    }

    setTituloFicha(titulo);
    setFichaErro(null);
    setFichaSelecionada(null);
    setFichaCarregando(true);
    setFichaModalAberta(true);

    const cacheKey = String(personagemId);
    if (fichasCache[cacheKey]) {
      setFichaSelecionada(fichasCache[cacheKey]);
      setFichaCarregando(false);
      return;
    }

    try {
      const ficha = await personagemService.getById(Number(personagemId)) as unknown as PersonagemDados;
      setFichasCache(prev => ({ ...prev, [cacheKey]: ficha }));
      setFichaSelecionada(ficha);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar ficha do personagem.';
      setFichaErro(message);
    } finally {
      setFichaCarregando(false);
    }
  }, [fichasCache]);

  const handleVerMinhaFicha = useCallback(() => {
    if (!personagemSelecionado) {
      setTituloFicha('Minha Ficha');
      setFichaErro('Nenhum personagem selecionado.');
      setFichaSelecionada(null);
      setFichaModalAberta(true);
      return;
    }
    abrirFichaLocal(personagemSelecionado, 'Minha Ficha');
  }, [personagemSelecionado, abrirFichaLocal]);

  const handleVerFichaJogador = useCallback((jogador: JogadorInfo | null) => {
    if (!jogador) return;
    if (user?.id && String(jogador.userId) === String(user.id)) {
      handleVerMinhaFicha();
      return;
    }
    const personagemId = jogador.personagemId || jogador.personagem_id;
    const titulo = `${jogador.username || 'Jogador'} • ${jogador.personagemNome || jogador.personagem || 'Personagem'}`;
    carregarFichaRemota(personagemId, titulo);
  }, [user, handleVerMinhaFicha, carregarFichaRemota]);

  return {
    fichaModalAberta,
    fichaSelecionada,
    fichaCarregando,
    fichaErro,
    tituloFicha,
    fecharFichaModal,
    handleVerMinhaFicha,
    handleVerFichaJogador,
  };
};
