# 3D&T Alpha Ficha Livre — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 3D&T linear wizard with a free-form character sheet where all point allocation happens on a single page with a shared point pool.

**Architecture:** New `TresDetFichaLivre/` directory under the existing Wizard folder, following MVVM pattern (index.jsx → model → view). The entry point (`Wizard/index.jsx`) branches to this component when `sistema=tresdet`. A single `useTresDetFichaModel` hook manages the shared point pool, with derived computations for remaining points, PV/PM, and Focus lock state.

**Tech Stack:** React 19, Vite, Zustand (catalog stores only), Tailwind CSS, localStorage (draft), existing MestreCriadorService API.

**Spec:** `docs/superpowers/specs/2026-03-22-3det-ficha-livre-design.md`

**Mockup:** `public/mockup-3det.html` (interactive reference at `/mockup-3det.html`)

---

## File Structure

### New files
```
src/Pages/Personagem/Wizard/TresDetFichaLivre/
├── index.jsx                          # ViewModel — orchestrates model + view
├── ficha-livre.model.js               # Model — useTresDetFichaModel hook (state, pool, draft)
├── ficha-livre.view.jsx               # View — main layout, all sections composed
├── hooks/
│   └── useMestreFichaLivre.js         # Mestre chat adapted for free-form (no navigation)
└── components/
    ├── PointsBar.jsx                  # Nível de Poder selector + pip track + remaining counter
    ├── CaracteristicasSection.jsx     # F/H/R/A/PdF +/- cards, PV/PM derived
    ├── VantagensDesvantagensSection.jsx  # Side-by-side lists + add buttons
    ├── CatalogoModal.jsx              # Drawer/modal for browsing vantagens/desvantagens catalog
    ├── FocusSection.jsx               # 6 element Focus cards with +/- (locked if no magia)
    ├── HistoriaSection.jsx            # Textarea for background
    └── MestrePanelLateral.jsx         # Collapsible chat panel
```

### Modified files
```
src/Pages/Personagem/Wizard/index.jsx  # Add branch: tresdet → TresDetFichaLivre
```

---

## Task 1: Point Pool Model Hook

**Files:**
- Create: `src/Pages/Personagem/Wizard/TresDetFichaLivre/ficha-livre.model.js`

This is the core of the feature — all state and computed values.

- [ ] **Step 1: Create the model hook with state and pool computations**

