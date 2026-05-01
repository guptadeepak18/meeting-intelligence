'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect } from 'react';
import { setApiAuthTokenGetter } from '../lib/api';

export function ApiAuthBridge() {
  const { getToken } = useAuth();

  useEffect(() => {
    setApiAuthTokenGetter(() => getToken());

    return () => {
      setApiAuthTokenGetter(null);
    };
  }, [getToken]);

  return null;
}