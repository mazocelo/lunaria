export type Amigo = {
  id?: number | string;
  amizadeId?: number | string;
  [key: string]: unknown;
};

export type Pendente = {
  id?: number | string;
  [key: string]: unknown;
};

export type Sugestao = {
  id?: number | string;
  [key: string]: unknown;
};

export type AmizadeState = {
  amigos: Amigo[];
  pendentes: Pendente[];
  sugestoes: Sugestao[];
  amigosCarregados: boolean;
  pendentesCarregados: boolean;
  sugestoesCarregadas: boolean;
  loading: boolean;
  error: string | null;
  lastLoadTime: number | null;
};

export const amizadeInitialStates: AmizadeState = {
  amigos: [],
  pendentes: [],
  sugestoes: [],
  amigosCarregados: false,
  pendentesCarregados: false,
  sugestoesCarregadas: false,
  loading: false,
  error: null,
  lastLoadTime: null,
};
