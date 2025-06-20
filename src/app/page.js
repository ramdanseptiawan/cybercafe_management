'use client';

import React from 'react';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../components/layout/MainLayout';
import { useCafeData } from '../hooks/useCafeData';

const CyberCafeManagement = () => {
  const { user, logout, isAdmin } = useAuth();
  const { 
    state, 
    handlers, 
    modals 
  } = useCafeData();

  return (
    <MainLayout 
      user={user}
      logout={logout}
      isAdmin={isAdmin}
      state={state}
      handlers={handlers}
      modals={modals}
    />
  );
};

export default CyberCafeManagement;