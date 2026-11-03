// O projeto não instala @types/node; os testes que leem arquivo do repo só precisam disto.
declare module 'node:fs' {
  export function readFileSync(path: string, encoding: 'utf8'): string;
  export function existsSync(path: string): boolean;
}
