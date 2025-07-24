import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "./ui/card";

interface WasmComponentProps {
  width?: number;
  height?: number;
}

export default function WasmComponent({
  width = 800,
  height = 600,
}: WasmComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadingState, setLoadingState] = useState<
    "loading" | "loaded" | "error"
  >("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    let script: HTMLScriptElement | null = null;

    const loadWasm = async () => {
      try {
        setLoadingState("loading");

        (window as any).Module = {
          canvas: (() => {
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;

            canvas.style.display = "block";
            canvas.style.maxWidth = "100%";
            canvas.style.maxHeight = "100%";
            canvas.style.objectFit = "contain";
            canvas.style.margin = "0 auto";
            canvas.className = "shadow-shadow border-2 border-border";

            containerRef.current?.appendChild(canvas);
            return canvas;
          })(),
          
          out: function(text: string) {
            console.log('WASM stdout:', text);
          },
          
          err: function(text: string) {
            console.error('WASM stderr:', text);
          },
          
          stdin: function() {
            return null;
          },
          
          preRun: [],
          postRun: [],
          
          onRuntimeInitialized: () => {
            console.log("WASM module initialized");
            setLoadingState("loaded");
          },
          
          locateFile: (path: string) => {
            if (path.endsWith(".wasm")) {
              return "RayBird/index.wasm";
            }
            return path;
          },
          
          noInitialRun: false,
          noExitRuntime: true,
          
          arguments: [],
          
          instantiateWasm: undefined,
          
          onAbort: function(what: any) {
            console.error('WASM aborted:', what);
            setLoadingState("error");
            setErrorMessage("WASM module aborted");
          }
        };

        script = document.createElement("script");
        script.src = "RayBird/index.js";
        script.onload = () => {
          console.log("WASM script loaded");
        };
        script.onerror = (error) => {
          console.error("Failed to load WASM script:", error);
          setLoadingState("error");
          setErrorMessage("Failed to load WASM script");
        };
        document.head.appendChild(script);
      } catch (error) {
        console.error("Failed to load WASM module:", error);
        setLoadingState("error");
        setErrorMessage("Failed to load WASM module");
      }
    };

    loadWasm();

    return () => {
      if (script && script.parentNode) {
        document.head.removeChild(script);
      }
      delete (window as any).Module;
      const canvas = containerRef.current?.querySelector("canvas");
      if (canvas) {
        canvas.remove();
      }
    };
  }, [width, height]);

  return (
    <div
      ref={containerRef}
      
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      {loadingState === "loading" && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 1000,
          }}
        >
          <Card>
            <CardContent>Loading WASM module...</CardContent>
          </Card>
        </div>
      )}
      {loadingState === "error" && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "red",
            borderRadius: "8px",
            textAlign: "center",
            zIndex: 1000,
          }}
        >
          <Card>
            <CardContent>Error loading WASM module</CardContent>
          </Card>
          <div style={{ fontSize: "14px", marginTop: "8px" }}>
            {errorMessage}
          </div>
        </div>
      )}
    </div>
  );
}