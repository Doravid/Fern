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
    <Carousel className="w-full max-w-[28em]">
      <CarouselContent>
        <CarouselItem className="p-[30px]">
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://github.com/better-wpi-planner/Chrome-Extension"
          >
            <ImageCard
              className="s shadow-none p-0 bg-main text-main-foreground w-[26em]"
              caption="Fun Little Project to add Rate My Professor rating to my school class planner."
              imageUrl="RateMyPlanner.png"
            ></ImageCard>
          </a>
        </CarouselItem>
        <CarouselItem className="p-[30px]">
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://github.com/Doravid/RayBird"
          >
            <ImageCard
              className="s shadow-none p-0 bg-main text-main-foreground w-[26em]"
              caption="Recreated (poorly) my favorite puzzle game, SnakeBird, in Raylib / Zig!"
              imageUrl="RayBird.png"
            ></ImageCard>
          </a>
        </CarouselItem>
        <CarouselItem className="p-[30px] ">
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://github.com/PMKS-Web/PMKS-Refactor"
          >
            <ImageCard
              className="s shadow-none p-0 bg-main text-main-foreground w-[26em] "
              caption="PMKS+ Pretty cool educational project I worked on for a while. Uses Angular 😔😔😔"
              imageUrl="PMKS.jpg"
            ></ImageCard>
          </a>
        </CarouselItem>
        <CarouselItem className="p-[30px]">
          <ImageCard
            className="s shadow-none p-0 bg-main text-main-foreground w-[26em] "
            caption="I also Like 3D Modeling!"
            imageUrl="Wallpaper.png"
          ></ImageCard>
        </CarouselItem>
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
