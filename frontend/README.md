# 🎮 Role Chat Game - Frontend

Sistema de RPG com chat em tempo real usando React + Vite + Zustand + WebSocket.

## 🏗️ **Nova Arquitetura (Zustand)**

### 🏪 **Sistema de Estados Globais**
- **🎮 Game Store**: Estados do jogo, história, personagens, sessões
- **🌐 Socket Store**: Estados de conexão WebSocket, usuários, sala técnica
- **💾 Persistência**: localStorage apenas para recuperação/hidratação

### 📁 **Estrutura do Projeto**
```
src/
├── 🎨 components/          # Componentes reutilizáveis
├── 🎯 contexts/           # React Contexts (Auth, Layout, Theme)
├── 🎛️ services/          # APIs e WebSocket
├── 🏪 store/             # Estados Globais Zustand
│   ├── index.js          # Exports + utilities
│   ├── game/             # Game Store
│   └── socket/           # Socket Store
├── 🎮 views/             # Views principais
│   ├── Auth/             # Login/Register
│   ├── Jogo/            # Sistema de jogo
│   └── ...              # Outras views
├── 🎨 viewmodels/        # Business Logic
└── 🔧 utils/            # Utilitários

```

## 🚀 **Views → Stores (Direto)**

### **Antes (com Hooks intermediários):**
```javascript
// ❌ Camada desnecessária
View → Hook → Store → WebSocket/API
```

### **Agora (Direto):**
```javascript
// ✅ Acesso direto e eficiente
View → Store → WebSocket/API
```

### **Exemplo de Uso:**
```javascript
// Views conectadas diretamente às stores
const { etapaAtual, mudarEtapa, personagemSelecionado } = useGameStore();
const { isConnected, setConnected } = useSocketStore();
```

## 🔄 **Fluxo de Dados**

1. **🚀 Inicialização**: `initializeAllStores()` (hidrata do localStorage)
2. **🎮 Uso**: Views → Stores → WebSocket/API
3. **💾 Persistência**: `persistirEstadoCritico()` (quando necessário)
4. **🧹 Reset**: `resetAllStores()` (logout/cleanup)

## 🎯 **Responsabilidades**

### 🏪 **Stores (Única Fonte de Verdade)**
- **Estados**: Sempre atualizada
- **Actions**: Lógicas de negócio
- **Persistência**: Controle total

### 🎮 **Views (Apresentação)**
- **Rendering**: Baseado em estados das stores
- **Interação**: Disparam actions das stores
- **Efeitos**: Reagem a mudanças das stores

### 🌐 **Services (Comunicação)**
- **WebSocket**: Eventos em tempo real
- **APIs**: Dados do servidor
- **Normalização**: Padronização de dados

## ⚡ **Benefícios da Nova Arquitetura**

1. **🎯 Menos Complexidade**: Sem camada intermediária de hooks
2. **⚡ Melhor Performance**: Menos re-renders desnecessários
3. **🔧 Mais Manutenível**: Estados centralizados e organizados
4. **📈 Escalável**: Fácil adicionar novas features
5. **🛡️ Mais Consistente**: Single source of truth
6. **💾 Persistência Controlada**: localStorage apenas quando necessário

## 🚀 **Scripts**

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview

# Linting
npm run lint
```

## 🔧 **Tecnologias**

- **⚛️ React 18** - Interface de usuário
- **🏪 Zustand** - Gerenciamento de estado global
- **🎨 Tailwind CSS** - Estilização
- **🌐 WebSocket** - Comunicação em tempo real
- **📱 React Router** - Roteamento
- **⚡ Vite** - Build tool moderna
