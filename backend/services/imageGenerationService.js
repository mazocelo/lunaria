const LEONARDO_API_URL = 'https://cloud.leonardo.ai/api/rest/v1';
const LEONARDO_API_KEY = process.env.LEONARDO_API_KEY;

const POLL_INTERVAL = 2000;
const MAX_POLLS = 30;

async function generateImage(prompt, options = {}) {
  if (!LEONARDO_API_KEY) {
    throw new Error('LEONARDO_API_KEY não configurada');
  }

  const body = {
    prompt,
    modelId: options.modelId || 'e71a1c2f-4f80-4800-934f-2c68979d8cc8',
    width: options.width || 512,
    height: options.height || 512,
    num_images: 1,
    guidance_scale: options.guidance_scale || 7,
    negative_prompt: options.negative_prompt || 'blurry, low quality, distorted, deformed, ugly, bad anatomy',
  };

  const response = await fetch(`${LEONARDO_API_URL}/generations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LEONARDO_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Leonardo API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const generationId = data.sdGenerationJob?.generationId;

  if (!generationId) {
    throw new Error('Falha ao iniciar geração de imagem');
  }

  return pollGeneration(generationId);
}

async function pollGeneration(generationId) {
  for (let i = 0; i < MAX_POLLS; i++) {
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));

    const response = await fetch(`${LEONARDO_API_URL}/generations/${generationId}`, {
      headers: {
        'Authorization': `Bearer ${LEONARDO_API_KEY}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) continue;

    const data = await response.json();
    const generation = data.generations_by_pk;

    if (generation?.status === 'COMPLETE' && generation.generated_images?.length > 0) {
      return generation.generated_images[0].url;
    }

    if (generation?.status === 'FAILED') {
      throw new Error('Geração de imagem falhou');
    }
  }

  throw new Error('Timeout aguardando geração de imagem');
}

function buildPrompt(entityType, entityData) {
  const style = 'high fantasy RPG art style, detailed, vibrant colors, digital painting';

  switch (entityType) {
    case 'personagem': {
      const parts = ['Fantasy RPG character portrait'];
      if (entityData.nome) parts.push(entityData.nome);
      if (entityData.raca) parts.push(entityData.raca);
      if (entityData.classe) parts.push(entityData.classe);
      if (entityData.background) parts.push(entityData.background.slice(0, 150));
      return `${parts.join(', ')}, ${style}`;
    }
    case 'monstro': {
      const parts = ['Fantasy RPG creature'];
      if (entityData.nome) parts.push(entityData.nome);
      if (entityData.tipo) parts.push(Array.isArray(entityData.tipo) ? entityData.tipo.join(' ') : entityData.tipo);
      if (entityData.descricao) parts.push(entityData.descricao.slice(0, 200));
      return `${parts.join(', ')}, ${style}`;
    }
    case 'equipamento': {
      const parts = ['Fantasy RPG item'];
      if (entityData.nome) parts.push(entityData.nome);
      if (entityData.tipo) parts.push(Array.isArray(entityData.tipo) ? entityData.tipo.join(' ') : entityData.tipo);
      if (entityData.descricao) parts.push(entityData.descricao.slice(0, 200));
      if (entityData.raridade) parts.push(`${entityData.raridade} rarity`);
      return `${parts.join(', ')}, ${style}`;
    }
    case 'historia': {
      const parts = ['Epic fantasy scene'];
      if (entityData.nome) parts.push(entityData.nome);
      if (entityData.temas) parts.push(`themes: ${entityData.temas}`);
      if (entityData.descricao) parts.push(entityData.descricao.slice(0, 200));
      return `${parts.join(', ')}, ${style}`;
    }
    default:
      return `Fantasy RPG illustration, ${entityData.nome || 'mysterious scene'}, ${style}`;
  }
}

export { generateImage, buildPrompt };
