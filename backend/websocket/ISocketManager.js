/**
 * @fileoverview Interface formal do SocketManager para uso nos engines.
 *
 * Este arquivo documenta o contrato público que os engines (combatEngine,
 * testEngine, turnEngine, roomGateway, sessionEngine, masterNarrationEngine)
 * recebem via parâmetro `sm` no construtor.
 *
 * Uso nos engines:
 *   @param {import('./ISocketManager').SocketManagerInterface} sm
 */

/**
 * @typedef {Object} SocketManagerInterface
 *
 * === Emissão de eventos ===
 * @property {(roomId: string, event: string, data: object) => void} sendToRoom
 *   Broadcast de evento para todos os sockets de uma sala.
 *
 * @property {(userId: string|number, event: string, data: object) => void} sendToUser
 *   Envio direto de evento para um usuário específico.
 *
 * @property {(roomId: string, sessao: object) => void} emitirEstadoTurno
 *   Emite `turno_estado_atualizado` com payload canônico para a sala.
 *
 * @property {(roomId: string, sessao: object, payload: object) => void} emitirAcaoMestrePersistida
 *   Cria mensagem de ação do mestre, persiste na sessão e emite `acao_mestre`.
 *
 * @property {(salaId: string, fase: string, dadosAdicionais?: object) => void} notificarMudancaFase
 *   Notifica mudança de fase do jogo via eventBus.
 *
 * @property {(salaId: string, dados: object) => void} notificarInicioAventura
 *   Notifica início de aventura via eventBus.
 *
 * === Construção de mensagens ===
 * @property {(conteudo: string, mestreConfig?: object, options?: object) => object} buildMestreMensagem
 *   Cria objeto de mensagem do mestre com campos de áudio vinculados.
 *
 * @property {(conteudo: string, mestreConfig?: object, options?: object) => object} criarMensagemMestre
 *   Alias para buildMestreMensagem — usado por turnEngine e testEngine.
 *
 * === Sessão e estado ===
 * @property {(salaId: string) => Promise<object|null>} obterSessaoHistoria
 *   Obtém sessão do Redis para uma sala. Delegate → sessionEngine.
 *
 * @property {(salaId: string, temas: string[], sessao: object, userId?: string|number) => Promise<object>} obterMestre
 *   Obtém ou cria instância do mestre IA para a sala. Delegate → sessionEngine.
 *
 * @property {(salaId: string, recapData?: object) => Promise<void>} limparSessaoCompleta
 *   Limpa todos os dados de sessão (Redis + timers + cache). Delegate → sessionEngine.
 *
 * @property {(roomId: string, sessao: object, options?: object) => Promise<void>} executarCompactacaoSeNecessaria
 *   Compacta histórico de mensagens se necessário. Delegate → sessionEngine.
 *
 * @property {(roomId: string, sessao: object, metadados: object) => object} aplicarMetadadosNarrativos
 *   Aplica metadados narrativos à sessão (temas, NPCs, locais).
 *
 * === Concorrência e persistência ===
 * @property {(roomId: string, fn: () => Promise<any>) => Promise<any>} withRoomLock
 *   Mutex por sala — garante uma operação por vez. Timeout 15s.
 *
 * @property {(roomId: string, sessao: object, force?: boolean) => void} _tentarSnapshot
 *   Snapshot periódico (fire-and-forget). A cada 10 mensagens ou forçado.
 *
 * === Cache ===
 * @property {(salaId: string, rodadaAtual: number) => void} invalidarMestreSeNecessario
 *   Invalida cache do mestre se a rodada mudou. Delegate → masterCacheManager.
 *
 * === Combate ===
 * @property {(roomId: string, combateData: object, sessao: object, userId: string|number) => Promise<void>} iniciarCombate
 *   Inicia combate. Delegate → combatEngine.
 *
 * === Observabilidade ===
 * @property {(level: string, event: string, socketId?: string, userId?: string|number, data?: object) => void} log
 *   Log estruturado via pino. Levels: INFO, WARN, ERROR, SUCCESS, DEBUG.
 *
 * === Propriedades acessíveis ===
 * @property {Map<string|number, import('socket.io').Socket>} connectedUsers
 *   Mapa userId → socket de usuários conectados.
 *
 * @property {Map<string, Set<string|number>>} roomUsers
 *   Mapa roomId → Set de userIds na sala.
 *
 * @property {import('socket.io').Server} io
 *   Instância do servidor Socket.IO.
 *
 * @property {import('./sessionEventBus.js').default} eventBus
 *   Barramento de eventos de sessão.
 *
 * @property {import('../redis/sessoes.js').default} gerenciadorSessoes
 *   Gerenciador de sessões Redis.
 */

export {};
