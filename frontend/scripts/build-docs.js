import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'fs';
import { join, basename, dirname } from 'path';
import { fileURLToPath } from 'url';
import MarkdownIt from 'markdown-it';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DOCS_SRC = join(ROOT, 'docs');
const DOCS_OUT = join(ROOT, 'public', 'docs-html');

const md = new MarkdownIt({ html: true, linkify: true, typographer: true });

const SECTIONS = ['jogador', 'interno'];

function buildSection(section) {
  const srcDir = join(DOCS_SRC, section);
  const outDir = join(DOCS_OUT, section);

  if (!existsSync(srcDir)) {
    console.warn(`Seção ${section} não encontrada em ${srcDir}`);
    return;
  }

  mkdirSync(outDir, { recursive: true });

  const files = readdirSync(srcDir).filter(f => f.endsWith('.md'));
  const manifest = [];

  for (const file of files) {
    const content = readFileSync(join(srcDir, file), 'utf-8');
    const html = md.render(content);
    const slug = basename(file, '.md');
    const outFile = join(outDir, `${slug}.html`);

    writeFileSync(outFile, html, 'utf-8');
    manifest.push({ slug, file });
  }

  writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`[docs] ${section}: ${files.length} arquivos convertidos`);
}

for (const section of SECTIONS) {
  buildSection(section);
}

console.log('[docs] Build completo');
