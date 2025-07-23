"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import ProjectCarousel from "@/components/ui/ProjectCarousel";
import WebGLCanvas from "@/components/webgl";
import Particles from "@/components/particles";
import WasmComponent from "@/components/wasmComponent";

export default function Home() {
  const [isResizing, setIsResizing] = useState<boolean>(false);

  const windowWidth = useRef(window.innerWidth);

  useEffect(() => {
    let resizeTimer: NodeJS.Timeout;

    const handleResize = (): void => {
      // **THE KEY CHANGE IS HERE**
      // We only check if the width has changed.
      if (windowWidth.current === window.innerWidth) {
        // If width is the same, it's a mobile scroll, so we ignore it.
        return;
      }

      // If width has changed, update the ref to the new width.
      windowWidth.current = window.innerWidth;
      
      // Now, proceed with your debounced resizing state logic.
      setIsResizing(true);
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        setIsResizing(false);
      }, 250);
    };

    window.addEventListener("resize", handleResize);
    
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen min-[1700px]:h-screen font-[family-name:var(--font-geist-sans)] px-2 sm:px-4 py-2 sm:py-4">
      <main className="flex flex-col min-[1700px]:grid min-[1700px]:grid-cols-8 gap-4 flex-1 w-full min-h-0 min-[1700px]:overflow-hidden">
        <Card className="order-2 min-[1700px]:order-none flex flex-col items-center bg-white w-full min-[1700px]:col-span-2 min-[1700px]:col-start-1 min-[1700px]:overflow-hidden p-3 gap-4">
          <Card className="text-xl w-full sm:text-2xl md:text-3xl font-bold text-center break-words flex-shrink-0">
            Cool Stuff!
          </Card>
          <div className="flex-1 w-full min-h-[300px] min-[1700px]:min-h-0 flex items-center justify-center">
            <ProjectCarousel />
          </div>
          <div className="font-bold text-2xl">My Cat Dora!!</div>
          <div className="flex-1 w-full min-h-[300px] min-[1700px]:min-h-0 flex items-center justify-center p-2">
            <img
              src={"/cat.jpg"}
              alt="A picture of my cat Dora"
              className="w-auto h-auto max-w-full max-h-full object-contain shadow-shadow border-2 border-border"
            />
          </div>
        </Card>

        <Card className="order-1 min-[1700px]:order-none flex flex-col items-center bg-[#ffca95] w-full min-[1700px]:col-span-4 min-[1700px]:col-start-3 min-[1700px]:overflow-hidden p-3 gap-4">
          <div className="text-xl w-full sm:text-2xl md:text-3xl font-bold text-center break-words flex-shrink-0">
            About Me!
          </div>
          <hr className="w-full h-0.5 sm:h-1 bg-black flex-shrink-0" />
          <div className="flex-1 w-full min-h-0 flex items-center justify-center">
            <Card className="bg-white w-full min-[1700px]:w-2/3 p-6 min-[1700px]:p-10 text-xl text-center">
              Hello, I'm Fern! 👋 <br />
              I'm a simple software developer who loves everything computer
              graphics, cyber security, game development, and my adorable cat
              Dora. <br />
              <br />
              If you have any questions about any of the projects here or just
              want to send me cat pictures, reach out to me at{" "}
              <a
                href="mailto:doravidmc@gmail.com"
                className="text-blue-600 underline"
              >
                doravidmc@gmail.com
              </a>
            </Card>
          </div>
          <div className="flex-1 w-full min-h-[300px] min-[1700px]:min-h-0 flex items-center justify-center">
            <WasmComponent />
          </div>
          <div className="text-lg text-center">
            Press F to enter fullscreen
          </div>
        </Card>

        <Card className="order-3 min-[1700px]:order-none flex flex-col items-center bg-white w-full min-[1700px]:col-span-2 min-[1700px]:col-start-7 min-[1700px]:overflow-hidden p-3 gap-4">
          <Card className="w-full text-xl sm:text-2xl md:text-3xl font-bold text-center break-words flex-shrink-0">
            Other Cool Stuff!
          </Card>
          <div className="flex-1 w-full aspect-square min-[1700px]:aspect-auto min-[1700px]:min-h-0 flex items-center justify-center">
            {isResizing ? (
              <div className="w-full h-full flex items-center justify-center">
                Resizing...
              </div>
            ) : (
              <Particles />
            )}
          </div>
          <div className="flex-1 w-full aspect-square min-[1700px]:aspect-auto min-[1700px]:min-h-0 flex items-center justify-center">
            {isResizing ? (
              <div className="w-full h-full flex items-center justify-center">
                Resizing...
              </div>
            ) : (
              <WebGLCanvas />
            )}
          </div>
        </Card>
      </main>

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