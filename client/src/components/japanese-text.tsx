import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import DictionaryPopup from "./dictionary-popup";

// Helper function to get text content without furigana readings
function getTextExcludingRt(element: HTMLElement): string {
  // Clone the node to avoid modifying the original DOM
  const clone = element.cloneNode(true) as HTMLElement;

  // Remove all rt elements from the clone
  const rtElements = clone.querySelectorAll("rt");
  rtElements.forEach((rt) => rt.remove());

  // Return the text content of the cleaned clone
  return clone.textContent || "";
}

export default function JapaneseText({
  text,
  englishText,
}: {
  text: string;
  englishText?: string;
}) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [popupPosition, setPopupPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [showFurigana, setShowFurigana] = useState(true);
  const [showEnglishText, setShowEnglishText] = useState(true);
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(
    null,
  );
  const containerRef = useRef<HTMLDivElement>(null);

  const handleWordClick = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement;

    // Remove highlight from previously selected word
    if (selectedElement) {
      selectedElement.classList.remove("bg-primary/10");
    }

    // Find the word container (jp-word span)
    const wordElement = target.closest(".jp-word");
    if (wordElement) {
      // Get the bounding rectangle of the clicked element
      const rect = wordElement.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();

      // Calculate popup position - now closer to the word
      const popupX = Math.min(
        rect.left,
        (containerRect?.right || window.innerWidth) - 300, // Ensure popup doesn't overflow container
      );
      const popupY = rect.top + rect.height + 5; // Position just below the word

      // Add highlight class to the current selected word
      wordElement.classList.add("bg-primary/10");
      setSelectedElement(wordElement as HTMLElement);

      // Set the word and position - now excluding rt content
      setSelectedWord(getTextExcludingRt(wordElement as HTMLElement));
      setPopupPosition({ x: popupX, y: popupY });
    }
  };

  const toggleFurigana = () => {
    setShowFurigana(!showFurigana);
  };

  const toggleEnglishText = () => {
    setShowEnglishText(!showEnglishText);
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="furigana-toggle"
              checked={showFurigana}
              onCheckedChange={toggleFurigana}
            />
            <Label htmlFor="furigana-toggle">Show Furigana</Label>
          </div>
          {englishText && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleEnglishText}
              title={showEnglishText ? "Hide English" : "Show English"}
            >
              {showEnglishText ? (
                <EyeOffIcon size={16} />
              ) : (
                <EyeIcon size={16} />
              )}
              <span className="ml-2">
                {showEnglishText ? "Hide" : "Show"} English
              </span>
            </Button>
          )}
        </div>

        <div ref={containerRef} className="space-y-4">
          {/* Japanese text with furigana */}
          <div
            className={`text-lg ${showFurigana ? "" : "rt-hidden"}`}
            onClick={handleWordClick}
            dangerouslySetInnerHTML={{ __html: text }}
          />

          {/* English translation (conditionally shown) */}
          {englishText && (
            <div
              className={`mt-4 text-muted-foreground ${showEnglishText ? "" : "hidden"}`}
            >
              {englishText}
            </div>
          )}
        </div>
      </Card>

      <style jsx>{`
        .rt-hidden rt {
          display: none;
        }
      `}</style>

      {selectedWord && popupPosition && (
        <DictionaryPopup
          word={selectedWord}
          position={popupPosition}
          onClose={() => {
            setSelectedWord(null);
            if (selectedElement) {
              selectedElement.classList.remove("bg-primary/10");
              setSelectedElement(null);
            }
          }}
        />
      )}
    </div>
  );
}
