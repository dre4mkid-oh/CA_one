import React from "react";
import { Link, useLocation } from "wouter";
import { useTheme } from "@/lib/theme";
import { type LucideIcon, LayoutDashboard, BarChart2, Timer, Sun, Moon, Palette, Palette as PaletteIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme, setTheme, palette, setPalette } = useTheme();

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      {/* Sidebar / Topbar */}
      <aside className="md:w-64 border-b md:border-b-0 md:border-r border-border bg-card p-4 flex flex-col justify-between shrink-0 sticky top-0 md:h-[100dvh] z-20">
        <div>
          <div className="flex items-center gap-3 px-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center blob-1 shadow-md">
              <div className="w-4 h-4 rounded-full bg-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight font-sans">
              Work<span className="text-primary">Flow</span>
            </h1>
          </div>

          <nav className="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0">
            <NavItem href="/" icon={LayoutDashboard} label="Today" active={location === "/"} />
            <NavItem href="/stats" icon={BarChart2} label="Stats" active={location === "/stats"} />
            <NavItem href="/countdown" icon={Timer} label="Countdown" active={location === "/countdown"} />
          </nav>
        </div>

        <div className="hidden md:flex flex-col gap-2 pt-4 border-t border-border mt-4">
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                  className="w-full flex-1 rounded-2xl"
                >
                  {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle Theme</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setPalette(palette === "pastel" ? "neon" : "pastel")}
                  className="w-full flex-1 rounded-2xl relative overflow-hidden"
                >
                  <PaletteIcon className="w-4 h-4 relative z-10" />
                  <div className="absolute inset-0 bg-gradient-to-tr from-theme-1 via-theme-2 to-theme-3 opacity-20" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle Palette ({palette})</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-5xl mx-auto w-full">
        {children}
      </main>
      
      {/* Mobile Theme Toggles */}
      <div className="md:hidden fixed bottom-4 right-4 flex gap-2 shadow-xl bg-card p-2 rounded-full z-50 border border-border">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="rounded-full"
        >
          {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setPalette(palette === "pastel" ? "neon" : "pastel")}
          className="rounded-full relative overflow-hidden"
        >
          <PaletteIcon className="w-4 h-4 relative z-10" />
          <div className="absolute inset-0 bg-gradient-to-tr from-theme-1 via-theme-2 to-theme-3 opacity-20" />
        </Button>
      </div>
    </div>
  );
}

function NavItem({ href, icon: Icon, label, active }: { href: string, icon: LucideIcon, label: string, active: boolean }) {
  return (
    <Link href={href} className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all ${
      active 
        ? "bg-primary text-primary-foreground shadow-md scale-[1.02]" 
        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
    }`}>
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </Link>
  );
}
