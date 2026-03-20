# Arquitetura MVV — Lunaria Frontend

## Visao Geral

Cada pagina/feature segue o padrao **Model → ViewModel → View** com responsabilidades rigidas:

```
Model (.model.js)          ViewModel (index.jsx)          View (.view.jsx)
Estado + entidade     →    Orquestracao pura         →    Apresentacao completa
Fetch, normalize,          Handlers, navegacao,           Tema, JSX, badges,
metodos da entidade        logica de negocio              sections, stats, CSS
```

---

## Model (`*.model.js`)

O Model e o **dono da entidade**. Gerencia estado, sincronizacao com API/stores, e normaliza dados crus em formato limpo.

### DEVE conter:
- `useState` para estado local
- `useEffect` / `useCallback` para fetch
- Normalizacao de dados da API (snake_case → camelCase, arrays safe, JSON parse)
- Resolucao de relacoes (`.raridade_rel?.nome` → `raridade`)
- Derivados da entidade (contagens, agrupamentos, configs de dados)
- Metodos da entidade (recarregar, deletar, atualizar)
- `useParams` para ID da rota

### NAO DEVE conter:
- `useNavigate` (navegacao e orquestracao, vive no ViewModel)
- `useTheme` (tema e apresentacao, vive na View)
- JSX ou classes CSS
- Handlers de UI (modals, confirmacoes)

### Exemplo:

```javascript
// monstro-ver.model.js
export const useMonstroVerModel = () => {
  const { id } = useParams();
  const [raw, setRaw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const carregar = useCallback(() => {
    if (!id) return;
    setLoading(true);
    monstroService.getById(id)
      .then(res => setRaw(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { carregar(); }, [carregar]);

  // Normalizacao: dados crus → formato limpo
  const monstro = raw ? {
    id: raw.id,
    nome: raw.nome,
    raridade: raw.raridade_rel?.nome || 'Comum',
    raridadeConfig: getRaridadeConfig(raridade),
    tipos: Array.isArray(raw.tipo) ? raw.tipo : [],
    habilidades: normalizarHabilidades(formatJson(raw.habilidades)),
    atributos: { forca: raw.forca || 0, ... },
    combate: { hpBase: raw.hp_base, ... },
  } : null;

  return { id, monstro, loading, error, setError, recarregar: carregar };
};
```

---

## ViewModel (`index.jsx`)

O ViewModel e o **orquestrador**. Conecta Model e View, fornece handlers e logica de negocio pura.

### DEVE conter:
- Importar e chamar o Model (hook de dados)
- `useNavigate` e handlers de navegacao
- Logica de negocio pura (validacoes, regras, permissoes)
- Decisoes de fluxo (redirect se nao autorizado, etc.)

### NAO DEVE conter:
- JSX de apresentacao (badges, sections, cards)
- Classes CSS ou `isLight`
- `useTheme`
- Montagem de arrays de sections/stats
- Formatacao visual

### Exemplo:

```javascript
// index.jsx (ViewModel)
export default function MonstroVerPage() {
  const model = useMonstroVerModel();
  const navigate = useNavigate();

  const handleBack = () => navigate(ROUTES.MONSTROS);
  const handleEdit = () => {
    if (model.monstro) navigate(generateRoute.editarMonstro(model.monstro.id));
  };

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

O ViewModel e **curto**. Se esta ficando grande, provavelmente esta fazendo trabalho de Model ou de View.

---

## View (`*.view.jsx`)

A View e dona da **apresentacao completa**. Recebe dados normalizados do Model (via ViewModel) e constroi toda a UI.

### DEVE conter:
- `useTheme` para resolver `isLight`
- Montagem de JSX (badges, sections, stats, cards)
- Escolha de icones, cores, classes CSS
- Componentes visuais (Badge, ChipGroup, AtributoBar)
- Layout e responsividade
- Estado visual local (tooltips, gallery, accordion)

### NAO DEVE conter:
- Fetch de dados ou `useEffect` de API
- `useNavigate` (recebe handlers prontos)
- Transformacao/normalizacao de dados (vem pronto do Model)
- `formatJson`, `Array.isArray()` checks, `?.nome || 'default'`

### Exemplo:

```javascript
// monstro-ver.view.jsx
const VerMonstroView = ({ monstro: m, loading, error, onBack, onEdit }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  if (loading || error || !m) {
    return <CatalogDetailLayout loading={loading} error={error} ... />;
  }

  // View monta toda a apresentacao
  const badges = [ ... ];
  const sections = [ ... ];
  const stats = [ ... ];

  return (
    <CatalogDetailLayout
      title={m.nome}
      badges={badges}
      sections={sections}
      stats={stats}
      onBack={onBack}
      onEdit={onEdit}
    />
  );
};
```

---

## Testes Mentais

### "Quem sabe o formato da API?"
So o Model. Se a View ou ViewModel acessa `.raridade_rel?.nome` ou faz `Array.isArray(m.tipo)`, a normalizacao deveria estar no Model.

### "Quem sabe que cor usar?"
So a View. Se o Model ou ViewModel retorna classes CSS ou `isLight`, isso deveria estar na View.

### "Quem decide pra onde navegar?"
So o ViewModel. Se o Model tem `useNavigate` ou a View chama `navigate()`, isso deveria estar no ViewModel.

### "O ViewModel esta grande?"
Se o ViewModel tem mais de 30-40 linhas, provavelmente esta fazendo trabalho de Model (normalizacao) ou de View (montagem de JSX).

---

## Fluxo de Dados

```
API Response (snake_case, nulls, raw JSON)
    ↓
Model (normaliza → camelCase, defaults, arrays safe, relacoes resolvidas)
    ↓
ViewModel (adiciona handlers de navegacao, logica de negocio)
    ↓
View (resolve tema, monta badges/sections/stats como JSX, renderiza)
```

---

## Migracao Gradual

Para cada pagina tocada:

1. Mover normalizacao de dados (formatJson, Array.isArray, ?.nome) da View/ViewModel pro Model
2. Mover montagem de JSX (badges, sections, stats) do ViewModel pra View
3. Mover useNavigate/handlers do Model pro ViewModel
4. Mover useTheme/isLight do ViewModel pra View
5. O ViewModel deve ficar curto (< 30 linhas ideal)
