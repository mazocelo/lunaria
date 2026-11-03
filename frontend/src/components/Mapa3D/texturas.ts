import * as THREE from 'three';
import { criarRng, hashSeed } from '../../mapEngine/rng';
import type { Textura } from './direcaoArte';

/**
 * Texturas procedurais desenhadas em canvas, em tempo de execucao.
 *
 * Por que procedural e nao arquivo de imagem: o artefato ja carrega 900KB de
 * three.js, e um atlas de texturas decentes somaria varios megabytes ao chunk.
 * Alem disso texturas hospedadas fora exigiriam CORS — o mesmo obstaculo que
 * impede usar a arte gerada pela IA como textura (o bucket R2 nao envia
 * `access-control-allow-origin`). Desenhar no cliente evita os dois problemas e
 * mantem o custo em alguns kilobytes de codigo.
 *
 * A geracao e deterministica (mesmo PRNG do motor de mapas), entao a mesma
 * combinacao de textura e cor produz sempre o mesmo bitmap.
 */

const TAMANHO = 256;

// Textura de three.js e recurso de GPU: recriar a cada render vazaria memoria
// rapidamente. A chave cobre tudo que altera o bitmap.
const cache = new Map<string, THREE.CanvasTexture>();
const LIMITE_CACHE = 48;

/** Escurece ou clareia um hex por um fator relativo. */
function ajustar(cor: string, fator: number): string {
  const c = new THREE.Color(cor);
  c.multiplyScalar(fator);
  return `#${c.getHexString()}`;
}

