import React, { createContext, useContext, useState, useCallback } from 'react';

const LayoutContext = createContext();

export const LayoutProvider = ({ children }) => {
  const [showSidebar, setShowSidebar] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebar-collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const hideSidebar = () => {
    setShowSidebar(false);
    setIsFullscreen(true);
  };

  const showSidebarFn = () => {
    setShowSidebar(true);
    setIsFullscreen(false);
  };

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('sidebar-collapsed', String(next)); } catch {}
      return next;
    });
  }, []);

  return (
    <LayoutContext.Provider value={{
      showSidebar,
      isFullscreen,
      hideSidebar,
      openSidebar: showSidebarFn,
      sidebarCollapsed,
      toggleSidebar
    }}>
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout deve ser usado dentro de um LayoutProvider');
  }
  return context;
};

export default LayoutProvider;
