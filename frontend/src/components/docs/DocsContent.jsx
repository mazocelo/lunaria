import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/theme.jsx';

export default function DocsContent({ section, slug }) {
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const isLight = theme === 'light';

  useEffect(() => {
    setLoading(true);
    fetch(`/docs/${section}/${slug}.html`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.text();
      })
      .then(setHtml)
      .catch(() => setHtml('<p>Documento não encontrado.</p>'))
      .finally(() => setLoading(false));
  }, [section, slug]);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-400">Carregando...</div>;
  }

  return (
    <article
      className={`docs-content max-w-none px-8 py-6 ${
        isLight ? 'text-slate-800' : 'text-slate-200'
      }`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
