import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

export interface LayoutContextValue {
  showSidebar: boolean;
  isFullscreen: boolean;
  setIsFullscreen: (value: boolean) => void;
  hideSidebar: () => void;
  openSidebar: () => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

const LayoutContext = createContext<LayoutContextValue | null>(null);

interface LayoutProviderProps {
  children: ReactNode;
}

export const LayoutProvider = ({ children }: LayoutProviderProps) => {
  const [showSidebar, setShowSidebar] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
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

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && !sidebarCollapsed) {
        setSidebarCollapsed(true);
      }
    };
    handleResize(); // Check on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar-collapsed', String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return (
    <LayoutContext.Provider
      value={{
        showSidebar,
        isFullscreen,
        setIsFullscreen,
        hideSidebar,
        openSidebar: showSidebarFn,
        sidebarCollapsed,
        toggleSidebar,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = (): LayoutContextValue => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout deve ser usado dentro de um LayoutProvider');
  }
  return context;
};

export default LayoutProvider;
