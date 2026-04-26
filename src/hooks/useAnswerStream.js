import { useRef, useState, useCallback } from 'react';
import { streamPost } from '../lib/api.js';

export function useAnswerStream() {
  const [text, setText] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState(null);
  const ctrlRef = useRef(null);

  const stop = useCallback(() => {
    ctrlRef.current?.abort();
    ctrlRef.current = null;
    setStreaming(false);
  }, []);

  const ask = useCallback(async (url, body) => {
    stop();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setText('');
    setError(null);
    setStreaming(true);
    try {
      await streamPost(url, body, (full) => setText(full), ctrl.signal);
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message);
    } finally {
      if (ctrlRef.current === ctrl) ctrlRef.current = null;
      setStreaming(false);
    }
  }, [stop]);

  const reset = () => {
    stop();
    setText('');
    setError(null);
  };

  return { text, streaming, error, ask, stop, reset, setText };
}
