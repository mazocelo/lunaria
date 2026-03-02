import { ChatGroq } from '@langchain/groq';
import { RunnableSequence } from '@langchain/core/runnables';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import dotenv from 'dotenv';

import { MESTRE_CONFIG } from './config.js';
import { criarPromptSistema } from './prompts/sistema.js';
import { criarPromptNarracao } from './prompts/narracao.js';
import { criarPromptInicio, criarPromptBoasVindas } from './prompts/inicio.js';
import { formatarMensagemJogador, formatarRespostaMestre, extrairInfoPersonagem } from './utils/formatacao.js';
import { converterHistoricoParaLangChain, adicionarMensagem } from './utils/historico.js';
import { extrairNomesTemas } from '../../helpers/temasHelper.js';

dotenv.config();

/**
 * Classe principal do Mestre de RPG
 * Gerencia toda a interação com o modelo de IA e o contexto da aventura
 */
export class MestreAgent {
  constructor(temas = [], personagens = [], configOverride = null) {
    // Garantir que temas sejam sempre strings (nomes)
    // Validação de segurança caso alguém passe IDs ou objetos por engano
    this.temas = extrairNomesTemas(temas);

    // Log de validação se necessário
    if (Array.isArray(temas) && temas.length > 0 && typeof temas[0] === 'number') {
      console.warn('⚠️ MestreAgent: Recebidos temas como IDs numéricos. Convertendo para nomes...');
    }

    this.personagens = personagens.map(p => extrairInfoPersonagem(p));
    this.configOverride = configOverride;
    this.historico = [];
    this.model = null;
    this.chain = null;

    this._inicializarModelo();
  }

  /**
   * Inicializa o modelo de IA e a chain
   */
  _inicializarModelo() {
    try {
      // Merge config customizada com defaults
      const modelName = this.configOverride?.modelo || MESTRE_CONFIG.model.name;
      const temperature = this.configOverride?.temperatura ?? MESTRE_CONFIG.model.temperature;
      const maxTokens = this.configOverride?.max_tokens ?? MESTRE_CONFIG.model.maxTokens;

      // Criar modelo Groq
      this.model = new ChatGroq({
        apiKey: process.env.GROQ_API_KEY,
        model: modelName,
        temperature,
        maxTokens,
        topP: MESTRE_CONFIG.model.topP
      });

      // Criar prompt template (com personalidade custom se houver)
      const promptSistema = criarPromptSistema(this.temas, this.personagens, this.configOverride);
      const prompt = ChatPromptTemplate.fromMessages([
        ['system', promptSistema],
        new MessagesPlaceholder('chat_history'),
        ['human', '{input}']
      ]);

      // Criar chain
      this.chain = RunnableSequence.from([
        {
          input: (input) => input.input,
          chat_history: (input) => input.chat_history || []
        },
        prompt,
        this.model
      ]);

      console.log('✅ MestreAgent: Modelo inicializado com sucesso');
    } catch (error) {
      console.error('❌ MestreAgent: Erro ao inicializar modelo:', error);
      throw error;
    }
  }

