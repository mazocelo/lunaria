type GetParams = Record<string, unknown> | undefined | null;

/**
 * Serializa um objeto plano em querystring com `?` prefixado, ignorando
 * valores `undefined`/`null`. Retorna string vazia quando nao ha params.
 * Valores primitivos sao convertidos via `String()`; objetos sao ignorados
 * para evitar `[object Object]` na URL.
 */
const generateGETparams = (params: GetParams): string => {
  if (!params || Object.keys(params).length === 0) {
    return '';
  }

  const queryString = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === 'object') return;
    queryString.append(key, String(value));
  });

  const result = queryString.toString();
  return result ? `?${result}` : '';
};

export default generateGETparams;
