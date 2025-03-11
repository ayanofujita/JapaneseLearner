import { Link, useLocation } from "wouter";
import { MoonIcon, SunIcon, LogInIcon, LogOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <nav className="flex gap-4 items-center">
              <span className="text-2xl font-bold text-primary">日本語学習</span>
              <Link href="/">
                <span className={location === "/" ? "text-primary cursor-pointer" : "text-muted-foreground cursor-pointer"}>
                  Translate
                </span>
              </Link>
              <Link href="/study">
                <span className={location === "/study" ? "text-primary cursor-pointer" : "text-muted-foreground cursor-pointer"}>
                  Study
                </span>
              </Link>
            </nav>
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <span className="text-sm text-muted-foreground">{user.email}</span>
                  <Button variant="ghost" size="icon" onClick={() => logout()}>
                    <LogOutIcon className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Link href="/auth">
                  <Button variant="ghost" size="icon">
                    <LogInIcon className="h-4 w-4" />
                  </Button>
                </Link>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? <SunIcon /> : <MoonIcon />}
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}