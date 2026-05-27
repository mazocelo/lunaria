import { useState, useCallback } from 'react';
import { imageGenerationService } from '../../../../services/index';

interface GerarImagemParams {
  nome: string;
  racaNome?: string;
  classeNome?: string;
  background?: string;
  vantagensNomes?: string[];
  desvantagensNomes?: string[];
}

export const useCharacterImage = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const gerarImagem = useCallback(async ({ nome, racaNome, classeNome, background, vantagensNomes, desvantagensNomes }: GerarImagemParams): Promise<string | null> => {
    setImageLoading(true);
    setImageError(null);
    try {
      const result = await imageGenerationService.generate({
        entityType: 'personagem',
        entityData: {
          nome,
          raca: racaNome,
          classe: classeNome,
          background,
          vantagens: vantagensNomes?.join(', '),
          desvantagens: desvantagensNomes?.join(', '),
        },
      }) as { data?: { url?: string } } | null;
      const url = result?.data?.url || null;
      setImageUrl(url);
      return url;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setImageError(message);
      return null;
    } finally {
      setImageLoading(false);
    }
  }, []);

  const resetImage = useCallback(() => {
    setImageUrl(null);
    setImageError(null);
  }, []);

  return { imageUrl, imageLoading, imageError, gerarImagem, resetImage };
};

export type CharacterImageApi = ReturnType<typeof useCharacterImage>;
