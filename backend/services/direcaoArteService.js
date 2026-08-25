import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatGroq } from '@langchain/groq';
import { ChatAnthropic } from '@langchain/anthropic';
import { trackLLMUsage } from './llmTracker.js';
import logger from '../helpers/logger.js';

const log = logger.child({ module: 'direcaoArteService' });

/**
 * Direcao de arte de um local, para o mapa 3D.
 *
 * O mapa procedural do frontend desenha a planta, mas sem isto toda dungeon tem
 * a mesma cara: a paleta sai de um default por `tipo`. Aqui a IA descreve a
 * identidade visual DAQUELE lugar (cor, material, atmosfera), no mesmo passo em
 * que gera a imagem — o usuario clica um botao so.
 *
 * Por que uma direcao escrita, e nao as cores amostradas da imagem gerada: as
 * imagens ficam num bucket R2 que nao envia `access-control-allow-origin`, entao
 * o navegador nao consegue ler os pixels nem usar a imagem como textura WebGL.
 * Uma paleta escrita tambem e mais controlavel do que uma amostrada.
 *
 * NADA aqui e obrigatorio: se a chamada falhar, o mapa continua usando o default
 * do tipo. Por isso toda falha e engolida e devolve null.
 */

const PROVIDER = process.env.IMAGE_PROMPT_PROVIDER || process.env.AI_PROVIDER || 'gemini';
const MODEL = process.env.DIRECAO_ARTE_MODEL || process.env.IMAGE_PROMPT_MODEL || 'gemini-2.5-flash-lite';
const TIMEOUT_MS = 12_000;

const TEXTURAS = ['pedra', 'tijolo', 'madeira', 'areia', 'gelo', 'musgo', 'metal'];

const SYSTEM_PROMPT = `Voce e diretor de arte de um RPG de fantasia. Recebe a descricao de um LOCAL e devolve a identidade visual dele para um mapa 3D isometrico.

Responda APENAS com JSON valido, sem markdown, sem cercas de codigo, sem explicacao:
{"paleta":{"piso":"#rrggbb","parede":"#rrggbb","acento":"#rrggbb","ambiente":"#rrggbb"},"materiais":{"textura":"pedra|tijolo|madeira|areia|gelo|musgo|metal","rugosidade":0.0,"metalico":0.0},"atmosfera":{"luzCor":"#rrggbb","luzIntensidade":1.0,"nevoaDensidade":0.5}}

REGRAS DE LEGIBILIDADE (o mapa e visto de cima; ilegivel e pior que feio):
- "piso" e "parede" devem ser MEDIOS a CLAROS. Nunca mais escuros que #4a4a4a. Um local sombrio se expressa por MATIZ fria e nevoa, nao por escuridao.
- "parede" deve ser perceptivelmente mais escura que "piso", mas na mesma familia de cor.
- "ambiente" e o fundo da cena e a cor da nevoa: use um tom ESCURO e dessaturado, para a planta saltar dele.
- "acento" e usado em tochas, altares e bau: escolha uma cor VIVA que contraste com piso e parede.
- "luzIntensidade" entre 0.8 e 1.6. "rugosidade", "metalico" e "nevoaDensidade" entre 0 e 1.
- Metalico alto so faz sentido em local metalico de verdade; a maioria fica abaixo de 0.2.

Traduza a FICCAO em escolha visual: um templo submerso puxa verde-azulado com musgo; uma forja pede metal e laranja quente; uma cripta gelada pede azul palido e gelo.`;

function criarModelo() {
  const comum = { temperature: 0.7, maxRetries: 1 };
  if (PROVIDER === 'anthropic') {
    return new ChatAnthropic({ model: MODEL, apiKey: process.env.ANTHROPIC_API_KEY, ...comum });
  }
  if (PROVIDER === 'groq') {
    return new ChatGroq({ model: MODEL, apiKey: process.env.GROQ_API_KEY, ...comum });
  }
  return new ChatGoogleGenerativeAI({ model: MODEL, apiKey: process.env.GOOGLE_API_KEY, ...comum });
}

/**
 * Extrai o objeto JSON da resposta do LLM.
 * Mesmo instruido a devolver JSON cru, o modelo as vezes embrulha em cerca de
 * codigo ou acrescenta uma frase antes — recortar entre chaves cobre os dois.
 */
