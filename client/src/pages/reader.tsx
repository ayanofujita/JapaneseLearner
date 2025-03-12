
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import JapaneseText from "@/components/japanese-text";
import { ChevronLeftIcon, ChevronRightIcon, ArrowLeftIcon, BookOpenIcon, Type } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Reader() {
  const [location, setLocation] = useLocation();
  const [currentPage, setCurrentPage] = useState(0);
  const [showFurigana, setShowFurigana] = useState(true);
  const [paginatedText, setPaginatedText] = useState<string[]>([]);
  const isMobile = useIsMobile();
  
  // Parse the translation data from URL
  const params = new URLSearchParams(window.location.search);
  const translationId = params.get("id");
  const japaneseText = params.get("text") || "";
  const englishText = params.get("english") || "";
  const tone = params.get("tone") || "casual";
  
  // Split text into pages (simple implementation)
  useEffect(() => {
    if (japaneseText) {
      // For a simple implementation, we'll just split by periods/sentences
      const sentences = japaneseText.split(/(?<=。)/g).filter(s => s.trim());
      
      // Group sentences into pages (2-3 sentences per page)
      const pages = [];
      const sentencesPerPage = isMobile ? 2 : 3;
      
      for (let i = 0; i < sentences.length; i += sentencesPerPage) {
        pages.push(sentences.slice(i, i + sentencesPerPage).join(""));
      }
      
      // Add English text as the last page
      if (englishText) {
        pages.push(englishText);
      }
      
      setPaginatedText(pages);
    }
  }, [japaneseText, englishText, isMobile]);
  
  const totalPages = paginatedText.length;
  
  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const goToPrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const isLastPage = currentPage === totalPages - 1;
  
  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[80vh]">
      <div className="flex justify-between items-center mb-4">
        <Button variant="ghost" onClick={() => setLocation("/")}>
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch 
              id="furigana-toggle" 
              checked={showFurigana} 
              onCheckedChange={setShowFurigana}
            />
            <Label htmlFor="furigana-toggle">Furigana</Label>
          </div>
        </div>
      </div>
      
      <Card className="flex-1 p-8 flex flex-col shadow-lg border-t-8 border-t-primary">
        <div className="text-center mb-4">
          <h1 className="text-xl font-semibold text-muted-foreground">Title to follow</h1>
          <p className="text-sm text-muted-foreground">{tone} tone</p>
        </div>
        
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex items-center justify-center">
            {paginatedText.length > 0 ? (
              <div className="max-w-prose mx-auto">
                {isLastPage ? (
                  <div className="prose dark:prose-invert">
                    <h3 className="text-lg font-medium mb-4">English Text:</h3>
                    <p>{paginatedText[currentPage]}</p>
                  </div>
                ) : (
                  <div className="text-lg leading-relaxed">
                    <JapaneseText 
                      text={paginatedText[currentPage]} 
                      showFurigana={showFurigana}
                    />
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">Loading...</p>
            )}
          </div>
          
          <div className="flex justify-between items-center pt-4 mt-auto border-t">
            <Button 
              variant="ghost" 
              onClick={goToPrevPage} 
              disabled={currentPage === 0}
            >
              <ChevronLeftIcon className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            <div className="text-sm text-muted-foreground">
              Page {currentPage + 1} of {totalPages}
            </div>
            
            <Button 
              variant="ghost" 
              onClick={goToNextPage} 
              disabled={currentPage === totalPages - 1}
            >
              Next
              <ChevronRightIcon className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
