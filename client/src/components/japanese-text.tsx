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

    // Find the word container (jp-word span)
    const wordElement = target.closest('.jp-word');
    if (wordElement) {
      // Get the bounding rectangle of the clicked element
      const rect = wordElement.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();

      // Calculate popup position - now closer to the word
      const popupX = Math.min(
        rect.left,
        (containerRect?.right || window.innerWidth) - 300 // Ensure popup doesn't overflow container
      );
      const popupY = rect.top + rect.height + 5; // Position just below the word

      // Add highlight to the word
      wordElement.classList.add("bg-primary/10");
      setSelectedElement(wordElement);

      // Get the full word text by removing all rt content
      const rtElements = wordElement.querySelectorAll('rt');
      let fullWord = wordElement.textContent || '';
      rtElements.forEach(rt => {
        fullWord = fullWord.replace(rt.textContent || '', '');
      });

      // Trim and clean up the word
      const cleanWord = fullWord.trim().replace(/\s+/g, '');
      setSelectedWord(cleanWord);
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
          [&_.jp-word]:hover:cursor-pointer [&_.jp-word]:rounded
          [&_.jp-word]:transition-colors
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