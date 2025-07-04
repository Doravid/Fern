import { useEffect, useRef, useState } from 'react';

interface WasmComponentProps {
  width?: number;
  height?: number;
}

export default function WasmComponent({ width = 800, height = 600 }: WasmComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadingState, setLoadingState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    let script: HTMLScriptElement | null = null;
    
    const loadWasm = async () => {
      try {
        setLoadingState('loading');
        
        // Configure Emscripten module before loading the script
        (window as any).Module = {
          canvas: (() => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            
            // Ensure canvas is fully visible and responsive
            canvas.style.display = 'block';
            canvas.style.maxWidth = '100%';
            canvas.style.maxHeight = '100%';
            canvas.style.objectFit = 'contain';
            canvas.style.margin = '0 auto';
            
            containerRef.current?.appendChild(canvas);
            return canvas;
          })(),
          onRuntimeInitialized: () => {
            console.log('WASM module initialized');
            setLoadingState('loaded');
          },
          locateFile: (path: string) => {
            if (path.endsWith('.wasm')) {
              return '/index.wasm';
            }
            return path;
          }
        };

        // Load the Emscripten-generated script
        script = document.createElement('script');
        script.src = '/index.js';
        script.onload = () => {
          console.log('WASM script loaded');
        };
        script.onerror = (error) => {
          console.error('Failed to load WASM script:', error);
          setLoadingState('error');
          setErrorMessage('Failed to load WASM script');
        };
        document.head.appendChild(script);
      } catch (error) {
        console.error('Failed to load WASM module:', error);
        setLoadingState('error');
        setErrorMessage('Failed to load WASM module');
      }
    };

    loadWasm();

    return () => {
      if (script && script.parentNode) {
        document.head.removeChild(script);
      }
      delete (window as any).Module;
      const canvas = containerRef.current?.querySelector('canvas');
      if (canvas) {
        canvas.remove();
      }
    };
  }, [width, height]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: 'auto',
        minHeight: `${height}px`,
        border: '1px solid #ccc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'auto', // Allow scrolling if needed
        position: 'relative'
      }}
    >
      {loadingState === 'loading' && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: '20px',
          borderRadius: '8px',
          zIndex: 1000
        }}>
          Loading WASM module...
        </div>
      )}
      {loadingState === 'error' && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(255, 0, 0, 0.1)',
          color: 'red',
          padding: '20px',
          borderRadius: '8px',
          textAlign: 'center',
          zIndex: 1000
        }}>
          <div>Error loading WASM module</div>
          <div style={{ fontSize: '14px', marginTop: '8px' }}>{errorMessage}</div>
        </div>
      )}
    </div>
  );
}