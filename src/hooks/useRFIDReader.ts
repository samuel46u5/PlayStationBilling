import { useEffect } from 'react';

export function useRFIDReader(onUID: (uid: string) => void, terminator: string = 'Enter') {
  useEffect(() => {
    let buffer = '';
    let timeoutId: number | undefined;

    const resetBuffer = () => {
      buffer = '';
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === terminator) {
        const uid = buffer.trim();
        if (uid) onUID(uid);
        resetBuffer();
        return;
      }

      if (e.key.length === 1 && /[0-9a-zA-Z]/.test(e.key)) {
        buffer += e.key;

        // Reset buffer jika tidak ada input baru dalam 500ms
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = window.setTimeout(resetBuffer, 500);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onUID, terminator]);
}
