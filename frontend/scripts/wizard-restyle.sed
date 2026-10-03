# scripts/wizard-restyle.sed
# Traduz o tema paralelo do wizard (wa-*, --wa-*) para tokens globais do index.css.
# Uso: sed -E -i -f scripts/wizard-restyle.sed <arquivo.tsx>
# TEMPORÁRIO (Fase 2 do redesign do wizard): apagado na Task 21.

# Rótulos uppercase com tracking largo viram texto normal; mono vira tabular-nums.
s/ uppercase tracking-\[0\.[0-9]+em\]//g
s/ tracking-\[0\.[0-9]+em\] uppercase//g
s/ uppercase//g
s/font-mono/tabular-nums/g

# Botão primário em gradiente e estado desabilitado.
s/bg-gradient-to-br from-\[var\(--wa-accent\)\] to-\[var\(--wa-teal\)\] text-white shadow-lg hover:-translate-y-0\.5/bg-[var(--primary)] text-[var(--primary-foreground)] shadow-lg hover:opacity-90/g
s/cursor-not-allowed bg-slate-600 text-slate-300 opacity-70/cursor-not-allowed bg-[var(--muted)] text-[var(--muted-foreground)] opacity-70/g

# Chips.
s/wa-accent-chip/bg-[var(--primary)]\/15 text-[var(--primary)]/g
s/wa-(teal|emerald)-chip/bg-emerald-500\/15 text-emerald-500/g
s/wa-ember-chip/bg-amber-400\/20 text-amber-500/g
s/wa-forge-chip/bg-amber-400\/15 text-amber-600/g
s/wa-warning-chip/bg-red-500\/15 text-red-400/g

# Superfícies (as mais específicas primeiro).
s/wa-panel-soft/bg-[var(--muted)]\/40/g
s/wa-panel-strong/bg-[var(--card)]/g
s/wa-panel/border border-[var(--border)] bg-[var(--card)]/g
s/wa-combo-block/border border-[var(--border)] bg-[var(--card)]/g
s/wizard-atelier /card-rpg !p-0 /g
s/ ?wa-(stage-enter|stagger-[0-9]|etched|main-shell|readiness-panel|surface)//g

# Roxo fixo (quebra o tema gótico) vira o primário do tema.
s/(text|bg|border|ring|from|to|via)-(purple|violet)-[0-9]{2,3}/\1-[var(--primary)]/g

# Variáveis de cor usadas como classe arbitrária.
s/(text|bg|border|ring|from|to)-\[var\(--wa-(teal|success|emerald)\)\]/\1-emerald-500/g
s/(text|bg|border|ring|from|to)-\[var\(--wa-(ember|forge-gold)\)\]/\1-amber-500/g
s/(text|bg|border|ring|from|to)-\[var\(--wa-danger\)\]/\1-red-500/g
s/var\(--wa-accent-bright\)/var(--primary)/g
s/var\(--wa-accent\)/var(--primary)/g
s/var\(--wa-muted\)/var(--muted-foreground)/g
s/var\(--wa-border\)/var(--border)/g
s/var\(--wa-surface\)/var(--card)/g
s/var\(--wa-ink\)/var(--foreground)/g

# Raios grandes do tema paralelo viram o raio do app.
s/rounded-\[(1[6-9]|2[0-9]|3[0-9])px\]/rounded-xl/g
