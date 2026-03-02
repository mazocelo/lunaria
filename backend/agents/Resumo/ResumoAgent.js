import { ChatGroq } from '@langchain/groq';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Agente responsável por resumir aventuras de RPG
 * Condensa o histórico de mensagens para manter o contexto do Mestre eficiente
 */
export class ResumoAgent {
  constructor() {
    this.model = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3, // Baixa criatividade para resumo fiel
      maxTokens: 2000
    });
  }

  /**
   * Resumir a aventura até o momento
   * @param {Object} params - Parâmetros do resumo
   * @param {Array} params.mensagens - Array de mensagens da sessão
   * @param {Array<string>} params.temas - Temas da aventura
   * @param {Array} params.personagens - Personagens jogando
   * @param {number} params.rodadasJogadas - Número de rodadas jogadas
   * @returns {Promise<Object>} - Resumo gerado
   */
  async resumirAventura({ mensagens, temas, personagens, rodadasJogadas }) {
    try {
      const ultimasMensagens = mensagens.slice(-50); // Últimas 50 mensagens
      
      const prompt = `Você é um assistente que resume aventuras de RPG de forma concisa.

CONTEXTO:
- Temas: ${temas.join(', ')}
- Personagens: ${personagens.map(p => p.personagemNome || p.username || p.nome || p).join(', ')}
- Rodadas Jogadas: ${rodadasJogadas}
- Total de Mensagens: ${mensagens.length}

Crie um resumo MUITO CONCISO (máximo 300 palavras) cobrindo:
1. Principais eventos ocorridos
2. Decisões importantes dos jogadores
3. Situação/desafio atual
4. NPCs ou inimigos encontrados

ÚLTIMAS MENSAGENS (${ultimasMensagens.length}):
${ultimasMensagens.map(m => {
  const tipo = m.tipo || m.type || 'desconhecido';
  const autor = m.username || 'Sistema';
  const texto = (m.mensagem || m.message || '').substring(0, 150);
  return `[${tipo.toUpperCase()}] ${autor}: ${texto}`;
}).join('\n')}

RESUMO CONCISO:`;

      const response = await this.model.invoke(prompt);
      
      console.log('✅ ResumoAgent: Resumo gerado com sucesso');

      return {
        resumo: response.content,
        mensagensResumiadas: mensagens.length,
        rodadasResumiadas: rodadasJogadas,
        geradoEm: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ ResumoAgent: Erro ao gerar resumo:', error);
      throw new Error(`Erro ao gerar resumo: ${error.message}`);
    }
  }
}

export default new ResumoAgent(); // Singleton