```javascript
// ficha-livre.model.js
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';

const NIVEL_PODER = {
  novato: 5,
  lutador: 7,
  campeao: 10,
  lenda: 12,
};

const FOCUS_KEYS = ['fogo', 'agua', 'terra', 'ar', 'luz', 'trevas'];
const CHAR_KEYS = ['F', 'H', 'R', 'A', 'PdF'];
const DRAFT_KEY = 'lunaria_3det_ficha_draft_v1';

export function useTresDetFichaModel({ navigate }) {
  // ---- Core state ----
  const [nome, setNome] = useState('');
  const [nivelPoder, setNivelPoder] = useState('lutador');
  const [caracteristicas, setCaracteristicas] = useState({ F: 0, H: 0, R: 0, A: 0, PdF: 0 });
  const [vantagensIds, setVantagensIds] = useState([]);
  const [desvantagensIds, setDesvantagensIds] = useState([]);
  const [focus, setFocus] = useState({ fogo: 0, agua: 0, terra: 0, ar: 0, luz: 0, trevas: 0 });
  const [historia, setHistoria] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [error, setError] = useState(null);

  // ---- Catalog data (fetched once) ----
  const [vantagensCatalogo, setVantagensCatalogo] = useState([]);
  const [desvantagensCatalogo, setDesvantagensCatalogo] = useState([]);
  const [catalogoLoading, setCatalogoLoading] = useState(true);

  // ---- Pool computations ----
  const pontosTotal = NIVEL_PODER[nivelPoder] || 7;

  const pontosCaracteristicas = useMemo(
    () => CHAR_KEYS.reduce((sum, k) => sum + caracteristicas[k], 0),
    [caracteristicas],
  );

  const pontosVantagens = useMemo(
    () => vantagensIds.reduce((sum, id) => {
      const v = vantagensCatalogo.find(x => String(x.id) === String(id));
      return sum + (v?.custo || 0);
    }, 0),
    [vantagensIds, vantagensCatalogo],
  );

  const pontosDesvantagens = useMemo(
    () => desvantagensIds.reduce((sum, id) => {
      const d = desvantagensCatalogo.find(x => String(x.id) === String(id));
      return sum + (d?.custo || 0); // custo is negative
    }, 0),
    [desvantagensIds, desvantagensCatalogo],
  );

  const pontosFocus = useMemo(
    () => FOCUS_KEYS.reduce((sum, k) => sum + focus[k], 0),
    [focus],
  );

  const pontosUsados = pontosCaracteristicas + pontosVantagens + pontosFocus;
  const pontosRestantes = pontosTotal + pontosDesvantagens - pontosUsados;

  // ---- Magic detection ----
  const temMagia = useMemo(
    () => vantagensIds.some(id => {
      const v = vantagensCatalogo.find(x => String(x.id) === String(id));
      return v?.tipo === 'magico' || (Array.isArray(v?.tipo) && v.tipo.includes('magico'));
    }),
    [vantagensIds, vantagensCatalogo],
  );

  // ---- Derived stats ----
  const pv = 5 * caracteristicas.R;
  const pm = temMagia ? 5 * Math.max(caracteristicas.H, caracteristicas.PdF) : 0;

  // ---- Setters with pool guard ----
  const setCaracteristica = useCallback((key, valor) => {
    if (valor < 0 || valor > 5) return;
    setCaracteristicas(prev => {
      const diff = valor - prev[key];
      if (diff > 0 && pontosRestantes <= 0) return prev;
      return { ...prev, [key]: valor };
    });
  }, [pontosRestantes]);

  const setFocusNivel = useCallback((key, valor) => {
    if (valor < 0 || valor > 5) return;
    setFocus(prev => {
      const diff = valor - prev[key];
      if (diff > 0 && pontosRestantes <= 0) return prev;
      return { ...prev, [key]: valor };
    });
  }, [pontosRestantes]);

  const adicionarVantagem = useCallback((id) => {
    const sid = String(id);
    if (vantagensIds.includes(sid)) return;
    const v = vantagensCatalogo.find(x => String(x.id) === sid);
    if (v && v.custo > pontosRestantes) return;
    setVantagensIds(prev => [...prev, sid]);
  }, [vantagensIds, vantagensCatalogo, pontosRestantes]);

  const removerVantagem = useCallback((id) => {
    const sid = String(id);
    setVantagensIds(prev => prev.filter(x => x !== sid));
    // If removing last magic advantage, clear focus
    const remaining = vantagensIds.filter(x => x !== sid);
    const stillHasMagia = remaining.some(vid => {
      const v = vantagensCatalogo.find(x => String(x.id) === vid);
      return v?.tipo === 'magico' || (Array.isArray(v?.tipo) && v.tipo.includes('magico'));
    });
    if (!stillHasMagia) {
      setFocus({ fogo: 0, agua: 0, terra: 0, ar: 0, luz: 0, trevas: 0 });
    }
  }, [vantagensIds, vantagensCatalogo]);

  const adicionarDesvantagem = useCallback((id) => {
    const sid = String(id);
    if (desvantagensIds.includes(sid)) return;
    setDesvantagensIds(prev => [...prev, sid]);
  }, [desvantagensIds]);

  const removerDesvantagem = useCallback((id) => {
    setDesvantagensIds(prev => prev.filter(x => x !== String(id)));
  }, []);

  // ---- Nível de Poder change with auto-trim ----
  const mudarNivelPoder = useCallback((novoNivel) => {
    setNivelPoder(novoNivel);
    const novoTotal = NIVEL_PODER[novoNivel] || 7;

    // Use functional updates to auto-trim if over budget
    setFocus(prevFocus => {
      setCaracteristicas(prevChars => {
        setVantagensIds(prevVant => {
          const calcUsed = (c, f, v) => {
            const charPts = CHAR_KEYS.reduce((s, k) => s + c[k], 0);
            const focusPts = FOCUS_KEYS.reduce((s, k) => s + f[k], 0);
            const vantPts = v.reduce((s, id) => {
              const vt = vantagensCatalogo.find(x => String(x.id) === id);
              return s + (vt?.custo || 0);
            }, 0);
            return charPts + focusPts + vantPts;
          };

          let c = { ...prevChars };
          let f = { ...prevFocus };
          let v = [...prevVant];

          // Trim Focus first (highest value first)
          while (calcUsed(c, f, v) + pontosDesvantagens > novoTotal) {
            const maxKey = FOCUS_KEYS.reduce((best, k) => f[k] > f[best] ? k : best, FOCUS_KEYS[0]);
            if (f[maxKey] <= 0) break;
            f[maxKey]--;
          }

          // Trim Characteristics (PdF → A → R → H → F)
          const charOrder = ['PdF', 'A', 'R', 'H', 'F'];
          while (calcUsed(c, f, v) + pontosDesvantagens > novoTotal) {
            const key = charOrder.find(k => c[k] > 0);
            if (!key) break;
            c[key]--;
          }

          // Trim Vantagens (last added first)
          while (calcUsed(c, f, v) + pontosDesvantagens > novoTotal && v.length > 0) {
            v.pop();
          }

          // Apply trimmed state
          setCaracteristicas(c);
          setFocus(f);
          return v;
        });
        return prevChars; // Will be overwritten above
      });
      return prevFocus; // Will be overwritten above
    });
  }, [vantagensCatalogo, pontosDesvantagens]);

  // ---- Draft persistence ----
  const draftTimerRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (!saved) return;
    try {
      const draft = JSON.parse(saved);
      if (draft.nome) setNome(draft.nome);
      if (draft.nivelPoder) setNivelPoder(draft.nivelPoder);
      if (draft.caracteristicas) setCaracteristicas(draft.caracteristicas);
      if (draft.vantagensIds) setVantagensIds(draft.vantagensIds);
      if (draft.desvantagensIds) setDesvantagensIds(draft.desvantagensIds);
      if (draft.focus) setFocus(draft.focus);
      if (draft.historia) setHistoria(draft.historia);
    } catch { /* ignore corrupt draft */ }
  }, []);

  useEffect(() => {
    clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      const draft = { nome, nivelPoder, caracteristicas, vantagensIds, desvantagensIds, focus, historia };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }, 1000);
    return () => clearTimeout(draftTimerRef.current);
  }, [nome, nivelPoder, caracteristicas, vantagensIds, desvantagensIds, focus, historia]);

  const limparDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
  }, []);

  // ---- Validation ----
  const podeCriar = nome.trim().length > 0 && pontosRestantes >= 0;

  return {
    // State
    nome, setNome,
    nivelPoder, mudarNivelPoder,
    caracteristicas, setCaracteristica,
    vantagensIds, adicionarVantagem, removerVantagem,
    desvantagensIds, adicionarDesvantagem, removerDesvantagem,
    focus, setFocusNivel,
    historia, setHistoria,
    // Pool
    pontosTotal, pontosCaracteristicas, pontosVantagens, pontosDesvantagens,
    pontosFocus, pontosUsados, pontosRestantes,
    // Derived
    temMagia, pv, pm, podeCriar,
    // Catalog
    vantagensCatalogo, desvantagensCatalogo, catalogoLoading,
    setVantagensCatalogo, setDesvantagensCatalogo, setCatalogoLoading,
    // Actions
    salvando, setSalvando, error, setError, limparDraft,
    navigate,
  };
}
```

- [ ] **Step 2: Verify no syntax errors**

Run: `cd /opt/role-chat-game/frontend && npx vite build 2>&1 | tail -5`

Note: Build won't include this file yet (no imports), but confirms no repo-wide breakage.

- [ ] **Step 3: Commit**

```bash
git add src/Pages/Personagem/Wizard/TresDetFichaLivre/ficha-livre.model.js
git commit -m "feat(3det): add ficha livre model hook with shared point pool"
```

---

## Task 2: PointsBar Component

**Files:**
- Create: `src/Pages/Personagem/Wizard/TresDetFichaLivre/components/PointsBar.jsx`

Nível de Poder selector + colored pip track + remaining points counter.

- [ ] **Step 1: Create PointsBar component**

