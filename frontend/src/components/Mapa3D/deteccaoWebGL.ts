/**
 * Deteccao de WebGL, isolada num modulo sem componentes para nao quebrar o
 * fast refresh do Vite (um arquivo com componentes deve exportar so componentes).
 *
 * O mapa e a unica parte do app que exige WebGL. Sem esta checagem, um navegador
 * antigo ou sem aceleracao grafica renderiza um canvas em branco e o usuario nao
 * descobre o motivo.
 */

let cache: boolean | null = null;

/** Detecta suporte a WebGL uma unica vez e memoriza o resultado. */
export function suportaWebGL(): boolean {
  if (cache !== null) return cache;
  if (typeof document === 'undefined') {
    cache = false;
    return cache;
  }
  try {
    const canvas = document.createElement('canvas');
    const ctx =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');
    cache = Boolean(ctx);
  } catch {
    // Alguns navegadores lancam em vez de devolver null quando WebGL esta
    // desativado por politica.
    cache = false;
  }
  return cache;
}
