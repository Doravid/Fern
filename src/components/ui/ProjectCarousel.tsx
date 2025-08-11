import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

const projects = [
  {
    href: "https://github.com/better-wpi-planner/Chrome-Extension",
    imageUrl: "RateMyPlanner.webp",
    caption:
      "Fun Little Project to add Rate My Professor rating to my school class planner.",
  },
  {
    href: "https://github.com/Doravid/RayBird",
    imageUrl: "RayBird.webp",
    caption:
      "I am recreating my favorite puzzle game, SnakeBird, in Raylib / Zig!",
  },
  {
    href: "https://github.com/PMKS-Web/PMKS-Refactor",
    imageUrl: "PMKS.jpg",
    caption:
      "PMKS+ Educational project I worked on. Simulates four-bar linkages.",
  },
  {
    href: "https://www.dev-fern.com/",
    imageUrl: "Wallpaper.webp",
    caption: "I also Like 3D Modeling!",
  },
];

export default function ProjectCarousel() {
  return (
    // 👇 The only change is on this line
    <Carousel className="w-full">
      <CarouselContent>
        {projects.map((project, index) => (
          <CarouselItem key={index}>
            <div className="p-1">
              <HoverCard closeDelay={0} openDelay={0}>
                <HoverCardTrigger asChild>
                  <a
                    href={project.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src={project.imageUrl}
                      alt={project.caption}
                      className="w-auto h-auto max-w-full max-h-full object-contain shadow-shadow border-2 border-border"
                    />
                  </a>
                </HoverCardTrigger>
                <HoverCardContent className="w-64">
                  {project.caption}
                </HoverCardContent>
              </HoverCard>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}
