import { useState, useCallback } from 'react';
import { personagemService } from '../../../../services';

export const useFichaModal = (personagemSelecionado, user) => {
  const [fichaModalAberta, setFichaModalAberta] = useState(false);
  const [fichaSelecionada, setFichaSelecionada] = useState(null);
  const [fichaCarregando, setFichaCarregando] = useState(false);
  const [fichaErro, setFichaErro] = useState(null);
  const [tituloFicha, setTituloFicha] = useState('Ficha do Personagem');
  const [fichasCache, setFichasCache] = useState({});

  const fecharFichaModal = useCallback(() => {
    setFichaModalAberta(false);
    setFichaErro(null);
    setFichaSelecionada(null);
    setFichaCarregando(false);
  }, []);

  const abrirFichaLocal = useCallback((dados, titulo = 'Ficha do Personagem') => {
    setTituloFicha(titulo);
    setFichaErro(null);
    setFichaSelecionada(dados);
    setFichaCarregando(false);
    setFichaModalAberta(true);
  }, []);

  const carregarFichaRemota = useCallback(async (personagemId, titulo) => {
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

    if (fichasCache[personagemId]) {
      setFichaSelecionada(fichasCache[personagemId]);
      setFichaCarregando(false);
      return;
    }

    try {
      const ficha = await personagemService.getById(personagemId);
      setFichasCache(prev => ({ ...prev, [personagemId]: ficha }));
      setFichaSelecionada(ficha);
    } catch (error) {
      setFichaErro(error.message || 'Erro ao carregar ficha do personagem.');
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

  const handleVerFichaJogador = useCallback((jogador) => {
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
