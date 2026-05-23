# Migracao para TypeScript

Codigo novo ou migrado segue a regra **zero-any**: nada de `any` explicito. Quando o
tipo for genuinamente desconhecido (payload externo, parse, retorno de biblioteca
sem tipos), use `unknown` e faca o narrowing antes de usar o valor. O ESLint trata
`@typescript-eslint/no-explicit-any` como erro e o `tsconfig` esta com
`noImplicitAny: true` e `strictNullChecks: true` — ambos bloqueiam regressoes em PR.

Supressoes de tipagem (`@ts-expect-error` ou `@ts-ignore`) so entram com comentario
no formato `YYYY-MM-DD motivo`, ex.: `// @ts-expect-error 2026-06-01 lib X ainda
sem types, abrir issue #123`. A regra `@typescript-eslint/ban-ts-comment` exige
descricao com pelo menos 10 caracteres. Sempre prefira corrigir o tipo a suprimir;
supressao e divida tecnica e deve ter prazo.

Nao renomeie `.jsx`/`.js` para `.tsx`/`.ts` sem tipar de verdade. Renomear sem
adicionar tipos so move o ruido para outro lugar e ainda gera falsa sensacao de
progresso. Cada migracao real cobre: Model + ViewModel + View da pagina, com tipos
proprios em `src/types/` quando aplicavel e import do `ApiEnvelope<T>` em chamadas
de API.
