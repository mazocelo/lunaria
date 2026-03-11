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

const IMAGE_STYLES = {
  fantasy_painting: 'high fantasy RPG art style, detailed, vibrant colors, digital painting',
  anime: 'anime art style, cel shading, vivid colors, manga illustration, Japanese RPG aesthetic',
  realistic: 'photorealistic, hyper-detailed, cinematic lighting, concept art, AAA game art',
  dark_gothic: 'dark fantasy art, gothic atmosphere, muted colors, dramatic shadows, grim and moody',
  watercolor: 'watercolor painting style, soft edges, ethereal, pastel tones, storybook illustration',
  pixel_art: 'pixel art style, retro 16-bit RPG aesthetic, detailed sprites, nostalgic',
  comic_book: 'comic book art style, bold ink outlines, dynamic poses, vibrant halftone colors, graphic novel',
};

function buildPrompt(entityType, entityData) {
  const style = IMAGE_STYLES[entityData.estilo_imagem] || IMAGE_STYLES.fantasy_painting;

  switch (entityType) {
    case 'personagem': {
      const parts = [`${style}, character portrait`];
      if (entityData.raca) parts.push(entityData.raca);
      if (entityData.classe) parts.push(entityData.classe);
      if (entityData.nome) parts.push(`named ${entityData.nome}`);
      if (entityData.background) parts.push(entityData.background.slice(0, 200));
      return parts.join(', ');
    }
    case 'monstro': {
      const parts = [`${style}, creature illustration`];
      if (entityData.nome) parts.push(entityData.nome);
      if (entityData.tipo) parts.push(Array.isArray(entityData.tipo) ? entityData.tipo.join(' ') : entityData.tipo);
      if (entityData.descricao) parts.push(entityData.descricao.slice(0, 300));
      return parts.join(', ');
    }
    case 'equipamento': {
      const parts = [`${style}, item illustration, no characters`];
      if (entityData.nome) parts.push(entityData.nome);
      if (entityData.tipo) parts.push(Array.isArray(entityData.tipo) ? entityData.tipo.join(' ') : entityData.tipo);
      if (entityData.descricao) parts.push(entityData.descricao.slice(0, 250));
      if (entityData.raridade) parts.push(`${entityData.raridade} rarity`);
      return parts.join(', ');
    }
    case 'historia': {
      const parts = [`${style}, epic book cover illustration`];
      if (entityData.nome) parts.push(`"${entityData.nome}"`);
      if (entityData.temas) parts.push(`themes: ${entityData.temas}`);
      if (entityData.sinopse) parts.push(entityData.sinopse.slice(0, 250));
      else if (entityData.prologo) parts.push(entityData.prologo.slice(0, 250));
      else if (entityData.descricao) parts.push(entityData.descricao.slice(0, 250));
      if (entityData.antagonista) parts.push(`antagonist: ${entityData.antagonista}`);
      if (entityData.locais) parts.push(`locations: ${entityData.locais}`);
      return parts.join(', ');
    }
    case 'historia_mapa': {
      const mapStyle = 'fantasy RPG world map, top-down cartographic view, parchment texture, hand-drawn style, detailed terrain';
      const parts = [mapStyle];
      if (entityData.nome) parts.push(`"${entityData.nome}"`);
      if (entityData.temas) parts.push(`themes: ${entityData.temas}`);
      if (entityData.locais) parts.push(`locations: ${entityData.locais}`);
      if (entityData.mapaMundi) parts.push(String(entityData.mapaMundi).slice(0, 250));
      return parts.join(', ');
    }
    case 'mestre': {
      const parts = [`${style}, game master portrait, wise narrator`];
      if (entityData.nome) parts.push(entityData.nome);
      if (entityData.tom_narrativo) parts.push(`${entityData.tom_narrativo} atmosphere`);
      if (entityData.personalidade) parts.push(entityData.personalidade.slice(0, 200));
      return parts.join(', ');
    }
    case 'npc': {
      const parts = [`${style}, RPG character portrait`];
      if (entityData.descricao) parts.push(entityData.descricao.slice(0, 400));
      if (entityData.nome) parts.push(`named ${entityData.nome}`);
      if (entityData.papel) parts.push(`${entityData.papel}`);
      if (entityData.local) parts.push(`in ${entityData.local}`);
      return parts.join(', ');
    }
    case 'local': {
      const parts = [`${style}, landscape illustration, environment art, no characters`];
      if (entityData.descricao) parts.push(entityData.descricao.slice(0, 400));
      if (entityData.nome) parts.push(entityData.nome);
      if (entityData.tipo) parts.push(`${entityData.tipo}`);
      return parts.join(', ');
    }
    case 'cena': {
      const parts = [`${style}, scene illustration, dramatic lighting, cinematic`];
      if (entityData.narracao) parts.push(entityData.narracao.slice(0, 500));
      return parts.join(', ');
    }
    default:
      return `${style}, ${entityData.nome || 'mysterious scene'}`;
  }
}

export { generateImage, buildPrompt, IMAGE_STYLES };
