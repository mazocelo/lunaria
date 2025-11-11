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

dotenv.config();

/**
 * Classe principal do Mestre de RPG
 * Gerencia toda a interação com o modelo de IA e o contexto da aventura
 */
export class MestreAgent {
  constructor(temas = [], personagens = []) {
    this.temas = temas;
    this.personagens = personagens.map(p => extrairInfoPersonagem(p));
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
      // Criar modelo Groq
      this.model = new ChatGroq({
        apiKey: process.env.GROQ_API_KEY,
        model: MESTRE_CONFIG.model.name,
        temperature: MESTRE_CONFIG.model.temperature,
        maxTokens: MESTRE_CONFIG.model.maxTokens,
        topP: MESTRE_CONFIG.model.topP
      });

      // Criar prompt template
      const promptSistema = criarPromptSistema(this.temas, this.personagens);
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
  async narrarAcao({ jogador, personagem, acao, chatHistory = [] }) {
    try {
      console.log(`🎭 MestreAgent: Narrando ação de ${personagem}...`);

      // Formatar input
      const input = criarPromptNarracao(jogador, personagem, acao);

      // Converter histórico
      const historico = converterHistoricoParaLangChain(chatHistory);

      // Invocar chain
      const response = await this.chain.invoke({
        input,
        chat_history: historico
      });

      // Adicionar ao histórico local
      const mensagemJogador = formatarMensagemJogador(jogador, personagem, acao);
      this.historico = adicionarMensagem(this.historico, mensagemJogador);

      const respostaMestre = formatarRespostaMestre(response.content);
      this.historico = adicionarMensagem(this.historico, respostaMestre);

      console.log('✅ MestreAgent: Ação narrada com sucesso');

      return {
        narracao: response.content,
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

      // Adicionar ao histórico
      const respostaMestre = formatarRespostaMestre(response.content, {
        tipo: 'inicio_sessao',
        tema: tema || this.temas.join(', ')
      });
      this.historico = [respostaMestre];

      console.log('✅ MestreAgent: Sessão iniciada com sucesso');

      return {
        introducao: response.content,
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
    chatHistory = [] 
  }) {
    try {
      console.log(`🎯 MestreAgent: Narrando turno ${turno} de ${personagem} (rodada ${rodada})...`);

      // Criar prompt específico para turno
      let input = `TURNO DO JOGADOR ${personagem} (Jogador: ${jogador})
Rodada: ${rodada} | Turno: ${turno} | Mensagem ${contadorMensagens + 1}/3

Mensagem do Jogador:
"${mensagem}"

`;

      // Se já houve 2 mensagens, avisar que é hora de finalizar
      if (contadorMensagens >= 2) {
        input += `\n⚠️ IMPORTANTE: Este é o limite de interações deste turno. Finalize a ação do jogador de forma conclusiva e prepare para passar para o próximo jogador.\n`;
      } else {
        input += `\nResponda à ação do jogador de forma dinâmica e envolvente. Você pode fazer até ${3 - contadorMensagens - 1} resposta(s) adicionais antes de finalizar o turno.\n`;
      }

      // Converter histórico
      const historico = converterHistoricoParaLangChain(chatHistory);

      // Invocar chain
      const response = await this.chain.invoke({
        input,
        chat_history: historico
      });

      // Determinar se deve finalizar o turno
      const deveFinalizarTurno = contadorMensagens >= 2;

      console.log(`✅ MestreAgent: Turno narrado (deve finalizar: ${deveFinalizarTurno})`);

      return {
        resposta: response.content,
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
    chatHistory = [] 
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
      const historico = converterHistoricoParaLangChain(chatHistory);

      // Invocar chain
      const response = await this.chain.invoke({
        input,
        chat_history: historico
      });

      console.log(`✅ MestreAgent: Narrativa entre rodadas gerada`);

      return {
        narrativa: response.content,
        rodadaAnterior,
        proximaRodada,
        novoDesafio: response.content,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ MestreAgent: Erro ao narrar entre rodadas:', error);
      throw new Error(`Erro ao narrar entre rodadas: ${error.message}`);
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
export async function criarMestreRPG(temas = [], personagens = []) {
  try {
    const mestre = new MestreAgent(temas, personagens);
    return mestre;
  } catch (error) {
    console.error('❌ Erro ao criar mestre de RPG:', error);
    throw new Error(`Erro ao criar mestre de RPG: ${error.message}`);
  }
}

export default criarMestreRPG;

