#!/usr/bin/env node
/**
 * Canonical Report — generates comparative analysis across AI models.
 *
 * Usage:
 *   node scripts/canonical-report.js <cenarioId>
 *   node scripts/canonical-report.js --all
 *
 * Loads frozen logs from tests/fixtures/frozen/{cenarioId}/, runs invariants,
 * and produces terminal output + report.json + report.md.
 */
import dotenv from 'dotenv';
dotenv.config();

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInvariants } from '../tests/scenarios/invariants.js';

// ── Paths ──
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_ROOT = path.resolve(__dirname, '..');
const SCENARIOS_DIR = path.join(BACKEND_ROOT, 'tests', 'fixtures', 'scenarios');
const FROZEN_DIR = path.join(BACKEND_ROOT, 'tests', 'fixtures', 'frozen');

// ── ANSI colors ──
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';
const CYAN = '\x1b[36m';

// ── Model definitions ──
const MODELS = [
  { slug: 'groq', label: 'Groq' },
  { slug: 'gemini', label: 'Gemini Flash' },
  { slug: 'sonnet', label: 'Claude Sonnet' },
];

// ── CLI parsing ──
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { cenarioId: null, all: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--all') {
      opts.all = true;
    } else if (!args[i].startsWith('--')) {
      opts.cenarioId = args[i];
    }
  }
  if (!opts.cenarioId && !opts.all) {
    console.error('Usage: node scripts/canonical-report.js <cenarioId> [--all]');
    process.exit(1);
  }
  return opts;
}

// ── Load helpers ──

function loadCenario(cenarioId) {
  const filepath = path.join(SCENARIOS_DIR, `${cenarioId}.json`);
  if (!existsSync(filepath)) {
    console.error(`${RED}Cenario not found: ${filepath}${RESET}`);
    return null;
  }
  return JSON.parse(readFileSync(filepath, 'utf-8'));
}

function loadFrozenLog(cenarioId, modelSlug) {
  const filepath = path.join(FROZEN_DIR, cenarioId, `${modelSlug}.json`);
  if (!existsSync(filepath)) return null;
  try {
    return JSON.parse(readFileSync(filepath, 'utf-8'));
  } catch (err) {
    console.error(`${YELLOW}Warning: Failed to parse ${filepath}: ${err.message}${RESET}`);
    return null;
  }
}

function listAllCenarios() {
  if (!existsSync(SCENARIOS_DIR)) return [];
  return readdirSync(SCENARIOS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''))
    .sort();
}

// ── Table rendering (terminal with ANSI) ──

