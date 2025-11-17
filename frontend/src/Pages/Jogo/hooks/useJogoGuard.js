import { useEffect } from 'react';
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
  const { personagemSelecionado, salaAberta, historiaAtual } = useGameStore();
  const navigate = useNavigate();
  const { id } = useParams();
  
  useEffect(() => {
    // Dar tempo para sincronização do store (evita race conditions)
    const validationTimer = setTimeout(() => {
      // Sempre precisa de história carregada (exceto na primeira etapa)
      if (!historiaAtual && requiredStep !== 'selecao-personagem') {
        console.warn('⚠️ useJogoGuard: História não carregada, redirecionando...');
        navigate(`/jogo/${id}/selecao-personagem`);
        return;
      }

      // Validações específicas por etapa
      switch (requiredStep) {
        case 'sala-espera':
          // Precisa ter personagem selecionado para entrar na sala de espera
          if (!personagemSelecionado) {
            console.warn('⚠️ useJogoGuard: Personagem não selecionado, redirecionando para seleção...');
            navigate(`/jogo/${id}/selecao-personagem`);
          }
          break;
          
        case 'jogo-ativo':
          // Precisa ter personagem E sala aberta para jogar
          if (!personagemSelecionado) {
            console.warn('⚠️ useJogoGuard: Personagem não selecionado, redirecionando para seleção...');
            navigate(`/jogo/${id}/selecao-personagem`);
          } else if (!salaAberta) {
            console.warn('⚠️ useJogoGuard: Sala não aberta, redirecionando para sala de espera...');
            navigate(`/jogo/${id}/sala-espera`);
          }
          break;
          
        case 'selecao-personagem':
          // Sem validações especiais - é a primeira etapa
          break;
          
        default:
          console.warn(`⚠️ useJogoGuard: Etapa desconhecida: ${requiredStep}`);
      }
    }, 100); // Pequeno delay para sincronização
    
    return () => clearTimeout(validationTimer);
  }, [requiredStep, personagemSelecionado, salaAberta, historiaAtual, navigate, id]);
};

export default useJogoGuard;

