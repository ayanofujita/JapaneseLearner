import { Link, useLocation } from "wouter";
import { MoonIcon, SunIcon, LogInIcon, LogOutIcon, MenuIcon, XIcon as CloseIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/use-auth";
import { useOnlineStatus } from "@/hooks/use-online-status";
import OfflineIndicator from "@/components/offline-indicator";
import "@/components/mobile-layout.css";
import { useState, useRef, useEffect } from "react";

// New History component
function HistoryPage() {
  //  Replace this with actual history fetching and display logic
  return (
    <div>
      <h1>Translation History</h1>
      <p>This page will display your translation history.</p>
    </div>
  );
}


export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close mobile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    }

    if (mobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mobileMenuOpen]);

  // Close mobile menu when changing routes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  return (
    <div className="min-h-screen bg-background">
      <OfflineIndicator />
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-xl md:text-2xl font-bold text-primary mr-4">漢字文脈</span>

              {!isMobile && (
                <nav className="hidden md:flex gap-4 items-center">
                  <Link href="/">
                    <span className={location === "/" ? "text-primary cursor-pointer" : "text-muted-foreground cursor-pointer"}>
                      Translate
                    </span>
                  </Link>
                  <Link href="/history"> {/* Added history link */}
                    <span className={location === "/history" ? "text-primary cursor-pointer" : "text-muted-foreground cursor-pointer"}>
                      History
                    </span>
                  </Link>
                  <Link href="/study">
                    <span className={location === "/study" ? "text-primary cursor-pointer" : "text-muted-foreground cursor-pointer"}>
                      Study
                    </span>
                  </Link>
                  <Link href="/quiz">
                    <span className={location === "/quiz" ? "text-primary cursor-pointer" : "text-muted-foreground cursor-pointer"}>
                      Quiz
                    </span>
                  </Link>
                </nav>
              )}
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              {isMobile ? (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  >
                    {theme === "dark" ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
                  </Button>

                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  >
                    {mobileMenuOpen ? <CloseIcon className="h-4 w-4" /> : <MenuIcon className="h-4 w-4" />}
                  </Button>
                </>
              ) : (
                <>
                  {user ? (
                    <>
                      <span className="hidden md:inline text-sm text-muted-foreground">{user.email}</span>
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
                    {theme === "dark" ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu */}
          {isMobile && mobileMenuOpen && (
            <div 
              ref={menuRef}
              className="absolute top-16 right-4 z-50 w-48 py-2 mt-2 bg-background rounded-md shadow-lg border border-border"
            >
              <nav className="flex flex-col">
                <Link href="/">
                  <span className={`block px-4 py-2 text-sm ${location === "/" ? "text-primary" : "text-foreground"} hover:bg-accent`}>
                    Translate
                  </span>
                </Link>
                <Link href="/history"> {/* Added history link to mobile menu */}
                  <span className={`block px-4 py-2 text-sm ${location === "/history" ? "text-primary" : "text-foreground"} hover:bg-accent`}>
                    History
                  </span>
                </Link>
                <Link href="/study">
                  <span className={`block px-4 py-2 text-sm ${location === "/study" ? "text-primary" : "text-foreground"} hover:bg-accent`}>
                    Study
                  </span>
                </Link>
                <Link href="/quiz">
                  <span className={`block px-4 py-2 text-sm ${location === "/quiz" ? "text-primary" : "text-foreground"} hover:bg-accent`}>
                    Quiz
                  </span>
                </Link>
                {user && (
                  <div className="border-t border-border mt-2 pt-2">
                    <div className="px-4 py-1 text-xs text-muted-foreground">{user.email}</div>
                    <button 
                      className="w-full text-left block px-4 py-2 text-sm text-foreground hover:bg-accent"
                      onClick={() => logout()}
                    >
                      Log out
                    </button>
                  </div>
                )}
                {!user && (
                  <Link href="/auth">
                    <span className="block px-4 py-2 text-sm text-foreground hover:bg-accent border-t border-border mt-2">
                      Log in
                    </span>
                  </Link>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}