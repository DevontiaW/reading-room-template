'use client';

import { useState, useEffect } from 'react';

const USER_KEY = 'bookclub_user';

export function useUser() {
  const [userName, setUserNameState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(USER_KEY);
    setUserNameState(stored);
    setIsLoading(false);
  }, []);

  const setUserName = (name: string) => {
    localStorage.setItem(USER_KEY, name);
    setUserNameState(name);
  };

  const clearUser = () => {
    localStorage.removeItem(USER_KEY);
    setUserNameState(null);
  };

  return {
    userName,
    isLoading,
    setUserName,
    clearUser,
    isLoggedIn: !!userName,
  };
}
