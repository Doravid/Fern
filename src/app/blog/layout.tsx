import NavigationMenuDemo from "@/components/ui/nav_bar";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen px-2 sm:px-4 py-2 sm:py-4">
      <NavigationMenuDemo />
      {children}
    </div>
  );
}