  /**
   * Narra uma ação do jogador
   */
  async narrarAcao({ jogador, personagem, acao, chatHistory = [], resumo = null }) {
    try {
      console.log(`🎭 MestreAgent: Narrando ação de ${personagem}...`);

      // Formatar input
      const input = criarPromptNarracao(jogador, personagem, acao);

      // Converter histórico
      let historico = converterHistoricoParaLangChain(chatHistory);

      // ✅ Se houver resumo, adicionar como contexto do sistema
      if (resumo) {
        console.log(`📖 MestreAgent: Usando resumo da aventura no contexto`);
        historico = [
          {
            role: 'system',
            content: `RESUMO DA AVENTURA ATÉ AGORA:\n${resumo}\n\nContinue a aventura considerando este contexto.`
          },
          ...historico.slice(-20) // Últimas 20 mensagens + resumo
        ];
      }

      // Invocar chain
      const response = await this.chain.invoke({
        input,
        chat_history: historico
      });

      // ✅ Parsear JSON da resposta
      let respostaJSON;
      try {
        respostaJSON = JSON.parse(response.content);
        console.log('✅ MestreAgent: Resposta JSON parseada com sucesso');
      } catch (error) {
        console.warn('⚠️ MestreAgent: Resposta não é JSON válido, usando fallback');
        // Fallback se não for JSON
        respostaJSON = {
          narrativa: response.content,
          fimDeTurno: false,
          solicitaDados: { solicita: false },
          acaoCompleta: false
        };
      }

      // Adicionar ao histórico local
      const mensagemJogador = formatarMensagemJogador(jogador, personagem, acao);
      this.historico = adicionarMensagem(this.historico, mensagemJogador);

      const respostaMestre = formatarRespostaMestre(respostaJSON.narrativa);
      this.historico = adicionarMensagem(this.historico, respostaMestre);

      console.log('✅ MestreAgent: Ação narrada com sucesso');

      return {
        narracao: respostaJSON.narrativa,
        fimDeTurno: respostaJSON.fimDeTurno || false,
        solicitaDados: respostaJSON.solicitaDados || { solicita: false },
        acaoCompleta: respostaJSON.acaoCompleta || false,
        jogador,
        personagem,
        acao,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ MestreAgent: Erro ao narrar ação:', error);
      throw new Error(`Erro ao narrar ação: ${error.message}`);
    }
  }

  /**
   * Inicia uma nova sessão com mensagem de boas-vindas
   */
  async iniciarSessao({ tema, personagens: personagensCustom, cenaInicial, historiaNome }) {
    try {
      console.log('🎮 MestreAgent: Iniciando nova sessão...');

      let input;
      
      if (historiaNome) {
        // Usar prompt de boas-vindas personalizado
        input = criarPromptBoasVindas(
          historiaNome,
          this.temas,
          personagensCustom || this.personagens
        );
      } else {
        // Usar prompt padrão de início
        input = criarPromptInicio(
          tema || this.temas.join(', '),
          personagensCustom || this.personagens,
          cenaInicial
        );
      }

      // Invocar chain sem histórico
      const response = await this.chain.invoke({
        input,
        chat_history: []
      });

      // ✅ Parsear JSON
      let respostaJSON;
      try {
        respostaJSON = JSON.parse(response.content);
      } catch (error) {
        console.warn('⚠️ Resposta iniciarSessao não é JSON, usando fallback');
        respostaJSON = {
          narrativa: response.content,
          fimDeTurno: false,
          solicitaDados: { solicita: false },
          acaoCompleta: false
        };
      }

      // Adicionar ao histórico
      const respostaMestre = formatarRespostaMestre(respostaJSON.narrativa, {
        tipo: 'inicio_sessao',
        tema: tema || this.temas.join(', ')
      });
      this.historico = [respostaMestre];

      console.log('✅ MestreAgent: Sessão iniciada com sucesso');

      return {
        introducao: respostaJSON.narrativa,
        tema: tema || this.temas.join(', '),
        personagens: personagensCustom || this.personagens,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ MestreAgent: Erro ao iniciar sessão:', error);
      throw new Error(`Erro ao iniciar sessão: ${error.message}`);
    }
  }

  /**
   * Processa uma resposta genérica do mestre
   */
  async processarResposta({ input, chatHistory = [] }) {
    try {
      console.log('💬 MestreAgent: Processando resposta...');

      const historico = converterHistoricoParaLangChain(chatHistory);

      const response = await this.chain.invoke({
        input,
        chat_history: historico
      });

      console.log('✅ MestreAgent: Resposta processada');

      return {
        resposta: response.content,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ MestreAgent: Erro ao processar resposta:', error);
      throw new Error(`Erro ao processar resposta: ${error.message}`);
    }
  }

  /**
   * Narrar turno do jogador (controla interação durante o turno)
   */
  async narrarTurnoJogador({ 
    jogador, 
    personagem, 
    mensagem, 
    rodada, 
    turno, 
    contadorMensagens = 0,
    chatHistory = [],
    resumo = null
  }) {
    try {
      console.log(`🎯 MestreAgent: Narrando turno ${turno} de ${personagem} (rodada ${rodada})...`);

      // Criar prompt específico para turno
      let input = `TURNO DO JOGADOR ${personagem} (Jogador: ${jogador})
Rodada: ${rodada} | Turno: ${turno} | Mensagem ${contadorMensagens + 1}/4

Mensagem do Jogador:
"${mensagem}"

`;

      // Se já houve 3 mensagens, avisar que é hora de finalizar
      if (contadorMensagens >= 3) {
        input += `\n⚠️ IMPORTANTE: Este é o limite de interações deste turno. Finalize a ação do jogador de forma conclusiva e sinalize "Próximo jogador!" para passar a vez.\n`;
      } else {
        input += `\nResponda à ação do jogador de forma dinâmica e envolvente. Você ainda tem ${4 - contadorMensagens - 1} resposta(s) disponíveis.\n\nSe a ação estiver completamente resolvida, você pode sinalizar "Próximo jogador!" para avançar antes do limite.\n`;
      }

      // Converter histórico
      let historico = converterHistoricoParaLangChain(chatHistory);

      // ✅ Se houver resumo, adicionar como contexto do sistema
      if (resumo) {
        console.log(`📖 MestreAgent: Usando resumo no turno`);
        historico = [
          {
            role: 'system',
            content: `RESUMO DA AVENTURA:\n${resumo}`
          },
          ...historico.slice(-15) // Últimas 15 mensagens + resumo
        ];
      }

      // Invocar chain
      const response = await this.chain.invoke({
        input,
        chat_history: historico
      });

      // ✅ Parsear JSON
      let respostaJSON;
      try {
        respostaJSON = JSON.parse(response.content);
      } catch (error) {
        console.warn('⚠️ Resposta narrarTurnoJogador não é JSON, usando fallback');
        respostaJSON = {
          narrativa: response.content,
          fimDeTurno: false,
          solicitaDados: { solicita: false },
          acaoCompleta: false
        };
      }

      // Determinar se deve finalizar o turno
      const deveFinalizarTurno = respostaJSON.fimDeTurno || contadorMensagens >= 3;

      console.log(`✅ MestreAgent: Turno narrado (deve finalizar: ${deveFinalizarTurno})`);

      return {
        resposta: respostaJSON.narrativa,
        fimDeTurno: respostaJSON.fimDeTurno || false,
        solicitaDados: respostaJSON.solicitaDados || { solicita: false },
        acaoCompleta: respostaJSON.acaoCompleta || false,
        deveFinalizarTurno,
        rodada,
        turno,
        jogador,
        personagem,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ MestreAgent: Erro ao narrar turno:', error);
      throw new Error(`Erro ao narrar turno: ${error.message}`);
    }
  }

  /**
   * Narrar entre rodadas (gerar novo desafio após todos jogarem)
   */
  async narrarEntreRodadas({ 
    rodadaAnterior, 
    proximaRodada, 
    resumoAcoes = [],
    chatHistory = [],
    resumo = null
  }) {
    try {
      console.log(`🔄 MestreAgent: Narrando transição da rodada ${rodadaAnterior} para ${proximaRodada}...`);

      // Criar resumo das ações da rodada anterior
      const resumoTexto = resumoAcoes.length > 0 
        ? `Resumo da Rodada ${rodadaAnterior}:\n${resumoAcoes.map((acao, idx) => `${idx + 1}. ${acao}`).join('\n')}`
        : `A rodada ${rodadaAnterior} foi concluída.`;

      // Criar prompt para entre rodadas
      const input = `FIM DA RODADA ${rodadaAnterior} - INÍCIO DA RODADA ${proximaRodada}

${resumoTexto}

Como Mestre, você deve:
1. Criar um NOVO DESAFIO ou situação interessante para a Rodada ${proximaRodada}
2. Manter a narrativa empolgante e dinâmica
3. Dar aos jogadores novos objetivos ou obstáculos
4. Conectar a nova situação com as ações da rodada anterior

Narre a transição e apresente o novo desafio:`;

      // Converter histórico
      let historico = converterHistoricoParaLangChain(chatHistory);

      // ✅ Se houver resumo, adicionar como contexto do sistema
      if (resumo) {
        console.log(`📖 MestreAgent: Usando resumo entre rodadas`);
        historico = [
          {
            role: 'system',
            content: `RESUMO DA AVENTURA:\n${resumo}`
          },
          ...historico.slice(-10) // Últimas 10 mensagens + resumo
        ];
      }

      // Invocar chain
      const response = await this.chain.invoke({
        input,
        chat_history: historico
      });

      // ✅ Parsear JSON
      let respostaJSON;
      try {
        respostaJSON = JSON.parse(response.content);
      } catch (error) {
        console.warn('⚠️ Resposta narrarEntreRodadas não é JSON, usando fallback');
        respostaJSON = {
          narrativa: response.content,
          fimDeTurno: false,
          solicitaDados: { solicita: false },
          acaoCompleta: false
        };
      }

      console.log(`✅ MestreAgent: Narrativa entre rodadas gerada`);

      return {
        narrativa: respostaJSON.narrativa,
        rodadaAnterior,
        proximaRodada,
        novoDesafio: respostaJSON.narrativa,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ MestreAgent: Erro ao narrar entre rodadas:', error);
      throw new Error(`Erro ao narrar entre rodadas: ${error.message}`);
    }
  }

  /**
   * Solicitar rolagem de dados dos jogadores
   */
  async solicitarRolagemDados({ 
    motivo, 
    tipoTeste = 'd20', 
    dificuldade = 'Média',
    jogadores = [],
    chatHistory = [] 
  }) {
    try {
      console.log(`🎲 MestreAgent: Solicitando rolagem - ${tipoTeste}`);

      const jogadoresTexto = jogadores.length > 0 
        ? jogadores.join(', ') 
        : 'todos os jogadores';

      const input = `SOLICITAÇÃO DE ROLAGEM DE DADOS

Motivo: ${motivo}
Tipo de Dado: ${tipoTeste}
Dificuldade: ${dificuldade}
Jogadores: ${jogadoresTexto}

Como Mestre, explique de forma BREVE e DRAMÁTICA:
- Por que essa rolagem é necessária agora
- O que está em jogo (sucesso vs falha)
- Como os jogadores devem proceder

Termine com "🎲 Rolem seus dados!"

Seja conciso (máximo 100 palavras).`;

      const historico = converterHistoricoParaLangChain(chatHistory);

      const response = await this.chain.invoke({
        input,
        chat_history: historico.slice(-10) // Só últimas 10 msgs
      });

      console.log('✅ MestreAgent: Solicitação de dados gerada');

      return {
        narrativa: response.content,
        tipoTeste,
        dificuldade,
        jogadores,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ MestreAgent: Erro ao solicitar dados:', error);
      throw new Error(`Erro ao solicitar dados: ${error.message}`);
    }
  }

  /**
   * Obtém o histórico atual
   */
  getHistorico() {
    return this.historico;
  }

  /**
   * Limpa o histórico
   */
  limparHistorico() {
    this.historico = [];
  }

  /**
   * Atualiza os temas da aventura
   */
  atualizarTemas(novosTemas) {
    this.temas = novosTemas;
    this._inicializarModelo(); // Reinicializar com novos temas
  }

  /**
   * Atualiza os personagens da aventura
   */
  atualizarPersonagens(novosPersonagens) {
    this.personagens = novosPersonagens.map(p => extrairInfoPersonagem(p));
    this._inicializarModelo(); // Reinicializar com novos personagens
  }
}

/**
 * Factory function para criar instância do Mestre
 */
export async function criarMestreRPG(temas = [], personagens = [], configOverride = null) {
  try {
    const mestre = new MestreAgent(temas, personagens, configOverride);
    return mestre;
  } catch (error) {
    console.error('❌ Erro ao criar mestre de RPG:', error);
    throw new Error(`Erro ao criar mestre de RPG: ${error.message}`);
  }
}

export default criarMestreRPG;

