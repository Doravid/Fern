"use client";

import * as React from "react";
import Link from "next/link";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

import { cn } from "@/lib/utils";

const courses: { title: string; href: string; description: string }[] = [
  {
    title: "Computer Graphics and Animation",
    href: "courses/computer-graphics",
    description:
      "CS 4741/4732 - WebGL, Quaternions, Fragment/Vertex Shaders, Physics Animation",
  },
  {
    title: "Algorithms",
    href: "courses/algo",
    description: "CS 2223 - Pretty standard DSA class.",
  },
  {
    title: "Discrete Math",
    href: "courses/discrete",
    description: "MA 2022 - Set theory. Boolean Algebra. Probability",
  },
  {
    title: "Operating Systems",
    href: "blog/operating-systems",
    description:
      "CS 3013 - How are processes launched, threading, memory management, scheduling",
  },
  {
    title: "Software Security",
    href: "courses/software-security",
    description:
      "CS 557 - Buffer Overflows, stack layout, how do applications really work, and how can we exploit that?",
  },
  {
    title: "Multiplayer Network Games",
    href: "courses/multiplayer-network-games",
    description:
      "CS 411X - Class that goes over object serialization, making and using network libraries, and latency compensation.",
  },
];

const writeUps: { title: string; href: string; description: string }[] = [
  {
    title: "Gets Protected",
    href: "/write-ups/gets-protected",
    description:
      "One of my challenges that revolves around understanding the internals of glibc.",
  },
  {
    title: "Fast Orbit",
    href: "/write-ups/fast-orbit",
    description: "One of my challenges. Double free heap challenge.",
  },
];

const projects: { title: string; href: string; description: string }[] = [
  {
    title: "PMKS+",
    href: "/projects/pmks",
    description: "Planar linkage simulation software.",
  },
  {
    title: "Rate My Planner",
    href: "projects/rate-my-planner",
    description:
      "Adds Rate My Professor, Term Filtering, and Search to WPI Planner.",
  },
  {
    title: "Raybird",
    href: "projects/raybird",
    description:
      "Recreation and Level Editor for the puzzle game Snake Bird. Built in Zig/Raylib",
  },
  {
    title: "Nolib Server",
    href: "projects/nolib",
    description: "Serves files. However, as we all know: libc is bloatware.",
  },
  {
    title: "Banh Me",
    href: "projects/banhme",
    description:
      "Short puzzle game built for learning Vietnamese while having fun!",
  },
];

export default function NavigationMenuDemo() {
  return (
    <NavigationMenu className="z-50 w-full max-w-full justify-start h-16 flex-none mb-3">
      <NavigationMenuList className="flex w-full flex-row justify-start space-x-2">
        <NavigationMenuItem>
          <NavigationMenuTrigger className="text-[25px]">
            CTF Write-Ups
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-2 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
              {writeUps.map((writeUp) => (
                <ListItem
                  key={writeUp.title}
                  title={writeUp.title}
                  href={writeUp.href}
                >
                  {writeUp.description}
                </ListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger className="text-[25px]">
            Course Reviews
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-2 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
              {courses.map((course) => (
                <ListItem
                  key={course.title}
                  title={course.title}
                  href={course.href}
                >
                  {course.description}
                </ListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger className="text-[25px]">
            Projects
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-2 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
              {projects.map((project) => (
                <ListItem
                  key={project.title}
                  title={project.title}
                  href={project.href}
                >
                  {project.description}
                </ListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

function ListItem({
  className,
  title,
  children,
  href,
  ...props
}: React.ComponentProps<"a">) {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          href={href || "#"}
          className={cn(
            "block text-main-foreground select-none space-y-1 rounded-base border-2 border-border p-3 leading-none no-underline outline-hidden transition-colors hover:bg-background",
            className,
          )}
          {...props}
        >
          <div className="text-base font-heading leading-none">{title}</div>
          <p className="font-base line-clamp-3 text-sm leading-snug">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}
ListItem.displayName = "ListItem";
