"use client";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ProjectCarousel from "@/components/ui/ProjectCarousel";
import WebGLCanvas from "@/components/webgl";
import Particles from "@/components/particles";
import WasmComponent from "@/components/wasmComponent";

export default function Home() {
  const [webglKey, setWebglKey] = useState<number>(0);
  const [isResizing, setIsResizing] = useState<boolean>(false);

  useEffect(() => {
    let resizeTimer: NodeJS.Timeout;

    const handleResize = (): void => {
      if (window.innerWidth >= 1700) {
        setIsResizing(true);
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          setIsResizing(false);
          setWebglKey((prev: number) => prev + 1);
        }, 250);
      } else {
        // For smaller screens, immediately clear any pending resize and ensure not in resizing state
        clearTimeout(resizeTimer);
        setIsResizing(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return (): void => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen font-[family-name:var(--font-geist-sans)] px-2 sm:px-4 py-2 sm:py-4">
      <main className="flex flex-col min-[1700px]:grid min-[1700px]:grid-cols-8 gap-4 flex-grow w-full">
        {/* Left Card - desktop version, hidden on tablet/mobile */}
        <Card className="hidden min-[1700px]:flex flex-col items-center bg-white w-full col-span-2 col-start-1 overflow-hidden min-h-0">
          <div className="w-full flex flex-col items-center p-3 h-full min-h-0">
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-center break-words flex-shrink-0">
              Cool Stuff!
            </p>
            <hr className="w-full h-0.5 sm:h-1 bg-black my-3 sm:my-4 flex-shrink-0" />
            <div className="flex-1 w-full overflow-hidden min-h-0 flex items-center justify-center">
              stuff
            </div>
            <hr className="w-full h-0.5 sm:h-1 bg-black my-3 sm:my-4 flex-shrink-0" />
            <div className="flex-1 w-full overflow-shown min-h-0 flex items-center justify-center">
              <ProjectCarousel />
            </div>
          </div>
        </Card>
        {/* Middle Card */}
        <Card className="hidden min-[1700px]:flex flex-col items-center bg-[#ffca95] w-full col-span-4 col-start-3 overflow-hidden min-h-0">
          <div className="w-full flex flex-col items-center p-3 h-full min-h-0">
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-center break-words flex-shrink-0">
              About Me!
            </p>
            <hr className="w-full h-0.5 sm:h-1 bg-black my-3 sm:my-4 flex-shrink-0" />
            <div className="flex-1 w-full overflow-hidden min-h-0 flex items-center justify-center">
              Hello! I'm Fern
            </div>
            <hr className="w-full h-0.5 sm:h-1 bg-black my-3 sm:my-4 flex-shrink-0" />
            <div className="flex-1 w-full min-h-0 flex items-center justify-center">
              <WasmComponent />
            </div>
            Press F to play in fullscreen!
          </div>
        </Card>

        {/* Right Card - desktop version, hidden on tablet/mobile */}
        <Card className="hidden min-[1700px]:flex flex-col items-center bg-white w-full col-span-2 col-start-7 overflow-hidden min-h-0">
          <div className="w-full flex flex-col items-center p-3 pb-0 h-full min-h-0">
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-center break-words flex-shrink-0">
              Other Cool Stuff!
            </p>
            <hr className="w-full h-0.5 sm:h-1 bg-black my-3 sm:my-4 flex-shrink-0" />
            <div className="flex-1 w-full overflow-shown min-h-0 flex items-center justify-center">
              {isResizing ? (
                <div className="w-full h-full flex items-center justify-center ">
                  Resizing...
                </div>
              ) : (
                <Particles />
              )}
            </div>
            <hr className="w-full h-0.5 sm:h-1 bg-black my-3 sm:my-4 flex-shrink-0" />
            <div className="flex-1 w-full min-h-0 flex items-center justify-center mb-0">
              {isResizing ? (
                <div className="w-full h-full flex items-center justify-center">
                  Resizing...
                </div>
              ) : (
                <WebGLCanvas />
              )}
            </div>
          </div>
        </Card>

        {/* Container for the two cards - side by side on tablet, stacked on mobile */}
        <div className="flex flex-col min-[800px]:flex-row gap-4 w-full min-[1700px]:hidden">
          {/* Left Card - tablet/mobile version */}
          <Card className="flex flex-col items-center bg-white w-full overflow-hidden min-h-[400px]">
            <div className="w-full flex flex-col items-center p-3 h-full min-h-0">
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-center break-words flex-shrink-0">
                About Me!
              </p>
              <hr className="w-full h-0.5 sm:h-1 bg-black my-3 sm:my-4 flex-shrink-0" />
              <div className="flex-1 w-full overflow-hidden min-h-0 flex items-center justify-center">
                <Card>
                  <CardContent>Hello, I'm Fern!</CardContent>
                </Card>
              </div>
              <hr className="w-full h-0.5 sm:h-1 bg-black my-3 sm:my-4 flex-shrink-0" />
              <div className="flex-1 w-full overflow-shown min-h-0 flex items-center justify-center">
                <ProjectCarousel />
              </div>
            </div>
          </Card>

          {/* Right Card - tablet/mobile version */}
          <Card className="flex flex-col items-center bg-white w-full overflow-hidden min-h-[400px]">
            <div className="w-full flex flex-col items-center h-full min-h-0">
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-center break-words flex-shrink-0">
                Cool Stuff
              </p>
              <hr className="w-full h-0.5 sm:h-1 bg-black my-3 sm:my-4 flex-shrink-0" />
              <div className="flex-1 w-full overflow-visible min-h-0 flex items-center justify-center">
                {isResizing ? (
                  <div className="w-full h-full flex items-center justify-center ">
                    Resizing...
                  </div>
                ) : (
                  <Particles />
                )}
              </div>
              <hr className="w-full h-0.5 sm:h-1 bg-black my-3 sm:my-4 flex-shrink-0" />
              <div
                className="flex-1 w-full overflow-visible min-h-0 h-full"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isResizing ? (
                  <div className="w-full h-full flex items-center justify-center">
                    Resizing...
                  </div>
                ) : (
                  <WebGLCanvas />
                )}
              </div>
            </div>
          </Card>
        </div>
      </main>

      {/* Footer - compact and positioned at bottom */}
      {/* Footer - compact and positioned at bottom */}
      <Card className="flex flex-row items-center justify-center gap-4 p-4 mt-4 bg-[#ff7a05]">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4 text-sm"
          href="https://www.dev-fern.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Recursion
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4 text-sm"
          href="https://github.com/Doravid"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          My GitHub →
        </a>
      </Card>
    </div>
  );
}