function extrairJson(texto) {
  const limpo = String(texto || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const inicio = limpo.indexOf('{');
  const fim = limpo.lastIndexOf('}');
  if (inicio === -1 || fim <= inicio) return null;
  try {
    return JSON.parse(limpo.slice(inicio, fim + 1));
  } catch {
    return null;
  }
}

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

function cor(valor) {
  return typeof valor === 'string' && HEX.test(valor.trim()) ? valor.trim().toLowerCase() : null;
}

function faixa(valor, min, max) {
  const n = typeof valor === 'number' ? valor : Number(valor);
  return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : null;
}

/**
 * Normaliza a resposta descartando campo invalido em vez do objeto inteiro.
 *
 * O frontend ja funde isto sobre o default do tipo campo a campo, entao uma
 * direcao parcial e util — e melhor entregar tres campos bons do que nada
 * porque o quarto veio errado. Devolve null so quando nao sobra nada.
 */
function normalizar(bruto) {
  if (!bruto || typeof bruto !== 'object') return null;

  const paleta = {};
  for (const chave of ['piso', 'parede', 'acento', 'ambiente']) {
    const c = cor(bruto.paleta?.[chave]);
    if (c) paleta[chave] = c;
  }

  const materiais = {};
  if (TEXTURAS.includes(bruto.materiais?.textura)) materiais.textura = bruto.materiais.textura;
  const rug = faixa(bruto.materiais?.rugosidade, 0, 1);
  if (rug !== null) materiais.rugosidade = rug;
  const met = faixa(bruto.materiais?.metalico, 0, 1);
  if (met !== null) materiais.metalico = met;

  const atmosfera = {};
  const luzCor = cor(bruto.atmosfera?.luzCor);
  if (luzCor) atmosfera.luzCor = luzCor;
  const intensidade = faixa(bruto.atmosfera?.luzIntensidade, 0.2, 3);
  if (intensidade !== null) atmosfera.luzIntensidade = intensidade;
  const nevoa = faixa(bruto.atmosfera?.nevoaDensidade, 0, 1);
  if (nevoa !== null) atmosfera.nevoaDensidade = nevoa;

  const saida = {};
  if (Object.keys(paleta).length) saida.paleta = paleta;
  if (Object.keys(materiais).length) saida.materiais = materiais;
  if (Object.keys(atmosfera).length) saida.atmosfera = atmosfera;

  return Object.keys(saida).length ? saida : null;
}

/**
 * Gera a direcao de arte de um local. Devolve null em qualquer falha — o mapa
 * cai no default do tipo e o usuario nao ve erro nenhum.
 */
export async function gerarDirecaoArte(entityData, userId) {
  const inicio = Date.now();
  try {
    const modelo = criarModelo();

    const mensagem = `Local: ${entityData?.nome || 'sem nome'}
Tipo: ${entityData?.tipo || 'outro'}
Descricao: ${String(entityData?.descricao || '').slice(0, 500)}
Estilo visual da campanha: ${entityData?.estilo_imagem || 'fantasy_painting'}

Devolva o JSON da direcao de arte:`;

    const resposta = await Promise.race([
      modelo.invoke([
        ['system', SYSTEM_PROMPT],
        ['human', mensagem],
      ]),
      new Promise((_, reject) => setTimeout(() => reject(new Error('DIRECAO_ARTE_TIMEOUT')), TIMEOUT_MS)),
    ]);

    trackLLMUsage(resposta, { modelName: MODEL, userId, startTime: inicio, agent: 'direcao-arte' });

    const direcao = normalizar(extrairJson(resposta.content));
    if (!direcao) {
      log.warn({ nome: entityData?.nome }, 'Direcao de arte invalida; mapa usara o default do tipo');
      return null;
    }

    log.info({ nome: entityData?.nome, campos: Object.keys(direcao) }, 'Direcao de arte gerada');
    return direcao;
  } catch (err) {
    log.warn({ err: err.message, nome: entityData?.nome }, 'Falha ao gerar direcao de arte');
    return null;
  }
}

export const _internos = { extrairJson, normalizar };
