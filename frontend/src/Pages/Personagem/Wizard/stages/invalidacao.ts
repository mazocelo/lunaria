// src/Pages/Personagem/Wizard/stages/invalidacao.ts
export interface Escolhas {
  racaId: number | string | null;
  classeId: number | string | null;
  vantagensIds: Array<number | string>;
  desvantagensIds: Array<number | string>;
}
export interface Feitos {
  bonusAplicados: boolean;
  comboPronto: boolean;
  grimorioSelecionado: boolean;
  dndAbilitiesConfirmed: boolean;
  dndSkillsConfirmed: boolean;
  /** A raça D&D (nova ou antiga) concede bônus de atributo (Task 15). */
  racaDaBonusDnd: boolean;
}

const mesmaLista = (a: Array<number | string>, b: Array<number | string>) =>
  a.length === b.length && a.every((x, i) => String(x) === String(b[i]));

/** Etapas já concluídas que uma troca de escolha obriga a refazer (A19, A20, A21). */
export function etapasAfetadas(antes: Escolhas, depois: Escolhas, f: Feitos, sistema: string): string[] {
  const raca = String(antes.racaId) !== String(depois.racaId);
  const classe = String(antes.classeId) !== String(depois.classeId);
  const tracos = !mesmaLista(antes.vantagensIds, depois.vantagensIds) || !mesmaLista(antes.desvantagensIds, depois.desvantagensIds);
  if (sistema === 'dnd5e') {
    const out: string[] = [];
    if (raca && f.racaDaBonusDnd && f.dndAbilitiesConfirmed) out.push('atributos');
    if (classe && f.dndSkillsConfirmed) out.push('skills');
    return out;
  }
  if (!raca && !classe && !tracos) return [];
  const out: string[] = [];
  if (f.bonusAplicados) out.push('atributos');
  if (f.comboPronto) out.push('equipamentos');
  if (classe && f.grimorioSelecionado) out.push('grimorio');
  return out;
}
