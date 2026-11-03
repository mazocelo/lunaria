# Arquitetura Model / ViewModel / View — Lunaria Frontend

## Visao Geral

Cada pagina/feature usa 3 arquivos com responsabilidades claras:

```
.model.js (Hook de dados)     index.jsx (ViewModel)        .view.jsx (View)
Fetch, estado, normalize  →   Navegacao, handlers,     →   Tema, JSX, visual
Metodos da entidade            logica de negocio            Badges, sections, stats
```

---

## Model (`*.model.js`)

**Dono da entidade.** Gerencia estado, sincronizacao com API/stores, e normaliza dados crus.

### Faz:
- `useState`, `useEffect`, `useCallback` para estado e fetch
- `useParams` para ID da rota
- Normalizacao: snake_case → camelCase, arrays safe, JSON parse
- Resolucao de relacoes (`.raridade_rel?.nome` → `raridade`)
- Agrupamento de dados (`.atributos`, `.combate`)
- Metodos da entidade (`recarregar`, `deletar`)

### Nao faz:
- `useNavigate` (ViewModel)
- `useTheme` (View)
- JSX ou CSS
- Handlers de UI

### Exemplo:
```javascript
export const useMonstroVerModel = () => {
  const { id } = useParams();
  const [raw, setRaw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const carregar = useCallback(() => { ... fetch ... }, [id]);
  useEffect(() => { carregar(); }, [carregar]);

  const monstro = raw ? {
    nome: raw.nome,
    raridade: raw.raridade_rel?.nome || 'Comum',
    atributos: { forca: raw.forca || 0, ... },
    combate: { hpBase: raw.hp_base, ... },
    tipos: Array.isArray(raw.tipo) ? raw.tipo : [],
    habilidades: normalizarHabilidades(formatJson(raw.habilidades)),
  } : null;

  return { id, monstro, loading, error, setError, recarregar: carregar };
};
```

---

## ViewModel (`index.jsx`)

**Orquestrador curto.** Conecta Model e View. Apenas navegacao e logica de negocio.

### Faz:
- `useNavigate` e handlers de navegacao
- Logica de negocio (validacoes, permissoes, redirects)
- Chamar o Model e passar dados + handlers pra View

### Nao faz:
- JSX de apresentacao
- CSS, `isLight`, `useTheme`
- Montagem de badges/sections/stats
- Normalizacao de dados (Model faz isso)

### Deve ser curto (< 30 linhas ideal):
```javascript
export default function MonstroVerPage() {
  const model = useMonstroVerModel();
  const navigate = useNavigate();

  const handleBack = () => navigate(ROUTES.MONSTROS);
  const handleEdit = () => { if (model.monstro) navigate(generateRoute.editarMonstro(model.monstro.id)); };

  return (
    <VerMonstroView
      monstro={model.monstro}
      loading={model.loading}
      error={model.error}
      onBack={handleBack}
      onEdit={handleEdit}
    />
  );
}
```

Se o ViewModel esta ficando grande, provavelmente esta fazendo trabalho de Model ou de View.

---

## View (`*.view.jsx`)

**Apresentacao completa.** Recebe dados normalizados do Model e handlers do ViewModel. Monta toda a UI.

### Faz:
- `useTheme` para resolver `isLight`
- Montar badges, sections, stats como JSX
- Escolher icones, cores, classes CSS
- Decidir o que renderizar condicionalmente (`m.descricao &&`)
- Estado visual local (tooltips, gallery, accordion)

### Nao faz:
- Fetch ou `useEffect` de API
- `useNavigate` (recebe handlers)
- Normalizacao de dados (`formatJson`, `Array.isArray` checks)
- Acessar dados crus da API (`.raridade_rel?.nome`)

### Exemplo:
```javascript
const VerMonstroView = ({ monstro: m, loading, error, onBack, onEdit }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  if (loading || error || !m) return <CatalogDetailLayout loading={loading} error={error} ... />;

  const badges = [ ... ]; // monta JSX dos badges
  const sections = [ ... ]; // monta sections com tema
  const stats = [ ... ]; // monta stats do sidebar

  return <CatalogDetailLayout title={m.nome} badges={badges} sections={sections} stats={stats} ... />;
};
```

---

## Testes Mentais

| Pergunta | Resposta |
|----------|---------|
| Quem acessa `.raridade_rel?.nome`? | **Model** (normaliza pra `m.raridade`) |
| Quem sabe que cor usar? | **View** (resolve `isLight ? x : y`) |
| Quem decide pra onde navegar? | **ViewModel** (tem `useNavigate`) |
| Quem decide se a secao de descricao aparece? | **View** (`m.descricao &&` e decisao visual) |
| O ViewModel esta grande? | Provavelmente fazendo trabalho de Model ou View |

---

## Anti-Patterns

### NAO faca protocolo intermediario
```javascript
// RUIM: ViewModel passa dados tipados pra View decodificar
stats = [{ icon: Heart, label: 'HP', value: 125, color: 'danger' }]
// View precisa de COLOR_MAP pra resolver 'danger' → 'text-red-600'

// BOM: View acessa dados normalizados e monta direto
stats = [{ icon: Heart, label: 'HP', content: <span className="text-red-600">125</span> }]
```

### NAO normalize na View
```javascript
// RUIM: View faz normalizacao
const tipos = Array.isArray(m.tipo) ? m.tipo : [];

// BOM: Model ja normalizou
// m.tipos ja e array garantido
```

### NAO navegue na View
```javascript
// RUIM: View usa navigate
onClick={() => navigate(generateRoute.verMonstro(id))}

// BOM: View usa handler do ViewModel
onClick={() => onVerMonstro(id)}
```

---

## Quando usar 3 arquivos vs menos

- **Pagina complexa** (50+ linhas de logica, 100+ de JSX): 3 arquivos
- **Pagina simples** (Ver Raca com 3 campos): 2 arquivos (model + page com JSX inline) ou ate 1
- **Componente compartilhado** (Badge, Card): arquivo unico
- **A regra**: separe quando a complexidade justifica, nao por dogma
