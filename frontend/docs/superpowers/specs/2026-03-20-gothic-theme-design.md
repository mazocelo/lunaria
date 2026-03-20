# Tema Gothic — Design Spec

## Resumo
Terceiro modo visual para toda a aplicação. Toggle: Light → Dark → Gothic.
Inspiração: Castlevania — terror sóbrio, gótico elegante, atmosfera de castelo vampiro.

## Paleta de Cores (CSS Variables `.gothic`)

```css
--background: linear-gradient(135deg, #0a0508 0%, #1a0a10 50%, #12080e 100%)
--foreground: #f5e6d3  (branco envelhecido)
--card: rgba(20, 8, 12, 0.85)
--card-foreground: #f5e6d3
--primary: #dc2626  (carmesim)
--primary-foreground: #ffffff
--secondary: #b8860b  (dourado antigo)
--secondary-foreground: #ffffff
--accent: #ef4444  (carmesim claro)
--accent-foreground: #ffffff
--muted: rgba(107, 92, 92, 0.6)
--muted-foreground: #a89090
--destructive: #ef4444
--border: rgba(220, 38, 38, 0.15)
--input: rgba(20, 8, 12, 0.8)
--ring: #dc2626
--sidebar: rgba(10, 5, 8, 0.95)
--sidebar-foreground: #f5e6d3
--sidebar-primary: #dc2626
--sidebar-border: rgba(220, 38, 38, 0.12)
```

## Partículas (Canvas — terceiro branch em ParticlesBackground)

Quando `theme === 'gothic'`:
- **Gotas de sangue** (~15): caem lentamente de cima, formato oval vertical, vermelho escuro (#8b0000), opacidade 0.15-0.35, velocidade lenta
- **Brasas/cinzas** (~20): flutuam pra cima, laranja/vermelho (#cc3300), tamanho pequeno (1-3px), brilho sutil, opacidade 0.1-0.3
- **Neblina**: gradiente animado na parte inferior (15% da altura), carmesim muito sutil, ondulação lenta via sin()

## Elementos Decorativos

- **Teias de aranha**: SVG estático nos 2 cantos superiores da sidebar (opacity 0.06-0.08). Não intrusivas.
- **Vinheta**: box-shadow inset nas bordas da viewport — escurece os cantos
- **Morcegos**: 1-2 silhuetas SVG que cruzam a tela a cada 30-60s via CSS animation (translateX + leve sin vertical). Opacity 0.08-0.12. Não interativos, background puro.
- **Caveiras**: usadas como ícone decorativo de fundo nas vitral-sections (substituindo o ícone padrão quando gothic)

## Componentes Afetados

### ThemeContext
- Toggle rotaciona: `light → dark → gothic`
- Gothic aplica classe `.gothic` no `<html>` + `data-theme="gothic"`
- `isLight` continua false pra gothic (tratado como dark variant)
- Novo helper: `isGothic = theme === 'gothic'`

### CSS (index.css)
- Novo bloco `.gothic { }` com todas as CSS variables
- `.gothic .card-rpg` — fundo escuro com tint vermelho
- `.gothic .btn-rpg` — gradiente carmesim → dourado
- `.gothic .vitral-section::before` — carmesim em vez de roxo
- `.gothic` scrollbar — gradiente carmesim
- Vinheta: `.gothic .main-content::after` — box-shadow inset

### ParticlesBackground
- Terceiro branch: `if (theme === 'gothic')` → renderiza gotas + brasas + neblina
- Morcegos como elementos CSS separados (não canvas — pra manter leves)

### Sidebar
- Fundo escuro com tint carmesim sutil
- Nav item active indicator: carmesim em vez de roxo/cyan

### Cards (CatalogCard, StatCard)
- `.gothic` variant: borda carmesim escura, hover glow vermelho
- Gradient overlay nos cards com tint vermelho sutil

### CatalogDetailLayout
- Accent default muda pra carmesim no gothic
- Seções vitral com tint carmesim
- Sidebar com borda carmesim

### Botões
- `.gothic .btn-rpg`: gradient carmesim → dourado antigo
- Hover: shadow carmesim

### TopHeader
- Ícone do toggle: sol (light) → lua (dark) → caveira/skull (gothic)

## Implementação

1. Atualizar ThemeContext (3 estados)
2. CSS variables `.gothic` no index.css
3. ParticlesBackground terceiro branch
4. Elementos decorativos (teias SVG, morcegos CSS, vinheta)
5. Ajustes em componentes que usam `isLight` (adicionar gothic como dark variant)
6. Build + deploy + teste visual
