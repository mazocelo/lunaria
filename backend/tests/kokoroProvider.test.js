import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import KokoroProvider from '../services/tts/kokoroProvider.js';

/**
 * Testes do provider Kokoro sem tocar a rede.
 *
 * O `_getClient()` do provider so cria o InferenceClient se `this.client` ainda
 * for nulo, entao injetar um dublê ali cobre `generateSpeech` inteiro — incluindo
 * quais parametros chegam a HuggingFace — sem chamar a API nem gastar cota.
 */

const TOKEN_ORIGINAL = process.env.HF_TOKEN;

function comToken() {
  process.env.HF_TOKEN = 'token-de-teste';
  return new KokoroProvider();
}

/** Dublê do SDK: devolve um Blob, como o cliente real. */
function dubla(provider, { bytes = [1, 2, 3], capturar } = {}) {
  provider.client = {
    textToSpeech: async (args) => {
      capturar?.(args);
      return new Blob([new Uint8Array(bytes)]);
    },
  };
}

beforeEach(() => {
  delete process.env.HF_TOKEN;
});

afterEach(() => {
  if (TOKEN_ORIGINAL === undefined) delete process.env.HF_TOKEN;
  else process.env.HF_TOKEN = TOKEN_ORIGINAL;
});

describe('KokoroProvider — configuracao', () => {
  it('nao fica configurado sem HF_TOKEN', () => {
    expect(new KokoroProvider().isConfigured()).toBe(false);
  });

  it('fica configurado com HF_TOKEN', () => {
    expect(comToken().isConfigured()).toBe(true);
  });

  it('declara WAV e voz padrao em portugues', () => {
    const p = comToken();
    expect(p.getContentType()).toBe('audio/wav');
    expect(p.getDefaultVoiceId()).toBe('pf_dora');
  });

  it('respeita KOKORO_DEFAULT_VOICE_ID', () => {
    process.env.KOKORO_DEFAULT_VOICE_ID = 'am_michael';
    expect(new KokoroProvider().getDefaultVoiceId()).toBe('am_michael');
    delete process.env.KOKORO_DEFAULT_VOICE_ID;
  });
});

describe('KokoroProvider — catalogo de vozes', () => {
  it('devolve vozes no formato dos demais providers', async () => {
    const vozes = await comToken().listVoices();
    expect(vozes.length).toBeGreaterThan(0);
    for (const v of vozes) {
      expect(typeof v.voice_id).toBe('string');
      expect(typeof v.name).toBe('string');
      expect(v.labels).toBeTypeOf('object');
    }
  });

  it('lista vozes em portugues, que e o idioma do jogo', async () => {
    const vozes = await comToken().listVoices();
    expect(vozes.some((v) => v.labels.idioma === 'pt-BR')).toBe(true);
  });

  it('nao vaza o catalogo interno para o chamador', async () => {
    const p = comToken();
    const primeira = await p.listVoices();
    primeira[0].name = 'mutado';
    const segunda = await p.listVoices();
    expect(segunda[0].name).not.toBe('mutado');
  });
});

describe('KokoroProvider — generateSpeech', () => {
  it('recusa sem token, sem chamar a API', async () => {
    await expect(new KokoroProvider().generateSpeech('oi', 'pf_dora')).rejects.toThrow(/HF_TOKEN/);
  });

  it('recusa texto vazio ou so espacos', async () => {
    const p = comToken();
    dubla(p);
    await expect(p.generateSpeech('', 'pf_dora')).rejects.toThrow(/vazio/i);
    await expect(p.generateSpeech('   ', 'pf_dora')).rejects.toThrow(/vazio/i);
  });

  it('devolve Buffer, nao Blob — e o que o resto do pipeline espera', async () => {
    const p = comToken();
    dubla(p, { bytes: [10, 20, 30, 40] });
    const saida = await p.generateSpeech('teste', 'pf_dora');
    expect(Buffer.isBuffer(saida)).toBe(true);
    expect(saida.length).toBe(4);
  });

  it('repassa modelo, provedor e voz para a HuggingFace', async () => {
    const p = comToken();
    let recebido = null;
    dubla(p, { capturar: (a) => { recebido = a; } });
    await p.generateSpeech('O templo range.', 'pm_alex');

    expect(recebido.model).toBe('hexgrad/Kokoro-82M');
    expect(recebido.provider).toBe('fal-ai');
    expect(recebido.inputs).toBe('O templo range.');
    expect(recebido.parameters.voice).toBe('pm_alex');
  });

  it('cai na voz padrao quando a voz nao existe no catalogo', async () => {
    // Uma voz salva no perfil pode ter sumido; melhor narrar com outra voz do
    // que quebrar a narracao.
    const p = comToken();
    let recebido = null;
    dubla(p, { capturar: (a) => { recebido = a; } });
    await p.generateSpeech('texto', 'voz_que_nao_existe');
    expect(recebido.parameters.voice).toBe('pf_dora');
  });

  it('trata audio vazio como erro em vez de devolver buffer zerado', async () => {
    const p = comToken();
    dubla(p, { bytes: [] });
    await expect(p.generateSpeech('texto', 'pf_dora')).rejects.toThrow(/vazio/i);
  });
});
