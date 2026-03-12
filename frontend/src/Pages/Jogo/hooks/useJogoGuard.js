import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useGameStore from '../../../store/game';

/**
 * Hook para validacao de acesso as etapas do jogo.
 * Redireciona automaticamente quando os pre-requisitos da etapa nao sao atendidos.
 *
 * @param {string} requiredStep
 * 'selecao-personagem' | 'sala-espera' | 'jogo-ativo'
 */
export const useJogoGuard = (requiredStep) => {
  const { personagemSelecionado, salaAberta, historiaAtual, loading } = useGameStore();
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    // Durante bootstrap/retomada, nao redirecionar.
    if (loading) return;

    const validationTimer = setTimeout(() => {
      if (!historiaAtual && requiredStep !== 'selecao-personagem') {
        navigate(`/jogo/${id}/selecao-personagem`);
        return;
      }

      switch (requiredStep) {
        case 'sala-espera':
          if (!personagemSelecionado) {
            navigate(`/jogo/${id}/selecao-personagem`);
          }
          break;

        case 'jogo-ativo':
          if (!personagemSelecionado) {
            navigate(`/jogo/${id}/selecao-personagem`);
          } else if (!salaAberta) {
            navigate(`/jogo/${id}/sala-espera`);
          }
          break;

        case 'selecao-personagem':
        default:
          break;
      }
    }, 150);

    return () => clearTimeout(validationTimer);
  }, [requiredStep, personagemSelecionado, salaAberta, historiaAtual, loading, navigate, id]);
};

export default useJogoGuard;
