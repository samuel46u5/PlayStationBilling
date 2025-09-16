import { useEffect } from 'react';

export function useRFIDReader(onUID: (uid: string) => void, terminator: string = 'Enter') {
  useEffect(() => {
    let buffer = '';
    let lastTime = 0;

    const onKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      const isScannerBurst = now - lastTime < 50; // ketikan cepat dari scanner
      lastTime = now;

      if (e.key === terminator) {
        const uid = buffer.trim();
        if (uid) onUID(uid);
        buffer = '';
        return;
      }

      if (isScannerBurst && e.key.length === 1 && /[0-9a-zA-Z]/.test(e.key)) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onUID, terminator]);
}


