# Arquitetura MVVM — Lunaria Frontend

## Visao Geral

Cada pagina/feature segue o padrao **Model → ViewModel → View** com responsabilidades rigidas:

```
Model (.model.js)          ViewModel (index.jsx)          View (.view.jsx)
Estado puro + sync    →    Logica de negocio         →    Render puro
Dados crus + setters       Transformacao + regras         Valores finais
API calls, stores          Handlers, derivados            Zero logica
```

---

## Model (`*.model.js`)

O Model e um **hook de estado puro**. Sua unica responsabilidade e manter dados atualizados.

### DEVE conter:
- `useState` para estado local
- `useEffect` para fetch de dados (API calls)
- Sincronizacao com Zustand stores
- Setters de estado (`setNome`, `setFiltro`, etc.)
- Loading/error states

### NAO DEVE conter:
- Logica de negocio (validacao, calculos, regras)
- Formatacao de dados (`formatJson`, `formatBonus`)
- Concerns de navegacao (`navigate`, `generateRoute`)
- Concerns de tema (`isLight`, `useTheme`)
- Handlers complexos (delete com modal, multi-step flows)
- Derivados computados (filtragem, ordenacao, agrupamento)

### Exemplo:

```javascript
// monstro-lista.model.js
export const useMonstroListaModel = () => {
  const [monstros, setMonstros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchMonstros();
  }, [currentPage, pageSize]);

  const fetchMonstros = async () => {
    setLoading(true);
    try {
      const res = await monstroService.getAll({ page: currentPage, limit: pageSize });
      setMonstros(res.data);
      setTotalCount(res.pagination.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    // Estado cru
    monstros,
    loading,
    error,
    searchTerm,
    currentPage,
    pageSize,
    totalCount,
    // Setters
    setSearchTerm,
    setCurrentPage,
    setPageSize,
    setError,
    recarregar: fetchMonstros,
  };
};
```

---

## ViewModel (`index.jsx`)

O ViewModel e o **cerebro da pagina**. Conecta Model e View, aplicando toda logica de negocio.

### DEVE conter:
- Importar e chamar o Model (hook de dados)
- Logica de negocio (validacao, regras, calculos)
- Transformacao de dados para exibicao (formatacao, derivados)
- Resolucao de tema (`isLight`)
- Navegacao (`navigate`, `generateRoute`)
- Handlers de UI (modals, confirmacoes, actions)
- Filtragem, ordenacao, agrupamento de dados
- Montagem de props formatadas para a View

### NAO DEVE conter:
- JSX de apresentacao (esse e o papel da View)
- CSS classes ou estilos
- Estado bruto de API (vem do Model)

### Exemplo:

```javascript
// index.jsx (ViewModel)
import { useMonstroListaModel } from './monstro-lista.model';
import MonstroListaView from './monstro-lista.view';

export default function MonstroListaPage() {
  const model = useMonstroListaModel();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isLight = theme === 'light';

  // --- Logica de negocio ---

  // Filtragem por busca
  const filteredMonstros = useMemo(() => {
    if (!model.searchTerm.trim()) return model.monstros;
    const term = model.searchTerm.toLowerCase();
    return model.monstros.filter(m =>
      m.nome.toLowerCase().includes(term)
    );
  }, [model.monstros, model.searchTerm]);

  // Contagem por raridade
  const raridades = useMemo(() => {
    const counts = {};
    model.monstros.forEach(m => {
      const r = m.raridade_rel?.nome || 'Comum';
      counts[r] = (counts[r] || 0) + 1;
    });
    return counts;
  }, [model.monstros]);

  // --- Handlers ---

  const handleVerMonstro = (id) => navigate(generateRoute.verMonstro(id));
  const handleEditarMonstro = (id) => navigate(generateRoute.editarMonstro(id));

  // --- Transformacao para View ---
  // A View recebe valores PRONTOS, sem precisar processar nada

  return (
    <MonstroListaView
      // Dados prontos
      monstros={filteredMonstros}
      totalCount={model.totalCount}
      raridades={raridades}
      // Estado de UI
      loading={model.loading}
      error={model.error}
      isLight={isLight}
      // Paginacao
      currentPage={model.currentPage}
      pageSize={model.pageSize}
      onPageChange={model.setCurrentPage}
      onPageSizeChange={model.setPageSize}
      // Handlers prontos
      onSearch={model.setSearchTerm}
      onClearError={() => model.setError(null)}
      onVerMonstro={handleVerMonstro}
      onEditarMonstro={handleEditarMonstro}
    />
  );
}
```

