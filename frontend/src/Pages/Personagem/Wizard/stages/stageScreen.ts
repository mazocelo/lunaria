// src/Pages/Personagem/Wizard/stages/stageScreen.ts
export type StageScreen =
  | 'nome' | 'catalogo-raca' | 'catalogo-classe' | 'background'
  | 'catalogo-desvantagem' | 'catalogo-vantagem' | 'atributos'
  | 'dnd-atributos' | 'dnd-pericias' | 'equipamentos' | 'grimorio' | 'resumo';

/** Tela de cada etapa de lunaria e dnd5e. 3D&T não passa por aqui (vai para TresDetFichaLivre). */
export function telaDaEtapa(etapaId: string, sistema: string): StageScreen {
  switch (etapaId) {
    case 'raca': return 'catalogo-raca';
    case 'classe': return 'catalogo-classe';
    case 'background': return 'background';
    case 'desvantagens': return 'catalogo-desvantagem';
    case 'vantagens': return 'catalogo-vantagem';
    case 'atributos': return sistema === 'dnd5e' ? 'dnd-atributos' : 'atributos';
    case 'skills': return 'dnd-pericias';
    case 'equipamentos': return 'equipamentos';
    case 'grimorio': return 'grimorio';
    case 'resumo': return 'resumo';
    // boas_vindas e id desconhecido (rascunho antigo) caem no Nome, a primeira etapa.
    default: return 'nome';
  }
}

export type AcaoRodape =
  | 'mestre' | 'local' | 'confirmar-atributos' | 'confirmar-dnd-atributos'
  | 'confirmar-dnd-pericias' | 'confirmar-grimorio' | 'criar';

export interface EstadoDoRodape {
  nome: string;
  racaId: number | string | null;
  classeId: number | string | null;
  background: string;
  vantagensIds: Array<number | string>;
  desvantagensIds: Array<number | string>;
  skipVantagens: boolean;
  skipDesvantagens: boolean;
  bonusAplicados: boolean;
  pontosRestantes: number;
  dndAbilitiesConfirmed: boolean;
  /** Quantos dos 6 atributos D&D já têm valor. */
  dndAtribuidos: number;
  dndSkillsConfirmed: boolean;
  dndPericiasEscolhidas: number;
  dndPericiasMax: number;
  comboPronto: boolean;
  comboCarregando: boolean;
  grimorioEscolhidas: number;
  grimorioErro: boolean;
  /** Lista "Antes de criar" (Task 16). Vazia = pode criar. */
  pendencias: string[];
}

export interface RegraRodape {
  /** O que o botão principal faz; a view traduz em chamada do modelo (Task 20). */
  acao: AcaoRodape;
  podeContinuar: boolean;
  /** Texto sob o botão quando desabilitado. */
  motivoBloqueio: string | null;
  /** null = "Continuar: {próxima etapa}". */
  rotulo: string | null;
  pular: 'vantagens' | 'desvantagens' | null;
}

const regra = (acao: AcaoRodape, ok: boolean, motivo: string, rotulo: string | null = null, pular: RegraRodape['pular'] = null): RegraRodape =>
  ({ acao, podeContinuar: ok, motivoBloqueio: ok ? null : motivo, rotulo, pular });

const pts = (n: number) => `${n} ${n === 1 ? 'pt' : 'pts'}`;

export function regraDoRodape(tela: StageScreen, s: EstadoDoRodape): RegraRodape {
  switch (tela) {
    case 'nome': return regra('mestre', Boolean(s.nome.trim()), 'Escreva o nome do herói');
    case 'catalogo-raca': return regra('mestre', s.racaId != null, 'Escolha uma raça');
    case 'catalogo-classe': return regra('mestre', s.classeId != null, 'Escolha uma classe');
    case 'background': return regra('mestre', Boolean(s.background.trim()), 'Escreva ou escolha um background');
    case 'catalogo-desvantagem':
      return regra('mestre', s.desvantagensIds.length > 0 || s.skipDesvantagens, 'Escolha uma desvantagem ou pule a etapa', null, 'desvantagens');
    case 'catalogo-vantagem':
      return regra('mestre', s.vantagensIds.length > 0 || s.skipVantagens, 'Escolha uma vantagem ou pule a etapa', null, 'vantagens');
    case 'atributos':
      if (s.bonusAplicados) return regra('mestre', true, '');
      // Um clique só (decisão do dono): o Continuar confirma a distribuição, espera o bônus e avança.
      return regra('confirmar-atributos', s.pontosRestantes === 0,
        s.pontosRestantes > 0 ? `Distribua mais ${pts(s.pontosRestantes)}` : `Retire ${pts(-s.pontosRestantes)}`);
    case 'dnd-atributos':
      if (s.dndAbilitiesConfirmed) return regra('local', true, '');
      return regra('confirmar-dnd-atributos', s.dndAtribuidos >= 6, `Atribua os ${6 - s.dndAtribuidos} valores restantes`, 'Confirmar atributos');
    case 'dnd-pericias': {
      if (s.dndSkillsConfirmed) return regra('local', true, '');
      const faltam = s.dndPericiasMax - s.dndPericiasEscolhidas;
      return regra('confirmar-dnd-pericias', faltam <= 0, `Escolha mais ${faltam} ${faltam === 1 ? 'perícia' : 'perícias'}`, 'Confirmar perícias');
    }
    case 'equipamentos':
      return regra('mestre', s.comboPronto && !s.comboCarregando,
        s.comboCarregando ? 'Montando o arsenal…' : 'O arsenal não carregou. Use "Tentar de novo" acima.');
    case 'grimorio':
      return regra('confirmar-grimorio', s.grimorioEscolhidas > 0 && !s.grimorioErro,
        s.grimorioErro ? 'O grimório não carregou. Use "Tentar de novo" acima.' : 'Escolha ao menos uma magia', 'Confirmar magias');
    case 'resumo': {
      const [primeira, ...resto] = s.pendencias;
      const motivo = primeira ? `Antes de criar: ${primeira}${resto.length ? ` (+${resto.length})` : ''}` : '';
      return regra('criar', s.pendencias.length === 0, motivo, `Criar ${s.nome.trim() || 'personagem'}`);
    }
  }
}