function padRight(str, len) {
  const stripped = str.replace(/\x1b\[[0-9;]*m/g, '');
  const padding = Math.max(0, len - stripped.length);
  return str + ' '.repeat(padding);
}

function padCenter(str, len) {
  const stripped = str.replace(/\x1b\[[0-9;]*m/g, '');
  const total = Math.max(0, len - stripped.length);
  const left = Math.floor(total / 2);
  const right = total - left;
  return ' '.repeat(left) + str + ' '.repeat(right);
}

function renderTable(headers, rows, colWidths) {
  const lines = [];
  const top = '\u250c' + colWidths.map(w => '\u2500'.repeat(w + 2)).join('\u252c') + '\u2510';
  const mid = '\u251c' + colWidths.map(w => '\u2500'.repeat(w + 2)).join('\u253c') + '\u2524';
  const bot = '\u2514' + colWidths.map(w => '\u2500'.repeat(w + 2)).join('\u2534') + '\u2518';

  lines.push(top);
  lines.push(
    '\u2502 ' + headers.map((h, i) => padRight(`${BOLD}${h}${RESET}`, colWidths[i])).join(' \u2502 ') + ' \u2502'
  );
  lines.push(mid);
  for (const row of rows) {
    lines.push(
      '\u2502 ' + row.map((cell, i) => padRight(cell, colWidths[i])).join(' \u2502 ') + ' \u2502'
    );
  }
  lines.push(bot);
  return lines.join('\n');
}

// ── Markdown table rendering ──

function mdTable(headers, rows) {
  const colWidths = headers.map((h, i) => {
    let max = h.length;
    for (const row of rows) {
      if (row[i] && row[i].length > max) max = row[i].length;
    }
    return max;
  });

  const lines = [];
  lines.push('| ' + headers.map((h, i) => h.padEnd(colWidths[i])).join(' | ') + ' |');
  lines.push('| ' + colWidths.map(w => '-'.repeat(w)).join(' | ') + ' |');
  for (const row of rows) {
    lines.push('| ' + row.map((cell, i) => (cell || '').padEnd(colWidths[i])).join(' | ') + ' |');
  }
  return lines.join('\n');
}

// ── Core report logic ──

function analyzeModel(log, cenario) {
  if (!log) {
    return {
      available: false,
      statusExecucao: null,
      turnos: null,
      condicaoDeParada: null,
      latenciaMediaMs: null,
      latenciaMaxMs: null,
      errosParse: null,
      invariantes: null,
      falhas: [],
    };
  }

  const inv = runInvariants(log, cenario);

  const falhasDetalhadas = [];
  for (const [name, res] of Object.entries(inv.results)) {
    if (!res.ok) {
      for (const f of res.falhas) {
        falhasDetalhadas.push({ invariante: name, detalhe: f });
      }
    }
  }

  return {
    available: true,
    statusExecucao: log.statusExecucao || 'desconhecido',
    turnos: log.metricas?.turnosExecutados ?? log.turnos?.length ?? 0,
    condicaoDeParada: log.condicaoDeParada || '—',
    latenciaMediaMs: log.metricas?.latenciaMediaMs ?? null,
    latenciaMaxMs: log.metricas?.latenciaMaxMs ?? null,
    errosParse: log.metricas?.errosParse ?? 0,
    invariantes: inv,
    falhas: falhasDetalhadas,
  };
}

function formatLatencia(ms) {
  if (ms == null) return '—';
  return (ms / 1000).toFixed(1) + 's';
}

function statusIcon(ok) {
  return ok ? `${GREEN}\u2705 ok${RESET}` : `${RED}\u274c fail${RESET}`;
}

function invIcon(ok) {
  return ok ? `${GREEN}\u2705${RESET}` : `${RED}\u274c${RESET}`;
}

function mdStatusIcon(ok) {
  return ok ? '\u2705 ok' : '\u274c fail';
}

function mdInvIcon(ok) {
  return ok ? '\u2705' : '\u274c';
}

function generateReport(cenarioId) {
  const cenario = loadCenario(cenarioId);
  if (!cenario) return null;

  const now = new Date().toISOString();
  const modelData = {};

  for (const m of MODELS) {
    const log = loadFrozenLog(cenarioId, m.slug);
    modelData[m.slug] = {
      log,
      analysis: analyzeModel(log, cenario),
    };
  }

  // ── Terminal output ──
  printTerminal(cenarioId, cenario, modelData, now);

  // ── Build report.json ──
  const reportJson = buildReportJson(cenarioId, cenario, modelData, now);

  // ── Build report.md ──
  const reportMd = buildReportMd(cenarioId, cenario, modelData, now);

  // ── Save files ──
  const outDir = path.join(FROZEN_DIR, cenarioId);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(reportJson, null, 2) + '\n');
  writeFileSync(path.join(outDir, 'report.md'), reportMd);
  console.log(`\n${DIM}Saved: ${path.join(outDir, 'report.json')}${RESET}`);
  console.log(`${DIM}Saved: ${path.join(outDir, 'report.md')}${RESET}`);

  return reportJson;
}

// ── Terminal output ──

function printTerminal(cenarioId, cenario, modelData, now) {
  const boxWidth = 55;
  const title = `RELAT\u00d3RIO: ${cenarioId} (v${cenario.versao})`;
  const dateLine = `Executado em: ${now.slice(0, 19).replace('T', ' ')}`;

  console.log('');
  console.log(`${CYAN}\u2554${'═'.repeat(boxWidth)}\u2557${RESET}`);
  console.log(`${CYAN}\u2551${RESET}  ${BOLD}${title}${RESET}${' '.repeat(Math.max(0, boxWidth - title.length - 2))}${CYAN}\u2551${RESET}`);
  console.log(`${CYAN}\u2551${RESET}  ${DIM}${dateLine}${RESET}${' '.repeat(Math.max(0, boxWidth - dateLine.length - 2))}${CYAN}\u2551${RESET}`);
  console.log(`${CYAN}\u2560${'═'.repeat(boxWidth)}\u2563${RESET}`);
  console.log('');

  // ── Metrics table ──
  const metricLabels = [
    'Status',
    'Turnos executados',
    'Condi\u00e7\u00e3o de parada',
    'Lat\u00eancia m\u00e9dia',
    'Lat\u00eancia m\u00e1xima',
    'Erros de parse',
  ];
  const modelHeaders = ['M\u00e9trica', ...MODELS.map(m => m.label)];
  const modelColWidths = [21, ...MODELS.map(m => Math.max(m.label.length, 15))];

  const metricRows = [];
  for (const label of metricLabels) {
    const row = [label];
    for (const m of MODELS) {
      const a = modelData[m.slug].analysis;
      if (!a.available) {
        row.push(`${DIM}\u2014 (no log)${RESET}`);
        continue;
      }
      switch (label) {
        case 'Status':
          row.push(statusIcon(a.statusExecucao === 'concluida'));
          break;
        case 'Turnos executados':
          row.push(String(a.turnos));
          break;
        case 'Condi\u00e7\u00e3o de parada':
          row.push(a.condicaoDeParada);
          break;
        case 'Lat\u00eancia m\u00e9dia':
          row.push(formatLatencia(a.latenciaMediaMs));
          break;
        case 'Lat\u00eancia m\u00e1xima':
          row.push(formatLatencia(a.latenciaMaxMs));
          break;
        case 'Erros de parse':
          row.push(a.errosParse > 0 ? `${RED}${a.errosParse}${RESET}` : `${GREEN}${a.errosParse}${RESET}`);
          break;
      }
    }
    metricRows.push(row);
  }
  console.log(renderTable(modelHeaders, metricRows, modelColWidths));
  console.log('');

  // ── Invariants table ──
  const requestedInvariants = cenario.invariantes || [];
  if (requestedInvariants.length > 0) {
    const invHeaders = ['Invariante', ...MODELS.map(m => m.label)];
    const invColWidths = [37, ...MODELS.map(m => Math.max(m.label.length, 8))];

    const invRows = [];
    for (const invName of requestedInvariants) {
      const row = [invName];
      for (const m of MODELS) {
        const a = modelData[m.slug].analysis;
        if (!a.available) {
          row.push(`${DIM}\u2014${RESET}`);
          continue;
        }
        const invResult = a.invariantes.results[invName];
        if (!invResult) {
          row.push(`${YELLOW}?${RESET}`);
        } else {
          row.push(invIcon(invResult.ok));
        }
      }
      invRows.push(row);
    }
    console.log(renderTable(invHeaders, invRows, invColWidths));
    console.log('');
  }

  // ── Detailed failures ──
  const anyFailures = MODELS.some(m => modelData[m.slug].analysis.falhas.length > 0);
  if (anyFailures) {
    console.log(`${RED}${BOLD}FALHAS DETALHADAS:${RESET}`);
    for (const m of MODELS) {
      const a = modelData[m.slug].analysis;
      if (a.falhas.length === 0) continue;
      for (const f of a.falhas) {
        console.log(`  ${YELLOW}[${m.label}]${RESET} ${BOLD}${f.invariante}${RESET}`);
        console.log(`    ${f.detalhe}`);
      }
    }
    console.log('');
  }

  // ── Summary line ──
  const summaryParts = [];
  for (const m of MODELS) {
    const a = modelData[m.slug].analysis;
    if (!a.available) {
      summaryParts.push(`${m.label} \u2014 (no log)`);
      continue;
    }
    const total = a.invariantes.total;
    const passed = a.invariantes.passed;
    if (passed === total) {
      summaryParts.push(`${GREEN}${m.label} ${passed}/${total} \u2705${RESET}`);
    } else {
      summaryParts.push(`${YELLOW}${m.label} ${passed}/${total} \u26a0\ufe0f${RESET}`);
    }
  }
  console.log(`${BOLD}RESUMO:${RESET} ${summaryParts.join(' | ')}`);
}

// ── report.json builder ──

function buildReportJson(cenarioId, cenario, modelData, now) {
  const report = {
    cenarioId,
    cenarioVersao: cenario.versao,
    geradoEm: now,
    modelos: {},
  };

  for (const m of MODELS) {
    const a = modelData[m.slug].analysis;
    if (!a.available) {
      report.modelos[m.slug] = {
        statusExecucao: 'sem_log',
        turnos: null,
        latenciaMediaMs: null,
        invariantes: null,
        falhas: [],
      };
      continue;
    }

    report.modelos[m.slug] = {
      statusExecucao: a.statusExecucao,
      turnos: a.turnos,
      latenciaMediaMs: a.latenciaMediaMs,
      invariantes: {
        total: a.invariantes.total,
        passaram: a.invariantes.passed,
        falharam: a.invariantes.failed,
      },
      falhas: a.falhas.map(f => ({
        invariante: f.invariante,
        detalhe: f.detalhe,
      })),
    };
  }

  return report;
}

// ── report.md builder ──

function buildReportMd(cenarioId, cenario, modelData, now) {
  const lines = [];

  lines.push(`# Relat\u00f3rio: ${cenarioId} (v${cenario.versao})`);
  lines.push('');
  lines.push(`**Gerado em:** ${now.slice(0, 19).replace('T', ' ')}`);
  lines.push('');

  // ── Metrics table ──
  lines.push('## M\u00e9tricas');
  lines.push('');

  const metricHeaders = ['M\u00e9trica', ...MODELS.map(m => m.label)];
  const metricRows = [];
  const metricLabels = [
    'Status',
    'Turnos executados',
    'Condi\u00e7\u00e3o de parada',
    'Lat\u00eancia m\u00e9dia',
    'Lat\u00eancia m\u00e1xima',
    'Erros de parse',
  ];

  for (const label of metricLabels) {
    const row = [label];
    for (const m of MODELS) {
      const a = modelData[m.slug].analysis;
      if (!a.available) {
        row.push('\u2014 (no log)');
        continue;
      }
      switch (label) {
        case 'Status':
          row.push(mdStatusIcon(a.statusExecucao === 'concluida'));
          break;
        case 'Turnos executados':
          row.push(String(a.turnos));
          break;
        case 'Condi\u00e7\u00e3o de parada':
          row.push(a.condicaoDeParada);
          break;
        case 'Lat\u00eancia m\u00e9dia':
          row.push(formatLatencia(a.latenciaMediaMs));
          break;
        case 'Lat\u00eancia m\u00e1xima':
          row.push(formatLatencia(a.latenciaMaxMs));
          break;
        case 'Erros de parse':
          row.push(String(a.errosParse));
          break;
      }
    }
    metricRows.push(row);
  }
  lines.push(mdTable(metricHeaders, metricRows));
  lines.push('');

  // ── Invariants table ──
  const requestedInvariants = cenario.invariantes || [];
  if (requestedInvariants.length > 0) {
    lines.push('## Invariantes');
    lines.push('');

    const invHeaders = ['Invariante', ...MODELS.map(m => m.label)];
    const invRows = [];
    for (const invName of requestedInvariants) {
      const row = [invName];
      for (const m of MODELS) {
        const a = modelData[m.slug].analysis;
        if (!a.available) {
          row.push('\u2014');
          continue;
        }
        const invResult = a.invariantes.results[invName];
        if (!invResult) {
          row.push('?');
        } else {
          row.push(mdInvIcon(invResult.ok));
        }
      }
      invRows.push(row);
    }
    lines.push(mdTable(invHeaders, invRows));
    lines.push('');
  }

  // ── Detailed failures ──
  const anyFailures = MODELS.some(m => modelData[m.slug].analysis.falhas.length > 0);
  if (anyFailures) {
    lines.push('## Falhas Detalhadas');
    lines.push('');
    for (const m of MODELS) {
      const a = modelData[m.slug].analysis;
      if (a.falhas.length === 0) continue;
      for (const f of a.falhas) {
        lines.push(`- **[${m.label}]** \`${f.invariante}\``);
        lines.push(`  - ${f.detalhe}`);
      }
    }
    lines.push('');
  }

  // ── Veredito por modelo ──
  lines.push('## Veredito por modelo');
  lines.push('');
  for (const m of MODELS) {
    const a = modelData[m.slug].analysis;
    if (!a.available) {
      lines.push(`- **${m.label}**: \u2014 (sem log dispon\u00edvel)`);
      continue;
    }
    const total = a.invariantes.total;
    const passed = a.invariantes.passed;
    const icon = passed === total ? '\u2705' : '\u26a0\ufe0f';
    lines.push(`- **${m.label}**: ${passed}/${total} invariantes ${icon}`);
    if (a.falhas.length > 0) {
      lines.push(`  - Falhas: ${a.falhas.map(f => f.invariante).join(', ')}`);
    }
  }
  lines.push('');

  // ── Summary ──
  lines.push('## Resumo');
  lines.push('');
  const summaryParts = [];
  for (const m of MODELS) {
    const a = modelData[m.slug].analysis;
    if (!a.available) {
      summaryParts.push(`${m.label} \u2014 (no log)`);
      continue;
    }
    const total = a.invariantes.total;
    const passed = a.invariantes.passed;
    const icon = passed === total ? '\u2705' : '\u26a0\ufe0f';
    summaryParts.push(`${m.label} ${passed}/${total} ${icon}`);
  }
  lines.push(summaryParts.join(' | '));
  lines.push('');

  return lines.join('\n');
}

// ── Main ──

function main() {
  const opts = parseArgs();

  if (opts.all) {
    const cenarios = listAllCenarios();
    if (cenarios.length === 0) {
      console.error(`${YELLOW}No scenario fixtures found in ${SCENARIOS_DIR}${RESET}`);
      process.exit(1);
    }
    console.log(`${BOLD}Running reports for ${cenarios.length} scenario(s)...${RESET}\n`);
    for (const id of cenarios) {
      generateReport(id);
      console.log('');
    }
  } else {
    generateReport(opts.cenarioId);
  }
}

main();
