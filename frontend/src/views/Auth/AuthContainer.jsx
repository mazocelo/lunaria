import React, { useState } from 'react';
import LoginView from './LoginView';
import RegisterView from './RegisterView';

const AuthContainer = () => {
  const [currentView, setCurrentView] = useState('login'); // 'login' ou 'register'
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleSwitchToRegister = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentView('register');
      setIsTransitioning(false);
    }, 150);
  };

  const handleSwitchToLogin = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentView('login');
      setIsTransitioning(false);
    }, 150);
  };

  return (
    <div className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
      {currentView === 'register' ? (
        <RegisterView onSwitchToLogin={handleSwitchToLogin} />
      ) : (
        <LoginView onSwitchToRegister={handleSwitchToRegister} />
      )}
    </div>
  );
};

export default AuthContainer; 