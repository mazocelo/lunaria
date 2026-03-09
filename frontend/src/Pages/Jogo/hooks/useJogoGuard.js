import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useGameStore from '../../../store/game';

/**
 * Hook para validação de acesso às etapas do jogo
 * Redireciona automaticamente se o jogador não atender os requisitos
 *
 * @param {string} requiredStep - Etapa que requer validação
 *                                 'selecao-personagem' | 'sala-espera' | 'jogo-ativo'
 */
export const useJogoGuard = (requiredStep) => {
  const { personagemSelecionado, salaAberta, historiaAtual, loading } = useGameStore();
  const navigate = useNavigate();
  const { id } = useParams();
  const hasValidated = useRef(false);

  useEffect(() => {
    // Não validar enquanto o store está carregando (retomarJogo, etc)
    if (loading) {
      hasValidated.current = false;
      return;
    }

    // Evitar validação duplicada
    if (hasValidated.current) return;

    const validationTimer = setTimeout(() => {
      hasValidated.current = true;

      if (!historiaAtual && requiredStep !== 'selecao-personagem') {
        console.warn('⚠️ useJogoGuard: História não carregada, redirecionando...');
        navigate(`/jogo/${id}/selecao-personagem`);
        return;
      }

      switch (requiredStep) {
        case 'sala-espera':
          if (!personagemSelecionado) {
            console.warn('⚠️ useJogoGuard: Personagem não selecionado, redirecionando para seleção...');
            navigate(`/jogo/${id}/selecao-personagem`);
          }
          break;

        case 'jogo-ativo':
          if (!personagemSelecionado) {
            console.warn('⚠️ useJogoGuard: Personagem não selecionado, redirecionando para seleção...');
            navigate(`/jogo/${id}/selecao-personagem`);
          } else if (!salaAberta) {
            console.warn('⚠️ useJogoGuard: Sala não aberta, redirecionando para sala de espera...');
            navigate(`/jogo/${id}/sala-espera`);
          }
          break;

        case 'selecao-personagem':
          break;

        default:
          console.warn(`⚠️ useJogoGuard: Etapa desconhecida: ${requiredStep}`);
      }
    }, 300);

    return () => clearTimeout(validationTimer);
  }, [requiredStep, personagemSelecionado, salaAberta, historiaAtual, loading, navigate, id]);
};

export default useJogoGuard;
