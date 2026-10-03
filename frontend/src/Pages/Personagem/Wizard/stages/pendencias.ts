// src/Pages/Personagem/Wizard/stages/pendencias.ts
export interface Pendencia { etapa: string; texto: string; }

interface Estado {
  sistema: string; nome: string; racaId: unknown; classeId: unknown; background: string;
  vantagensIds: unknown[]; desvantagensIds: unknown[]; skipVantagens: boolean; skipDesvantagens: boolean;
  bonusAplicados: boolean; comboPronto: boolean; pontosCriacaoRestantes: number;
  dndAbilitiesConfirmed: boolean; dndSkillsConfirmed: boolean;
}

/** Fonte única do "Antes de criar" (A37/L-22/L-23), na ordem em que o jogador deve resolver. */
export function listarPendencias(b: Estado): Pendencia[] {
  const p: Pendencia[] = [];
  const lunaria = b.sistema !== 'dnd5e';
  if (lunaria && b.pontosCriacaoRestantes < 0) p.push({ etapa: 'vantagens', texto: `Saldo negativo: remova ${-b.pontosCriacaoRestantes} pts em Vantagens` });
  if (!b.nome.trim()) p.push({ etapa: 'boas_vindas', texto: 'Nome: escolha um nome' });
  if (b.racaId == null) p.push({ etapa: 'raca', texto: 'Raça: escolha uma' });
  if (b.classeId == null) p.push({ etapa: 'classe', texto: 'Classe: escolha uma' });
  if (!b.background.trim()) p.push({ etapa: 'background', texto: lunaria ? 'Background: escreva a origem' : 'Antecedente: escreva a origem' });
  if (lunaria) {
    if (b.desvantagensIds.length === 0 && !b.skipDesvantagens) p.push({ etapa: 'desvantagens', texto: 'Desvantagens: escolha ou pule' });
    if (b.vantagensIds.length === 0 && !b.skipVantagens) p.push({ etapa: 'vantagens', texto: 'Vantagens: escolha ou pule' });
    if (!b.bonusAplicados) p.push({ etapa: 'atributos', texto: 'Atributos: confirme a distribuição' });
    if (!b.comboPronto) p.push({ etapa: 'equipamentos', texto: 'Equipamentos: o arsenal precisa ser montado' });
  } else {
    if (!b.dndAbilitiesConfirmed) p.push({ etapa: 'atributos', texto: 'Atributos: confirme a distribuição' });
    if (!b.dndSkillsConfirmed) p.push({ etapa: 'skills', texto: 'Perícias: confirme as escolhas' });
  }
  return p;
}
