import ImageCard from "@/components/ui/image-card";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export default function ProjectCarousel() {
  return (
    <div className="w-full flex justify-center over overflow-shown">
      <Carousel className="w-full max-w-full relative px-12 overflow-shown">
        <CarouselContent className="ml-0 overflow-shown">
          <CarouselItem className="p-4 sm:p-[30px] pl-4 sm:pl-[30px]">
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://github.com/better-wpi-planner/Chrome-Extension"
            >
              <ImageCard
                className="shadow-none p-0 bg-main text-main-foreground w-full max-w-[26em] mx-auto"
                caption="Fun Little Project to add Rate My Professor rating to my school class planner."
                imageUrl="RateMyPlanner.webp"
              />
            </a>
          </CarouselItem>
          <CarouselItem className="p-4 sm:p-[30px] pl-4 sm:pl-[30px]">
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://github.com/Doravid/RayBird"
            >
              <ImageCard
                className="shadow-none p-0 bg-main text-main-foreground w-full max-w-[26em] mx-auto"
                caption="I am recreating my favorite puzzle game, SnakeBird, in Raylib / Zig!
                On the desktop version of my site, you can play the first few levels"
                imageUrl="RayBird.webp"
              />
            </a>
          </CarouselItem>
          <CarouselItem className="p-4 sm:p-[30px] pl-4 sm:pl-[30px]">
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://github.com/PMKS-Web/PMKS-Refactor"
            >
              <ImageCard
                className="shadow-none p-0 bg-main text-main-foreground w-full max-w-[26em] mx-auto"
                caption="PMKS+ Educational project I worked on. Simulates four-bar linkages."
                imageUrl="PMKS.jpg"
              />
            </a>
          </CarouselItem>
          <CarouselItem className="p-4 sm:p-[30px] pl-4 sm:pl-[30px]">
            <ImageCard
              className="shadow-none p-0 bg-main text-main-foreground w-full max-w-[26em] mx-auto"
              caption="I also Like 3D Modeling!"
              imageUrl="Wallpaper.webp"
            />
          </CarouselItem>
        </CarouselContent>
        <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 z-10" />
        <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 z-10" />
      </Carousel>
    </div>
  );
}
