import { useState, useEffect, useRef, useCallback } from 'react';
import { LEVEL_CONFIG } from '../utils/gameEngine';

export default function useGameTimer(level, onTimeUp) {
  const total     = LEVEL_CONFIG[level]?.timeLimit || 60;
  const [secs, setSecs]     = useState(total);
  const [running, setRunning] = useState(true);
  const ref    = useRef(null);
  const cbRef  = useRef(onTimeUp);
  cbRef.current = onTimeUp;

  useEffect(() => {
    if (!running) return;
    ref.current = setInterval(() => {
      setSecs(prev => {
        if (prev <= 1) {
          clearInterval(ref.current);
          setRunning(false);
          cbRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current);
  }, [running]);

  const pause  = useCallback(() => { clearInterval(ref.current); setRunning(false); }, []);
  const resume = useCallback(() => setRunning(true), []);
  const stop   = useCallback(() => { clearInterval(ref.current); setRunning(false); }, []);

  return { secs, total, percent: secs / total, running, pause, resume, stop };
}
