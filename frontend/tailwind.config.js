/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'fantasy': ['"EB Garamond"', 'serif'],
        'modern': ['"DM Sans"', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-in-left': 'slideInLeft 0.6s ease-out',
        'slide-in-right': 'slideInRight 0.6s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: {
          'from': { opacity: '0', transform: 'translateY(20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          'from': { opacity: '0', transform: 'translateX(-30px)' },
          'to': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          'from': { opacity: '0', transform: 'translateX(30px)' },
          'to': { opacity: '1', transform: 'translateX(0)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200px 0' },
          '100%': { backgroundPosition: 'calc(200px + 100%) 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(139, 92, 246, 0.6)' },
        },
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.glass': {
          background: 'rgba(30, 41, 59, 0.7)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
        },
        '.glass-strong': {
          background: 'rgba(30, 41, 59, 0.9)',
          backdropFilter: 'blur(30px)',
          border: '1px solid rgba(148, 163, 184, 0.3)',
        },
        /* Modo Light - Classes específicas */
        '.glass-light': {
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
        },
        '.glass-strong-light': {
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(30px)',
          border: '1px solid rgba(148, 163, 184, 0.3)',
        },
        '.gradient-primary': {
          background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #06b6d4 100%)',
        },
        '.gradient-secondary': {
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
        },
        '.gradient-accent': {
          background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 50%, #0e7490 100%)',
        },
        '.gradient-dark': {
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        },
        /* Modo Light - Gradientes suaves */
        '.gradient-light': {
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
        },
        '.gradient-light-warm': {
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fcd34d 100%)',
        },
        '.hover-lift': {
          transition: 'all 0.3s ease',
        },
        '.hover-lift:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 20px 40px rgba(139, 92, 246, 0.2)',
        },
        '.hover-glow:hover': {
          boxShadow: '0 0 30px rgba(139, 92, 246, 0.4)',
        },
        '.font-fantasy': {
          fontFamily: "'EB Garamond', serif",
        },
        '.font-modern': {
          fontFamily: "'DM Sans', sans-serif",
        },
        '.border-glow': {
          border: '2px solid transparent',
          background: 'linear-gradient(135deg, #8b5cf6, #6366f1, #06b6d4) border-box',
          WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'destination-out',
          maskComposite: 'exclude',
        },
        '.btn-rpg': {
          position: 'relative',
          overflow: 'hidden',
          padding: '0.75rem 1.5rem',
          borderRadius: '0.5rem',
          fontWeight: '600',
          transition: 'all 0.3s',
          background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
          border: 'none',
          color: 'white',
        },
        '.btn-rpg::before': {
          content: '""',
          position: 'absolute',
          top: '0',
          left: '-100%',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
          transition: 'left 0.5s',
        },
        '.btn-rpg:hover::before': {
          left: '100%',
        },
        '.btn-rpg:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 10px 25px rgba(139, 92, 246, 0.4)',
        },
        /* Modo Light - Botão suave */
        '.btn-rpg-light': {
          position: 'relative',
          overflow: 'hidden',
          padding: '0.75rem 1.5rem',
          borderRadius: '0.5rem',
          fontWeight: '600',
          transition: 'all 0.3s',
          background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
          border: 'none',
          color: 'white',
        },
        '.btn-rpg-light::before': {
          content: '""',
          position: 'absolute',
          top: '0',
          left: '-100%',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
          transition: 'left 0.5s',
        },
        '.btn-rpg-light:hover::before': {
          left: '100%',
        },
        '.btn-rpg-light:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 10px 25px rgba(139, 92, 246, 0.3)',
        },
        '.card-rpg': {
          background: 'rgba(30, 41, 59, 0.7)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          transition: 'all 0.3s',
        },
        '.card-rpg:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 20px 40px rgba(139, 92, 246, 0.15)',
          borderColor: 'rgba(139, 92, 246, 0.3)',
        },
       
        '.input-rpg': {
          background: 'rgba(30, 41, 59, 0.5)',
          border: '1px solid rgba(71, 85, 105, 0.5)',
          borderRadius: '0.5rem',
          padding: '0.75rem 1rem',
          color: 'white',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease',
        },
        '.input-rpg:focus': {
          outline: 'none',
          borderColor: '#8b5cf6',
          boxShadow: '0 0 0 3px rgba(139, 92, 246, 0.1)',
          background: 'rgba(30, 41, 59, 0.8)',
        },
        /* Modo Light - Input suave */
        '.input-rpg-light': {
          background: 'rgba(255, 255, 255, 0.8)',
          border: '1px solid rgba(148, 163, 184, 0.3)',
          borderRadius: '0.5rem',
          padding: '0.75rem 1rem',
          color: '#1e293b',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease',
        },
        '.input-rpg-light:focus': {
          outline: 'none',
          borderColor: '#8b5cf6',
          boxShadow: '0 0 0 3px rgba(139, 92, 246, 0.1)',
          background: 'rgba(255, 255, 255, 0.9)',
        },
        '.table-rpg': {
          width: '100%',
          borderRadius: '0.5rem',
          overflow: 'hidden',
          background: 'rgba(30, 41, 59, 0.6)',
          backdropFilter: 'blur(20px)',
        },
        '.table-rpg th': {
          background: 'rgba(30, 41, 59, 0.8)',
          color: 'white',
          fontWeight: '600',
          padding: '1rem 1.5rem',
          textAlign: 'left',
          borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
        },
        '.table-rpg td': {
          padding: '1rem 1.5rem',
          color: '#e2e8f0',
          borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
        },
        '.table-rpg tr:hover': {
          background: 'rgba(139, 92, 246, 0.1)',
        },
        /* Modo Light - Tabela suave */
        '.table-rpg-light': {
          width: '100%',
          borderRadius: '0.5rem',
          overflow: 'hidden',
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
        },
        '.table-rpg-light th': {
          background: 'rgba(255, 255, 255, 0.9)',
          color: '#1e293b',
          fontWeight: '600',
          padding: '1rem 1.5rem',
          textAlign: 'left',
          borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
        },
        '.table-rpg-light td': {
          padding: '1rem 1.5rem',
          color: '#475569',
          borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
        },
        '.table-rpg-light tr:hover': {
          background: 'rgba(139, 92, 246, 0.05)',
        },
        '.sidebar-rpg': {
          background: 'rgba(30, 41, 59, 0.9)',
          backdropFilter: 'blur(30px)',
          border: '1px solid rgba(148, 163, 184, 0.3)',
          borderRight: '1px solid rgba(148, 163, 184, 0.2)',
          boxShadow: '5px 0 20px rgba(0, 0, 0, 0.3)',
        },
        /* Modo Light - Sidebar suave */
        '.sidebar-rpg-light': {
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(30px)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          borderRight: '1px solid rgba(148, 163, 184, 0.1)',
          boxShadow: '5px 0 20px rgba(0, 0, 0, 0.1)',
        },
        '.shimmer': {
          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
          backgroundSize: '200px 100%',
          animation: 'shimmer 1.5s infinite',
        },
        /* Modo Light - Shimmer suave */
        '.shimmer-light': {
          background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.1), transparent)',
          backgroundSize: '200px 100%',
          animation: 'shimmer 1.5s infinite',
        },
        '.particles-bg': {
          position: 'fixed',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: '-1',
        },
        '.particle': {
          position: 'absolute',
          width: '2px',
          height: '2px',
          background: 'rgba(139, 92, 246, 0.6)',
          borderRadius: '50%',
          animation: 'float 8s ease-in-out infinite',
        },
        /* Modo Light - Partículas suaves */
        '.particle-light': {
          position: 'absolute',
          width: '2px',
          height: '2px',
          background: 'rgba(139, 92, 246, 0.3)',
          borderRadius: '50%',
          animation: 'float 8s ease-in-out infinite',
        },
      }
      addUtilities(newUtilities)
    }
  ],
} 