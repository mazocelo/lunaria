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

### Vantagens (`/vantagens`)

- `POST /vantagens` - Criar nova vantagem
- `GET /vantagens` - Listar vantagens
- `GET /vantagens/{id}` - Obter vantagem específica
- `PUT /vantagens/{id}` - Atualizar vantagem
- `DELETE /vantagens/{id}` - Excluir vantagem
- `GET /vantagens/elemento/{elemento}` - Listar por elemento
- `GET /vantagens/tipo/{tipo}` - Listar por tipo
- `GET /vantagens/nivel/{nivel}` - Listar por nível
- `GET /vantagens/buscar?termo=...` - Buscar vantagens
- `GET /vantagens/estatisticas` - Obter estatísticas

### Desvantagens (`/desvantagens`)

- `POST /desvantagens` - Criar nova desvantagem
- `GET /desvantagens` - Listar desvantagens
- `GET /desvantagens/{id}` - Obter desvantagem específica
- `PUT /desvantagens/{id}` - Atualizar desvantagem
- `DELETE /desvantagens/{id}` - Excluir desvantagem
- `GET /desvantagens/elemento/{elemento}` - Listar por elemento
- `GET /desvantagens/tipo/{tipo}` - Listar por tipo
- `GET /desvantagens/nivel/{nivel}` - Listar por nível
- `GET /desvantagens/buscar?termo=...` - Buscar desvantagens
- `GET /desvantagens/estatisticas` - Obter estatísticas



### Personagens (`/personagens`)

- `POST /personagens` - Criar novo personagem
- `GET /personagens` - Listar personagens
- `GET /personagens/:id` - Obter personagem específico
- `PUT /personagens/:id` - Atualizar personagem
- `DELETE /personagens/:id` - Excluir personagem
- `POST /personagens/:id/gerar-background` - Gerar background para personagem
- `GET /historias/:historia_id/personagens` - Listar personagens por história

**Nota:** Ao criar um personagem, você pode incluir `gerar_background: true` e `sugestao_background` para gerar automaticamente um background baseado na sugestão (ex: "nobre", "carpinteiro", "aventureiro").

### Raças (`/racas`)

- `POST /racas` - Criar nova raça
- `GET /racas` - Listar raças
- `GET /racas/:id` - Obter raça específica
- `PUT /racas/:id` - Atualizar raça
- `DELETE /racas/:id` - Excluir raça
- `GET /racas/buscar` - Buscar raças por nome

### Classes (`/classes`)

- `POST /classes` - Criar nova classe
- `GET /classes` - Listar classes
- `GET /classes/:id` - Obter classe específica
- `PUT /classes/:id` - Atualizar classe
- `DELETE /classes/:id` - Excluir classe
- `GET /classes/buscar` - Buscar classes por nome

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

### Personagem

```json
{
  "id": 1,
  "nome": "Marcus",
  "nivel": 5,
  "background": "Nascido nas ruas de Porto Negro...",
  "forca": 14,
  "inteligencia": 12,
  "carisma": 16,
  "destreza": 18,
  "constituicao": 12,
  "agilidade": 15,
  "historia_id": 1,
  "criado_em": "2024-01-01T00:00:00.000Z",
  "atualizado_em": "2024-01-01T00:00:00.000Z"
}
```

### Criar Personagem com Background Automático

```json
{
  "nome": "Marcus",
  "historia_id": 1,
  "gerar_background": true,
  "sugestao_background": "nobre",
  "temas_disponiveis": ["fantasia", "medieval"],
  "nivel": 5,
  "forca": 14,
  "inteligencia": 12,
  "carisma": 16,
  "destreza": 18,
  "constituicao": 12,
  "agilidade": 15
}
```
  "carisma": 16,
  "destreza": 18,
  "constituicao": 12,
  "sabedoria": 10
}
```

### Gerar Background para Personagem Existente

```json
{
  "tipo": "detalhado",
  "sugestao_background": "carpinteiro",
  "temas_disponiveis": ["fantasia", "medieval"]
}
```

### Raça

```json
{
  "id": 1,
  "nome": "Humano",
  "custo": 0,
  "descricao": "Raça versátil e adaptável",
  "bonus": "{\"forca\": \"+1\", \"destreza\": \"+1\", \"constituicao\": \"+1\", \"inteligencia\": \"+1\", \"sabedoria\": \"+1\", \"carisma\": \"+1\"}"
}
```

### Classe

```json
{
  "id": 1,
  "nome": "Guerreiro",
  "custo": 0,
  "descricao": "Especialista em combate corpo a corpo",
  "bonus": "{\"proficiencia_armas\": [\"simples\", \"marciais\"], \"proficiencia_armaduras\": [\"leve\", \"media\", \"pesada\"], \"pontos_vida\": \"+10\"}"
}
```

### Vantagem

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

### Desvantagem

```json
{
  "id": 1,
  "nome": "Fraqueza Física",
  "descricao": "O personagem tem uma constituição física debilitada, sofrendo penalidades em testes de força e resistência.",
  "custo": 0,
  "tipo": ["passiva"],
  "bonus": {
    "penalidade_forca": -2,
    "penalidade_constituicao": -1
  },
  "restricao": {
    "requer_descanso": true,
    "limite_carga": 0.5
  },
  "dano_base": null,
  "efeito": {
    "fadiga_rapida": true,
    "recuperacao_lenta": true
  },
  "usar": null,
  "elemento": ["fisico"],
  "nivel": 1,
  "requisitos": {
    "constituicao_maxima": 12
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