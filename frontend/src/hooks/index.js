import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../services/api';

/** Run an async loader on mount / when deps change. Ignores stale responses. */
export function useAsync(loader, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const reqId = useRef(0);

  const run = useCallback(() => {
    const id = ++reqId.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    loader()
      .then((data) => id === reqId.current && setState({ data, loading: false, error: null }))
      .catch((err) => id === reqId.current && setState({ data: null, loading: false, error: getErrorMessage(err) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { run(); }, [run]);
  return { ...state, reload: run, setData: (data) => setState((s) => ({ ...s, data })) };
}

export function useDebounce(value, delay = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

const DEFAULT_DESC = 'CHOLAN WEAR - premium oversized, regular and customized t-shirts. Wear your identity.';

/** Per-page <title> and meta description (client-side SEO for the SPA). */
export function useSEO(title, description = DEFAULT_DESC) {
  useEffect(() => {
    document.title = title ? `${title} | CHOLAN WEAR` : 'CHOLAN WEAR | Premium Streetwear & Custom T-Shirts';
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = description.slice(0, 160);
  }, [title, description]);
}

export function useLockBodyScroll(locked) {
  useEffect(() => {
    if (!locked) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [locked]);
}

export function useEscape(handler, active = true) {
  useEffect(() => {
    if (!active) return undefined;
    const fn = (e) => e.key === 'Escape' && handler();
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [handler, active]);
}
