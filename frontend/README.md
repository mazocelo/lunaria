# 🎲 Role Chat Game - Plataforma de RPG

Uma plataforma moderna e imersiva para gerenciamento de campanhas de RPG, com design único inspirado em jogos de fantasia e arquitetura MVVM.

## 🏗️ Arquitetura MVVM

Este projeto segue a arquitetura **MVVM (Model-View-ViewModel)** para garantir:

- ✅ **Separação de responsabilidades**
- ✅ **Testabilidade**
- ✅ **Manutenibilidade**
- ✅ **Reutilização de código**
- ✅ **Escalabilidade**

### 📁 Estrutura da Arquitetura

```
src/
├── models/           # Modelos de dados
│   ├── Historia.js
│   ├── Personagem.js
│   ├── Tema.js
│   └── index.js
├── views/            # Componentes de UI (Views)
│   ├── HistoriaView.jsx
│   └── index.js
├── viewmodels/       # ViewModels (lógica de negócio)
│   ├── HistoriaViewModel.js
│   ├── PersonagemViewModel.js
│   └── index.js
├── services/         # Serviços de API e dados
│   ├── ApiClient.js
│   ├── HistoriaService.js
│   ├── PersonagemService.js
│   ├── TemaService.js
│   └── index.js
├── shared/           # Componentes e utilitários compartilhados
│   ├── hooks/
│   │   ├── useViewModel.js
│   │   └── index.js
│   └── index.js
└── architecture/     # Configurações e documentação da arquitetura
    └── README.md
```

## 🎯 Responsabilidades

### 📊 Models
- **Definição de dados**: Estrutura e tipos de dados
- **Validação**: Regras de validação dos modelos
- **Transformação**: Conversão entre diferentes formatos
- **Métodos de negócio**: Lógica específica do domínio

### 🖥️ Views
- **Apresentação**: Componentes React puros
- **Interação**: Eventos de UI e navegação
- **Renderização**: Como os dados são exibidos
- **Sem lógica de negócio**: Apenas responsáveis pela UI

### 🔄 ViewModels
- **Estado**: Gerenciamento do estado da aplicação
- **Lógica de negócio**: Regras e validações
- **Comunicação**: Entre Views e Models/services
- **Transformação**: Preparação de dados para Views
- **Observers**: Sistema de reatividade

### 🔌 services
- **API**: Comunicação com backend
- **Dados**: Acesso a dados externos
- **Utilitários**: Funções auxiliares
- **Validação**: Validação antes de enviar dados

## 🔄 Fluxo de Dados

```
View → ViewModel → Service → Model
  ↑                                    ↓
  ←─────────── Dados ────────────────←
```

### Exemplo de Fluxo:

1. **View** chama método do ViewModel
2. **ViewModel** valida dados e chama Service
3. **Service** comunica com API e retorna Model
4. **Model** é validado e processado
5. **ViewModel** atualiza estado e notifica View
6. **View** re-renderiza com novos dados

## ✨ Características

### 🎨 Design Moderno e Imersivo
- **Tema de Fantasia**: Design inspirado em RPGs com gradientes, efeitos de vidro e animações
- **Partículas Animadas**: Fundo dinâmico com partículas conectadas
- **Tipografia Dupla**: Fontes Cinzel (fantasia) e Inter (moderna)
- **Efeitos Visuais**: Hover, glow, shimmer e transições suaves
- **Modo Escuro**: Tema escuro otimizado para longas sessões

### 🛠️ Componentes Personalizados
- **Cards RPG**: Cards com efeitos de vidro e hover
- **Botões Temáticos**: Botões com gradientes e animações
- **Inputs Estilizados**: Campos de entrada com design moderno
- **Tabelas Personalizadas**: Tabelas com hover e efeitos visuais
- **Loading Spinners**: Indicadores de carregamento temáticos
- **Notificações**: Sistema de notificações elegante

### 📱 Interface Responsiva
- **Mobile-First**: Design otimizado para dispositivos móveis
- **Sidebar Inteligente**: Navegação lateral com estatísticas
- **Grid Adaptativo**: Layouts que se adaptam ao tamanho da tela

## 🚀 Tecnologias

- **React 18** - Framework principal
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Framework de estilização
- **React Router** - Navegação
- **Canvas API** - Animações de partículas
- **MVVM Pattern** - Arquitetura de aplicação

## 🎯 Funcionalidades

### 📚 Gestão de Histórias
- Criar e gerenciar campanhas
- Sistema de temas e categorização
- Controle de participantes
- Interface intuitiva para criação

### ⚔️ Gestão de Personagens
- Criação de personagens
- Sistema de classes e raças
- Atributos e estatísticas
- Visualização em cards

### 🎨 Sistema de Temas
- Múltiplos temas por história
- Categorização inteligente
- Interface de seleção moderna

## 🎨 Paleta de Cores

### Cores Principais
- **Roxo**: `#8b5cf6` - Cor primária
- **Azul**: `#6366f1` - Cor secundária  
- `#06b6d4` - Cor de destaque

### Gradientes
- **Primário**: Roxo → Azul → Ciano
- **Secundário**: Azul → Roxo → Magenta
- **Destaque**: Ciano → Azul escuro

## 📦 Instalação

```bash
# Clone o repositório
git clone [url-do-repositorio]

# Instale as dependências
npm install

# Execute em modo de desenvolvimento
npm run dev

# Build para produção
npm run build
```

## 🎮 Como Usar

### Criando uma História
1. Navegue para "Histórias" na sidebar
2. Clique em "Nova História"
3. Preencha o nome da aventura
4. Selecione os temas (até 3)
5. Defina o número máximo de participantes
6. Clique em "Criar História"

### Criando um Personagem
1. Navegue para "Personagens" na sidebar
2. Clique em "Novo Personagem"
3. Preencha os dados do personagem
4. Escolha classe e raça
5. Defina os atributos
6. Salve o personagem

## 🎨 Componentes Disponíveis

### Básicos
- `Button` - Botões com variantes e tamanhos
- `InputSimples` - Campos de entrada estilizados
- `Selector` - Seletores múltiplos

### RPG Específicos
- `RPGCard` - Cards com efeitos de vidro
- `StatCard` - Cards de estatísticas
- `LoadingSpinner` - Indicadores de carregamento
- `Notification` - Sistema de notificações
- `ParticlesBackground` - Fundo animado

## 🧪 Testabilidade

### ViewModels
- Testáveis independentemente
- Mock de services para testes isolados
- Validação de lógica de negócio

### Models
- Testáveis sem dependências
- Validação de dados
- Métodos de transformação

### services
- Mockáveis para testes
- Testes de integração com API
- Tratamento de erros

### Views
- Testáveis com ViewModels mockados
- Testes de renderização
- Testes de interação

## 🎯 Próximas Funcionalidades

- [ ] Sistema de chat em tempo real
- [ ] Mapa interativo para campanhas
- [ ] Sistema de dados virtuais
- [ ] Integração com APIs de RPG
- [ ] Modo colaborativo
- [ ] Sistema de conquistas
- [ ] Migração completa para MVVM
- [ ] Testes automatizados

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🎲 Sobre

Role Chat Game é uma plataforma criada para entusiastas de RPG que desejam uma experiência moderna e imersiva para gerenciar suas campanhas e personagens, seguindo as melhores práticas de arquitetura de software.

---

**Desenvolvido com ❤️ para a comunidade RPG**
