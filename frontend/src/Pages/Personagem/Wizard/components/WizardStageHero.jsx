import React from 'react';

const STAGE_COPY = {
  boas_vindas: {
    title: 'Batize a centelha do heroi',
    description: 'Escolha um nome que abra caminho para o resto da identidade do personagem.',
    action: 'Defina como ele sera lembrado no mundo.'
  },
  raca: {
    title: 'Sele a linhagem',
    description: 'A linhagem define imaginario, afinidades e o primeiro impacto da ficha.',
    action: 'Escolha a origem que sustenta a fantasia base.'
  },
  classe: {
    title: 'Forje a vocacao',
    description: 'A vocacao define papel tatico, ritmo e como esse personagem atua em cena.',
    action: 'Escolha a funcao principal antes dos refinamentos.'
  },
  background: {
    title: 'Amarre a origem',
    description: 'Agora a ficha precisa de um passado que explique as marcas e ambicoes do heroi.',
    action: 'Escreva uma origem curta ou refine uma sugestao do Mestre.'
  },
  vantagens: {
    title: 'Escolha os dons',
    description: 'Os dons ampliam recursos, reputacao e versatilidade mecanica.',
    action: 'Adicione apenas o que reforca o conceito do personagem.'
  },
  desvantagens: {
    title: 'Aceite as marcas',
    description: 'Marcas bem escolhidas devolvem pontos e criam conflitos memoraveis.',
    action: 'Assuma custos que voce realmente queira interpretar.'
  },
  atributos: {
    title: 'Calibre a essencia',
    description: 'Aqui a ficha deixa de ser conceito e passa a ter proporcao mecanica real.',
    action: 'Distribua os pontos base e confirme a leitura final.'
  },
  resumo: {
    title: 'Revise o destino',
    description: 'Confirme se identidade, custo e atributos contam a mesma historia.',
    action: 'Ajuste o necessario antes de selar a ficha.'
  },
  refinamento: {
    title: 'Feche os ultimos ajustes',
    description: 'Ultima checagem ritual antes do personagem entrar no mundo.',
    action: 'Se tudo estiver consistente, conclua a criacao.'
  }
};

const WizardStageHero = ({
  etapas,
  etapaAtual,
  etapaIndex,
  isLight,
  embedded = false,
}) => {
  const copy = STAGE_COPY[etapaAtual] || STAGE_COPY.boas_vindas;

  return (
    <section className={`wa-stage-enter shrink-0 ${embedded ? '' : 'px-4 pt-3 md:px-5'}`}>
      <div className={`flex items-center gap-3 ${embedded ? 'px-5 py-2.5 md:px-6' : 'wa-hero wa-etched rounded-[24px] px-4 py-3 md:px-5'}`}>
        <h2 className={`shrink-0 text-base font-fantasy font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
          {copy.title}
        </h2>
        <span className={`hidden sm:inline text-xs font-modern ${isLight ? 'text-slate-400' : 'text-[var(--wa-muted)]'}`}>—</span>
        <p className={`hidden sm:block min-w-0 truncate text-xs font-modern ${isLight ? 'text-slate-500' : 'text-[var(--wa-muted)]'}`}>
          {copy.description}
        </p>
      </div>
    </section>
  );
};

export default WizardStageHero;