---

## View (`*.view.jsx`)

A View e **render puro**. Recebe valores finais e renderiza.

### DEVE conter:
- JSX de apresentacao
- Componentes visuais (Badge, Card, Button)
- Layout e responsividade
- Animacoes CSS

### NAO DEVE conter:
- `useState` (exceto estado visual local como tooltips, dropdowns abertos)
- `useEffect`
- `useMemo` com logica de negocio
- Formatacao de dados (`formatJson`, `.filter()`, `.map()` de transformacao)
- `useTheme()` (recebe `isLight` pronto do ViewModel)
- `useNavigate()` (recebe handlers prontos)
- Condicionais de negocio (`if (pontosCriacao < 0)`)

### Estado visual local permitido:
- `useState` para: tooltip aberto, accordion expandido, tab ativa, gallery index
- Esses sao estados puramente visuais que nao afetam logica de negocio

### Exemplo:

```javascript
// monstro-lista.view.jsx (View pura)
const MonstroListaView = ({
  monstros,
  totalCount,
  raridades,
  loading,
  error,
  isLight,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onSearch,
  onClearError,
  onVerMonstro,
}) => {
  // Unico estado permitido: visual local
  const [galleryIndex, setGalleryIndex] = useState(null);

  if (loading) return <Skeleton />;

  return (
    <div>
      <PageHeader title="Monstros" />
      <SearchBar onChange={onSearch} />
      <div className="grid grid-cols-4 gap-4">
        {monstros.map(m => (
          <CatalogCard
            key={m.id}
            title={m.nome}
            image={m.imagem}
            onClick={() => onVerMonstro(m.id)}
          />
        ))}
      </div>
    </div>
  );
};
```

---

## Regras de Ouro

### 1. Teste mental: "A View sabe o que e um monstro?"
Se a View precisa saber a estrutura do dado (`.raridade_rel?.nome`), a transformacao deveria estar no ViewModel.

### 2. Teste mental: "O Model sabe que cor usar?"
Se o Model retorna `isLight` ou classes CSS, isso deveria estar no ViewModel.

### 3. Teste mental: "O ViewModel renderiza algo?"
Se o ViewModel tem JSX, esse JSX deveria estar na View.

### 4. Props devem ser agrupadas por dominio
```javascript
// Ruim: 40 props flat
<View nome={nome} racaId={racaId} racaNome={racaNome} classeId={classeId} ... />

// Bom: props agrupadas
<View
  character={{ nome, raca: racaNome, classe: classeNome }}
  stats={{ hp, ataque, defesa }}
  actions={{ onSave, onDelete, onEdit }}
  ui={{ isLight, loading, error }}
/>
```

### 5. Handlers devem ser resolvidos no ViewModel
```javascript
// Ruim: View recebe navigate e generateRoute e monta o handler
onClick={() => navigate(generateRoute.verMonstro(row.id))}

// Bom: View recebe handler pronto
onClick={() => onVerMonstro(row.id)}
```

---

## Migracao Gradual

Nao e necessario refatorar tudo de uma vez. Para cada pagina tocada:

1. Identificar o que no `.model.js` e logica de negocio vs estado puro
2. Mover logica de negocio para o `index.jsx` (ViewModel)
3. Mover formatacao/derivados da `.view.jsx` para o ViewModel
4. Limpar o Model para ficar so com estado + sync
5. Limpar a View para ficar so com render

Prioridade: paginas que vao ser modificadas a seguir naturalmente passam pelo refactor.