```jsx
// components/PointsBar.jsx
import { useTheme } from '../../../../../contexts/theme.jsx';

const NIVEIS = [
  { id: 'novato', label: 'Novato', pts: 5 },
  { id: 'lutador', label: 'Lutador', pts: 7 },
  { id: 'campeao', label: 'Campeão', pts: 10 },
  { id: 'lenda', label: 'Lenda', pts: 12 },
];

export default function PointsBar({
  nivelPoder, mudarNivelPoder,
  pontosTotal, pontosRestantes,
  pontosCaracteristicas, pontosVantagens, pontosFocus, pontosDesvantagens,
}) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const isOver = pontosRestantes < 0;

  return (
    <div className={`sticky top-0 z-10 flex items-center gap-5 flex-wrap px-6 py-3 border-b ${
      isLight ? 'bg-white/90 border-slate-200' : 'bg-slate-900/90 border-purple-900/30'
    } backdrop-blur-sm`}>
      {/* Nível de Poder */}
      <div className="flex items-center gap-3">
        <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          Poder
        </span>
        <div className="flex gap-1.5">
          {NIVEIS.map(n => (
            <button
              key={n.id}
              onClick={() => mudarNivelPoder(n.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                nivelPoder === n.id
                  ? 'bg-amber-500 text-slate-900 shadow-md shadow-amber-500/20'
                  : isLight
                    ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {n.label} ({n.pts})
            </button>
          ))}
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Pip track */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1 flex-wrap max-w-[180px]">
          {Array.from({ length: pontosCaracteristicas }).map((_, i) => (
            <div key={`c${i}`} className="w-3 h-3 rounded-sm bg-purple-500" />
          ))}
          {Array.from({ length: pontosVantagens }).map((_, i) => (
            <div key={`v${i}`} className="w-3 h-3 rounded-sm bg-amber-500" />
          ))}
          {Array.from({ length: pontosFocus }).map((_, i) => (
            <div key={`f${i}`} className="w-3 h-3 rounded-sm bg-sky-400" />
          ))}
          {Array.from({ length: Math.max(0, pontosRestantes) }).map((_, i) => (
            <div key={`r${i}`} className={`w-3 h-3 rounded-sm border ${isLight ? 'border-slate-300' : 'border-slate-600'}`} />
          ))}
          {Array.from({ length: Math.abs(pontosDesvantagens) }).map((_, i) => (
            <div key={`d${i}`} className="w-3 h-3 rounded-sm bg-emerald-400" />
          ))}
        </div>

        {/* Counter */}
        <div className="text-center">
          <div className={`text-2xl font-extrabold ${isOver ? 'text-red-400' : 'text-amber-400'}`}>
            {pontosRestantes}
          </div>
          <div className={`text-[10px] leading-tight ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            de {pontosTotal}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/Pages/Personagem/Wizard/TresDetFichaLivre/components/PointsBar.jsx
git commit -m "feat(3det): add PointsBar component with nivel de poder selector"
```

---

## Task 3: CaracteristicasSection Component

**Files:**
- Create: `src/Pages/Personagem/Wizard/TresDetFichaLivre/components/CaracteristicasSection.jsx`

Grid of 5 characteristic cards with +/- buttons and derived PV/PM.

- [ ] **Step 1: Create CaracteristicasSection**

```jsx
// components/CaracteristicasSection.jsx
import { useTheme } from '../../../../../contexts/theme.jsx';

const ATTRS = [
  { key: 'F', label: 'Forca', sigla: 'F' },
  { key: 'H', label: 'Habilidade', sigla: 'H' },
  { key: 'R', label: 'Resistencia', sigla: 'R' },
  { key: 'A', label: 'Armadura', sigla: 'A' },
  { key: 'PdF', label: 'Poder de Fogo', sigla: 'PdF' },
];