function desenhar(ctx: CanvasRenderingContext2D, textura: Textura, cor: string, seed: number): void {
  const rng = criarRng(seed);

  ctx.fillStyle = cor;
  ctx.fillRect(0, 0, TAMANHO, TAMANHO);

  const ruido = (quantidade: number, alpha: number, tamanhoMax: number) => {
    for (let i = 0; i < quantidade; i++) {
      const claro = rng.proximo() > 0.5;
      ctx.fillStyle = claro ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${alpha})`;
      const s = 1 + rng.proximo() * tamanhoMax;
      ctx.fillRect(rng.proximo() * TAMANHO, rng.proximo() * TAMANHO, s, s);
    }
  };

  switch (textura) {
    case 'tijolo': {
      const alturaFileira = 26;
      const larguraTijolo = 58;
      ctx.fillStyle = ajustar(cor, 0.4);
      ctx.fillRect(0, 0, TAMANHO, TAMANHO);
      for (let linha = 0, y = 0; y < TAMANHO; linha++, y += alturaFileira) {
        // Deslocamento alternado: sem ele a parede vira grade e denuncia o padrao.
        const offset = linha % 2 === 0 ? 0 : -larguraTijolo / 2;
        for (let x = offset; x < TAMANHO; x += larguraTijolo) {
          ctx.fillStyle = ajustar(cor, 0.8 + rng.proximo() * 0.62);
          ctx.fillRect(x + 3, y + 3, larguraTijolo - 6, alturaFileira - 6);
        }
      }
      ruido(700, 0.05, 2);
      break;
    }

    case 'madeira': {
      for (let x = 0; x < TAMANHO; x += 2) {
        const veio = 0.72 + Math.abs(Math.sin(x * 0.11 + rng.proximo() * 0.4)) * 0.58;
        ctx.fillStyle = ajustar(cor, veio);
        ctx.fillRect(x, 0, 2, TAMANHO);
      }
      // Nos da madeira.
      for (let i = 0; i < 5; i++) {
        const cx = rng.proximo() * TAMANHO;
        const cy = rng.proximo() * TAMANHO;
        for (let r = 10; r > 0; r -= 2) {
          ctx.strokeStyle = ajustar(cor, r % 4 === 0 ? 0.7 : 1.1);
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(cx, cy, r, r * 0.6, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      break;
    }

    case 'areia':
      ruido(9000, 0.11, 2.2);
      break;

    case 'gelo': {
      for (let i = 0; i < 26; i++) {
        ctx.strokeStyle = `rgba(255,255,255,${0.05 + rng.proximo() * 0.16})`;
        ctx.lineWidth = 1 + rng.proximo() * 2.5;
        ctx.beginPath();
        const x = rng.proximo() * TAMANHO;
        ctx.moveTo(x, 0);
        ctx.lineTo(x + (rng.proximo() - 0.5) * 90, TAMANHO);
        ctx.stroke();
      }
      ruido(1800, 0.04, 2);
      break;
    }

    case 'musgo': {
      ruido(2600, 0.13, 4);
      // Manchas de vegetacao por cima da base.
      for (let i = 0; i < 130; i++) {
        ctx.fillStyle = `rgba(58,102,44,${0.12 + rng.proximo() * 0.34})`;
        ctx.beginPath();
        ctx.arc(rng.proximo() * TAMANHO, rng.proximo() * TAMANHO, 3 + rng.proximo() * 13, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'metal': {
      for (let y = 0; y < TAMANHO; y += 1) {
        ctx.fillStyle = `rgba(255,255,255,${rng.proximo() * 0.05})`;
        ctx.fillRect(0, y, TAMANHO, 1);
      }
      for (let i = 0; i < 40; i++) {
        ctx.strokeStyle = `rgba(0,0,0,${0.03 + rng.proximo() * 0.06})`;
        ctx.lineWidth = 1;
        const y = rng.proximo() * TAMANHO;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(TAMANHO, y + (rng.proximo() - 0.5) * 6);
        ctx.stroke();
      }
      break;
    }

    case 'pedra':
    default: {
      // Alvenaria em fiadas irregulares. A argamassa escura vem PRIMEIRO e os
      // blocos claros por cima deixam uma folga: a aresta de alto contraste e o
      // que sobrevive quando a textura e reduzida a poucos pixels na tela.
      ctx.fillStyle = ajustar(cor, 0.42);
      ctx.fillRect(0, 0, TAMANHO, TAMANHO);

      const alturaFiada = 42;
      for (let y = 0; y < TAMANHO; y += alturaFiada) {
        let x = -rng.proximo() * 40;
        while (x < TAMANHO) {
          const w = 40 + rng.proximo() * 46;
          const h = alturaFiada - 5 - rng.proximo() * 5;
          ctx.fillStyle = ajustar(cor, 0.82 + rng.proximo() * 0.6);
          ctx.fillRect(x + 3, y + 3, w - 4, h);
          // Chanfro claro no topo: sugere volume mesmo sem relevo real.
          ctx.fillStyle = `rgba(255,255,255,${0.05 + rng.proximo() * 0.07})`;
          ctx.fillRect(x + 3, y + 3, w - 4, 3);
          x += w;
        }
      }
      ruido(900, 0.09, 2.5);
      break;
    }
  }
}

/**
 * Devolve (e memoriza) a textura para uma combinacao de padrao e cor.
 * `repeticoes` controla quantas vezes o bitmap se repete na superficie — o
 * chamador ajusta pelo tamanho real da sala para a escala nao esticar.
 */
export function obterTextura(textura: Textura, cor: string, repeticoes = 4): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;

  const chave = `${textura}|${cor}|${repeticoes}`;
  const emCache = cache.get(chave);
  if (emCache) return emCache;

  const canvas = document.createElement('canvas');
  canvas.width = TAMANHO;
  canvas.height = TAMANHO;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  desenhar(ctx, textura, cor, hashSeed(chave));

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeticoes, repeticoes);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;

  if (cache.size >= LIMITE_CACHE) {
    const maisAntiga = cache.keys().next().value;
    if (maisAntiga) {
      cache.get(maisAntiga)?.dispose();
      cache.delete(maisAntiga);
    }
  }
  cache.set(chave, tex);
  return tex;
}
