function rolarDado(lados = 6) {
  return Math.floor(Math.random() * lados) + 1;
}

const MODIFICADORES_VANTAGENS = [
  { match: 'Aparência Inofensiva', dado: 1, multiplicador: 50 },
  { match: 'Boa Fama', dado: 1, multiplicador: 50 },
  { match: 'Genialidade', dado: 2, multiplicador: 100 },
  { match: 'Patrono', dado: 2, multiplicador: 100 },
  { match: 'Torcida', dado: 1, multiplicador: 10 },
];

const MODIFICADORES_DESVANTAGENS = [
  { match: 'Assombrado', dado: 1, multiplicador: -10 },
  { match: 'Maldição', dado: 1, multiplicador: -10 },
  { match: 'Código de Honra', dado: 1, multiplicador: -10 },
  { match: 'Clericato', dado: 1, multiplicador: -10 },
  { match: 'Paladino', dado: 1, multiplicador: -10 },
  { match: 'Inculto', dado: 1, multiplicador: -100 },
  { match: 'Insano', dado: 1, multiplicador: -50 },
  { match: 'Má Fama', dado: 1, multiplicador: -100 },
  { match: 'Monstruoso', dado: 1, multiplicador: -10 },
];

export function calcularDinheiroInicial(vantagens = [], desvantagens = []) {
  const nomes = vantagens.map(v => v.nome || '');

  const temRiqueza = nomes.some(n => n.toLowerCase().includes('riqueza'));
  if (temRiqueza) {
    return rolarDado(6) * 100_000_000;
  }

  let total = rolarDado(6) * 100;

  for (const mod of MODIFICADORES_VANTAGENS) {
    const encontrou = nomes.some(n => n.toLowerCase().includes(mod.match.toLowerCase()));
    if (encontrou) {
      let soma = 0;
      for (let i = 0; i < mod.dado; i++) soma += rolarDado(6);
      total += soma * mod.multiplicador;
    }
  }

  const pericias = vantagens.filter(v => v.tipo === 'pericia');
  for (const _ of pericias) {
    total += (rolarDado(6) + rolarDado(6)) * 100;
  }
  const especializacoes = vantagens.filter(v => v.tipo === 'especializacao');
  for (const _ of especializacoes) {
    total += rolarDado(6) * 50;
  }

  const nomesDesv = desvantagens.map(d => d.nome || '');
  for (const mod of MODIFICADORES_DESVANTAGENS) {
    const encontrou = nomesDesv.some(n => n.toLowerCase().includes(mod.match.toLowerCase()));
    if (encontrou) {
      let soma = 0;
      for (let i = 0; i < mod.dado; i++) soma += rolarDado(6);
      total += soma * mod.multiplicador;
    }
  }

  return total;
}

export function calcularPrecoVenda(preco) {
  return Math.floor(preco * 0.5);
}

export const LIMITES_EQUIP = {
  arma: 1,
  armadura: 1,
  acessorio: 2,
  consumivel: 0,
  pergaminho: 0,
};