export default function CaracteristicasSection({
  caracteristicas, setCaracteristica, pontosCaracteristicas,
  pontosRestantes, pv, pm, temMagia,
}) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <section className={`rounded-2xl border p-5 ${
      isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-purple-900/30'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-sm font-bold uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-purple-300'}`}>
          Caracteristicas
        </h3>
        <span className={`text-xs px-2 py-0.5 rounded-md ${isLight ? 'bg-slate-100 text-slate-500' : 'bg-slate-800 text-slate-400'}`}>
          {pontosCaracteristicas} pts
        </span>
      </div>

      <div className="grid grid-cols-5 gap-3 max-[768px]:grid-cols-3">
        {ATTRS.map(attr => {
          const val = caracteristicas[attr.key];
          const canInc = val < 5 && pontosRestantes > 0;
          const canDec = val > 0;
          return (
            <div key={attr.key} className={`rounded-xl border p-4 text-center ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/50 border-purple-900/20'
            }`}>
              <div className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {attr.label}
              </div>
              <div className={`text-3xl font-extrabold mb-2 ${isLight ? 'text-slate-800' : 'text-purple-200'}`}>
                {val}
              </div>
              <div className="flex justify-center gap-2">
                <button
                  disabled={!canDec}
                  onClick={() => setCaracteristica(attr.key, val - 1)}
                  className={`w-8 h-8 rounded-lg border text-sm font-bold flex items-center justify-center cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                    isLight
                      ? 'border-slate-300 hover:bg-purple-50 text-purple-600'
                      : 'border-purple-800 hover:bg-purple-900/50 text-purple-400'
                  }`}
                >-</button>
                <button
                  disabled={!canInc}
                  onClick={() => setCaracteristica(attr.key, val + 1)}
                  className={`w-8 h-8 rounded-lg border text-sm font-bold flex items-center justify-center cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                    isLight
                      ? 'border-slate-300 hover:bg-purple-50 text-purple-600'
                      : 'border-purple-800 hover:bg-purple-900/50 text-purple-400'
                  }`}
                >+</button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3 mt-3">
        <div className={`rounded-lg border px-3 py-2 text-xs ${isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-800/50 border-purple-900/20 text-slate-400'}`}>
          PV: <strong className={isLight ? 'text-slate-800' : 'text-purple-200'}>{pv}</strong>
        </div>
        <div className={`rounded-lg border px-3 py-2 text-xs ${isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-800/50 border-purple-900/20 text-slate-400'}`}>
          PM: <strong className={isLight ? 'text-slate-800' : 'text-purple-200'}>{pm}</strong>
          {!temMagia && <span className="ml-1 opacity-50">(sem magia)</span>}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/Pages/Personagem/Wizard/TresDetFichaLivre/components/CaracteristicasSection.jsx
git commit -m "feat(3det): add CaracteristicasSection with shared pool guards"
```

---

## Task 4: VantagensDesvantagensSection + CatalogoModal

**Files:**
- Create: `src/Pages/Personagem/Wizard/TresDetFichaLivre/components/VantagensDesvantagensSection.jsx`
- Create: `src/Pages/Personagem/Wizard/TresDetFichaLivre/components/CatalogoModal.jsx`

Side-by-side lists with catalog modal for adding items.

- [ ] **Step 1: Create CatalogoModal**

Drawer modal for browsing and adding vantagens or desvantagens. Includes text search and type filter chips.

```jsx
// components/CatalogoModal.jsx
import { useState, useMemo } from 'react';
import { X, Search } from 'lucide-react';
import { useTheme } from '../../../../../contexts/theme.jsx';

const TIPO_LABELS = {
  ofensiva: 'Ofensiva', defensiva: 'Defensiva', magico: 'Magica',
  passiva: 'Passiva', movimento: 'Movimento', social: 'Social',
  comportamental: 'Comportamental', sobrenatural: 'Sobrenatural',
  mental: 'Mental', fisica: 'Fisica',
};

export default function CatalogoModal({ aberto, onFechar, itens, selecionados, onAdicionar, titulo, pontosRestantes }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState(null);

  const tipos = useMemo(() => {
    const set = new Set();
    itens.forEach(i => {
      const t = Array.isArray(i.tipo) ? i.tipo : [i.tipo];
      t.forEach(x => x && set.add(x));
    });
    return [...set].sort();
  }, [itens]);

  const filtrados = useMemo(() => {
    return itens.filter(i => {
      if (selecionados.includes(String(i.id))) return false;
      if (busca && !i.nome.toLowerCase().includes(busca.toLowerCase())) return false;
      if (filtroTipo) {
        const t = Array.isArray(i.tipo) ? i.tipo : [i.tipo];
        if (!t.includes(filtroTipo)) return false;
      }
      return true;
    });
  }, [itens, selecionados, busca, filtroTipo]);

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onFechar} />
      <div className={`relative w-full max-w-md flex flex-col ${
        isLight ? 'bg-white' : 'bg-slate-900'
      } shadow-2xl`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${isLight ? 'border-slate-200' : 'border-purple-900/30'}`}>
          <h3 className={`text-base font-bold ${isLight ? 'text-slate-800' : 'text-purple-200'}`}>{titulo}</h3>
          <button onClick={onFechar} className="cursor-pointer p-1"><X size={18} className={isLight ? 'text-slate-400' : 'text-slate-500'} /></button>
        </div>

        {/* Search */}
        <div className="p-4 pb-2">
          <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${isLight ? 'border-slate-200 bg-slate-50' : 'border-purple-900/30 bg-slate-800/50'}`}>
            <Search size={14} className={isLight ? 'text-slate-400' : 'text-slate-500'} />
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar..."
              className={`flex-1 bg-transparent outline-none text-sm ${isLight ? 'text-slate-700' : 'text-slate-200'}`}
            />
          </div>
          <div className="flex gap-1.5 mt-2 flex-wrap">
            <button onClick={() => setFiltroTipo(null)} className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${!filtroTipo ? 'bg-purple-500 text-white' : isLight ? 'bg-slate-100 text-slate-500' : 'bg-slate-800 text-slate-400'}`}>Todos</button>
            {tipos.map(t => (
              <button key={t} onClick={() => setFiltroTipo(t)} className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${filtroTipo === t ? 'bg-purple-500 text-white' : isLight ? 'bg-slate-100 text-slate-500' : 'bg-slate-800 text-slate-400'}`}>
                {TIPO_LABELS[t] || t}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 pt-2 space-y-2">
          {filtrados.map(item => {
            const custoNum = item.custo || 0;
            const semPontos = custoNum > 0 && custoNum > pontosRestantes;
            return (
              <button
                key={item.id}
                disabled={semPontos}
                onClick={() => { onAdicionar(item.id); onFechar(); }}
                className={`w-full text-left rounded-xl border p-3 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  isLight
                    ? 'border-slate-200 bg-slate-50 hover:border-purple-300'
                    : 'border-purple-900/20 bg-slate-800/50 hover:border-purple-500/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{item.nome}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${custoNum > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {custoNum > 0 ? `${custoNum} pt` : `${custoNum} pt`}
                  </span>
                </div>
                <p className={`text-xs mt-1 line-clamp-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{item.descricao}</p>
              </button>
            );
          })}
          {filtrados.length === 0 && (
            <p className={`text-sm text-center py-8 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Nenhum item encontrado</p>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create VantagensDesvantagensSection**

```jsx
// components/VantagensDesvantagensSection.jsx
import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { useTheme } from '../../../../../contexts/theme.jsx';
import CatalogoModal from './CatalogoModal.jsx';

function ItemCard({ item, onRemover, isLight }) {
  if (!item) return null;
  const custo = item.custo || 0;
  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/50 border-purple-900/20'
    }`}>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{item.nome}</div>
        <div className={`text-xs truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{item.descricao}</div>
      </div>
      <span className={`text-xs font-bold px-2 py-0.5 rounded shrink-0 ${custo > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-400'}`}>
        {custo > 0 ? `${custo} pt` : `${custo} pt`}
      </span>
      <button onClick={() => onRemover(item.id)} className="cursor-pointer text-red-400/50 hover:text-red-400 transition-colors">
        <X size={16} />
      </button>
    </div>
  );
}

export default function VantagensDesvantagensSection({
  vantagensIds, desvantagensIds,
  vantagensCatalogo, desvantagensCatalogo,
  adicionarVantagem, removerVantagem,
  adicionarDesvantagem, removerDesvantagem,
  pontosVantagens, pontosDesvantagens, pontosRestantes,
}) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [modalAberto, setModalAberto] = useState(null); // 'vantagens' | 'desvantagens' | null

  const vantagensSelecionadas = vantagensIds.map(id => vantagensCatalogo.find(v => String(v.id) === id)).filter(Boolean);
  const desvantagensSelecionadas = desvantagensIds.map(id => desvantagensCatalogo.find(d => String(d.id) === id)).filter(Boolean);

  const secClass = `rounded-2xl border p-5 ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-purple-900/30'}`;

  return (
    <>
      <div className="grid grid-cols-2 gap-4 max-[900px]:grid-cols-1">
        {/* Vantagens */}
        <section className={secClass}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-bold uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-amber-300'}`}>Vantagens</h3>
            <span className={`text-xs px-2 py-0.5 rounded-md ${isLight ? 'bg-amber-50 text-amber-600' : 'bg-amber-900/20 text-amber-400'}`}>{pontosVantagens} pts</span>
          </div>
          <div className="space-y-2">
            {vantagensSelecionadas.map(v => <ItemCard key={v.id} item={v} onRemover={removerVantagem} isLight={isLight} />)}
            <button onClick={() => setModalAberto('vantagens')} className={`w-full rounded-xl border border-dashed p-3 text-center text-sm cursor-pointer transition-all ${
              isLight ? 'border-slate-300 text-slate-400 hover:border-amber-400 hover:text-amber-600' : 'border-purple-900/30 text-slate-500 hover:border-amber-500/50 hover:text-amber-400'
            }`}>
              <Plus size={14} className="inline mr-1" /> Adicionar vantagem
            </button>
          </div>
        </section>

        {/* Desvantagens */}
        <section className={secClass}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-bold uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-emerald-300'}`}>Desvantagens</h3>
            <span className={`text-xs px-2 py-0.5 rounded-md ${isLight ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-900/20 text-emerald-400'}`}>{pontosDesvantagens} pt</span>
          </div>
          <div className="space-y-2">
            {desvantagensSelecionadas.map(d => <ItemCard key={d.id} item={d} onRemover={removerDesvantagem} isLight={isLight} />)}
            <button onClick={() => setModalAberto('desvantagens')} className={`w-full rounded-xl border border-dashed p-3 text-center text-sm cursor-pointer transition-all ${
              isLight ? 'border-slate-300 text-slate-400 hover:border-emerald-400 hover:text-emerald-600' : 'border-purple-900/30 text-slate-500 hover:border-emerald-500/50 hover:text-emerald-400'
            }`}>
              <Plus size={14} className="inline mr-1" /> Adicionar desvantagem
            </button>
          </div>
        </section>
      </div>

      <CatalogoModal
        aberto={modalAberto === 'vantagens'}
        onFechar={() => setModalAberto(null)}
        itens={vantagensCatalogo}
        selecionados={vantagensIds}
        onAdicionar={adicionarVantagem}
        titulo="Catalogo de Vantagens"
        pontosRestantes={pontosRestantes}
      />
      <CatalogoModal
        aberto={modalAberto === 'desvantagens'}
        onFechar={() => setModalAberto(null)}
        itens={desvantagensCatalogo}
        selecionados={desvantagensIds}
        onAdicionar={adicionarDesvantagem}
        titulo="Catalogo de Desvantagens"
        pontosRestantes={999}
      />
    </>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/Pages/Personagem/Wizard/TresDetFichaLivre/components/CatalogoModal.jsx \
        src/Pages/Personagem/Wizard/TresDetFichaLivre/components/VantagensDesvantagensSection.jsx
git commit -m "feat(3det): add VantagensDesvantagens section with CatalogoModal drawer"
```

---

## Task 5: FocusSection Component

**Files:**
- Create: `src/Pages/Personagem/Wizard/TresDetFichaLivre/components/FocusSection.jsx`

6 element Focus cards with +/- distribution, locked if no magic advantage.

- [ ] **Step 1: Create FocusSection**

```jsx
// components/FocusSection.jsx
import { Lock } from 'lucide-react';
import { useTheme } from '../../../../../contexts/theme.jsx';

const FOCUS_CONFIG = [
  { key: 'fogo', label: 'Fogo', emoji: '\u{1F525}' },
  { key: 'agua', label: 'Agua', emoji: '\u{1F4A7}' },
  { key: 'terra', label: 'Terra', emoji: '\u{1F343}' },
  { key: 'ar', label: 'Ar', emoji: '\u{1F300}' },
  { key: 'luz', label: 'Luz', emoji: '\u2600\uFE0F' },
  { key: 'trevas', label: 'Trevas', emoji: '\u{1F311}' },
];

export default function FocusSection({ focus, setFocusNivel, pontosFocus, pontosRestantes, temMagia }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <section className={`relative rounded-2xl border p-5 ${
      isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-purple-900/30'
    } ${!temMagia ? 'opacity-40 pointer-events-none' : ''}`}>
      {!temMagia && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold ${
            isLight ? 'bg-white border border-slate-200 text-slate-500' : 'bg-slate-900 border border-purple-900/30 text-slate-400'
          }`}>
            <Lock size={14} /> Compre uma vantagem de Magia para desbloquear
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-sm font-bold uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-sky-300'}`}>
          Focus Elementais
        </h3>
        <span className={`text-xs px-2 py-0.5 rounded-md ${isLight ? 'bg-sky-50 text-sky-600' : 'bg-sky-900/20 text-sky-400'}`}>
          {pontosFocus} pts
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 max-[768px]:grid-cols-2">
        {FOCUS_CONFIG.map(fc => {
          const val = focus[fc.key];
          const hasPoints = val > 0;
          const canInc = val < 5 && pontosRestantes > 0;
          return (
            <div key={fc.key} className={`rounded-xl border p-4 text-center transition-all ${
              hasPoints
                ? isLight ? 'border-sky-300 bg-sky-50/50' : 'border-sky-500/40 bg-sky-900/10'
                : isLight ? 'border-slate-200 bg-slate-50' : 'border-purple-900/20 bg-slate-800/50'
            }`}>
              <div className="text-2xl mb-1">{fc.emoji}</div>
              <div className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${hasPoints ? (isLight ? 'text-sky-600' : 'text-sky-300') : (isLight ? 'text-slate-500' : 'text-slate-400')}`}>
                {fc.label}
              </div>
              <div className={`text-2xl font-extrabold mb-2 ${hasPoints ? (isLight ? 'text-sky-700' : 'text-sky-300') : (isLight ? 'text-slate-400' : 'text-slate-500')}`}>
                {val}
              </div>
              <div className="flex justify-center gap-2">
                <button disabled={val <= 0} onClick={() => setFocusNivel(fc.key, val - 1)} className={`w-7 h-7 rounded-lg border text-sm font-bold flex items-center justify-center cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed ${isLight ? 'border-sky-200 text-sky-500 hover:bg-sky-50' : 'border-sky-800 text-sky-400 hover:bg-sky-900/30'}`}>-</button>
                <button disabled={!canInc} onClick={() => setFocusNivel(fc.key, val + 1)} className={`w-7 h-7 rounded-lg border text-sm font-bold flex items-center justify-center cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed ${isLight ? 'border-sky-200 text-sky-500 hover:bg-sky-50' : 'border-sky-800 text-sky-400 hover:bg-sky-900/30'}`}>+</button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/Pages/Personagem/Wizard/TresDetFichaLivre/components/FocusSection.jsx
git commit -m "feat(3det): add FocusSection with elemental Focus distribution"
```

---

## Task 6: HistoriaSection + MestrePanelLateral

**Files:**
- Create: `src/Pages/Personagem/Wizard/TresDetFichaLivre/components/HistoriaSection.jsx`
- Create: `src/Pages/Personagem/Wizard/TresDetFichaLivre/components/MestrePanelLateral.jsx`
- Create: `src/Pages/Personagem/Wizard/TresDetFichaLivre/hooks/useMestreFichaLivre.js`

- [ ] **Step 1: Create HistoriaSection** (simple textarea)

```jsx
// components/HistoriaSection.jsx
import { useTheme } from '../../../../../contexts/theme.jsx';

export default function HistoriaSection({ historia, setHistoria }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  return (
    <section className={`rounded-2xl border p-5 ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-purple-900/30'}`}>
      <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 ${isLight ? 'text-slate-700' : 'text-purple-300'}`}>Historia & Background</h3>
      <textarea
        value={historia}
        onChange={e => setHistoria(e.target.value)}
        placeholder="Descreva a historia, motivacoes e personalidade do personagem..."
        className={`w-full min-h-[100px] rounded-xl border p-4 text-sm resize-y outline-none transition-colors ${
          isLight ? 'bg-slate-50 border-slate-200 text-slate-700 focus:border-purple-400' : 'bg-slate-800/50 border-purple-900/20 text-slate-200 focus:border-purple-500'
        }`}
      />
    </section>
  );
}
```

- [ ] **Step 2: Create useMestreFichaLivre hook**

```javascript
// hooks/useMestreFichaLivre.js
import { useState, useCallback, useRef } from 'react';
import { mestreCriadorService } from '../../../../../services/index.js';

export function useMestreFichaLivre({ getEstado }) {
  const [mensagens, setMensagens] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const enviandoRef = useRef(false);

  const enviarMensagem = useCallback(async (texto) => {
    if (!texto?.trim() || enviandoRef.current) return;

    const msg = texto.trim();
    setMensagens(prev => [...prev, { id: Date.now(), role: 'jogador', content: msg, timestamp: new Date() }]);
    enviandoRef.current = true;
    setEnviando(true);

    try {
      const resultado = await mestreCriadorService.interagir({
        etapa: 'ficha_livre',
        estado: getEstado(),
        mensagemJogador: msg,
        historico: mensagens.filter(m => m.role !== 'sistema').map(m => ({ role: m.role === 'jogador' ? 'user' : 'assistant', content: m.content })),
        actionMode: 'reply',
        sistema: 'tresdet',
      });

      setMensagens(prev => [...prev, {
        id: Date.now() + 1,
        role: 'mestre',
        content: resultado.mensagem,
        sugestoes: resultado.sugestoes,
        timestamp: new Date(),
      }]);
    } catch {
      setMensagens(prev => [...prev, {
        id: Date.now() + 1,
        role: 'sistema',
        content: 'Nao foi possivel contatar o Mestre. Tente novamente.',
        timestamp: new Date(),
      }]);
    } finally {
      enviandoRef.current = false;
      setEnviando(false);
    }
  }, [mensagens, getEstado]);

  return { mensagens, enviando, enviarMensagem };
}
```

- [ ] **Step 3: Create MestrePanelLateral**

```jsx
// components/MestrePanelLateral.jsx
import { useState, useRef, useEffect } from 'react';
import { X, Send, MessageCircle } from 'lucide-react';
import { useTheme } from '../../../../../contexts/theme.jsx';

export default function MestrePanelLateral({ aberto, onToggle, mensagens, enviando, enviarMensagem, onSugestaoClick }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [input, setInput] = useState('');
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [mensagens]);

  const handleEnviar = () => {
    if (!input.trim()) return;
    enviarMensagem(input);
    setInput('');
  };

  if (!aberto) return null;

  return (
    <div className={`w-[380px] max-[768px]:fixed max-[768px]:inset-y-0 max-[768px]:right-0 max-[768px]:w-[85vw] max-[768px]:z-50 max-[768px]:shadow-2xl border-l flex flex-col ${
      isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-purple-900/30'
    }`}>
      <div className={`flex items-center justify-between p-4 border-b ${isLight ? 'border-slate-200' : 'border-purple-900/30'}`}>
        <span className={`text-sm font-bold ${isLight ? 'text-slate-800' : 'text-purple-200'}`}>Mestre Criador</span>
        <button onClick={onToggle} className="cursor-pointer p-1"><X size={16} className={isLight ? 'text-slate-400' : 'text-slate-500'} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {mensagens.map(msg => (
          <div key={msg.id}>
            <div className={`rounded-xl px-4 py-3 text-sm max-w-[90%] ${
              msg.role === 'jogador'
                ? 'ml-auto bg-purple-500 text-white'
                : msg.role === 'sistema'
                  ? `${isLight ? 'bg-slate-100 text-slate-500' : 'bg-slate-800 text-slate-400'}`
                  : `${isLight ? 'bg-slate-50 border border-slate-200 text-slate-700' : 'bg-slate-800/80 border border-purple-900/20 text-slate-200'}`
            }`}>
              {msg.content}
            </div>
            {msg.sugestoes?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2 ml-1">
                {msg.sugestoes.map((s, i) => (
                  <button key={i} onClick={() => onSugestaoClick(s)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    isLight ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100' : 'bg-amber-900/20 text-amber-400 border border-amber-800/30 hover:bg-amber-900/40'
                  }`}>
                    + {s.nome} ({s.custo || 0}pt)
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className={`p-3 border-t flex gap-2 ${isLight ? 'border-slate-200' : 'border-purple-900/30'}`}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleEnviar()}
          placeholder="Peca ajuda ao Mestre..."
          className={`flex-1 rounded-lg border px-3 py-2 text-sm outline-none ${isLight ? 'border-slate-200 bg-slate-50 text-slate-700' : 'border-purple-900/30 bg-slate-800/50 text-slate-200'}`}
        />
        <button disabled={enviando || !input.trim()} onClick={handleEnviar} className="px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-semibold cursor-pointer disabled:opacity-50">
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/Pages/Personagem/Wizard/TresDetFichaLivre/components/HistoriaSection.jsx \
        src/Pages/Personagem/Wizard/TresDetFichaLivre/components/MestrePanelLateral.jsx \
        src/Pages/Personagem/Wizard/TresDetFichaLivre/hooks/useMestreFichaLivre.js
git commit -m "feat(3det): add Historia section, Mestre panel, and Mestre chat hook"
```

---

## Task 7: View + ViewModel + Catalog Fetch + Route Branch

**Files:**
- Create: `src/Pages/Personagem/Wizard/TresDetFichaLivre/ficha-livre.view.jsx`
- Create: `src/Pages/Personagem/Wizard/TresDetFichaLivre/index.jsx`
- Modify: `src/Pages/Personagem/Wizard/index.jsx`

This wires everything together.

- [ ] **Step 1: Create the view**

```jsx
// ficha-livre.view.jsx
import { useState } from 'react';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { useTheme } from '../../../../contexts/theme.jsx';
import PointsBar from './components/PointsBar.jsx';
import CaracteristicasSection from './components/CaracteristicasSection.jsx';
import VantagensDesvantagensSection from './components/VantagensDesvantagensSection.jsx';
import FocusSection from './components/FocusSection.jsx';
import HistoriaSection from './components/HistoriaSection.jsx';
import MestrePanelLateral from './components/MestrePanelLateral.jsx';

export default function FichaLivreView(props) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [mestreAberto, setMestreAberto] = useState(false);

  const {
    nome, setNome,
    nivelPoder, mudarNivelPoder,
    caracteristicas, setCaracteristica,
    vantagensIds, adicionarVantagem, removerVantagem,
    desvantagensIds, adicionarDesvantagem, removerDesvantagem,
    focus, setFocusNivel,
    historia, setHistoria,
    pontosTotal, pontosCaracteristicas, pontosVantagens, pontosDesvantagens,
    pontosFocus, pontosRestantes,
    temMagia, pv, pm, podeCriar,
    vantagensCatalogo, desvantagensCatalogo, catalogoLoading,
    salvando, error, setError,
    onCriar, navigate,
    // Mestre
    mestreMensagens, mestreEnviando, mestreEnviarMensagem, mestreOnSugestao,
  } = props;

  return (
    <div className={`flex flex-col h-full ${isLight ? 'bg-slate-50' : 'bg-[#0f0d1a]'}`}>
      {/* Top bar */}
      <div className={`flex items-center justify-between px-6 py-3 border-b shrink-0 ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-purple-900/30'
      }`}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/personagens')} className={`cursor-pointer p-1 ${isLight ? 'text-slate-400 hover:text-slate-600' : 'text-slate-500 hover:text-slate-300'}`}>
            <ArrowLeft size={20} />
          </button>
          <h1 className={`text-lg font-bold font-fantasy ${isLight ? 'text-slate-800' : 'text-purple-200'}`}>
            <span className="text-amber-400">3D&T Alpha</span> — Ficha de Personagem
          </h1>
        </div>
        <button onClick={() => setMestreAberto(v => !v)} className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold cursor-pointer transition-all ${
          mestreAberto
            ? 'bg-purple-500 text-white border-purple-500'
            : isLight
              ? 'border-slate-200 text-slate-500 hover:border-purple-300'
              : 'border-purple-900/30 text-purple-400 hover:border-purple-500/50'
        }`}>
          <MessageCircle size={14} /> Mestre
        </button>
      </div>

      {/* Points bar */}
      <PointsBar
        nivelPoder={nivelPoder}
        mudarNivelPoder={mudarNivelPoder}
        pontosTotal={pontosTotal}
        pontosRestantes={pontosRestantes}
        pontosCaracteristicas={pontosCaracteristicas}
        pontosVantagens={pontosVantagens}
        pontosFocus={pontosFocus}
        pontosDesvantagens={pontosDesvantagens}
      />

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-400 flex items-center justify-between">
              {error}
              <button onClick={() => setError(null)} className="cursor-pointer text-red-400/50 hover:text-red-400">✕</button>
            </div>
          )}

          {/* Nome */}
          <section className={`rounded-2xl border p-5 ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-purple-900/30'}`}>
            <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 ${isLight ? 'text-slate-700' : 'text-purple-300'}`}>Nome</h3>
            <input
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Nome do personagem..."
              className={`w-full rounded-xl border px-4 py-3 text-lg font-semibold outline-none transition-colors ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-purple-400' : 'bg-slate-800/50 border-purple-900/20 text-slate-100 focus:border-purple-500'
              }`}
            />
          </section>

          <CaracteristicasSection
            caracteristicas={caracteristicas}
            setCaracteristica={setCaracteristica}
            pontosCaracteristicas={pontosCaracteristicas}
            pontosRestantes={pontosRestantes}
            pv={pv} pm={pm} temMagia={temMagia}
          />

          <VantagensDesvantagensSection
            vantagensIds={vantagensIds}
            desvantagensIds={desvantagensIds}
            vantagensCatalogo={vantagensCatalogo}
            desvantagensCatalogo={desvantagensCatalogo}
            adicionarVantagem={adicionarVantagem}
            removerVantagem={removerVantagem}
            adicionarDesvantagem={adicionarDesvantagem}
            removerDesvantagem={removerDesvantagem}
            pontosVantagens={pontosVantagens}
            pontosDesvantagens={pontosDesvantagens}
            pontosRestantes={pontosRestantes}
          />

          <FocusSection
            focus={focus}
            setFocusNivel={setFocusNivel}
            pontosFocus={pontosFocus}
            pontosRestantes={pontosRestantes}
            temMagia={temMagia}
          />

          {/* Equipamentos stub */}
          <section className={`rounded-2xl border p-5 ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-purple-900/30'}`}>
            <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 ${isLight ? 'text-slate-700' : 'text-purple-300'}`}>Equipamentos</h3>
            <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Em breve</p>
          </section>

          <HistoriaSection historia={historia} setHistoria={setHistoria} />

          {/* Create button */}
          <button
            disabled={!podeCriar || salvando}
            onClick={onCriar}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-400 text-white text-base font-bold cursor-pointer transition-all hover:shadow-lg hover:shadow-purple-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {salvando ? 'Criando...' : 'Criar Personagem'}
          </button>
          <div className="h-6" />
        </div>

        {/* Mestre Panel */}
        <MestrePanelLateral
          aberto={mestreAberto}
          onToggle={() => setMestreAberto(v => !v)}
          mensagens={mestreMensagens}
          enviando={mestreEnviando}
          enviarMensagem={mestreEnviarMensagem}
          onSugestaoClick={mestreOnSugestao}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create the ViewModel (index.jsx)**

```jsx
// TresDetFichaLivre/index.jsx
import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { vantagemService, desvantagemService } from '../../../../services/index.js';
import { useTresDetFichaModel } from './ficha-livre.model.js';
import { useMestreFichaLivre } from './hooks/useMestreFichaLivre.js';
import FichaLivreView from './ficha-livre.view.jsx';

export default function TresDetFichaLivre() {
  const navigate = useNavigate();
  const model = useTresDetFichaModel({ navigate });

  // Fetch catalogs
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [vResp, dResp] = await Promise.all([
          vantagemService.getAll({ sistema: 'tresdet' }),
          desvantagemService.getAll({ sistema: 'tresdet' }),
        ]);
        if (cancelled) return;
        model.setVantagensCatalogo(vResp.data || vResp || []);
        model.setDesvantagensCatalogo(dResp.data || dResp || []);
      } catch { /* ignore */ }
      if (!cancelled) model.setCatalogoLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // Build estado for Mestre
  const getEstado = useCallback(() => ({
    nome: model.nome,
    nivel_poder: model.nivelPoder,
    caracteristicas: model.caracteristicas,
    vantagens_ids: model.vantagensIds,
    desvantagens_ids: model.desvantagensIds,
    focus: model.focus,
    historia: model.historia,
  }), [model.nome, model.nivelPoder, model.caracteristicas, model.vantagensIds, model.desvantagensIds, model.focus, model.historia]);

  const mestre = useMestreFichaLivre({ getEstado });

  // Handle Mestre suggestion click
  const mestreOnSugestao = useCallback((sugestao) => {
    if (sugestao.tipo === 'vantagem') model.adicionarVantagem(sugestao.id);
    else if (sugestao.tipo === 'desvantagem') model.adicionarDesvantagem(sugestao.id);
  }, [model.adicionarVantagem, model.adicionarDesvantagem]);

  // Create character (stub — full implementation depends on backend contract)
  const onCriar = useCallback(async () => {
    model.setSalvando(true);
    model.setError(null);
    try {
      // TODO: integrate with personagem creation endpoint
      await new Promise(r => setTimeout(r, 1500));
      model.limparDraft();
      navigate('/personagens');
    } catch (err) {
      model.setError(err.message || 'Erro ao criar personagem');
    } finally {
      model.setSalvando(false);
    }
  }, [model, navigate]);

  return (
    <FichaLivreView
      {...model}
      onCriar={onCriar}
      mestreMensagens={mestre.mensagens}
      mestreEnviando={mestre.enviando}
      mestreEnviarMensagem={mestre.enviarMensagem}
      mestreOnSugestao={mestreOnSugestao}
    />
  );
}
```

- [ ] **Step 3: Update Wizard/index.jsx to branch for tresdet**

Modify `src/Pages/Personagem/Wizard/index.jsx` — add lazy import and branch:

```jsx
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useWizardModel } from './wizard.model';
import WizardView from './wizard.view';
import WizardSystemPicker from './components/WizardSystemPicker';
import TresDetFichaLivre from './TresDetFichaLivre/index.jsx';

function WizardWithSystem({ sistema }) {
  const navigate = useNavigate();
  const props = useWizardModel({ navigate, sistema });
  return (
    <div className="-m-6 h-[calc(100vh-3.5rem)] overflow-hidden">
      <WizardView {...props} />
    </div>
  );
}

export default function PersonagemWizardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const sistemaParam = searchParams.get('sistema');

  if (!sistemaParam) {
    return (
      <WizardSystemPicker
        onSelect={(id) => setSearchParams({ sistema: id })}
        onBack={() => navigate('/personagens')}
      />
    );
  }

  if (sistemaParam === 'tresdet') {
    return (
      <div className="-m-6 h-[calc(100vh-3.5rem)] overflow-hidden">
        <TresDetFichaLivre />
      </div>
    );
  }

  return <WizardWithSystem sistema={sistemaParam} />;
}
```

- [ ] **Step 4: Build and verify**

Run: `cd /opt/role-chat-game/frontend && NODE_OPTIONS="--max-old-space-size=4096" npx vite build 2>&1 | tail -5`
Expected: `✓ built in Xs` — no errors

- [ ] **Step 5: Deploy and test in browser**

```bash
sudo rm -rf /var/www/lunaria-front/* && sudo cp -r dist/* /var/www/lunaria-front/
```

Navigate to `https://lunaria.app.br/novo-personagem`, select 3D&T Alpha, verify ficha livre loads.

- [ ] **Step 6: Commit**

```bash
git add src/Pages/Personagem/Wizard/TresDetFichaLivre/ \
        src/Pages/Personagem/Wizard/index.jsx
git commit -m "feat(3det): wire up TresDetFichaLivre view, viewmodel, and route branch"
```

---

## Task 8: E2E Smoke Test via Playwright

Verify the full flow works: system picker → ficha livre → distribute points → open Mestre.

- [ ] **Step 1: Login and navigate to wizard**
- [ ] **Step 2: Verify system picker shows 3 options**
- [ ] **Step 3: Click 3D&T Alpha — verify ficha livre loads (not linear wizard)**
- [ ] **Step 4: Verify PointsBar shows Lutador (7) selected by default**
- [ ] **Step 5: Increase Forca to 2 — verify remaining drops from 7 to 6**
- [ ] **Step 6: Open catalogo modal — verify vantagens list loads**
- [ ] **Step 7: Add a vantagem — verify it appears in list and points update**
- [ ] **Step 8: Add Magia Elemental — verify Focus section unlocks**
- [ ] **Step 9: Distribute Focus points — verify pool updates**
- [ ] **Step 10: Open Mestre panel — verify chat renders**
- [ ] **Step 11: Switch Nível to Novato (5) — verify auto-trim removes excess points**
- [ ] **Step 12: Verify Lunaria wizard still works (navigate to /novo-personagem?sistema=lunaria)**

- [ ] **Step 13: Final commit and push**

```bash
git push origin main
```
