import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

const PROMPT = `Você é um game designer de RPG. O sistema Lunaria RPG mistura mecânicas de D&D 5e, 3D&T Alpha, Daemon e Tormenta RPG.

Atributos: Força, Constituição, Agilidade, Destreza, Inteligência, Carisma (base 10, mod = floor((attr-10)/2))
Dados de dano: d4, d6, d8, d10, d12, 2d6, 2d8 etc.
Tamanhos: minúsculo, pequeno, médio, grande, enorme, colossal

Para o monstro "Dretch" (demônio menor):
- Nível: 1-3
- Tipo: Demônio
- Na mitologia: demônio inferior do Abismo, fedorento, covarde, usado como bucha de canhão. Em outros cenários aparece como servo de deuses das trevas. Em Daemon seria um demônio de 1a ordem.

Gere stats balanceados para nível 1 considerando que um jogador nível 1 tem ~14 HP e atributos 10-14.

Retorne APENAS JSON válido:
{
  "forca": N, "constituicao": N, "agilidade": N, "destreza": N, "inteligencia": N, "carisma": N,
  "dano_base": "XdY",
  "tamanho": "pequeno",
  "perfil": { "for_tier": "-/N/+/++/+++", "con_tier": "...", "agi_tier": "...", "dex_tier": "..." },
  "habilidades": [
    { "nome": "...", "tipo": "ofensiva/defensiva/suporte", "dano": "XdY ou null", "efeito": "descrição mecânica curta", "chance": 0-100, "cooldown": turnos }
  ],
  "resistencias": { "elemento": multiplicador },
  "imunidades": [],
  "xp_sugerido": N,
  "justificativa": "2-3 linhas misturando referências de D&D, 3D&T, Daemon e Tormenta"
}`;

const model = new ChatGoogleGenerativeAI({
  model: 'gemini-3.1-pro-preview',
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0.3
});

const res = await model.invoke(PROMPT);
console.log(res.content);
