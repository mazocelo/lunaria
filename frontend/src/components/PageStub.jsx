import React from 'react';

const PageStub = ({ title = "Página", message = "Esta página será migrada em breve." }) => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="card-rpg text-center p-8">
        <h2 className="text-2xl font-bold text-white mb-4">🚧 {title}</h2>
        <p className="text-slate-300">{message}</p>
        <p className="text-slate-400 text-sm mt-2">Por favor, use a navegação para outras páginas.</p>
      </div>
    </div>
  );
};

export default PageStub;

