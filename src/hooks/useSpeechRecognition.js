import { useEffect, useRef, useState } from 'react';

/**
 * Wrapper around the browser Web Speech API.
 * Handles auto-restart, interim results, and unsupported environments.
 */
export function useSpeechRecognition({ onFinal, onInterim } = {}) {
  const recRef = useRef(null);
  const listeningRef = useRef(false);
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState(null);

  // keep latest callbacks
  const cbRef = useRef({ onFinal, onInterim });
  useEffect(() => {
    cbRef.current = { onFinal, onInterim };
  }, [onFinal, onInterim]);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) cbRef.current.onFinal?.(r[0].transcript.trim());
        else interim += r[0].transcript;
      }
      if (interim) cbRef.current.onInterim?.(interim);
    };
    rec.onerror = (e) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      setError(e.error);
    };
    rec.onend = () => {
      if (listeningRef.current) {
        try { rec.start(); } catch {}
      } else {
        setListening(false);
      }
    };

    recRef.current = rec;
    return () => {
      listeningRef.current = false;
      try { rec.stop(); } catch {}
    };
  }, []);

  const start = () => {
    if (!recRef.current) return;
    listeningRef.current = true;
    setListening(true);
    setError(null);
    try { recRef.current.start(); } catch {}
  };
  const stop = () => {
    listeningRef.current = false;
    setListening(false);
    try { recRef.current?.stop(); } catch {}
  };
  const toggle = () => (listening ? stop() : start());

  return { supported, listening, error, start, stop, toggle };
}
