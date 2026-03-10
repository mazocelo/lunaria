import { generateImage, buildPrompt } from '../services/imageGenerationService.js';

const VALID_ENTITY_TYPES = ['personagem', 'monstro', 'equipamento', 'historia', 'mestre'];

async function gerarImagem(req, res) {
  try {
    const { entityType, entityData } = req.body;

    if (!entityType || !VALID_ENTITY_TYPES.includes(entityType)) {
      return res.status(400).json({
        success: false,
        error: `entityType inválido. Use: ${VALID_ENTITY_TYPES.join(', ')}`,
      });
    }

    if (!entityData || typeof entityData !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'entityData é obrigatório e deve ser um objeto',
      });
    }

    const prompt = buildPrompt(entityType, entityData);
    const imageUrl = await generateImage(prompt);

    return res.json({ success: true, data: { url: imageUrl, prompt } });
  } catch (error) {
    console.error('[ImageController] Erro ao gerar imagem:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao gerar imagem',
    });
  }
}

export { gerarImagem };
