import { Link, useLocation } from "wouter";
import { MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <nav className="flex gap-4 items-center">
              <Link href="/">
                <a className="text-2xl font-bold text-primary">日本語学習</a>
              </Link>
              <Link href="/">
                <a className={location === "/" ? "text-primary" : "text-muted-foreground"}>
                  Translate
                </a>
              </Link>
              <Link href="/study">
                <a className={location === "/study" ? "text-primary" : "text-muted-foreground"}>
                  Study
                </a>
              </Link>
            </nav>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
