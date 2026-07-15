import { useContext } from 'react';

import { AuthContext } from '@/auth/AuthContext';

export const useAuthSession = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuthSession must be used inside AuthProvider');
  }

  return context;
};
