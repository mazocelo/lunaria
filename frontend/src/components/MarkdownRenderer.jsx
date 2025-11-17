import React from 'react';

/**
 * Componente para renderizar markdown nas mensagens do Mestre
 * Suporta: títulos (**texto**), listas (- item), negrito inline, quebras de linha
 */
const MarkdownRenderer = ({ children, className = '' }) => {
  if (!children) return null;
  
  const text = typeof children === 'string' ? children : String(children);
  
  // Processar markdown manualmente
  const lines = text.split('\n');
  const elements = [];
  let currentList = [];
  let key = 0;
  
  const getKey = () => `md-${key++}`;
  
  lines.forEach((line, index) => {
    // Títulos (linhas que começam e terminam com **)
    if (line.trim().match(/^\*\*.*\*\*$/)) {
      // Fechar lista anterior se existir
      if (currentList.length > 0) {
        elements.push(renderList(currentList, getKey()));
        currentList = [];
      }
      
      const title = line.trim().replace(/^\*\*|\*\*$/g, '');
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
      while (j < text.length - 1) {
        if (text[j] === '*' && text[j + 1] === '*') {
          parts.push(
            <strong key={`bold-${partKey++}`} className="font-bold text-yellow-200">
              {boldText}
            </strong>
          );
          i = j + 2;
          break;
        }
        boldText += text[j];
        j++;
      }
      
      // Se não encontrou fechamento, adiciona como texto normal
      if (j >= text.length - 1) {
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
      while (j < text.length) {
        if (text[j] === '*' && (j === text.length - 1 || text[j + 1] !== '*')) {
          parts.push(
            <em key={`italic-${partKey++}`} className="italic text-purple-300">
              {italicText}
            </em>
          );
          i = j + 1;
          break;
        }
        italicText += text[j];
        j++;
      }
      
      // Se não encontrou fechamento, adiciona como texto normal
      if (j >= text.length) {
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

