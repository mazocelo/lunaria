import React from 'react';

/**
 * Componente para renderizar markdown nas mensagens do Mestre
 * 
 * Suporta:
 * - Cabeçalhos: # H1, ## H2, ### H3
 * - Títulos centralizados: **texto**
 * - Listas: - item
 * - Negrito inline: **texto**
 * - Itálico inline: *texto*
 * - Quebras de linha
 */
const MarkdownRenderer = ({ children, className = '' }) => {
  if (!children) return null;
  
  const text = typeof children === 'string' ? children : String(children);
  
  // Processar markdown manualmente
  const lines = text.split('\n');
  
  // Normalizar formatação irregular antes de processar
  const linesNormalizadas = lines.map(line => {
    let lineLimpa = line.trim();
    
    // Padrões irregulares de lista:
    // "Texto** → - Texto
    // *Texto** → - Texto  
    // "Texto" → - Texto
    
    // Detectar se parece lista (começa com aspas ou asterisco único)
    if (lineLimpa.match(/^["'].*\*\*?$/)) {
      // Remover aspas iniciais
      lineLimpa = lineLimpa.replace(/^["']/, '');
      // Remover asteriscos finais
      lineLimpa = lineLimpa.replace(/\*+$/, '');
      // Adicionar marcador de lista
      return `- ${lineLimpa}`;
    }
    
    if (lineLimpa.match(/^\*[^*].*\*\*$/)) {
      // Remove * inicial e ** final
      lineLimpa = lineLimpa.replace(/^\*/, '').replace(/\*\*$/, '');
      return `- ${lineLimpa}`;
    }
    
    return line;
  });
  
  const elements = [];
  let currentList = [];
  let key = 0;
  
  const getKey = () => `md-${key++}`;
  
  linesNormalizadas.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // Cabeçalhos Markdown (# ## ###)
    if (trimmedLine.match(/^#{1,3}\s+/)) {
      // Fechar lista anterior se existir
      if (currentList.length > 0) {
        elements.push(renderList(currentList, getKey()));
        currentList = [];
      }
      
      // Contar nível do cabeçalho
      const match = trimmedLine.match(/^(#{1,3})\s+(.+)/);
      if (match) {
        const nivel = match[1].length;
        const texto = match[2];
        
        // Estilos por nível
        const estilos = {
          1: "text-3xl font-bold mb-4 mt-6 bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 bg-clip-text text-transparent drop-shadow-lg",
          2: "text-2xl font-bold mb-3 mt-5 text-purple-300 drop-shadow-md",
          3: "text-xl font-semibold mb-2 mt-4 text-cyan-300"
        };
        
        elements.push(
          <div key={getKey()} className={estilos[nivel]}>
            {texto}
          </div>
        );
      }
    }
    // Títulos (linhas que começam e terminam com **)
    else if (trimmedLine.match(/^\*\*.*\*\*$/)) {
      // Fechar lista anterior se existir
      if (currentList.length > 0) {
        elements.push(renderList(currentList, getKey()));
        currentList = [];
      }
      
      const title = trimmedLine.replace(/^\*\*|\*\*$/g, '');
      elements.push(
        <div key={getKey()} className="text-center font-bold text-2xl mb-4 mt-5 bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 bg-clip-text text-transparent drop-shadow-lg">
          {title}
        </div>
      );
    }
    // Listas com -
    else if (line.trim().startsWith('- ')) {
      currentList.push(line.trim().substring(2));
    }
    // Parágrafo normal
    else if (line.trim()) {
      // Fechar lista anterior se existir
      if (currentList.length > 0) {
        elements.push(renderList(currentList, getKey()));
        currentList = [];
      }
      
      // Processar formatação inline (negrito, itálico)
      const formatted = processInlineFormatting(line);
      elements.push(
        <p key={getKey()} className="mb-2 leading-relaxed">
          {formatted}
        </p>
      );
    }
    // Linha vazia (espaçamento) - só adiciona se houver elementos antes
    else if (!line.trim() && elements.length > 0) {
      elements.push(<div key={getKey()} className="h-2" />);
    }
  });
  
  // Fechar lista final se existir
  if (currentList.length > 0) {
    elements.push(renderList(currentList, getKey()));
  }
  
  return <div className={className}>{elements}</div>;
};

/**
 * Renderiza uma lista HTML a partir de itens
 */
function renderList(items, key) {
  return (
    <ul key={key} className="list-none space-y-2 ml-2 mb-4 mt-3">
      {items.map((item, i) => (
        <li key={i} className="leading-relaxed flex items-start">
          <span className="text-cyan-400 mr-3 text-lg flex-shrink-0">▸</span>
          <span className="text-cyan-50">
            {processInlineFormatting(item)}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Processa formatação inline: **negrito** e *itálico*
 */
function processInlineFormatting(text) {
  const parts = [];
  let current = '';
  let i = 0;
  let partKey = 0;
  
  while (i < text.length) {
    // Detectar **negrito**
    if (text[i] === '*' && text[i + 1] === '*') {
      // Salvar texto anterior
      if (current) {
        parts.push(<span key={`text-${partKey++}`}>{current}</span>);
        current = '';
      }
      
      // Encontrar fim do negrito
      let j = i + 2;
      let boldText = '';
      let found = false;
      
      while (j < text.length) {
        if (text[j] === '*' && text[j + 1] === '*') {
          parts.push(
            <strong key={`bold-${partKey++}`} className="font-bold text-yellow-200">
              {boldText}
            </strong>
          );
          i = j + 2;
          found = true;
          break;
        }
        boldText += text[j];
        j++;
      }
      
      // Se não encontrou fechamento, adiciona como texto normal
      if (!found) {
        current += '**';
        i += 2;
      }
    }
    // Detectar *itálico* (só se não for parte de **)
    else if (text[i] === '*' && text[i + 1] !== '*' && (i === 0 || text[i - 1] !== '*')) {
      // Salvar texto anterior
      if (current) {
        parts.push(<span key={`text-${partKey++}`}>{current}</span>);
        current = '';
      }
      
      // Encontrar fim do itálico
      let j = i + 1;
      let italicText = '';
      let found = false;
      
      while (j < text.length) {
        if (text[j] === '*' && (j === text.length - 1 || text[j + 1] !== '*')) {
          parts.push(
            <em key={`italic-${partKey++}`} className="italic text-purple-300">
              {italicText}
            </em>
          );
          i = j + 1;
          found = true;
          break;
        }
        italicText += text[j];
        j++;
      }
      
      // Se não encontrou fechamento, adiciona como texto normal
      if (!found) {
        current += '*';
        i++;
      }
    }
    else {
      current += text[i];
      i++;
    }
  }
  
  // Adicionar texto restante
  if (current) {
    parts.push(<span key={`text-${partKey++}`}>{current}</span>);
  }
  
  return parts.length > 0 ? parts : text;
}

export default MarkdownRenderer;

