# Role Chat Game - Frontend

Uma aplicação moderna de RPG com interface elegante e modo claro/escuro.

## 🎨 Modo Light

A aplicação agora suporta um modo light elegante que mantém a estética RPG com cores mais suaves e claras.

### Características do Modo Light:

- **Cores Suaves**: Paleta de cores claras e elegantes
- **Glassmorphism**: Efeitos de vidro com transparência suave
- **Partículas Adaptativas**: Partículas mais suaves e menos intensas
- **Contraste Otimizado**: Texto e elementos com contraste adequado
- **Transições Suaves**: Animações e transições adaptadas ao tema

### Como Usar:

1. **Toggle de Tema**: Clique no botão no header para alternar entre modo claro e escuro
2. **Detecção Automática**: O tema inicial é baseado na preferência do sistema
3. **Persistência**: O tema escolhido é mantido durante a sessão

### Componentes Atualizados:

- ✅ App.jsx - Header e layout principal
- ✅ Sidebar - Navegação lateral
- ✅ ParticlesBackground - Partículas adaptativas
- ✅ InputSimples - Campos de entrada
- ✅ Button - Botões com variantes
- ✅ RPGCard - Cards com glassmorphism
- ✅ StatCard - Cards de estatísticas
- ✅ Table - Tabelas responsivas
- ✅ LoadingSpinner - Indicadores de carregamento
- ✅ Notification - Notificações do sistema

### Classes CSS Disponíveis:

#### Modo Light:
- `.glass-light` - Efeito de vidro claro
- `.glass-strong-light` - Efeito de vidro forte claro
- `.card-rpg-light` - Cards com estilo light
- `.input-rpg-light` - Inputs com estilo light
- `.btn-rpg-light` - Botões com estilo light
- `.table-rpg-light` - Tabelas com estilo light
- `.sidebar-rpg-light` - Sidebar com estilo light
- `.gradient-light` - Gradientes suaves
- `.gradient-light-warm` - Gradientes quentes suaves

#### Modo Dark (Original):
- `.glass` - Efeito de vidro escuro
- `.glass-strong` - Efeito de vidro forte escuro
- `.card-rpg` - Cards com estilo dark
- `.input-rpg` - Inputs com estilo dark
- `.btn-rpg` - Botões com estilo dark
- `.table-rpg` - Tabelas com estilo dark
- `.sidebar-rpg` - Sidebar com estilo dark

## 🚀 Tecnologias

- React 18
- Vite
- Tailwind CSS
- React Router
- Context API para gerenciamento de estado

## 📦 Instalação

```bash
npm install
npm run dev
```

## 🎯 Funcionalidades

- ✅ Sistema de temas (Light/Dark)
- ✅ Interface responsiva
- ✅ Animações suaves
- ✅ Glassmorphism effects
- ✅ Partículas interativas
- ✅ Componentes reutilizáveis
- ✅ Sistema de notificações
- ✅ Loading states
- ✅ Tabelas responsivas

## 🎨 Design System

A aplicação utiliza um design system consistente com:

- **Tipografia**: Cinzel (fantasy) + Inter (modern)
- **Cores**: Paleta roxa/ciano com variações
- **Efeitos**: Glassmorphism, gradientes, sombras
- **Animações**: Transições suaves e micro-interações
- **Responsividade**: Mobile-first approach

## 🔧 Desenvolvimento

Para adicionar novos componentes com suporte a temas:

1. Importe o contexto de tema: `import { useTheme } from '../contexts/theme.jsx'`
2. Use a variável `isLight`: `const isLight = theme === 'light'`
3. Aplique classes condicionais: `className={isLight ? 'classe-light' : 'classe-dark'}`

## 📱 Responsividade

A aplicação é totalmente responsiva e funciona em:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (320px - 767px)

## 🎮 RPG Features

- Gerenciamento de histórias
- Criação de personagens
- Sistema de estatísticas
- Interface imersiva
- Temas adaptativos
