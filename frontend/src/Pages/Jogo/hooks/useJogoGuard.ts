import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useGameStore from '../../../store/game';
import { getPhaseByRoute } from '../../../features/gameSession/config/phaseConfig';
import { resolvePhaseRedirect } from '../../../features/gameSession/config/routeRules';

/**
 * Hook para validacao de acesso as etapas do jogo.
 * Redireciona automaticamente quando os pre-requisitos da etapa nao sao atendidos.
 */
export const useJogoGuard = (requiredStep: string) => {
  const { personagemSelecionado, salaAberta, historiaAtual, loading } = useGameStore();
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    // Durante bootstrap/retomada, nao redirecionar.
    if (loading) return;

    const validationTimer = setTimeout(() => {
      const phase = getPhaseByRoute(requiredStep);
      if (!phase) return;

      const redirect = resolvePhaseRedirect(phase.id, {
        hasHistoria: !!historiaAtual,
        hasCharacter: !!personagemSelecionado,
        isSalaAberta: !!salaAberta,
      });

      if (redirect) {
        navigate(`/jogo/${id}/${redirect}`);
      }
    }, 150);

    return () => clearTimeout(validationTimer);
  }, [requiredStep, personagemSelecionado, salaAberta, historiaAtual, loading, navigate, id]);
};

export default useJogoGuard;
