import React, { createContext, useContext, useState } from 'react';

const LayoutContext = createContext();

export const LayoutProvider = ({ children }) => {
  const [showSidebar, setShowSidebar] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const hideSidebar = () => {
    setShowSidebar(false);
    setIsFullscreen(true);
  };

  const showSidebarFn = () => {
    setShowSidebar(true);
    setIsFullscreen(false);
  };

  return (
    <LayoutContext.Provider value={{
      showSidebar,
      isFullscreen,
      hideSidebar,
      openSidebar: showSidebarFn
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