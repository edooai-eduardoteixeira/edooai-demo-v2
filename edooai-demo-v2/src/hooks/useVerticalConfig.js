import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getVerticalConfig } from '../config/index.js';

export function useVerticalConfig() {
  const [searchParams] = useSearchParams();
  const vertical = searchParams.get('vertical') || 'neobank';

  const config = useMemo(() => getVerticalConfig(vertical), [vertical]);

  return config;
}
