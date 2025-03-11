import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import DictionaryPopup from "./dictionary-popup";

export default function JapaneseText({ text }: { text: string }) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);
  const [showFurigana, setShowFurigana] = useState(true);
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleWordClick = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement;

    // Remove highlight from previously selected word
    if (selectedElement) {
      selectedElement.classList.remove("bg-primary/10");
    }

    // Find the closest ruby element (word container)
    const rubyElement = target.closest('ruby');
    if (rubyElement) {
      // Get the bounding rectangle of the clicked element
      const rect = rubyElement.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();

      // Calculate popup position
      const popupX = Math.min(
        rect.left,
        (containerRect?.right || window.innerWidth) - 300 // Ensure popup doesn't overflow container
      );
      const popupY = Math.max(
        rect.top - 200, // Position above the word if possible
        10 // Minimum distance from top of viewport
      );

      // Add highlight to the word
      rubyElement.classList.add("bg-primary/10");
      setSelectedElement(rubyElement);

      // Extract the full word including hiragana/katakana
      const word = rubyElement.textContent || '';
      setSelectedWord(word);
      setPopupPosition({ x: popupX, y: popupY });
    }
  };

  return (
    <Card className="p-6 relative" ref={containerRef}>
      <div className="flex items-center justify-end space-x-2 mb-4">
        <Switch
          id="furigana-mode"
          checked={showFurigana}
          onCheckedChange={setShowFurigana}
        />
        <Label htmlFor="furigana-mode">Show Furigana</Label>
      </div>

      <div
        className={`
          text-lg leading-relaxed break-words
          ${!showFurigana ? '[&_rt]:hidden [&_rt]:absolute [&_rt]:top-0' : '[&_rt]:block'}
          [&_ruby]:inline-flex [&_ruby]:flex-col [&_ruby]:items-center [&_ruby]:justify-center
          [&_ruby]:relative [&_ruby]:leading-normal
        `}
        onClick={handleWordClick}
        dangerouslySetInnerHTML={{ __html: text }}
      />

      {selectedWord && popupPosition && (
        <DictionaryPopup
          word={selectedWord}
          position={popupPosition}
          onClose={() => {
            setSelectedWord(null);
            setPopupPosition(null);
            if (selectedElement) {
              selectedElement.classList.remove("bg-primary/10");
              setSelectedElement(null);
            }
          }}
        />
      )}
    </Card>
  );
}