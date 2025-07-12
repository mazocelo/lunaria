# Role Chat Game API

API para gerenciamento de histórias e sessões de RPG com IA.

## Documentação da API

A documentação completa da API está disponível através do Swagger UI em:

**http://localhost:3000/api-docs**

### Como acessar a documentação

1. Inicie o servidor:
   ```bash
   npm start
   # ou
   npm run dev
   ```

2. Acesse a documentação no navegador:
   ```
   http://localhost:3000/api-docs
   ```

## Endpoints Principais

### Histórias (`/historias`)

- `POST /historias/nova` - Criar nova história
- `GET /historias` - Listar histórias
- `GET /historias/:id` - Obter história específica
- `PUT /historias/:id` - Atualizar história
- `DELETE /historias/:id` - Excluir história

### Geração com IA

- `POST /historias/gerar-ia` - Gerar história com IA
- `POST /historias/gerar-aventura-completa` - Gerar aventura completa

**Nota:** A rota `POST /historias/nova` agora gera automaticamente um prólogo para cada história criada.

### Sessões de RPG

- `POST /sessoes/:historiaId/iniciar` - Iniciar sessão
- `GET /sessoes/:salaId` - Obter sessão
- `POST /sessoes/:salaId/mensagem` - Adicionar mensagem
- `PUT /sessoes/:salaId/estado` - Atualizar estado do jogo
- `POST /sessoes/:salaId/jogador` - Adicionar jogador
- `DELETE /sessoes/:salaId/jogador/:nomeJogador` - Remover jogador
- `POST /sessoes/:salaId/finalizar` - Finalizar sessão
- `POST /sessoes/:salaId/renovar` - Renovar TTL da sessão
- `GET /sessoes/:salaId/estatisticas` - Obter estatísticas
- `GET /sessoes` - Listar sessões ativas

### RPG em Tempo Real (`/rpg`)

- `POST /rpg/acao` - Enviar ação do jogador
- `POST /rpg/rolagem` - Enviar resultado de rolagem

### Temas (`/temas`)

- `GET /temas` - Listar temas disponíveis

### WebSocket (`/websocket`)

- `GET /websocket/stats` - Obter estatísticas do WebSocket
- `POST /websocket/broadcast` - Enviar mensagem broadcast
- `POST /websocket/room/{roomId}/message` - Enviar mensagem para sala
- `POST /websocket/user/{userId}/message` - Enviar mensagem para usuário

**Nota:** Para comunicação em tempo real, use o WebSocket. Veja a documentação completa em `README-WebSocket.md`.

### Habilidades (`/habilidades`)

- `POST /habilidades` - Criar nova habilidade
- `GET /habilidades` - Listar habilidades
- `GET /habilidades/{id}` - Obter habilidade específica
- `PUT /habilidades/{id}` - Atualizar habilidade
- `DELETE /habilidades/{id}` - Excluir habilidade
- `GET /habilidades/elemento/{elemento}` - Listar por elemento
- `GET /habilidades/tipo/{tipo}` - Listar por tipo
- `GET /habilidades/nivel/{nivel}` - Listar por nível
- `GET /habilidades/buscar?termo=...` - Buscar habilidades
- `GET /habilidades/estatisticas` - Obter estatísticas

## Exemplos de Uso

Para testar a API, use a documentação Swagger em `http://localhost:3000/api-docs` que permite testar todos os endpoints diretamente no navegador.

## Schemas

### História

```json
{
  "id": 1,
  "nome": "Aventura na Floresta",
  "tema": "fantasia",
  "descricao": "Uma aventura épica...",
  "genero": "fantasia",
  "maximo_de_participantes": 5,
  "status": "ativa",
  "criada_em": "2024-01-01T00:00:00.000Z",
  "atualizada_em": "2024-01-01T00:00:00.000Z"
}
```

### Sessão

```json
{
  "id": "sessao_123",
  "historia_id": 1,
  "status": "ativa",
  "criada_em": "2024-01-01T00:00:00.000Z"
}
```

### Ação RPG

```json
{
  "mensagem": "Vou investigar a caverna",
  "jogadorId": 1,
  "salaId": "sala_123"
}
```

### Rolagem

```json
{
  "resultado": 17,
  "tipo": "1d20",
  "descricao": "Teste de percepção"
}
```

### Habilidade

```json
{
  "id": 1,
  "nome": "Bola de Fogo",
  "descricao": "Lança uma bola de fogo que causa dano mágico aos inimigos",
  "custo": 25,
  "tipo": ["ativa"],
  "bonus": {
    "ataque_magico": "+3",
    "dano_fogo": "+2d6"
  },
  "restricao": {
    "concentracao": true,
    "gestos": true
  },
  "dano_base": "8d6",
  "efeito": {
    "area": "raio_6m",
    "tipo_dano": "fogo",
    "salvacao": "reflexos"
  },
  "usar": 1,
  "elemento": ["fogo"],
  "nivel": 5,
  "requisitos": {
    "inteligencia": 16,
    "proficiencia": "magia_arcana"
  },
  "criada_em": "2024-01-01T00:00:00.000Z",
  "atualizada_em": "2024-01-01T00:00:00.000Z"
}
```

## Códigos de Status

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Dados inválidos
- `404` - Não encontrado
- `500` - Erro interno do servidor

## Desenvolvimento

Para desenvolvimento local:

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Configure as variáveis de ambiente:
   ```bash
   cp env.example .env
   # Edite o arquivo .env com suas configurações
   ```

3. Configure o banco de dados:
   ```bash
   # Verifique se o PostgreSQL está rodando
   npm run check-db
   
   # Se houver problemas, siga as instruções exibidas
   ```

4. Inicie o servidor:
   ```bash
   npm run dev
   ```

5. Acesse a documentação:
   ```
   http://localhost:3000/api-docs
   ```

### Solução de Problemas

**Erro de conexão com banco de dados:**

1. **Verifique se o PostgreSQL está rodando:**
   - Windows: `net start postgresql-x64-15`
   - Linux/Mac: `sudo service postgresql start`

2. **Crie o banco de dados:**
   ```bash
   createdb role_chat_game
   ```

3. **Verifique a configuração no .env:**
   ```
   DATABASE_URL=postgresql://localhost:5432/role_chat_game
   ```

4. **Execute o script de verificação:**
   ```bash
   npm run check-db
   ```

## Tecnologias Utilizadas

- **Express.js** - Framework web
- **Sequelize** - ORM para banco de dados
- **PostgreSQL** - Banco de dados
- **Redis** - Cache e sessões
- **LangChain** - Integração com IA
- **Swagger** - Documentação da API 