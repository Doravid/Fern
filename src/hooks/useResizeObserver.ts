// hooks/useResizeObserver.ts
import { useState, useEffect, useRef } from 'react';

export function useResizeObserver<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const observeTarget = ref.current;
    if (!observeTarget) return;

    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(observeTarget);

    // Cleanup observer on component unmount
    return () => {
      observer.unobserve(observeTarget);
    };
  }, [ref]);

  return { ref, dimensions };
}